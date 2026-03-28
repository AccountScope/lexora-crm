import crypto from "crypto";
import { query } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { sendEmail } from "@/lib/email/send";
import { renderEmailTemplate } from "@/lib/email/templates";
import { getAppBaseUrl } from "@/lib/utils/app-url";

const VERIFICATION_TTL_HOURS = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24);
const RESEND_INTERVAL_MINUTES = Number(process.env.EMAIL_VERIFICATION_RESEND_MINUTES ?? 5);

const verificationLink = (token: string) => `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

const fetchUserVerificationRow = async (userId: string) => {
  const result = await query<{
    id: string;
    email: string;
    email_verified: boolean;
    email_verification_token: string | null;
    email_verification_expires: string | null;
    email_verification_last_sent: string | null;
  }>(
    `SELECT id, email, email_verified, email_verification_token, email_verification_expires, email_verification_last_sent
     FROM users
     WHERE id = $1 OR external_auth_id = $1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] ?? null;
};

const dispatchVerificationEmail = async (email: string, token: string, expiresAt: string) => {
  const { subject, html, text } = renderEmailTemplate("EMAIL_VERIFICATION", {
    email,
    verifyUrl: verificationLink(token),
    expiresAt,
  });
  await sendEmail({ to: email, subject, html, text });
};

export const upsertEmailVerificationToken = async (userId: string) => {
  const user = await fetchUserVerificationRow(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const token = crypto.randomUUID();
  const result = await query<{ email: string; expires_at: string }>(
    `UPDATE users
     SET email_verification_token = $2,
         email_verification_expires = NOW() + ($3 * INTERVAL '1 hour'),
         email_verification_last_sent = NOW(),
         email_verified = FALSE,
         updated_at = NOW()
     WHERE id = $1
     RETURNING email, email_verification_expires as expires_at`,
    [user.id, token, VERIFICATION_TTL_HOURS]
  );
  const updated = result.rows[0];
  await dispatchVerificationEmail(updated.email, token, updated.expires_at);
  return { token, email: updated.email, expiresAt: updated.expires_at };
};

export const resendVerificationEmail = async (userId: string) => {
  const user = await fetchUserVerificationRow(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.email_verified) {
    throw new ApiError(400, "Email already verified");
  }
  if (user.email_verification_last_sent) {
    const lastSent = new Date(user.email_verification_last_sent).getTime();
    const nextAllowed = lastSent + RESEND_INTERVAL_MINUTES * 60 * 1000;
    if (Date.now() < nextAllowed) {
      throw new ApiError(429, "Please wait before requesting another email", {
        retryAt: new Date(nextAllowed).toISOString(),
      });
    }
  }
  return upsertEmailVerificationToken(user.id);
};

export const verifyEmailToken = async (token: string) => {
  if (!token) {
    throw new ApiError(400, "Missing verification token");
  }
  const result = await query<{ id: string; email: string }>(
    `UPDATE users
     SET email_verified = TRUE,
         email_verification_token = NULL,
         email_verification_expires = NULL,
         email_verification_last_sent = NULL,
         updated_at = NOW()
     WHERE email_verification_token = $1
       AND email_verification_expires IS NOT NULL
       AND email_verification_expires >= NOW()
     RETURNING id, email`,
    [token]
  );
  const row = result.rows[0];
  if (!row) {
    throw new ApiError(400, "Verification link is invalid or expired");
  }
  return row;
};

export const getEmailVerificationStatus = async (userId: string) => {
  const user = await fetchUserVerificationRow(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return {
    email: user.email,
    verified: user.email_verified,
    lastSentAt: user.email_verification_last_sent,
    expiresAt: user.email_verification_expires,
  };
};
