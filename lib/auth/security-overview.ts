// Security overview for middleware (Edge Runtime compatible)
// No email imports allowed here!

import crypto from "crypto";
import type { Role } from "@/lib/rbac/roles";
import { query } from "@/lib/api/db";

const TWO_FACTOR_COOKIE = "lexora-2fa-session";
const sessionSecret = process.env.TWO_FACTOR_SESSION_SECRET ?? process.env.TWO_FACTOR_ENCRYPTION_KEY ?? "default-secret";
const sessionKey = crypto.createHash("sha256").update(sessionSecret).digest();
const sessionTtlMinutes = Number(process.env.TWO_FACTOR_SESSION_TTL_MINUTES ?? 720);
const sessionTtlMs = Math.max(sessionTtlMinutes, 1) * 60 * 1000;
const forceTwoFactorForAll = (process.env.LEXORA_FORCE_2FA_FOR_ALL ?? "").toLowerCase() === "true";
const graceDays = Math.max(1, Number(process.env.TWO_FACTOR_GRACE_DAYS ?? 7));

interface SecurityRecord {
  id: string;
  two_factor_enabled: boolean;
  two_factor_force_started_at: string | null;
  two_factor_force_deadline: string | null;
  two_factor_session_revoked_at: string | null;
  email_verified: boolean;
  locked_until: string | null;
}

export interface SecurityOverview {
  email: { verified: boolean };
  twoFactor: {
    enabled: boolean;
    verified: boolean;
    required: boolean;
    blocking: boolean;
  };
  backupCodesRemaining?: number;
}

async function getUserSecurityRecord(userId: string): Promise<SecurityRecord> {
  const res = await query(
    `SELECT 
      id, 
      two_factor_enabled, 
      two_factor_force_started_at,
      two_factor_force_deadline, 
      two_factor_session_revoked_at,
      email_verified, 
      locked_until
    FROM users WHERE id = $1`,
    [userId]
  );
  
  if (!res.rows[0]) {
    throw new Error("User not found");
  }
  
  return res.rows[0];
}

function shouldEnforceTwoFactor(role: Role): boolean {
  if (forceTwoFactorForAll) return true;
  return role === "admin";
}

function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair) => {
    const [key, value] = pair.trim().split("=");
    if (key && value !== undefined) {
      cookies[key] = value;
    }
  });
  return cookies;
}

function decodeSessionPayload(sessionCookie: string | undefined): { userId: string; issuedAt: number } | null {
  if (!sessionCookie) return null;
  try {
    const decoded = Buffer.from(sessionCookie, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", sessionKey, decoded.subarray(0, 16));
    const decrypted = Buffer.concat([decipher.update(decoded.subarray(16)), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}

async function ensureForceWindow(record: SecurityRecord, required: boolean) {
  if (!required || record.two_factor_enabled || record.two_factor_force_started_at) return;
  
  const now = new Date();
  const deadline = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);
  
  await query(
    `UPDATE users
     SET two_factor_force_started_at = $2, two_factor_force_deadline = $3
     WHERE id = $1
     AND two_factor_enabled = FALSE
     AND two_factor_force_started_at IS NULL`,
    [record.id, now.toISOString(), deadline.toISOString()]
  );
}

async function maybeResetLock(record: SecurityRecord) {
  if (record.locked_until && new Date(record.locked_until).getTime() < Date.now()) {
    await query(
      `UPDATE users
       SET locked_until = NULL
       WHERE id = $1`,
      [record.id]
    );
  }
}

export async function getSecurityOverview(params: {
  authUserId: string;
  role: Role;
  cookieHeader?: string | null;
}): Promise<SecurityOverview> {
  const record = await getUserSecurityRecord(params.authUserId);
  await maybeResetLock(record);
  
  const required = shouldEnforceTwoFactor(params.role) || !!record.two_factor_force_started_at;
  await ensureForceWindow(record, required);

  const cookies = parseCookieHeader(params.cookieHeader);
  const session = decodeSessionPayload(cookies[TWO_FACTOR_COOKIE]);
  const revokedAt = record.two_factor_session_revoked_at ? new Date(record.two_factor_session_revoked_at).getTime() : 0;
  const sessionValid =
    !!session &&
    session.userId === record.id &&
    Date.now() - session.issuedAt <= sessionTtlMs &&
    (!revokedAt || session.issuedAt >= revokedAt);

  const twoFactorVerified = record.two_factor_enabled ? (required ? sessionValid : true) : false;
  const forceDeadline = record.two_factor_force_deadline;
  const blocking = required && !record.two_factor_enabled && forceDeadline != null && new Date(forceDeadline).getTime() < Date.now();

  return {
    email: { verified: record.email_verified },
    twoFactor: {
      enabled: record.two_factor_enabled,
      verified: twoFactorVerified,
      required,
      blocking,
    },
  };
}
