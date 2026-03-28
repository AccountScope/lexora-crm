import { createClient } from '@/lib/api/db';

export interface LoginAttemptRecord {
  id: string;
  email: string;
  ipAddress: string;
  success: boolean;
  device?: string;
  browser?: string;
  location?: string;
  failureReason?: string;
  createdAt: string;
}

export interface AccountLockStatus {
  isLocked: boolean;
  lockedUntil?: string;
  failedAttempts: number;
  remainingTime?: number; // seconds
}

/**
 * Check if an IP address is currently blocked
 */
export async function isIpBlocked(ipAddress: string): Promise<boolean> {
  const db = createClient();
  
  const result = await db.query(
    'SELECT is_ip_blocked($1) as blocked',
    [ipAddress]
  );
  
  return result.rows[0]?.blocked || false;
}

/**
 * Check if a user account is currently locked
 */
export async function isUserLocked(email: string): Promise<AccountLockStatus> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      locked_until,
      failed_login_count,
      CASE 
        WHEN locked_until IS NOT NULL AND locked_until > NOW() THEN TRUE
        ELSE FALSE
      END as is_locked,
      CASE
        WHEN locked_until IS NOT NULL AND locked_until > NOW() 
        THEN EXTRACT(EPOCH FROM (locked_until - NOW()))
        ELSE 0
      END as remaining_seconds
    FROM users
    WHERE email = $1`,
    [email]
  );
  
  const row = result.rows[0];
  
  if (!row) {
    return {
      isLocked: false,
      failedAttempts: 0,
    };
  }
  
  return {
    isLocked: row.is_locked,
    lockedUntil: row.locked_until,
    failedAttempts: row.failed_login_count || 0,
    remainingTime: row.remaining_seconds > 0 ? Math.ceil(row.remaining_seconds) : undefined,
  };
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(params: {
  email: string;
  ipAddress: string;
  success: boolean;
  device?: string;
  browser?: string;
  location?: string;
  failureReason?: string;
}): Promise<void> {
  const db = createClient();
  
  await db.query(
    `SELECT record_login_attempt($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.email,
      params.ipAddress,
      params.success,
      params.device || null,
      params.browser || null,
      params.location || null,
      params.failureReason || null,
    ]
  );
}

/**
 * Block an IP address temporarily
 */
export async function blockIpAddress(params: {
  ipAddress: string;
  reason: string;
  durationMinutes?: number;
}): Promise<void> {
  const db = createClient();
  const duration = params.durationMinutes || 60; // Default 1 hour
  
  await db.query(
    `INSERT INTO blocked_ips (ip_address, reason, blocked_until)
     VALUES ($1, $2, NOW() + $3 * INTERVAL '1 minute')
     ON CONFLICT (ip_address) 
     DO UPDATE SET 
       blocked_until = NOW() + $3 * INTERVAL '1 minute',
       reason = $2`,
    [params.ipAddress, params.reason, duration]
  );
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(params: {
  email: string;
  limit?: number;
  offset?: number;
}): Promise<LoginAttemptRecord[]> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      email,
      ip_address as "ipAddress",
      success,
      device,
      browser,
      location,
      failure_reason as "failureReason",
      created_at as "createdAt"
    FROM login_attempts
    WHERE email = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,
    [params.email, params.limit || 50, params.offset || 0]
  );
  
  return result.rows;
}

/**
 * Get recent failed login attempts from an IP
 */
export async function getRecentFailedAttempts(params: {
  ipAddress: string;
  minutesAgo?: number;
}): Promise<number> {
  const db = createClient();
  const minutes = params.minutesAgo || 60;
  
  const result = await db.query(
    `SELECT COUNT(*) as count
     FROM login_attempts
     WHERE ip_address = $1
     AND success = FALSE
     AND created_at > NOW() - $2 * INTERVAL '1 minute'`,
    [params.ipAddress, minutes]
  );
  
  return parseInt(result.rows[0]?.count || '0', 10);
}

/**
 * Should show CAPTCHA based on failed attempts
 */
export async function shouldShowCaptcha(email: string): Promise<boolean> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT failed_login_count
     FROM users
     WHERE email = $1`,
    [email]
  );
  
  const failedCount = result.rows[0]?.failed_login_count || 0;
  return failedCount >= 3;
}

/**
 * Unlock a user account (admin action)
 */
export async function unlockUserAccount(email: string): Promise<void> {
  const db = createClient();
  
  await db.query(
    `UPDATE users
     SET 
       locked_until = NULL,
       failed_login_count = 0,
       last_failed_login = NULL
     WHERE email = $1`,
    [email]
  );
}

/**
 * Get blocked IPs list (admin)
 */
export async function getBlockedIps(): Promise<Array<{
  id: string;
  ipAddress: string;
  reason: string;
  blockedUntil: string;
  createdAt: string;
}>> {
  const db = createClient();
  
  const result = await db.query(
    `SELECT 
      id,
      ip_address as "ipAddress",
      reason,
      blocked_until as "blockedUntil",
      created_at as "createdAt"
    FROM blocked_ips
    WHERE blocked_until > NOW()
    ORDER BY created_at DESC`
  );
  
  return result.rows;
}

/**
 * Unblock an IP address (admin action)
 */
export async function unblockIpAddress(ipAddress: string): Promise<void> {
  const db = createClient();
  
  await db.query(
    'DELETE FROM blocked_ips WHERE ip_address = $1',
    [ipAddress]
  );
}
