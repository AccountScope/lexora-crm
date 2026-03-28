import { query } from "@/lib/api/db";
import type { ActivityFilters, ActivityRecord } from "@/types";
import { emitActivityEvent } from "@/lib/notifications/sender";

interface ActivityPayload {
  type: ActivityRecord["type"];
  action: string;
  description: string;
  userId?: string | null;
  caseId?: string | null;
  documentId?: string | null;
  metadata?: Record<string, any> | null;
}

const ROW_SELECT = `
  a.id,
  a.type,
  a.action,
  a.description,
  a.metadata,
  a.created_at as "createdAt",
  CASE
    WHEN u.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', u.id,
      'name', CONCAT(u.first_name, ' ', u.last_name),
      'email', u.email,
      'avatarUrl', u.avatar_url
    )
  END as "user",
  CASE
    WHEN m.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', m.id,
      'title', m.title,
      'matterNumber', m.matter_number
    )
  END as "case",
  CASE
    WHEN d.id IS NULL THEN NULL
    ELSE json_build_object(
      'id', d.id,
      'title', d.title
    )
  END as "document"
`;

const buildCursor = (record: { id: string; createdAt: string }) => `${new Date(record.createdAt).toISOString()}__${record.id}`;

const parseCursor = (cursor?: string | null) => {
  if (!cursor) return { createdAt: null as string | null, id: null as string | null };
  const [ts, id] = cursor.split("__");
  if (!ts || !id) return { createdAt: null, id: null };
  return { createdAt: ts, id };
};

const mapRowToActivity = (row: any): ActivityRecord => ({
  id: row.id,
  type: row.type,
  action: row.action,
  description: row.description,
  createdAt: row.createdAt,
  metadata: row.metadata ?? null,
  user: row.user ?? null,
  case: row.case ?? null,
  document: row.document ?? null,
  linkUrl:
    row.document?.id ? `/documents/${row.document.id}` : row.case?.id ? `/cases/${row.case.id}` : null,
});

export const logActivity = async (payload: ActivityPayload): Promise<ActivityRecord> => {
  const result = await query(
    `INSERT INTO activities (type, action, description, user_id, case_id, document_id, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING ${ROW_SELECT}`,
    [payload.type, payload.action, payload.description, payload.userId ?? null, payload.caseId ?? null, payload.documentId ?? null, payload.metadata ?? null]
  );
  const record = mapRowToActivity(result.rows[0]);
  emitActivityEvent(record);
  return record;
};

export const listActivities = async (
  filters: ActivityFilters = {},
  options: { limit?: number; cursor?: string | null } = {}
): Promise<{ data: ActivityRecord[]; nextCursor?: string | null }> => {
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const { createdAt, id } = parseCursor(options.cursor);
  const result = await query(
    `SELECT ${ROW_SELECT}
     FROM activities a
     LEFT JOIN users u ON u.id = a.user_id
     LEFT JOIN matters m ON m.id = a.case_id
     LEFT JOIN documents d ON d.id = a.document_id
     WHERE ($1::text[] IS NULL OR a.type = ANY($1))
       AND ($2::uuid IS NULL OR a.user_id = $2)
       AND ($3::uuid IS NULL OR a.case_id = $3)
       AND ($4::uuid IS NULL OR a.document_id = $4)
       AND ($5::text IS NULL OR a.description ILIKE '%' || $5 || '%')
       AND ($6::timestamptz IS NULL OR a.created_at >= $6)
       AND ($7::timestamptz IS NULL OR a.created_at <= $7)
       AND (
         $8::timestamptz IS NULL
         OR a.created_at < $8
         OR (a.created_at = $8 AND ($9::uuid IS NULL OR a.id < $9))
       )
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $10`,
    [
      filters.types ?? null,
      filters.userId ?? null,
      filters.caseId ?? null,
      filters.documentId ?? null,
      filters.search ?? null,
      filters.from ?? null,
      filters.to ?? null,
      createdAt,
      id,
      limit + 1,
    ]
  );

  const rows = result.rows.map(mapRowToActivity);
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? buildCursor(rows[rows.length - 1]) : null;

  return { data, nextCursor };
};

export const listCaseActivities = async (
  caseId: string,
  options: { limit?: number; cursor?: string | null } = {}
) => listActivities({ caseId }, options);
