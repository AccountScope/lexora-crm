import { query } from "@/lib/api/db";
import type { NotificationPreferences, NotificationType, UserNotification, DeadlinePriority } from "@/types";
import type { NotificationPreferencesInput } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/errors";

const NOTIFICATION_TYPES: NotificationType[] = [
  "DEADLINE_REMINDER",
  "CASE_UPDATE",
  "DOCUMENT_UPLOADED",
  "INVOICE_SENT",
  "INVOICE_PAID",
  "NEW_CASE_ASSIGNMENT",
  "CASE_ASSIGNMENT",
  "CLIENT_PORTAL_MESSAGE",
  "COMMENT_MENTION",
  "DOCUMENT_TO_CASE",
  "DEADLINE_ALERT",
  "USER_INVITED",
];

const buildDefaultToggles = () => {
  return NOTIFICATION_TYPES.reduce<Record<NotificationType, boolean>>((acc, type) => {
    acc[type] = true;
    return acc;
  }, {} as Record<NotificationType, boolean>);
};

const mapPreferencesRow = (row: any): NotificationPreferences => {
  const togglesFromDb = row.toggles ?? {};
  const defaults = buildDefaultToggles();
  const merged = { ...defaults, ...togglesFromDb } as Record<NotificationType, boolean>;
  return {
    userId: row.user_id,
    channels: row.channels ?? ["EMAIL", "IN_APP"],
    emailFrequency: row.email_frequency,
    quietHours: {
      start: row.quiet_hours_start ? row.quiet_hours_start.slice(0, 5) : null,
      end: row.quiet_hours_end ? row.quiet_hours_end.slice(0, 5) : null,
    },
    digestHour: row.digest_hour ?? 7,
    toggles: merged,
    updatedAt: row.updated_at,
  };
};

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  const existing = await query(
    `SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  if (existing.rows[0]) {
    return mapPreferencesRow(existing.rows[0]);
  }
  const defaults = buildDefaultToggles();
  const inserted = await query(
    `INSERT INTO notification_preferences (user_id, channels, email_frequency, toggles)
     VALUES ($1, ARRAY['EMAIL','IN_APP'], 'INSTANT', $2::jsonb)
     RETURNING *`,
    [userId, JSON.stringify(defaults)]
  );
  return mapPreferencesRow(inserted.rows[0]);
};

export const updateNotificationPreferences = async (
  userId: string,
  payload: NotificationPreferencesInput
): Promise<NotificationPreferences> => {
  const toggles = { ...buildDefaultToggles(), ...payload.toggles };
  await query(
    `INSERT INTO notification_preferences (
      user_id, channels, email_frequency, quiet_hours_start, quiet_hours_end, digest_hour, toggles
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET
      channels = EXCLUDED.channels,
      email_frequency = EXCLUDED.email_frequency,
      quiet_hours_start = EXCLUDED.quiet_hours_start,
      quiet_hours_end = EXCLUDED.quiet_hours_end,
      digest_hour = EXCLUDED.digest_hour,
      toggles = EXCLUDED.toggles,
      updated_at = NOW()
    `,
    [
      userId,
      payload.channels,
      payload.emailFrequency,
      payload.quietHoursStart ?? null,
      payload.quietHoursEnd ?? null,
      payload.digestHour ?? 7,
      JSON.stringify(toggles),
    ]
  );
  return getNotificationPreferences(userId);
};

export const listNotifications = async (
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<{ notifications: UserNotification[]; unreadCount: number }> => {
  const limit = options.limit ?? 25;
  const unreadClause = options.unreadOnly ? "AND n.read_at IS NULL" : "";
  const result = await query(
    `SELECT
      n.id,
      n.type,
      n.title,
      n.message,
      n.url,
      n.metadata,
      n.related_case_id as "relatedCaseId",
      n.related_document_id as "relatedDocumentId",
      n.deadline_id as "deadlineId",
      n.priority,
      n.comment_id as "commentId",
      n.read_at as "readAt",
      n.created_at as "createdAt"
    FROM notifications n
    WHERE n.user_id = $1 ${unreadClause}
    ORDER BY n.created_at DESC
    LIMIT $2`,
    [userId, limit]
  );
  const unreadCountResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return {
    notifications: result.rows.map(mapNotificationRow),
    unreadCount: Number(unreadCountResult.rows[0]?.count ?? "0"),
  };
};

export const markNotificationRead = async (userId: string, notificationId: string, read: boolean) => {
  const result = await query(`UPDATE notifications SET read_at = CASE WHEN $3 THEN NOW() ELSE NULL END WHERE id = $1 AND user_id = $2 RETURNING id`, [
    notificationId,
    userId,
    read,
  ]);
  if (!result.rows.length) {
    throw new ApiError(404, "Notification not found");
  }
};

interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  url?: string | null;
  metadata?: Record<string, any> | null;
  relatedCaseId?: string | null;
  relatedDocumentId?: string | null;
  deadlineId?: string | null;
  priority?: DeadlinePriority | null;
  commentId?: string | null;
}

const mapNotificationRow = (row: any): UserNotification => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  url: row.url,
  metadata: row.metadata,
  relatedCaseId: row.relatedCaseId,
  relatedDocumentId: row.relatedDocumentId,
  deadlineId: row.deadlineId,
  priority: row.priority,
  commentId: row.commentId,
  readAt: row.readAt,
  createdAt: row.createdAt,
});

export const createNotification = async (payload: CreateNotificationPayload): Promise<UserNotification> => {
  const result = await query(
    `INSERT INTO notifications (
      user_id, type, title, message, url, metadata, related_case_id, related_document_id, deadline_id, priority, comment_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING
      id,
      type,
      title,
      message,
      url,
      metadata,
      related_case_id as "relatedCaseId",
      related_document_id as "relatedDocumentId",
      deadline_id as "deadlineId",
      priority,
      comment_id as "commentId",
      read_at as "readAt",
      created_at as "createdAt"`,
    [
      payload.userId,
      payload.type,
      payload.title,
      payload.message,
      payload.url ?? null,
      payload.metadata ?? null,
      payload.relatedCaseId ?? null,
      payload.relatedDocumentId ?? null,
      payload.deadlineId ?? null,
      payload.priority ?? null,
      payload.commentId ?? null,
    ]
  );
  return mapNotificationRow(result.rows[0]);
};
