import type { UserNotification } from "@/types";
import { sendMentionNotification } from "@/lib/notifications/sender";

interface MentionNotifyOptions {
  commentId: string;
  actorId: string;
  entityId: string;
  entityType: string;
  mentionIds: string[];
  url?: string;
  actorName?: string;
  contextTitle?: string;
}

export const notifyMentionedUsers = async ({
  commentId,
  actorId,
  entityId,
  entityType,
  mentionIds,
  url,
  actorName,
  contextTitle,
}: MentionNotifyOptions): Promise<UserNotification[]> => {
  if (!mentionIds?.length) return [];
  const results: UserNotification[] = [];
  for (const userId of mentionIds) {
    if (userId === actorId) continue;
    const notification = await sendMentionNotification({
      userId,
      commentId,
      entityId,
      entityType,
      url,
      actorName,
      contextTitle,
    });
    if (notification) {
      results.push(notification);
    }
  }
  return results;
};
