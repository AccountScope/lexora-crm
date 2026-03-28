import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import {
  clearTwoFactorSessionCookie,
  completeTwoFactorRecovery,
  disableTwoFactor,
  getSecurityOverview,
  regenerateBackupCodes,
  requestTwoFactorRecovery,
  startTwoFactorEnrollment,
  verifyTwoFactorEnrollment,
  verifyTwoFactorLogin,
} from "@/lib/auth/two-factor";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const overview = await getSecurityOverview({
      authUserId: user.id,
      role: user.role,
      cookieHeader: request.headers.get("cookie"),
    });
    return NextResponse.json({ data: overview });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (error) {
      body = {};
    }
    const action = body?.action;
    if (!action) {
      throw new ApiError(400, "Missing action");
    }

    if (action === "complete-recovery") {
      const token = body?.token as string;
      await completeTwoFactorRecovery(token);
      const response = NextResponse.json({ data: { recovered: true } });
      const cleared = clearTwoFactorSessionCookie();
      response.cookies.set(cleared.name, cleared.value, cleared.attributes);
      return response;
    }

    const user = await requireUser(request);

    switch (action) {
      case "init": {
        const secret = await startTwoFactorEnrollment(user.id);
        return NextResponse.json({ data: secret });
      }
      case "verify": {
        const result = await verifyTwoFactorEnrollment(user.id, body?.code);
        const response = NextResponse.json({ data: { backupCodes: result.backupCodes } });
        response.cookies.set(result.sessionCookie.name, result.sessionCookie.value, result.sessionCookie.attributes);
        return response;
      }
      case "regenerate-backup-codes": {
        const result = await regenerateBackupCodes(user.id);
        const response = NextResponse.json({ data: { codes: result.codes } });
        response.cookies.set(result.sessionCookie.name, result.sessionCookie.value, result.sessionCookie.attributes);
        return response;
      }
      case "disable": {
        await disableTwoFactor(user.id, {
          code: body?.code,
          backupCode: body?.backupCode,
          role: user.role,
        });
        const response = NextResponse.json({ data: { disabled: true } });
        const cleared = clearTwoFactorSessionCookie();
        response.cookies.set(cleared.name, cleared.value, cleared.attributes);
        return response;
      }
      case "login-verify": {
        const method = body?.method === "backup" ? "backup" : "totp";
        const cookie = await verifyTwoFactorLogin(user.id, { method, code: body?.code });
        const response = NextResponse.json({ data: { verified: true } });
        response.cookies.set(cookie.name, cookie.value, cookie.attributes);
        return response;
      }
      case "request-recovery": {
        await requestTwoFactorRecovery(user.id);
        return NextResponse.json({ data: { emailed: true } });
      }
      default:
        throw new ApiError(400, `Unknown action: ${action}`);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
