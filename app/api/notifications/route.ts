import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, success } from "@/lib/api/response";
import {
  getNotificationPreferences,
  listNotifications,
  markNotificationRead,
  updateNotificationPreferences,
} from "@/lib/api/notifications";
import { notificationActionSchema } from "@/lib/api/validation";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") ?? "inbox";
    if (scope === "preferences") {
      const data = await getNotificationPreferences(user.id);
      return success({ data });
    }
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Number(searchParams.get("limit") ?? "20");
    const { notifications, unreadCount } = await listNotifications(user.id, { unreadOnly, limit });
    return success({ data: notifications, meta: { unreadCount } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const json = await request.json();
    const payload = notificationActionSchema.parse(json);
    if (payload.action === "preferences") {
      const updated = await updateNotificationPreferences(user.id, payload.payload);
      return success({ data: updated });
    }
    await markNotificationRead(user.id, payload.notificationId, payload.read ?? true);
    return success({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
