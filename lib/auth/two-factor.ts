// @ts-ignore - no type declarations
import crypto from "crypto";
// @ts-ignore - no type declarations for speakeasy
import speakeasy from "speakeasy";
import bcrypt from "bcrypt";
import type { Role } from "@/lib/rbac/roles";
import { query, withDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
// Lazy-load email functions to avoid Edge Runtime issues in middleware
const renderEmailTemplate = async (template: string, data: any) => {
  const { renderEmailTemplate: fn } = await import("@/lib/email/templates");
  return fn(template, data);
};

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  const { sendEmail: fn } = await import("@/lib/email/send");
  return fn(to, subject, html, text);
};
import { getAppBaseUrl } from "@/lib/utils/app-url";

const issuer = process.env.TWO_FACTOR_ISSUER ?? "Lexora";
const encryptionSecret = process.env.TWO_FACTOR_ENCRYPTION_KEY;

if (!encryptionSecret || encryptionSecret.length < 16) {
  throw new Error("TWO_FACTOR_ENCRYPTION_KEY must be set and at least 16 characters long");
}

const cipherKey = crypto.createHash("sha256").update(encryptionSecret).digest();
const sessionSecret = process.env.TWO_FACTOR_SESSION_SECRET ?? encryptionSecret;
const sessionKey = crypto.createHash("sha256").update(sessionSecret).digest();
const sessionTtlMinutes = Number(process.env.TWO_FACTOR_SESSION_TTL_MINUTES ?? 720);
const sessionTtlMs = Math.max(sessionTtlMinutes, 1) * 60 * 1000;
const maxAttempts = Math.max(1, Number(process.env.TWO_FACTOR_MAX_ATTEMPTS ?? 5));
const lockMinutes = Math.max(1, Number(process.env.TWO_FACTOR_LOCK_MINUTES ?? 15));
const recoveryLinkTtlMinutes = Math.max(1, Number(process.env.TWO_FACTOR_RECOVERY_TTL_MINUTES ?? 60));
const graceDays = Math.max(1, Number(process.env.TWO_FACTOR_GRACE_DAYS ?? 7));
const forceTwoFactorForAll = (process.env.LEXORA_FORCE_2FA_FOR_ALL ?? "").toLowerCase() === "true";
const backupCodeRounds = Math.max(10, Number(process.env.TWO_FACTOR_BACKUP_ROUNDS ?? 12));
const appBaseUrl = getAppBaseUrl();

const TWO_FACTOR_COOKIE = "lexora-mfa";

interface SecurityUserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  two_factor_secret: string | null;
  two_factor_enabled: boolean;
  two_factor_attempts: number;
  two_factor_locked_until: string | null;
  two_factor_recovery_token: string | null;
  two_factor_recovery_expires: string | null;
  two_factor_force_started_at: string | null;
  two_factor_force_deadline: string | null;
  two_factor_session_revoked_at: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expires: string | null;
  email_verification_last_sent: string | null;
}

export interface TwoFactorStatus {
  enabled: boolean;
  verified: boolean;
  required: boolean;
  blocking: boolean;
  forceDeadline?: string | null;
  forceStartedAt?: string | null;
  attemptsRemaining: number;
  lockedUntil?: string | null;
  backupCodesRemaining: number;
  recoveryPending: boolean;
}

export interface SecurityOverview {
  twoFactor: TwoFactorStatus;
  email: {
    address: string;
    verified: boolean;
    lastSentAt?: string | null;
    expiresAt?: string | null;
  };
}

interface TwoFactorSessionCookie {
  name: string;
  value: string;
  attributes: {
    path: string;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
    maxAge: number;
  };
}

const encryptSecret = (plain: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", cipherKey, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

const decryptSecret = (payload: string) => {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", cipherKey, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};

const parseCookieHeader = (header?: string | null) => {
  if (!header) return {} as Record<string, string>;
  return header.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [rawKey, rawValue] = pair.split("=");
    if (!rawKey || !rawValue) return acc;
    acc[rawKey.trim()] = decodeURIComponent(rawValue.trim());
    return acc;
  }, {});
};

interface SessionPayload {
  userId: string;
  issuedAt: number;
  signature: string;
}

const encodeSessionPayload = (userId: string, issuedAt: number): string => {
  const signature = crypto.createHmac("sha256", sessionKey).update(`${userId}.${issuedAt}`).digest("hex");
  const payload: SessionPayload = { userId, issuedAt, signature };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
};

const decodeSessionPayload = (value: string | undefined | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString()) as Partial<SessionPayload>;
    if (!parsed.userId || typeof parsed.issuedAt !== "number" || typeof parsed.signature !== "string") {
      return null;
    }
    const expected = crypto.createHmac("sha256", sessionKey).update(`${parsed.userId}.${parsed.issuedAt}`).digest("hex");
    const provided = Buffer.from(parsed.signature, "hex");
    const comparison = Buffer.from(expected, "hex");
    if (provided.length !== comparison.length || !crypto.timingSafeEqual(provided, comparison)) {
      return null;
    }
    return parsed as SessionPayload;
  } catch (error) {
    return null;
  }
};

export const createTwoFactorSessionCookie = (userId: string, issuedAt = Date.now()): TwoFactorSessionCookie => {
  return {
    name: TWO_FACTOR_COOKIE,
    value: encodeSessionPayload(userId, issuedAt),
    attributes: {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: Math.floor(sessionTtlMs / 1000),
    },
  };
};

export const clearTwoFactorSessionCookie = (): TwoFactorSessionCookie => ({
  name: TWO_FACTOR_COOKIE,
  value: "",
  attributes: {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  },
});

const getUserSecurityRecord = async (authUserId: string): Promise<SecurityUserRecord> => {
  const result = await query<SecurityUserRecord>(
    `SELECT
      id,
      email,
      first_name,
      last_name,
      two_factor_secret,
      two_factor_enabled,
      two_factor_attempts,
      two_factor_locked_until,
      two_factor_recovery_token,
      two_factor_recovery_expires,
      two_factor_force_started_at,
      two_factor_force_deadline,
      two_factor_session_revoked_at,
      email_verified,
      email_verification_token,
      email_verification_expires,
      email_verification_last_sent
     FROM users
     WHERE id = $1 OR external_auth_id = $1
     LIMIT 1`,
    [authUserId]
  );
  const record = result.rows[0];
  if (!record) {
    throw new ApiError(404, "User record not found");
  }
  return record;
};

const maybeResetLock = async (record: SecurityUserRecord) => {
  if (!record.two_factor_locked_until) return;
  const lockedUntil = new Date(record.two_factor_locked_until).getTime();
  if (lockedUntil > Date.now()) {
    return;
  }
  await query(
    `UPDATE users
     SET two_factor_locked_until = NULL,
         two_factor_attempts = 0,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id]
  );
  record.two_factor_locked_until = null;
  record.two_factor_attempts = 0;
};

const shouldEnforceTwoFactor = (role: Role) => role === "admin" || forceTwoFactorForAll;

const ensureForceWindow = async (record: SecurityUserRecord, required: boolean) => {
  if (!required || record.two_factor_enabled || record.two_factor_force_started_at) {
    return record;
  }
  const result = await query<{ started_at: string; deadline: string }>(
    `UPDATE users
     SET two_factor_force_started_at = NOW(),
         two_factor_force_deadline = NOW() + ($2 * INTERVAL '1 day'),
         updated_at = NOW()
     WHERE id = $1
     RETURNING two_factor_force_started_at as started_at, two_factor_force_deadline as deadline`,
    [record.id, graceDays]
  );
  const row = result.rows[0];
  if (row) {
    record.two_factor_force_started_at = row.started_at;
    record.two_factor_force_deadline = row.deadline;
  }
  return record;
};

const countUnusedBackupCodes = async (userId: string) => {
  const result = await query<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM backup_codes WHERE user_id = $1 AND used = FALSE`,
    [userId]
  );
  return Number(result.rows[0]?.count ?? "0");
};

const normalizeTotp = (token: string) => {
  const trimmed = token?.trim();
  if (!trimmed || !/^\d{6}$/.test(trimmed)) {
    throw new ApiError(400, "Invalid authentication code");
  }
  return trimmed;
};

const generateBackupCode = () => {
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
};

const normalizeBackupCodeInput = (input: string) => {
  const raw = input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (raw.length < 10) {
    throw new ApiError(400, "Backup code must be 10 characters");
  }
  const value = raw.slice(0, 10);
  return `${value.slice(0, 5)}-${value.slice(5)}`;
};

const createBackupCodes = async (userId: string) => {
  const codes = Array.from({ length: 10 }, generateBackupCode);
  const hashes = await Promise.all(codes.map((code) => bcrypt.hash(code, backupCodeRounds)));
  await withDb(async (client) => {
    await client.query(`DELETE FROM backup_codes WHERE user_id = $1`, [userId]);
    for (let index = 0; index < codes.length; index += 1) {
      await client.query(
        `INSERT INTO backup_codes (user_id, code_hash) VALUES ($1,$2)`,
        [userId, hashes[index]]
      );
    }
  });
  return codes;
};

const consumeBackupCode = async (userId: string, code: string) => {
  const formatted = normalizeBackupCodeInput(code);
  return withDb(async (client) => {
    const rows = await client.query<{ id: string; code_hash: string }>(
      `SELECT id, code_hash FROM backup_codes WHERE user_id = $1 AND used = FALSE FOR UPDATE`,
      [userId]
    );
    for (const row of rows.rows) {
      const match = await bcrypt.compare(formatted, row.code_hash);
      if (match) {
        await client.query(`UPDATE backup_codes SET used = TRUE, used_at = NOW() WHERE id = $1`, [row.id]);
        return true;
      }
    }
    return false;
  });
};

const updateSessionRevocation = async (userId: string, timestamp: Date) => {
  await query(
    `UPDATE users SET two_factor_session_revoked_at = $2, updated_at = NOW() WHERE id = $1`,
    [userId, timestamp.toISOString()]
  );
};

const verifyTotp = (record: SecurityUserRecord, token: string) => {
  if (!record.two_factor_secret) {
    throw new ApiError(400, "2FA secret not initialized");
  }
  const secret = decryptSecret(record.two_factor_secret);
  return speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 });
};

const incrementAttempts = async (record: SecurityUserRecord) => {
  const attempts = record.two_factor_attempts + 1;
  const lock = attempts >= maxAttempts;
  record.two_factor_attempts = attempts;
  record.two_factor_locked_until = lock
    ? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()
    : record.two_factor_locked_until;
  await query(
    `UPDATE users
     SET two_factor_attempts = $2,
         two_factor_locked_until = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id, attempts, lock ? record.two_factor_locked_until : null]
  );
  if (lock) {
    throw new ApiError(423, "Too many attempts. 2FA temporarily locked.", {
      lockedUntil: record.two_factor_locked_until,
    });
  }
  throw new ApiError(401, "Invalid authentication code");
};

const resetAttempts = async (record: SecurityUserRecord) => {
  record.two_factor_attempts = 0;
  record.two_factor_locked_until = null;
  await query(
    `UPDATE users
     SET two_factor_attempts = 0,
         two_factor_locked_until = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id]
  );
};

const clearTwoFactorState = async (userId: string, options: { restartForceWindow?: boolean }) => {
  const revokedAt = new Date();
  const forceStarted = options.restartForceWindow ? revokedAt.toISOString() : null;
  const forceDeadline = options.restartForceWindow
    ? new Date(revokedAt.getTime() + graceDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  await withDb(async (client) => {
    await client.query(
      `UPDATE users
       SET two_factor_enabled = FALSE,
           two_factor_secret = NULL,
           two_factor_attempts = 0,
           two_factor_locked_until = NULL,
           two_factor_recovery_token = NULL,
           two_factor_recovery_expires = NULL,
           two_factor_session_revoked_at = $2,
           two_factor_force_started_at = $3,
           two_factor_force_deadline = $4,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, revokedAt.toISOString(), forceStarted, forceDeadline]
    );
    await client.query(`DELETE FROM backup_codes WHERE user_id = $1`, [userId]);
  });
};

const hashRecoveryToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const getSecurityOverview = async (params: {
  authUserId: string;
  role: Role;
  cookieHeader?: string | null;
}): Promise<SecurityOverview> => {
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
  const backupCodesRemaining = await countUnusedBackupCodes(record.id);
  const forceDeadline = record.two_factor_force_deadline;
  const blocking = required && !record.two_factor_enabled && forceDeadline != null && new Date(forceDeadline).getTime() < Date.now();

  return {
    twoFactor: {
      enabled: record.two_factor_enabled,
      verified: twoFactorVerified,
      required,
      blocking,
      forceDeadline,
      forceStartedAt: record.two_factor_force_started_at,
      attemptsRemaining: Math.max(0, maxAttempts - record.two_factor_attempts),
      lockedUntil: record.two_factor_locked_until,
      backupCodesRemaining,
      recoveryPending: !!record.two_factor_recovery_expires && new Date(record.two_factor_recovery_expires).getTime() > Date.now(),
    },
    email: {
      address: record.email,
      verified: record.email_verified,
      lastSentAt: record.email_verification_last_sent,
      expiresAt: record.email_verification_expires,
    },
  };
};

export const startTwoFactorEnrollment = async (authUserId: string) => {
  const record = await getUserSecurityRecord(authUserId);
  const label = record.email ? `${issuer} (${record.email})` : `${issuer}`;
  const secret = speakeasy.generateSecret({ name: label, issuer, length: 32 });
  const now = new Date();
  await query(
    `UPDATE users
     SET two_factor_secret = $2,
         two_factor_enabled = FALSE,
         two_factor_attempts = 0,
         two_factor_locked_until = NULL,
         two_factor_session_revoked_at = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id, encryptSecret(secret.base32), now.toISOString()]
  );
  return { base32: secret.base32, otpauthUrl: secret.otpauth_url };
};

export const verifyTwoFactorEnrollment = async (authUserId: string, token: string) => {
  const record = await getUserSecurityRecord(authUserId);
  if (!record.two_factor_secret) {
    throw new ApiError(400, "Generate a new QR code before verifying");
  }
  const normalized = normalizeTotp(token);
  const valid = verifyTotp(record, normalized);
  if (!valid) {
    throw new ApiError(401, "Invalid authentication code");
  }
  const backupCodes = await createBackupCodes(record.id);
  const now = new Date();
  await query(
    `UPDATE users
     SET two_factor_enabled = TRUE,
         two_factor_attempts = 0,
         two_factor_locked_until = NULL,
         two_factor_recovery_token = NULL,
         two_factor_recovery_expires = NULL,
         two_factor_force_started_at = NULL,
         two_factor_force_deadline = NULL,
         two_factor_session_revoked_at = $2,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id, now.toISOString()]
  );
  return { backupCodes, sessionCookie: createTwoFactorSessionCookie(record.id, now.getTime()) };
};

export const regenerateBackupCodes = async (authUserId: string) => {
  const record = await getUserSecurityRecord(authUserId);
  if (!record.two_factor_enabled) {
    throw new ApiError(400, "Enable 2FA before generating backup codes");
  }
  const codes = await createBackupCodes(record.id);
  const now = new Date();
  await updateSessionRevocation(record.id, now);
  return { codes, sessionCookie: createTwoFactorSessionCookie(record.id, now.getTime()) };
};

export const disableTwoFactor = async (authUserId: string, options: { code?: string; backupCode?: string; role: Role }) => {
  const record = await getUserSecurityRecord(authUserId);
  if (!record.two_factor_enabled) {
    return;
  }
  const required = shouldEnforceTwoFactor(options.role) || !!record.two_factor_force_started_at;
  if (required) {
    throw new ApiError(403, "2FA is required and cannot be disabled");
  }
  if (!options.code && !options.backupCode) {
    throw new ApiError(400, "Provide a code to disable 2FA");
  }
  if (options.code) {
    const normalized = normalizeTotp(options.code);
    const valid = verifyTotp(record, normalized);
    if (!valid) {
      throw new ApiError(401, "Invalid authentication code");
    }
  } else if (options.backupCode) {
    const consumed = await consumeBackupCode(record.id, options.backupCode);
    if (!consumed) {
      throw new ApiError(401, "Backup code not recognized");
    }
  }
  await clearTwoFactorState(record.id, { restartForceWindow: false });
};

export const verifyTwoFactorLogin = async (authUserId: string, payload: { method: "totp" | "backup"; code: string }) => {
  const record = await getUserSecurityRecord(authUserId);
  if (!record.two_factor_enabled) {
    throw new ApiError(400, "2FA is not enabled for this account");
  }
  if (record.two_factor_locked_until && new Date(record.two_factor_locked_until).getTime() > Date.now()) {
    throw new ApiError(423, "2FA is temporarily locked", { lockedUntil: record.two_factor_locked_until });
  }
  if (payload.method === "totp") {
    const valid = verifyTotp(record, normalizeTotp(payload.code));
    if (!valid) {
      await incrementAttempts(record);
    }
    await resetAttempts(record);
  } else {
    const consumed = await consumeBackupCode(record.id, payload.code);
    if (!consumed) {
      await incrementAttempts(record);
    }
    await resetAttempts(record);
  }
  const now = new Date();
  await updateSessionRevocation(record.id, now);
  return createTwoFactorSessionCookie(record.id, now.getTime());
};

export const requestTwoFactorRecovery = async (authUserId: string) => {
  const record = await getUserSecurityRecord(authUserId);
  if (!record.two_factor_enabled) {
    throw new ApiError(400, "2FA is not enabled");
  }
  if (record.two_factor_recovery_expires && new Date(record.two_factor_recovery_expires).getTime() > Date.now()) {
    throw new ApiError(429, "We already sent a recovery email", { expiresAt: record.two_factor_recovery_expires });
  }
  const token = crypto.randomUUID();
  const digest = hashRecoveryToken(token);
  const expiresAt = new Date(Date.now() + recoveryLinkTtlMinutes * 60 * 1000);
  await query(
    `UPDATE users
     SET two_factor_recovery_token = $2,
         two_factor_recovery_expires = NOW() + ($3 * INTERVAL '1 minute'),
         two_factor_session_revoked_at = $4,
         updated_at = NOW()
     WHERE id = $1`,
    [record.id, digest, recoveryLinkTtlMinutes, new Date().toISOString()]
  );
  const { subject, html, text } = await renderEmailTemplate("TWO_FACTOR_RECOVERY" as any, {
    email: record.email,
    recoverUrl: `${appBaseUrl}/login/two-factor?token=${token}`,
    expiresAt: expiresAt.toISOString(),
  });
  await sendEmail({ to: record.email, subject, html, text });
};

export const completeTwoFactorRecovery = async (token: string) => {
  if (!token) {
    throw new ApiError(400, "Missing recovery token");
  }
  const digest = hashRecoveryToken(token);
  const result = await query<{ id: string }>(
    `SELECT id FROM users
     WHERE two_factor_recovery_token = $1
       AND two_factor_recovery_expires IS NOT NULL
       AND two_factor_recovery_expires >= NOW()
     LIMIT 1`,
    [digest]
  );
  const row = result.rows[0];
  if (!row) {
    throw new ApiError(400, "Recovery link is invalid or expired");
  }
  await clearTwoFactorState(row.id, { restartForceWindow: true });
  return row.id;
};
