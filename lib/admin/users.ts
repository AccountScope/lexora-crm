import crypto from "node:crypto";
import { query, withDb } from "@/lib/api/db";
import { ApiError, assertFound } from "@/lib/api/errors";
import type {
  AdminUserDetail,
  AdminUserMetrics,
  AdminUserRole,
  AdminUserSummary,
  UserAuditLogEntry,
  UserLoginEvent,
  UserStatus,
} from "@/types";
import { listRoles } from "@/lib/admin/roles";
import { queueEmailJob } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/utils/app-url";

const FORGOT_PASSWORD_EXPIRY_MINUTES = 60;
const RESET_APP_URL = getAppBaseUrl();
const SUPPORT_EMAIL = process.env.SECURITY_CONTACT_EMAIL ?? "security@lexora.app";

const normalizeSort = (sort?: string | null, direction?: string | null) => {
  const dir = direction === "desc" ? "DESC" : "ASC";
  switch ((sort ?? "name").toLowerCase()) {
    case "email":
      return { clause: `LOWER(u.email) ${dir}` };
    case "status":
      return { clause: `u.status ${dir}` };
    case "last_login":
      return { clause: `u.last_login_at ${dir}` };
    case "verified":
      return { clause: `u.email_verified ${dir}` };
    default:
      return { clause: `LOWER(u.first_name) ${dir}, LOWER(u.last_name) ${dir}` };
  }
};

const mapUserRow = (row: any): AdminUserSummary => ({
  id: row.id,
  fullName: `${row.first_name} ${row.last_name}`.trim(),
  email: row.email,
  status: row.status,
  userType: row.user_type,
  phone: row.phone,
  lastLoginAt: row.last_login_at,
  emailVerified: row.email_verified,
  roles: row.roles ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export interface AdminUserListParams {
  search?: string;
  status?: UserStatus | string;
  roleId?: string;
  verified?: "true" | "false";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export const listAdminUsers = async (params: AdminUserListParams = {}) => {
  const limit = Math.min(Math.max(params.pageSize ?? 50, 1), 100);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;
  const sort = normalizeSort(params.sortBy, params.sortDirection);
  const values: any[] = [];
  let idx = 1;
  const filters: string[] = [`u.deleted_at IS NULL`];

  if (params.search) {
    values.push(`%${params.search.trim()}%`);
    filters.push(`(CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx} OR u.email ILIKE $${idx})`);
    idx += 1;
  }

  if (params.status) {
    values.push(params.status.toUpperCase());
    filters.push(`u.status = $${idx}`);
    idx += 1;
  }

  if (params.roleId) {
    values.push(params.roleId);
    filters.push(`EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = $${idx})`);
    idx += 1;
  }

  if (params.verified === "true" || params.verified === "false") {
    values.push(params.verified === "true");
    filters.push(`u.email_verified = $${idx}`);
    idx += 1;
  }

  values.push(limit, offset);

  const result = await query<any>(
    `SELECT * FROM (
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.status,
        u.user_type,
        u.phone,
        u.last_login_at,
        u.email_verified,
        u.created_at,
        u.updated_at,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      WHERE ${filters.join(" AND ")}
      GROUP BY u.id
    ) AS records
    ORDER BY ${sort.clause}
    LIMIT $${idx} OFFSET $${idx + 1}
  `,
    values
  );

  const totalResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM users u WHERE ${filters.join(" AND ")}`,
    values.slice(0, idx - 1)
  );

  return {
    users: result.rows.map(mapUserRow),
    pagination: {
      total: totalResult.rows[0]?.count ?? 0,
      page,
      pageSize: limit,
    },
  };
};

export const getAdminUserById = async (userId: string): Promise<AdminUserDetail> => {
  const base = await query<any>(
    `SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.status,
      u.user_type,
      u.phone,
      u.timezone,
      u.last_login_at,
      u.email_verified,
      u.created_at,
      u.updated_at,
      COALESCE(json_agg(DISTINCT jsonb_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    WHERE u.id = $1 AND u.deleted_at IS NULL
    GROUP BY u.id` ,
    [userId]
  );
  const row = assertFound(base.rows[0], "User not found");

  const [loginHistory, auditLog] = await Promise.all([
    query<UserLoginEvent>(
      `SELECT id, last_activity as "occurredAt", ip_address as "ipAddress", location, device, browser, 'session'::text as status
       FROM sessions
       WHERE user_id = $1
       ORDER BY last_activity DESC
       LIMIT 15`,
      [userId]
    ),
    query<UserAuditLogEntry>(
      `SELECT
         id,
         occurred_at as "occurredAt",
         event_type as "eventType",
         actor_user_id as "actorId",
         details,
         target_table,
         target_id,
         created_at,
         (SELECT jsonb_build_object('id', a.id, 'email', a.email)
            FROM users a WHERE a.id = audit_logs.actor_user_id) as actor
       FROM audit_logs
       WHERE target_table = 'users' AND target_id = $1::uuid
       ORDER BY occurred_at DESC
       LIMIT 25`,
      [userId]
    ),
  ]);

  return {
    ...mapUserRow(row),
    firstName: row.first_name,
    lastName: row.last_name,
    timezone: row.timezone,
    loginHistory: loginHistory.rows,
    auditLog: auditLog.rows.map((entry) => ({
      ...entry,
      actor: entry.actor as UserAuditLogEntry["actor"],
    })),
  };
};

export const getAdminUserMetrics = async (): Promise<AdminUserMetrics> => {
  const [total, active, invited, pendingInvites, verification, lastLogin, roles] = await Promise.all([
    query<{ count: number }>(`SELECT COUNT(*)::int as count FROM users WHERE deleted_at IS NULL`),
    query<{ count: number }>(`SELECT COUNT(*)::int as count FROM users WHERE deleted_at IS NULL AND status = 'ACTIVE'`),
    query<{ count: number }>(`SELECT COUNT(*)::int as count FROM users WHERE deleted_at IS NULL AND status = 'INVITED'`),
    query<{ count: number }>(`SELECT COUNT(*)::int as count FROM invitations WHERE status = 'pending'`),
    query<{ verified: number; unverified: number }>(
      `SELECT
         SUM(CASE WHEN email_verified THEN 1 ELSE 0 END)::int as verified,
         SUM(CASE WHEN email_verified THEN 0 ELSE 1 END)::int as unverified
       FROM users WHERE deleted_at IS NULL`
    ),
    query<{ past24h: number; past7d: number; stale: number }>(
      `SELECT
         SUM(CASE WHEN last_login_at >= NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END)::int as "past24h",
         SUM(CASE WHEN last_login_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)::int as "past7d",
         SUM(CASE WHEN last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END)::int as stale
       FROM users WHERE deleted_at IS NULL`
    ),
    query<{ role: string; count: number }>(
      `SELECT r.name as role, COUNT(ur.user_id)::int as count
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       GROUP BY r.name
       ORDER BY r.name`
    ),
  ]);

  return {
    totalUsers: total.rows[0]?.count ?? 0,
    activeUsers: active.rows[0]?.count ?? 0,
    invitedUsers: invited.rows[0]?.count ?? 0,
    pendingInvitations: pendingInvites.rows[0]?.count ?? 0,
    roles: roles.rows,
    verification: {
      verified: verification.rows[0]?.verified ?? 0,
      unverified: verification.rows[0]?.unverified ?? 0,
    },
    lastLogin: {
      past24h: lastLogin.rows[0]?.past24h ?? 0,
      past7d: lastLogin.rows[0]?.past7d ?? 0,
      stale: lastLogin.rows[0]?.stale ?? 0,
    },
  };
};

export interface AdminUserUpdatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  status?: UserStatus;
  roleId?: string;
}

export const recordUserAuditLog = async (actorId: string | null, targetId: string, eventType: string, details?: Record<string, any>) => {
  await query(
    `INSERT INTO audit_logs (actor_user_id, actor_type, event_type, target_table, target_id, changes)
     VALUES ($1,'user',$2,'users',$3,$4)` ,
    [actorId, eventType, targetId, details ? JSON.stringify(details) : null]
  );
};

export const updateAdminUserProfile = async (
  userId: string,
  payload: AdminUserUpdatePayload,
  actorId: string
): Promise<AdminUserDetail> => {
  return withDb(async (client) => {
    const updates = [
      client.query(
        `UPDATE users
         SET first_name = $2,
             last_name = $3,
             email = $4,
             phone = $5,
             status = COALESCE($6, status),
             updated_at = NOW()
         WHERE id = $1
           AND deleted_at IS NULL`,
        [userId, payload.firstName.trim(), payload.lastName.trim(), payload.email.trim().toLowerCase(), payload.phone ?? null, payload.status ?? null]
      ),
    ];

    if (payload.roleId) {
      updates.push((async () => {
        await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [userId]);
        return await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [userId, payload.roleId]);
      })());
    }

    await Promise.all(updates) as any;
    await recordUserAuditLog(actorId, userId, "user.updated", payload);
    return getAdminUserById(userId);
  });
};

export const applyUserBulkAction = async (
  action: "activate" | "deactivate" | "delete",
  userIds: string[],
  actorId: string
) => {
  if (!userIds?.length) {
    throw new ApiError(400, "No users selected");
  }
  if (action === "delete") {
    await query(`UPDATE users SET deleted_at = NOW() WHERE id = ANY($1::uuid[])`, [userIds]);
  } else if (action === "activate") {
    await query(`UPDATE users SET status = 'ACTIVE', deleted_at = NULL WHERE id = ANY($1::uuid[])`, [userIds]);
  } else {
    await query(`UPDATE users SET status = 'SUSPENDED' WHERE id = ANY($1::uuid[])`, [userIds]);
  }
  await Promise.all(userIds.map((id) => recordUserAuditLog(actorId, id, `user.bulk.${action}`)));
  return userIds.length;
};

export const markUserVerified = async (userId: string, actorId: string) => {
  await query(
    `UPDATE users
     SET email_verified = TRUE,
         email_verification_token = NULL,
         email_verification_expires = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
  await recordUserAuditLog(actorId, userId, "user.verified");
};

export const issueAdminPasswordReset = async (userId: string, actorId: string) => {
  const userResult = await query<{ email: string; first_name: string | null }>(
    `SELECT email, first_name FROM users WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const user = assertFound(userResult.rows[0], "User not found");
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + FORGOT_PASSWORD_EXPIRY_MINUTES * 60 * 1000).toISOString();
  await query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1,$2,$3)` ,
    [userId, tokenHash, expiresAt]
  );
  const resetUrl = `${RESET_APP_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
  await queueEmailJob({
    template: "PASSWORD_RESET",
    to: user.email,
    data: {
      firstName: user.first_name ?? undefined,
      resetUrl,
      expiresInMinutes: FORGOT_PASSWORD_EXPIRY_MINUTES,
      supportEmail: SUPPORT_EMAIL,
    },
  });
  await recordUserAuditLog(actorId, userId, "user.reset_password_requested");
};

export const fetchAssignableRoles = async (): Promise<AdminUserRole[]> => {
  const roles = await listRoles();
  return roles.map((role) => ({ id: role.id, name: role.name }));
};
