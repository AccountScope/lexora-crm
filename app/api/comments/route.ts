import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import { query } from "@/lib/api/db";
import { logActivity } from "@/lib/activity/logger";
import { sanitizeCommentBody, extractMentionIds } from "@/lib/comments/utils";
import { notifyMentionedUsers } from "@/lib/comments/mentions";
import type { CommentRecord, CommentAttachment } from "@/types";
import { commentCreateSchema, commentUpdateSchema, commentActionSchema } from "@/lib/api/validation";

const encoder = new TextEncoder();

type CommentRow = {
  id: string;
  content: string;
  entityType: string;
  entityId: string;
  user: any;
  parentId: string | null;
  mentions: any[];
  attachments: CommentAttachment[];
  likesCount: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
};

const commentSelect = `
  c.id,
  c.content,
  c.entity_type as "entityType",
  c.entity_id as "entityId",
  c.user_id as "authorId",
  c.parent_id as "parentId",
  c.attachments,
  c.mentions,
  c.likes_count as "likesCount",
  c.liked_by as "likedBy",
  c.created_at as "createdAt",
  c.updated_at as "updatedAt",
  c.deleted_at as "deletedAt",
  CASE
    WHEN u.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', u.id,
      'name', CONCAT(u.first_name, ' ', u.last_name),
      'email', u.email
    )
  END as "user",
  mention_users.users as "mentionUsers"
`;

const buildCursor = (row: { id: string; createdAt: string }) => `${new Date(row.createdAt).toISOString()}__${row.id}`;

const parseCursor = (cursor?: string | null) => {
  if (!cursor) return { createdAt: null as string | null, id: null as string | null };
  const [ts, id] = cursor.split("__");
  return { createdAt: ts ?? null, id: id ?? null };
};

const mapRowToComment = (row: any, currentUserId: string): CommentRecord => ({
  id: row.id,
  content: row.content,
  entityType: row.entityType,
  entityId: row.entityId,
  user: row.user,
  parentId: row.parentId,
  mentions: row.mentionUsers ?? [],
  attachments: row.attachments ?? [],
  likesCount: Number(row.likesCount ?? 0),
  likedByCurrentUser: Array.isArray(row.likedBy) ? row.likedBy.includes(currentUserId) : false,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  deletedAt: row.deletedAt,
});

const fetchTopLevelComments = async (
  entityType: string,
  entityId: string,
  limit: number,
  cursor: { createdAt: string | null; id: string | null },
  currentUserId: string
) => {
  const result = await query(
    `SELECT ${commentSelect}
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', mu.id, 'name', CONCAT(mu.first_name, ' ', mu.last_name), 'email', mu.email)) as users
       FROM users mu
       WHERE mu.id = ANY(c.mentions)
     ) as mention_users ON TRUE
     WHERE c.entity_type = $1 AND c.entity_id = $2 AND c.parent_id IS NULL
       AND (
         $4::timestamptz IS NULL
         OR c.created_at < $4
         OR (c.created_at = $4 AND ($5::uuid IS NULL OR c.id < $5))
       )
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT $3`,
    [entityType, entityId, limit, cursor.createdAt, cursor.id]
  );
  return result.rows.map((row) => mapRowToComment(row, currentUserId));
};

const fetchReplies = async (parentIds: string[], currentUserId: string) => {
  if (!parentIds.length) return [] as CommentRecord[];
  const result = await query(
    `SELECT ${commentSelect}
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', mu.id, 'name', CONCAT(mu.first_name, ' ', mu.last_name), 'email', mu.email)) as users
       FROM users mu
       WHERE mu.id = ANY(c.mentions)
     ) as mention_users ON TRUE
     WHERE c.parent_id = ANY($1::uuid[])
     ORDER BY c.created_at ASC`,
    [parentIds]
  );
  return result.rows.map((row) => mapRowToComment(row, currentUserId));
};

const buildThread = (roots: CommentRecord[], replies: CommentRecord[]) => {
  const replyMap = replies.reduce<Record<string, CommentRecord[]>>((acc, reply) => {
    if (!reply.parentId) return acc;
    if (!acc[reply.parentId]) acc[reply.parentId] = [];
    acc[reply.parentId].push(reply);
    return acc;
  }, {});

  return roots.map((root) => ({
    ...root,
    replies: (replyMap[root.id] ?? []).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  }));
};

const fetchEntityContext = async (entityType: string, entityId: string) => {
  if (entityType === "case") {
    const record = await query<{ id: string; title: string; matter_number: string }>(
      `SELECT id, title, matter_number FROM matters WHERE id = $1 LIMIT 1`,
      [entityId]
    );
    return record.rows[0] ? { title: record.rows[0].title, caseId: record.rows[0].id } : null;
  }
  if (entityType === "document") {
    const record = await query<{ id: string; title: string; matter_id: string | null }>(
      `SELECT id, title, matter_id FROM documents WHERE id = $1 LIMIT 1`,
      [entityId]
    );
    return record.rows[0]
      ? { title: record.rows[0].title, caseId: record.rows[0].matter_id }
      : null;
  }
  return null;
};

const getCommentById = async (commentId: string, currentUserId: string) => {
  const result = await query(
    `SELECT ${commentSelect}
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', mu.id, 'name', CONCAT(mu.first_name, ' ', mu.last_name), 'email', mu.email)) as users
       FROM users mu
       WHERE mu.id = ANY(c.mentions)
     ) as mention_users ON TRUE
     WHERE c.id = $1
     LIMIT 1`,
    [commentId]
  );
  const row = result.rows[0];
  return row ? mapRowToComment(row, currentUserId) : null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    if (!entityType || !entityId) {
      throw new Error("entityType and entityId are required");
    }
    const cursor = parseCursor(searchParams.get("cursor"));
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 20), 1), 50);

    const roots = await fetchTopLevelComments(entityType, entityId, limit + 1, cursor, user.id);
    const hasMore = roots.length > limit;
    const limitedRoots = hasMore ? roots.slice(0, limit) : roots;
    const replies = await fetchReplies(limitedRoots.map((root) => root.id), user.id);
    const threaded = buildThread(limitedRoots, replies);
    const nextCursor = hasMore ? buildCursor(roots[roots.length - 1]) : null;

    return success({ data: threaded, meta: { nextCursor } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = commentCreateSchema.parse(await request.json());
    const content = sanitizeCommentBody(payload.content);
    const mentionIds = extractMentionIds(content);

    if (payload.parentId) {
      const parent = await query<{ parent_id: string | null }>(
        `SELECT parent_id FROM comments WHERE id = $1 LIMIT 1`,
        [payload.parentId]
      );
      const parentRow = parent.rows[0];
      if (!parentRow) throw new Error("Parent comment not found");
      if (parentRow.parent_id) {
        throw new Error("Nested replies are limited to two levels");
      }
    }

    const insert = await query(
      `INSERT INTO comments (content, entity_type, entity_id, user_id, parent_id, mentions, attachments)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id`,
      [
        content,
        payload.entityType,
        payload.entityId,
        user.id,
        payload.parentId ?? null,
        mentionIds,
        payload.attachments ?? [],
      ]
    );

    const commentId = insert.rows[0].id;
    const comment = await getCommentById(commentId, user.id);

    const context = await fetchEntityContext(payload.entityType, payload.entityId);

    await logActivity({
      type: "comment",
      action: payload.parentId ? "replied" : "created",
      description: `${user.email ?? "A teammate"} commented on ${context?.title ?? payload.entityType}`,
      userId: user.id,
      caseId: context?.caseId ?? (payload.entityType === "case" ? payload.entityId : null),
      metadata: { commentId },
    });

    await notifyMentionedUsers({
      commentId,
      actorId: user.id,
      entityId: payload.entityId,
      entityType: payload.entityType,
      mentionIds,
      url:
        payload.entityType === "case"
          ? `/cases/${payload.entityId}`
          : payload.entityType === "document"
          ? `/documents/${payload.entityId}`
          : undefined,
      actorName: comment?.user?.name,
      contextTitle: context?.title,
    });

    return success({ data: comment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = commentUpdateSchema.parse(await request.json());
    const existing = await query<{ user_id: string; mentions: string[] | null; entity_type: string; entity_id: string }>(
      `SELECT user_id, mentions, entity_type, entity_id FROM comments WHERE id = $1 LIMIT 1`,
      [payload.commentId]
    );
    const row = existing.rows[0];
    if (!row) throw new Error("Comment not found");
    if (row.user_id !== user.id && user.role !== "admin") {
      throw new Error("Not permitted to edit this comment");
    }

    const content = sanitizeCommentBody(payload.content);
    const mentionIds = extractMentionIds(content);

    await query(
      `UPDATE comments
       SET content = $2,
           mentions = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [payload.commentId, content, mentionIds]
    );

    const comment = await getCommentById(payload.commentId, user.id);

    const previousMentions = row.mentions ?? [];
    const diff = mentionIds.filter((target) => !previousMentions.includes(target));
    if (diff.length && comment) {
      const context = await fetchEntityContext(row.entity_type, row.entity_id);
      await notifyMentionedUsers({
        commentId: payload.commentId,
        actorId: user.id,
        entityId: row.entity_id,
        entityType: row.entity_type,
        mentionIds: diff,
        url:
          row.entity_type === "case"
            ? `/cases/${row.entity_id}`
            : row.entity_type === "document"
            ? `/documents/${row.entity_id}`
            : undefined,
        actorName: comment.user?.name,
        contextTitle: context?.title,
      });
    }

    await logActivity({
      type: "comment",
      action: "edited",
      description: `${user.email ?? "Someone"} edited a comment`,
      userId: user.id,
      metadata: { commentId: payload.commentId },
    });

    return success({ data: comment });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");
    if (!commentId) throw new Error("commentId is required");

    const existing = await query<{ user_id: string }>(
      `SELECT user_id FROM comments WHERE id = $1 LIMIT 1`,
      [commentId]
    );
    const row = existing.rows[0];
    if (!row) throw new Error("Comment not found");
    if (row.user_id !== user.id && user.role !== "admin") {
      throw new Error("Not permitted to delete this comment");
    }

    await query(`UPDATE comments SET deleted_at = NOW() WHERE id = $1`, [commentId]);
    await logActivity({
      type: "comment",
      action: "deleted",
      description: `${user.email ?? "Someone"} deleted a comment`,
      userId: user.id,
      metadata: { commentId },
    });

    return success({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = commentActionSchema.parse(await request.json());
    let result;
    if (payload.action === "like") {
      result = await query(
        `UPDATE comments
         SET liked_by = CASE WHEN NOT ($2 = ANY(liked_by)) THEN array_append(liked_by, $2) ELSE liked_by END,
             likes_count = CASE WHEN NOT ($2 = ANY(liked_by)) THEN likes_count + 1 ELSE likes_count END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [payload.commentId, user.id]
      );
    } else {
      result = await query(
        `UPDATE comments
         SET liked_by = array_remove(liked_by, $2),
             likes_count = GREATEST(likes_count - 1, 0),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [payload.commentId, user.id]
      );
    }
    if (!result.rows[0]) {
      throw new Error("Comment not found");
    }
    const comment = await getCommentById(payload.commentId, user.id);
    return success({ data: comment });
  } catch (error) {
    return handleApiError(error);
  }
}
