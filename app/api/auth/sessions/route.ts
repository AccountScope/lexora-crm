import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api/response";
import { sessionActionSchema } from "@/lib/api/validation";
import {
  ensureSession,
  listUserSessions,
  revokeSession,
  revokeOtherSessions,
  extendSession,
  serializeSessionCookie,
  serializeRememberCookie,
  extractSessionToken,
  extractRememberPreference,
  getSessionIdForToken,
  SESSION_IDLE_TIMEOUT_MS,
  getClientIp,
} from "@/lib/auth/sessions";
import { getPasswordMetadata } from "@/lib/auth/password";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const rememberPreference = extractRememberPreference(request);
    const token = extractSessionToken(request);
    const ensureResult = await ensureSession({
      userId: user.id,
      userEmail: user.email ?? undefined,
      token,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      rememberMe: rememberPreference,
    });

    const sessions = await listUserSessions(user.id, ensureResult.tokenHash);
    const password = await getPasswordMetadata(user.id);
    const response = NextResponse.json({
      data: sessions,
      meta: {
        password,
        rememberMe: rememberPreference,
        idleTimeoutMinutes: Math.floor(SESSION_IDLE_TIMEOUT_MS / 60000),
      },
    });

    if (ensureResult.issuedCookie) {
      const cookie = serializeSessionCookie(ensureResult.token, rememberPreference);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const payload = sessionActionSchema.parse(await request.json());
    const token = extractSessionToken(request);
    const rememberPreference = extractRememberPreference(request);
    const response = NextResponse.json({ ok: true });

    switch (payload.action) {
      case "revoke": {
        await revokeSession(user.id, payload.sessionId);
        break;
      }
      case "revoke-others": {
        const sessionId = await getSessionIdForToken(token);
        await revokeOtherSessions(user.id, sessionId ?? undefined);
        break;
      }
      case "extend": {
        if (!token) {
          throw new Error("No active session token");
        }
        const session = await extendSession(token, payload.rememberMe ?? rememberPreference);
        const cookie = serializeSessionCookie(token, session.rememberMe);
        response.cookies.set(cookie.name, cookie.value, cookie.options);
        break;
      }
      case "remember": {
        const cookie = serializeRememberCookie(payload.rememberMe);
        response.cookies.set(cookie.name, cookie.value, cookie.options);
        break;
      }
      default:
        break;
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
