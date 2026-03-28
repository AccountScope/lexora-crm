import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import zxcvbn from "zxcvbn";
import type { PoolClient } from "pg";
import { query, withDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { checkPasswordBreach, type PasswordBreachResult } from "@/lib/auth/password-breach";
import { logAuthEvent } from "@/lib/audit/logger";

export interface PasswordRequirement {
  label: string;
  passed: boolean;
  helpText?: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number;
  warning?: string;
  requirements: PasswordRequirement[];
  suggestions: string[];
  breached?: boolean;
  breachCount?: number;
}

export interface PasswordValidationOptions {
  historyHashes?: string[];
  checkBreach?: boolean;
}

export interface PasswordMetadata {
  passwordChangedAt?: string | null;
  passwordExpiresAt?: string | null;
  forcePasswordChange: boolean;
}

export interface UpdatePasswordOptions {
  client?: PoolClient;
  actorId?: string;
  actorEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  checkBreach?: boolean;
  skipHistoryCheck?: boolean;
}

const COMMON_PASSWORDS_PATH = path.join(process.cwd(), "lib/auth/common-passwords.txt");
const SPECIAL_CHARS = "!@#$%^&*";
const BCRYPT_ROUNDS = Math.max(12, Number(process.env.BCRYPT_ROUNDS ?? 12));
const PASSWORD_EXPIRY_DAYS = Math.max(1, Number(process.env.PASSWORD_EXPIRY_DAYS ?? 90));
export const PASSWORD_EXPIRY_WARNING_DAYS = Math.max(1, Number(process.env.PASSWORD_EXPIRY_WARNING_DAYS ?? 7));
const HISTORY_LIMIT = Math.max(1, Number(process.env.PASSWORD_HISTORY_LIMIT ?? 5));
const REJECT_BREACHED = (process.env.PASSWORD_ALLOW_BREACHED ?? "false").toLowerCase() !== "true";

export const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialCharacters: SPECIAL_CHARS,
  minScore: 3,
  history: HISTORY_LIMIT,
  expiryDays: PASSWORD_EXPIRY_DAYS,
  expiryWarningDays: PASSWORD_EXPIRY_WARNING_DAYS,
  rejectBreached: REJECT_BREACHED,
};

let commonPasswordSet: Set<string> | null = null;
const loadCommonPasswords = () => {
  if (commonPasswordSet) return commonPasswordSet;
  try {
    const contents = fs.readFileSync(COMMON_PASSWORDS_PATH, "utf-8");
    commonPasswordSet = new Set(
      contents
        .split("\n")
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean)
    );
  } catch (error) {
    console.warn("[security] Unable to load common password list", error);
    commonPasswordSet = new Set();
  }
  return commonPasswordSet;
};

const hasUppercase = (value: string) => /[A-Z]/.test(value);
const hasLowercase = (value: string) => /[a-z]/.test(value);
const hasNumber = (value: string) => /[0-9]/.test(value);
const hasSpecial = (value: string) => new RegExp(`[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}]`).test(value);
const isCommonPassword = (password: string) => loadCommonPasswords().has(password.trim().toLowerCase());

export const hashPassword = async (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = async (password: string, hash?: string | null) => {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
};

const compareAgainstHistory = async (password: string, hashes: string[] = []) => {
  for (const hash of hashes) {
    if (!hash) continue;
    const match = await bcrypt.compare(password, hash).catch(() => false);
    if (match) {
      return true;
    }
  }
  return false;
};

export const validatePassword = async (
  password: string,
  options: PasswordValidationOptions = {}
): Promise<PasswordValidationResult> => {
  const requirements: PasswordRequirement[] = [];
  const trimmed = password ?? "";

  requirements.push({
    label: `At least ${passwordPolicy.minLength} characters`,
    passed: trimmed.length >= passwordPolicy.minLength,
  });
  requirements.push({
    label: "Contains an uppercase letter",
    passed: !passwordPolicy.requireUppercase || hasUppercase(trimmed),
  });
  requirements.push({
    label: "Contains a lowercase letter",
    passed: !passwordPolicy.requireLowercase || hasLowercase(trimmed),
  });
  requirements.push({
    label: "Contains a number",
    passed: !passwordPolicy.requireNumber || hasNumber(trimmed),
  });
  requirements.push({
    label: `Contains a special character (${passwordPolicy.specialCharacters})`,
    passed: !passwordPolicy.requireSpecial || hasSpecial(trimmed),
  });
  requirements.push({
    label: "Not in top 10,000 common passwords",
    passed: trimmed.length === 0 ? false : !isCommonPassword(trimmed),
  });

  if (options.historyHashes?.length) {
    const reused = await compareAgainstHistory(trimmed, options.historyHashes);
    requirements.push({
      label: `Not reused from your last ${passwordPolicy.history} passwords`,
      passed: !reused,
    });
  }

  const strength = trimmed ? zxcvbn(trimmed) : { score: 0, feedback: { warning: "", suggestions: [] } };
  const suggestions = new Set<string>(strength.feedback?.suggestions ?? []);
  if (strength.feedback?.warning) {
    suggestions.add(strength.feedback.warning);
  }

  let breachResult: PasswordBreachResult | undefined;
  if (options.checkBreach && trimmed) {
    try {
      breachResult = await checkPasswordBreach(trimmed);
    } catch (error) {
      console.warn("[security] Unable to reach haveibeenpwned API", error);
    }
  }

  const valid =
    requirements.every((req) => req.passed) &&
    trimmed.length >= passwordPolicy.minLength &&
    strength.score >= passwordPolicy.minScore &&
    (!breachResult || !breachResult.breached || !REJECT_BREACHED);

  return {
    valid,
    score: strength.score,
    warning: strength.feedback?.warning,
    requirements,
    suggestions: Array.from(suggestions).filter(Boolean),
    breached: breachResult?.breached,
    breachCount: breachResult?.count,
  };
};

export const assertPasswordValid = async (password: string, options: PasswordValidationOptions = {}) => {
  const result = await validatePassword(password, options);
  if (!result.valid) {
    throw new ApiError(400, "Password does not meet security requirements", {
      requirements: result.requirements,
      suggestions: result.suggestions,
      breached: result.breached,
      breachCount: result.breachCount,
      score: result.score,
    });
  }
  if (result.breached && REJECT_BREACHED) {
    throw new ApiError(400, "Password was found in public breach databases", {
      breachCount: result.breachCount,
    });
  }
  return result;
};

export const getPasswordMetadata = async (userId: string, client?: PoolClient): Promise<PasswordMetadata> => {
  const executor = client ?? null;
  const res = executor
    ? await executor.query(
        `SELECT password_changed_at, password_expires_at, force_password_change FROM users WHERE id = $1`,
        [userId]
      )
    : await query(
        `SELECT password_changed_at, password_expires_at, force_password_change FROM users WHERE id = $1`,
        [userId]
      );
  const row = res.rows[0];
  return {
    passwordChangedAt: row?.password_changed_at ?? row?.passwordChangedAt ?? null,
    passwordExpiresAt: row?.password_expires_at ?? row?.passwordExpiresAt ?? null,
    forcePasswordChange: Boolean(row?.force_password_change ?? row?.forcePasswordChange ?? false),
  };
};

const getPasswordHistory = async (client: PoolClient, userId: string): Promise<string[]> => {
  const res = await client.query<{ password_hash: string }>(
    `SELECT password_hash FROM password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, HISTORY_LIMIT]
  );
  return res.rows.map((row) => row.password_hash);
};

const recordPasswordHistory = async (client: PoolClient, userId: string, passwordHash: string) => {
  await client.query(
    `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
    [userId, passwordHash]
  );
  await client.query(
    `DELETE FROM password_history
     WHERE user_id = $1
       AND id NOT IN (
         SELECT id FROM password_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       )`,
    [userId, HISTORY_LIMIT]
  );
};

const setPasswordInternal = async (client: PoolClient, userId: string, newPassword: string, options: UpdatePasswordOptions) => {
  const current = await client.query<{ password_hash: string | null }>(
    `SELECT password_hash FROM users WHERE id = $1 FOR UPDATE`,
    [userId]
  );
  const currentHash = current.rows[0]?.password_hash;
  const history = options.skipHistoryCheck ? [] : await getPasswordHistory(client, userId);
  if (currentHash) history.push(currentHash);

  await assertPasswordValid(newPassword, {
    historyHashes: history,
    checkBreach: options.checkBreach !== false,
  });

  const passwordHash = await hashPassword(newPassword);
  const expiresAt = new Date(Date.now() + PASSWORD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const result = await client.query(
    `UPDATE users
     SET password_hash = $2,
         password_changed_at = NOW(),
         password_expires_at = $3,
         force_password_change = FALSE,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, first_name, last_name, password_expires_at, password_changed_at`,
    [userId, passwordHash, expiresAt.toISOString()]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, "User not found");
  }

  await recordPasswordHistory(client, userId, passwordHash);

  await logAuthEvent({
    type: "auth.password.changed",
    success: true,
    actor: options.actorId
      ? { id: options.actorId, email: options.actorEmail, ipAddress: options.ipAddress, userAgent: options.userAgent }
      : undefined,
    details: { userId },
  });

  return {
    user: {
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
    },
    passwordChangedAt: result.rows[0].password_changed_at,
    passwordExpiresAt: result.rows[0].password_expires_at,
  };
};

export const updatePasswordForUser = async (userId: string, newPassword: string, options: UpdatePasswordOptions = {}) => {
  if (options.client) {
    return setPasswordInternal(options.client, userId, newPassword, options);
  }
  return withDb((client) => setPasswordInternal(client, userId, newPassword, options));
};

export const verifyCurrentPassword = async (userId: string, password: string, client?: PoolClient) => {
  const res = client
    ? await client.query<{ password_hash: string | null }>(`SELECT password_hash FROM users WHERE id = $1`, [userId])
    : await query<{ password_hash: string | null }>(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
  const hash = res.rows[0]?.password_hash;
  if (!hash) {
    throw new ApiError(400, "Password has never been set. Please reset using email link.");
  }
  const valid = await verifyPassword(password, hash);
  if (!valid) {
    throw new ApiError(400, "Current password is incorrect");
  }
};

export const hasPasswordExpired = (meta?: PasswordMetadata) => {
  if (!meta?.passwordExpiresAt) return false;
  return new Date(meta.passwordExpiresAt).getTime() <= Date.now();
};

export const shouldWarnPasswordExpiry = (meta?: PasswordMetadata) => {
  if (!meta?.passwordExpiresAt) return false;
  const expires = new Date(meta.passwordExpiresAt).getTime();
  const warningStart = expires - PASSWORD_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= warningStart && Date.now() < expires;
};
