import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/response";
import { resetPasswordSchema } from "@/lib/api/validation";
import { withDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { updatePasswordForUser, getPasswordMetadata } from "@/lib/auth/password";
import { queueEmailJob } from "@/lib/email/send";
import { getClientIp, revokeAllSessions, describeDeviceFromUserAgent, resolveLocationFromIp } from "@/lib/auth/sessions";
import { logAuthEvent } from "@/lib/audit/logger";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SELF_HOSTED_APP_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      throw new ApiError(400, "Token is required");
    }
    const tokenHash = hashToken(token);
    const result = await withDb(async (client) => {
      const res = await client.query(
        `SELECT id FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW() LIMIT 1`,
        [tokenHash]
      );
      return res.rows[0];
    });
    if (!result) {
      throw new ApiError(400, "Invalid or expired reset link");
    }
    return NextResponse.json({ data: { valid: true } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = resetPasswordSchema.parse(body);
    const tokenHash = hashToken(payload.token);
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent");

    const { userId, email } = await withDb(async (client) => {
      const res = await client.query<{ id: string; user_id: string; email: string }>(
        `SELECT prt.id, prt.user_id, u.email
         FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token = $1 AND prt.used = FALSE AND prt.expires_at > NOW()
         LIMIT 1 FOR UPDATE`,
        [tokenHash]
      );
      const row = res.rows[0];
      if (!row) {
        throw new ApiError(400, "Invalid or expired reset link");
      }

      await updatePasswordForUser(row.user_id, payload.password, {
        client,
        actorId: row.user_id,
        actorEmail: row.email,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent ?? undefined,
        checkBreach: true,
      });

      await client.query(`UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = $1`, [row.id]);
      return { userId: row.user_id, email: row.email };
    });

    await revokeAllSessions(userId);

    const device = describeDeviceFromUserAgent(userAgent || undefined);
    const location = resolveLocationFromIp(ipAddress);
    const meta = await getPasswordMetadata(userId);
    const secureUrl = `${APP_URL.replace(/\/$/, "")}/settings/password`;

    await queueEmailJob({
      template: "PASSWORD_CHANGED",
      to: email,
      data: {
        firstName: undefined,
        changedAt: new Date().toISOString(),
        device,
        location,
        ipAddress: ipAddress || undefined,
        nextStepsUrl: secureUrl,
      },
    });

    await logAuthEvent({
      type: "auth.password.reset.completed",
      success: true,
      actor: { id: userId, email, ipAddress: ipAddress || undefined, userAgent: userAgent ?? undefined },
    });

    return NextResponse.json({ ok: true, meta });
  } catch (error) {
    return handleApiError(error);
  }
}
