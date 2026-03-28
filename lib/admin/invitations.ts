import crypto from "node:crypto";
import { query, withDb } from "@/lib/api/db";
import { ApiError, assertFound } from "@/lib/api/errors";
import type { InvitationRecord, InvitationStatus } from "@/types";
import { queueEmailJob } from "@/lib/email/send";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { assertPasswordValid, hashPassword, passwordPolicy } from "@/lib/auth/password";
import { recordUserAuditLog } from "@/lib/admin/users";

const INVITE_EXPIRY_DAYS = Number(process.env.USER_INVITE_EXPIRY_DAYS ?? 7);

const baseUrl = getAppBaseUrl();

const invitationLink = (token: string) => `${baseUrl.replace(/\/$/, "")}/accept-invitation?token=${encodeURIComponent(token)}`;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const mapInvitationRow = (row: any): InvitationRecord => ({
  id: row.id,
  email: row.email,
  role: row.role_id
    ? {
        id: row.role_id,
        name: row.role_name ?? "",
      }
    : null,
  invitedBy: row.invited_by
    ? {
        id: row.invited_by,
        name: row.invited_by_name ?? "",
        email: row.invited_by_email ?? null,
      }
    : null,
  status: row.status,
  customMessage: row.custom_message,
  token: row.token,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  acceptedAt: row.accepted_at,
  cancelledAt: row.cancelled_at,
});

const logInvitationEvent = async (actorId: string | null, invitationId: string, eventType: string, details?: Record<string, any>) => {
  await query(
    `INSERT INTO audit_logs (actor_user_id, actor_type, event_type, target_table, target_id, changes)
     VALUES ($1,'user',$2,'invitations',$3,$4)` ,
    [actorId, eventType, invitationId, details ? JSON.stringify(details) : null]
  );
};

const expireStaleInvitations = async () => {
  await query(
    `UPDATE invitations
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'pending' AND expires_at < NOW()`
  );
};

export interface InvitationCreateInput {
  email: string;
  roleId: string;
  customMessage?: string;
}

export const createInvitations = async (invites: InvitationCreateInput[], actorId: string) => {
  if (!invites?.length) {
    throw new ApiError(400, "No invitations provided");
  }
  return withDb(async (client) => {
    const created: InvitationRecord[] = [];
    for (const invite of invites) {
      const email = normalizeEmail(invite.email);
      const roleId = invite.roleId;
      if (!roleId) {
        throw new ApiError(400, "Role is required for invitations");
      }
      const roleLookup = await client.query<{ id: string; name: string }>(
        `SELECT id, name FROM roles WHERE id = $1`,
        [roleId]
      );
      const role = assertFound(roleLookup.rows[0], "Role not found");
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const insert = await client.query(
        `INSERT INTO invitations (email, role_id, invited_by, token, custom_message, status, expires_at)
         VALUES ($1,$2,$3,$4,$5,'pending',$6)
         RETURNING *,
           (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM users u WHERE u.id = invited_by) as invited_by_name,
           (SELECT email FROM users WHERE id = invited_by) as invited_by_email,
           $7 as role_name`,
        [email, role.id, actorId ?? null, token, invite.customMessage ?? null, expiresAt, role.name]
      );
      const record = mapInvitationRow(insert.rows[0]);
      created.push(record);
      await queueEmailJob({
        template: "USER_INVITATION",
        to: email,
        data: {
          invitationUrl: invitationLink(token),
          roleName: role.name,
          invitedBy: insert.rows[0].invited_by_name ?? "Lexora Admin",
          expiresAt,
          customMessage: invite.customMessage ?? undefined,
        },
      });
      await logInvitationEvent(actorId ?? null, record.id, 'invitation.created', { email });
    }
    return created;
  });
};

export interface InvitationListParams {
  status?: InvitationStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export const listInvitations = async (params: InvitationListParams = {}) => {
  await expireStaleInvitations();
  const limit = Math.min(Math.max(params.pageSize ?? 50, 1), 200);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;
  const values: any[] = [];
  const clauses = ["1=1"];
  let idx = 1;
  if (params.status && params.status !== "all") {
    values.push(params.status);
    clauses.push(`i.status = $${idx}`);
    idx += 1;
  }
  if (params.search) {
    values.push(`%${params.search.trim().toLowerCase()}%`);
    clauses.push(`LOWER(i.email) ILIKE $${idx}`);
    idx += 1;
  }
  values.push(limit, offset);
  const rows = await query(
    `SELECT
       i.*,
       r.name as role_name,
       CONCAT(u.first_name, ' ', u.last_name) as invited_by_name,
       u.email as invited_by_email
     FROM invitations i
     LEFT JOIN roles r ON r.id = i.role_id
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE ${clauses.join(" AND ")}
     ORDER BY i.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    values
  );
  const total = await query<{ count: number }>(
    `SELECT COUNT(*)::int as count FROM invitations i WHERE ${clauses.join(" AND ")}`,
    values.slice(0, idx - 1)
  );
  return {
    invitations: rows.rows.map(mapInvitationRow),
    pagination: {
      total: total.rows[0]?.count ?? 0,
      page,
      pageSize: limit,
    },
  };
};

export const resendInvitation = async (invitationId: string, actorId: string) => {
  await expireStaleInvitations();
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const updated = await query(
    `UPDATE invitations
     SET token = $2,
         expires_at = $3,
         status = 'pending',
         accepted_at = NULL,
         cancelled_at = NULL,
         updated_at = NOW(),
         invited_by = COALESCE(invited_by, $4)
     WHERE id = $1
     RETURNING *,
       (SELECT name FROM roles WHERE id = role_id) as role_name,
       (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = invited_by) as invited_by_name,
       (SELECT email FROM users WHERE id = invited_by) as invited_by_email`,
    [invitationId, token, expiresAt, actorId ?? null]
  );
  const row = assertFound(updated.rows[0], "Invitation not found");
  await queueEmailJob({
    template: "USER_INVITATION",
    to: row.email,
    data: {
      invitationUrl: invitationLink(token),
      roleName: row.role_name ?? "",
      invitedBy: row.invited_by_name ?? "Lexora Admin",
      expiresAt,
      customMessage: row.custom_message ?? undefined,
    },
  });
  await logInvitationEvent(actorId ?? null, invitationId, 'invitation.resent');
  return mapInvitationRow(row);
};

export const cancelInvitation = async (invitationId: string, actorId: string) => {
  const result = await query(
    `UPDATE invitations
     SET status = 'cancelled',
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING email`,
    [invitationId]
  );
  if (!result.rowCount) {
    throw new ApiError(404, "Invitation not found");
  }
  await logInvitationEvent(actorId ?? null, invitationId, 'invitation.cancelled');
};

export const getInvitationByToken = async (token: string): Promise<InvitationRecord> => {
  await expireStaleInvitations();
  const row = await query(
    `SELECT
       i.*,
       r.name as role_name,
       CONCAT(u.first_name, ' ', u.last_name) as invited_by_name,
       u.email as invited_by_email
     FROM invitations i
     LEFT JOIN roles r ON r.id = i.role_id
     LEFT JOIN users u ON u.id = i.invited_by
     WHERE i.token = $1
     LIMIT 1`,
    [token]
  );
  const record = row.rows[0];
  if (!record) {
    throw new ApiError(404, "Invitation token is invalid or has expired");
  }
  if (record.status !== "pending") {
    throw new ApiError(400, "Invitation is no longer available");
  }
  return mapInvitationRow(record);
};

export interface AcceptInvitationInput {
  token: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms: boolean;
}

export const acceptInvitation = async (payload: AcceptInvitationInput) => {
  if (!payload.acceptTerms) {
    throw new ApiError(400, "You must accept the terms to continue");
  }
  await assertPasswordValid(payload.password);
  return withDb(async (client) => {
    const inviteResult = await client.query(
      `SELECT
         i.*,
         r.name as role_name
       FROM invitations i
       LEFT JOIN roles r ON r.id = i.role_id
       WHERE i.token = $1
       FOR UPDATE`,
      [payload.token]
    );
    const invitation = assertFound(inviteResult.rows[0], "Invitation token is invalid or has expired");
    if (invitation.status !== "pending") {
      throw new ApiError(400, "Invitation is no longer available");
    }
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      await client.query(`UPDATE invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`, [invitation.id]);
      throw new ApiError(400, "Invitation has expired");
    }
    const roleId = invitation.role_id;
    if (!roleId) {
      throw new ApiError(400, "Invitation is missing a role assignment");
    }
    const email = normalizeEmail(invitation.email);
    const firstName = (payload.firstName ?? email.split("@")[0]).trim() || email.split("@")[0];
    const lastName = (payload.lastName ?? "").trim() || "User";
    const userType = (invitation.role_name ?? "").toLowerCase() === "client" ? "CLIENT" : "STAFF";

    let userId: string | null = null;
    const existing = await client.query<{ id: string }>(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
    if (existing.rowCount) {
      userId = existing.rows[0].id;
      await client.query(
        `UPDATE users
         SET first_name = $2,
             last_name = $3,
             phone = $4,
             status = 'ACTIVE',
             email_verified = TRUE,
             deleted_at = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, firstName, lastName, payload.phone ?? null]
      );
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (
           email,
           first_name,
           last_name,
           phone,
           status,
           user_type,
           email_verified
         ) VALUES ($1,$2,$3,$4,'ACTIVE',$5,TRUE)
         RETURNING id`,
        [email, firstName, lastName, payload.phone ?? null, userType]
      );
      userId = inserted.rows[0].id;
    }

    const passwordHash = await hashPassword(payload.password);
    const expiresAt = new Date(Date.now() + passwordPolicy.expiryDays * 24 * 60 * 60 * 1000).toISOString();
    await client.query(
      `UPDATE users
       SET password_hash = $2,
           password_changed_at = NOW(),
           password_expires_at = $3,
           force_password_change = FALSE
       WHERE id = $1`,
      [userId, passwordHash, expiresAt]
    );

    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1,$2)
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, roleId]
    );

    await client.query(
      `UPDATE invitations
       SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [invitation.id]
    );

    await logInvitationEvent(userId, invitation.id, 'invitation.accepted', { userId });
    await recordUserAuditLog(userId, userId, "invitation.accepted", { invitationId: invitation.id });
    return { success: true };
  });
};
