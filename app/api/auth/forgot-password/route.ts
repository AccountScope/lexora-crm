import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/api/validation";
import { handleApiError } from "@/lib/api/response";
import { query } from "@/lib/api/db";
import { queueEmailJob } from "@/lib/email/send";
import { logAuthEvent } from "@/lib/audit/logger";
import { getClientIp } from "@/lib/auth/sessions";

const RESET_EXPIRY_MINUTES = 60;
const RATE_LIMIT_MS = 5 * 60 * 1000;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SELF_HOSTED_APP_URL ?? "http://localhost:3000";
const SUPPORT_EMAIL = process.env.SECURITY_CONTACT_EMAIL ?? "security@lexora.app";

export async function POST(request: NextRequest) {
  try {
    const payload = forgotPasswordSchema.parse(await request.json());
    const email = payload.email.trim().toLowerCase();
    const userResult = await query<{ id: string; email: string; first_name: string | null }>(
      `SELECT id, email, first_name FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    const user = userResult.rows[0];

    if (user) {
      const recentToken = await query<{ created_at: string }>(
        `SELECT created_at FROM password_reset_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [user.id]
      );
      const lastSent = recentToken.rows[0]?.created_at ? new Date(recentToken.rows[0].created_at).getTime() : 0;
      const now = Date.now();
      if (now - lastSent >= RATE_LIMIT_MS) {
        const token = crypto.randomBytes(48).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(now + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();
        const ipAddress = getClientIp(request);
        const userAgent = request.headers.get("user-agent");

        await query(
          `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address, user_agent)
           VALUES ($1,$2,$3,$4,$5)`,
          [user.id, tokenHash, expiresAt, ipAddress ?? null, userAgent ?? null]
        );

        const resetUrl = `${APP_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
        await queueEmailJob({
          template: "PASSWORD_RESET",
          to: user.email,
          data: {
            firstName: user.first_name || undefined,
            resetUrl,
            expiresInMinutes: RESET_EXPIRY_MINUTES,
            supportEmail: SUPPORT_EMAIL,
          },
        });

        await logAuthEvent({
          type: "auth.password.reset.requested",
          success: true,
          actor: { id: user.id, email: user.email, ipAddress, userAgent: userAgent || undefined },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
