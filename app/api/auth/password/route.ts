import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api/response";
import { changePasswordSchema } from "@/lib/api/validation";
import { getPasswordMetadata, updatePasswordForUser, verifyCurrentPassword } from "@/lib/auth/password";
import { getClientIp, describeDeviceFromUserAgent, resolveLocationFromIp, getSessionIdForToken, revokeOtherSessions, extractSessionToken, serializeSessionCookie, extractRememberPreference, rotateSessionToken } from "@/lib/auth/sessions";
import { queueEmailJob } from "@/lib/email/send";
import { withDb } from "@/lib/api/db";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SELF_HOSTED_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const meta = await getPasswordMetadata(user.id);
    return NextResponse.json({ data: meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = changePasswordSchema.parse(await request.json());
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent");
    const token = extractSessionToken(request);
    const rememberPreference = extractRememberPreference(request);
    const sessionId = await getSessionIdForToken(token);

    const result = await withDb(async (client) => {
      await verifyCurrentPassword(user.id, payload.currentPassword, client);
      return updatePasswordForUser(user.id, payload.newPassword, {
        client,
        actorId: user.id,
        actorEmail: user.email || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent ?? undefined,
        checkBreach: true,
      });
    });

    await revokeOtherSessions(user.id, sessionId || undefined);

    const rotated = await rotateSessionToken(token, rememberPreference);

    await queueEmailJob({
      template: "PASSWORD_CHANGED",
      to: user.email ?? "",
      data: {
        firstName: result.user?.firstName || undefined,
        changedAt: result.passwordChangedAt ?? new Date().toISOString(),
        device: describeDeviceFromUserAgent(userAgent || undefined),
        location: resolveLocationFromIp(ipAddress),
        ipAddress: ipAddress || undefined,
        nextStepsUrl: `${APP_URL.replace(/\/$/, "")}/settings/password`,
      },
    });

    const meta = await getPasswordMetadata(user.id);
    const response = NextResponse.json({ ok: true, data: meta });
    if (rotated) {
      const cookie = serializeSessionCookie(rotated.token, rotated.rememberMe);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
