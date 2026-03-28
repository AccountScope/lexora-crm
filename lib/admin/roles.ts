import { query, withDb } from "@/lib/api/db";
import { ApiError, assertFound } from "@/lib/api/errors";
import type { RoleDetail, RoleSummary } from "@/types";
import { PERMISSION_DEFINITIONS, PERMISSION_KEYS } from "@/lib/admin/permission-matrix";

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_custom: boolean;
  user_count: number;
}

const mapRoleRow = (row: RoleRow): RoleSummary => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  isSystem: row.is_system,
  isCustom: row.is_custom,
  userCount: Number(row.user_count ?? 0),
});

let permissionsHydrated = false;

const ensurePermissionCatalog = async () => {
  if (permissionsHydrated) return;
  const values: (string | null)[] = [];
  const tuples: string[] = [];
  PERMISSION_DEFINITIONS.forEach((permission, index) => {
    values.push(permission.key, permission.label);
    tuples.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
  });
  if (values.length) {
    await query(
      `INSERT INTO permissions (key, description)
       VALUES ${tuples.join(",")}
       ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description`,
      values
    );
  }
  permissionsHydrated = true;
};

const normalizePermissions = (permissions: string[]): string[] => {
  const unique = Array.from(new Set((permissions ?? []).filter((item) => PERMISSION_KEYS.includes(item))));
  if (permissions.length && !unique.length) {
    throw new ApiError(400, "No valid permissions supplied");
  }
  if (permissions.some((permission) => !PERMISSION_KEYS.includes(permission))) {
    throw new ApiError(400, "Unknown permission provided");
  }
  return unique;
};

const resolvePermissionIds = async (client: any, permissionKeys: string[]): Promise<Map<string, string>> => {
  if (!permissionKeys.length) return new Map();
  const result = await client.query(
    `SELECT id, key FROM permissions WHERE key = ANY($1::text[])`,
    [permissionKeys]
  );
  if (result.rowCount !== permissionKeys.length) {
    throw new ApiError(400, "One or more permissions are not registered");
  }
  return new Map(result.rows.map((row: any) => [row.key, row.id]));
};

const assertRoleIsCustom = async (roleId: string) => {
  const role = await query<{ is_custom: boolean }>(`SELECT is_custom FROM roles WHERE id = $1`, [roleId]);
  const record = assertFound(role.rows[0], "Role not found");
  if (!record.is_custom) {
    throw new ApiError(400, "System roles cannot be modified");
  }
};

export const listRoles = async (): Promise<RoleSummary[]> => {
  await ensurePermissionCatalog();
  const result = await query<RoleRow>(
    `SELECT r.id, r.name, r.description, r.is_system, r.is_custom, COUNT(ur.user_id)::int AS user_count
     FROM roles r
     LEFT JOIN user_roles ur ON ur.role_id = r.id
     GROUP BY r.id
     ORDER BY r.is_system DESC, lower(r.name)`
  );
  return result.rows.map(mapRoleRow);
};

export const getRoleById = async (roleId: string): Promise<RoleDetail> => {
  await ensurePermissionCatalog();
  const base = await query<RoleRow>(
    `SELECT r.id, r.name, r.description, r.is_system, r.is_custom, COUNT(ur.user_id)::int AS user_count
     FROM roles r
     LEFT JOIN user_roles ur ON ur.role_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [roleId]
  );
  const role = assertFound(base.rows[0], "Role not found");
  const permissions = await query<{ key: string }>(
    `SELECT p.key FROM role_permissions rp
     INNER JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = $1
     ORDER BY p.key`,
    [roleId]
  );
  const users = await query<RoleDetail["users"][number]>(
    `SELECT
       u.id,
       CONCAT(u.first_name, ' ', u.last_name) AS name,
       u.email,
       tm.member_of AS roles
     FROM (
       SELECT ur.user_id, array_remove(array_agg(DISTINCT r.name), NULL) AS member_of
       FROM user_roles ur
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ur.role_id = $1
       GROUP BY ur.user_id
     ) tm
     INNER JOIN users u ON u.id = tm.user_id
     ORDER BY lower(u.first_name), lower(u.last_name)`,
    [roleId]
  );

  return {
    ...mapRoleRow(role),
    permissions: permissions.rows.map((row) => row.key),
    users: users.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      roles: row.roles ?? [],
    })),
  };
};

export interface RolePayload {
  name: string;
  description?: string | null;
  permissions: string[];
}

export const createRole = async (payload: RolePayload): Promise<RoleDetail> => {
  await ensurePermissionCatalog();
  const permissions = normalizePermissions(payload.permissions);
  return withDb(async (client) => {
    const conflict = await client.query(`SELECT 1 FROM roles WHERE lower(name) = lower($1)`, [payload.name]);
    if (conflict.rowCount) {
      throw new ApiError(409, "A role with this name already exists");
    }
    const role = await client.query<RoleRow>(
      `INSERT INTO roles (name, description, is_system, is_custom)
       VALUES ($1, $2, false, true)
       RETURNING id, name, description, is_system, is_custom, 0::int AS user_count`,
      [payload.name.trim(), payload.description ?? null]
    );
    if (permissions.length) {
      const permissionIds = await resolvePermissionIds(client, permissions);
      const values: any[] = [];
      const tuples: string[] = [];
      Array.from(permissionIds.values()).forEach((permissionId, index) => {
        values.push(role.rows[0].id, permissionId);
        tuples.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });
      if (values.length) {
        await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${tuples.join(",")}`, values);
      }
    }
    return getRoleById(role.rows[0].id);
  });
};

export const updateRole = async (roleId: string, payload: RolePayload): Promise<RoleDetail> => {
  await ensurePermissionCatalog();
  await assertRoleIsCustom(roleId);
  const permissions = normalizePermissions(payload.permissions);
  return withDb(async (client) => {
    if (payload.name) {
      const conflict = await client.query(`SELECT 1 FROM roles WHERE lower(name) = lower($1) AND id <> $2`, [payload.name, roleId]);
      if (conflict.rowCount) {
        throw new ApiError(409, "A role with this name already exists");
      }
    }
    await client.query(`UPDATE roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3`, [
      payload.name.trim(),
      payload.description ?? null,
      roleId,
    ]);
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    if (permissions.length) {
      const permissionIds = await resolvePermissionIds(client, permissions);
      const values: any[] = [];
      const tuples: string[] = [];
      Array.from(permissionIds.values()).forEach((permissionId, index) => {
        values.push(roleId, permissionId);
        tuples.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
      });
      if (values.length) {
        await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${tuples.join(",")}`, values);
      }
    }
    return getRoleById(roleId);
  });
};

export const deleteRole = async (roleId: string) => {
  await assertRoleIsCustom(roleId);
  await withDb(async (client) => {
    await client.query(`DELETE FROM roles WHERE id = $1`, [roleId]);
  });
};

export const addUsersToRole = async (roleId: string, userIds: string[]) => {
  if (!userIds?.length) {
    throw new ApiError(400, "No users provided");
  }
  await withDb(async (client) => {
    const values: any[] = [];
    const tuples: string[] = [];
    userIds.forEach((userId, index) => {
      values.push(userId, roleId);
      tuples.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
    });
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ${tuples.join(",")}
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      values
    );
  });
  return getRoleById(roleId);
};

export const removeUserFromRole = async (roleId: string, userId: string) => {
  await query(`DELETE FROM user_roles WHERE role_id = $1 AND user_id = $2`, [roleId, userId]);
  return getRoleById(roleId);
};
