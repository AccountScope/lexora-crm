import { EventEmitter } from "events";
import type { ActivityRecord, NotificationStreamEvent, UserNotification } from "@/types";
import { createNotification, getNotificationPreferences } from "@/lib/api/notifications";
import { queueEmailJob } from "@/lib/email/send";
import { query } from "@/lib/api/db";

const stream = new EventEmitter();
stream.setMaxListeners(1000);

const dispatch = (event: NotificationStreamEvent) => {
  stream.emit("broadcast", event);
};

export const subscribeToNotificationStream = (handler: (event: NotificationStreamEvent) => void) => {
  stream.on("broadcast", handler);
  return () => stream.off("broadcast", handler);
};

export const emitActivityEvent = (activity: ActivityRecord) => {
  dispatch({ kind: "activity", payload: activity });
};

export const emitNotificationEvent = (notification: UserNotification, userId: string) => {
  dispatch({ kind: "notification", targetUserId: userId, payload: notification });
};

interface MentionNotificationPayload {
  userId: string;
  commentId: string;
  entityId: string;
  entityType: string;
  url?: string;
  actorName?: string;
  contextTitle?: string;
}

export const sendMentionNotification = async (
  payload: MentionNotificationPayload
): Promise<UserNotification | null> => {
  const notification = await createNotification({
    userId: payload.userId,
    type: "COMMENT_MENTION",
    title: "You were mentioned in a comment",
    message: payload.contextTitle ? `In ${payload.contextTitle}` : "Open the thread to reply",
    url: payload.url ?? `/comments/${payload.commentId}`,
    metadata: {
      entityId: payload.entityId,
      entityType: payload.entityType,
      actorName: payload.actorName,
      entityTitle: payload.contextTitle,
    },
    relatedCaseId: payload.entityType === "case" ? payload.entityId : undefined,
    commentId: payload.commentId,
  });

  if (!notification) {
    return null;
  }

  emitNotificationEvent(notification, payload.userId);

  const preferences = await getNotificationPreferences(payload.userId);
  const prefersEmail =
    preferences.channels.includes("EMAIL") &&
    preferences.toggles.COMMENT_MENTION !== false &&
    preferences.emailFrequency !== "WEEKLY";

  if (prefersEmail) {
    const recipient = await query<{ email: string | null; first_name: string | null; last_name: string | null }>(
      `SELECT email, first_name, last_name FROM users WHERE id = $1 LIMIT 1`,
      [payload.userId]
    );
    const email = recipient.rows[0]?.email;
    if (email) {
      await queueEmailJob({
        template: "COMMENT_MENTION",
        to: email,
        data: {
          actorName: payload.actorName ?? "A colleague",
          preview: notification.message,
          contextTitle: payload.contextTitle ?? "Lexora",
          link: notification.url ?? undefined,
        },
      });
    }
  }

  return notification;
};
