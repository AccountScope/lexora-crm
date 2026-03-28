import crypto from "node:crypto";
import { UAParser } from "ua-parser-js";
import type { NextRequest } from "next/server";
import { query } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { logAuthEvent } from "@/lib/audit/logger";

export interface SessionRecord {
  id: string;
  userId: string;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  rememberMe: boolean;
  current: boolean;
}

export interface EnsureSessionOptions {
  userId: string;
  userEmail?: string;
  token?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  rememberMe?: boolean;
}

export interface EnsureSessionResult {
  session: SessionRecord;
  token: string;
  tokenHash: string;
  issuedCookie?: boolean;
}

export const SESSION_COOKIE_NAME = "lexora-session";
export const REMEMBER_ME_COOKIE_NAME = "lexora-remember";

const SESSION_TOKEN_BYTES = Math.max(32, Number(process.env.SESSION_TOKEN_BYTES ?? 48));
const DEFAULT_SESSION_DURATION_MS = Math.max(1, Number(process.env.SESSION_DURATION_HOURS ?? 8)) * 60 * 60 * 1000;
const REMEMBER_ME_DURATION_MS = Math.max(1, Number(process.env.SESSION_REMEMBER_DAYS ?? 30)) * 24 * 60 * 60 * 1000;
export const SESSION_IDLE_TIMEOUT_MS = Math.max(5, Number(process.env.SESSION_IDLE_MINUTES ?? 30)) * 60 * 1000;

const parseCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return {} as Record<string, string>;
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split("=");
    if (key && value) {
      acc[key.trim()] = decodeURIComponent(value.trim());
    }
    return acc;
  }, {});
};

export const extractSessionToken = (request: Request | NextRequest): string | null => {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE_NAME] ?? null;
};

export const extractRememberPreference = (request: Request | NextRequest): boolean => {
  const cookies = parseCookies(request.headers.get("cookie"));
  const value = cookies[REMEMBER_ME_COOKIE_NAME];
  return value === "true";
};

export const getClientIp = (request: Request | NextRequest): string | null => {
  const headerKeys = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"];
  for (const key of headerKeys) {
    const value = request.headers.get(key);
    if (value) {
      return value.split(",")[0]?.trim() ?? null;
    }
  }
  return null;
};

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const buildDeviceProfile = (userAgent?: string | null) => {
  if (!userAgent) {
    return { device: "Unknown", browser: null, os: null, fingerprint: "unknown" };
  }
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  const labelParts = [device?.vendor, device?.model].filter(Boolean);
  const deviceLabel = labelParts.length ? labelParts.join(" ") : os.name ?? browser.name ?? "Unknown";
  const fingerprint = crypto.createHash("sha1").update(`${browser?.name ?? "browser"}:${os?.name ?? "os"}:${deviceLabel}`).digest("hex");
  return {
    device: deviceLabel,
    browser: browser.name ?? null,
    os: os.name ?? null,
    fingerprint,
  };
};

const lookupLocation = async (ip?: string | null) => {
  if (!ip) return null;
  try {
    // Dynamic import to avoid build-time issues
    const geoip = await import("geoip-lite");
    const info = geoip.default.lookup(ip);
    if (!info) return null;
    const parts = [info.city, info.region, info.country].filter(Boolean);
    return parts.join(", ");
  } catch (error) {
    console.warn("[security] geoip lookup failed", error);
    return null;
  }
};

const mapSessionRow = (row: any, currentHash?: string | null): SessionRecord => ({
  id: row.id,
  userId: row.user_id,
  device: row.device,
  browser: row.browser,
  os: row.os,
  ipAddress: row.ip_address,
  location: row.location,
  lastActivity: row.last_activity,
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  rememberMe: Boolean(row.remember_me),
  current: currentHash ? row.token === currentHash : false,
});

const createSessionRecord = async (options: EnsureSessionOptions) => {
  const token = crypto.randomBytes(SESSION_TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const remember = options.rememberMe ?? false;
  const expiresAt = new Date(Date.now() + (remember ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS));
  const profile = buildDeviceProfile(options.userAgent);
  const location = await lookupLocation(options.ipAddress);
  await query(
    `INSERT INTO sessions (user_id, token, device, browser, os, user_agent, fingerprint, remember_me, ip_address, location, last_activity, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11)`,
    [
      options.userId,
      tokenHash,
      profile.device,
      profile.browser,
      profile.os,
      options.userAgent ?? null,
      profile.fingerprint,
      remember,
      options.ipAddress ?? null,
      location,
      expiresAt.toISOString(),
    ]
  );

  await (logAuthEvent as any)({
    type: "auth.session.created",
    success: true,
    actor: options.userId ? { id: options.userId, email: options.userEmail, ipAddress: options.ipAddress, userAgent: options.userAgent } : undefined,
    details: { rememberMe: remember },
  });

  return { token, tokenHash };
};

const findSessionByTokenHash = async (tokenHash: string) => {
  const res = await query(
    `SELECT * FROM sessions WHERE token = $1 LIMIT 1`,
    [tokenHash]
  );
  return res.rows[0] ?? null;
};

const isExpired = (session: any) => {
  if (!session) return true;
  if (new Date(session.expires_at).getTime() <= Date.now()) return true;
  if (session.last_activity) {
    const idleSince = new Date(session.last_activity).getTime();
    if (Date.now() - idleSince > SESSION_IDLE_TIMEOUT_MS) {
      return true;
    }
  }
  return false;
};

export const ensureSession = async (options: EnsureSessionOptions): Promise<EnsureSessionResult> => {
  const token = options.token;
  if (token) {
    const tokenHash = hashToken(token);
    const existing = await findSessionByTokenHash(tokenHash);
    if (existing && !isExpired(existing)) {
      await query(
        `UPDATE sessions SET last_activity = NOW(), ip_address = COALESCE($2, ip_address), location = COALESCE($3, location), updated_at = NOW() WHERE id = $1`,
        [existing.id, options.ipAddress ?? null, lookupLocation(options.ipAddress)]
      );
      return {
        session: mapSessionRow(existing, tokenHash),
        token,
        tokenHash,
        issuedCookie: false,
      };
    }
    if (existing) {
      await query(`DELETE FROM sessions WHERE id = $1`, [existing.id]);
      await (logAuthEvent as any)({
        type: "auth.session.invalidated",
        success: true,
        actor: { id: options.userId, email: options.userEmail },
        details: { reason: "expired", sessionId: existing.id },
      });
    }
  }

  const rememberPreference = options.rememberMe ?? false;
  const { token: newToken, tokenHash } = await createSessionRecord({ ...options, rememberMe: rememberPreference });
  const row = await findSessionByTokenHash(tokenHash);
  if (!row) {
    throw new ApiError(500, "Unable to bootstrap session");
  }
  return {
    session: mapSessionRow(row, tokenHash),
    token: newToken,
    tokenHash,
    issuedCookie: true,
  };
};

export const listUserSessions = async (userId: string, currentTokenHash?: string | null): Promise<SessionRecord[]> => {
  const res = await query(
    `SELECT * FROM sessions WHERE user_id = $1 ORDER BY last_activity DESC`,
    [userId]
  );
  return res.rows.map((row) => mapSessionRow(row, currentTokenHash ?? null));
};

export const getSessionIdForToken = async (token: string | null) => {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = await findSessionByTokenHash(tokenHash);
  return row?.id ?? null;
};


export const rotateSessionToken = async (token: string | null, rememberMe: boolean) => {
  if (!token) return null;
  const tokenHash = hashToken(token);
  const existing = await findSessionByTokenHash(tokenHash);
  if (!existing) return null;
  const newToken = crypto.randomBytes(SESSION_TOKEN_BYTES).toString("hex");
  const newHash = hashToken(newToken);
  const expiresAt = new Date(Date.now() + (rememberMe ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS));
  await query(
    `UPDATE sessions SET token = $2, expires_at = $3, remember_me = $4, updated_at = NOW(), last_activity = NOW() WHERE id = $1`,
    [existing.id, newHash, expiresAt.toISOString(), rememberMe]
  );
  await (logAuthEvent as any)({
    type: "auth.session.created",
    success: true,
    actor: { id: existing.user_id },
    details: { rotated: true },
  });
  return { sessionId: existing.id, token: newToken, rememberMe };
};

export const revokeSession = async (userId: string, sessionId: string) => {
  const result = await query(`DELETE FROM sessions WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
  if (!result.rowCount) {
    throw new ApiError(404, "Session not found");
  }
  await (logAuthEvent as any)({
    type: "auth.session.revoked",
    success: true,
    actor: { id: userId },
    details: { sessionId },
  });
};

export const revokeOtherSessions = async (userId: string, keepSessionId?: string) => {
  await query(`DELETE FROM sessions WHERE user_id = $1 ${keepSessionId ? "AND id <> $2" : ""}`, keepSessionId ? [userId, keepSessionId] : [userId]);
  await (logAuthEvent as any)({
    type: "auth.session.revoked",
    success: true,
    actor: { id: userId },
    details: { scope: "others" },
  });
};

export const revokeAllSessions = async (userId: string) => {
  await query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
  await (logAuthEvent as any)({
    type: "auth.session.revoked",
    success: true,
    actor: { id: userId },
    details: { scope: "all" },
  });
};

export const extendSession = async (token: string, rememberMe: boolean) => {
  const tokenHash = hashToken(token);
  const row = await findSessionByTokenHash(tokenHash);
  if (!row) {
    throw new ApiError(404, "Session not found");
  }
  if (isExpired(row)) {
    await query(`DELETE FROM sessions WHERE id = $1`, [row.id]);
    throw new ApiError(401, "Session expired");
  }
  const expiresAt = new Date(Date.now() + (rememberMe ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS));
  await query(
    `UPDATE sessions SET last_activity = NOW(), expires_at = $2, remember_me = $3, updated_at = NOW() WHERE id = $1`,
    [row.id, expiresAt.toISOString(), rememberMe]
  );
  const updated = await findSessionByTokenHash(tokenHash);
  if (!updated) {
    throw new ApiError(500, "Unable to extend session");
  }
  await (logAuthEvent as any)({
    type: "auth.session.extended",
    success: true,
    actor: { id: updated.user_id },
    details: { sessionId: updated.id },
  });
  return mapSessionRow(updated, tokenHash);
};

export const serializeSessionCookie = (token: string, rememberMe: boolean) => ({
  name: SESSION_COOKIE_NAME,
  value: token,
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: Math.floor((rememberMe ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS) / 1000),
    path: "/",
  },
});

export const serializeRememberCookie = (remember: boolean) => ({
  name: REMEMBER_ME_COOKIE_NAME,
  value: remember ? "true" : "false",
  options: {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: remember ? Math.floor(REMEMBER_ME_DURATION_MS / 1000) : 0,
    path: "/",
  },
});

export const describeDeviceFromUserAgent = (userAgent?: string | null) => buildDeviceProfile(userAgent).device;

export const resolveLocationFromIp = async (ip?: string | null) => await lookupLocation(ip);
