import { query, withDb } from "@/lib/api/db";
import { ApiError, assertFound } from "@/lib/api/errors";
import type { TeamDetail, TeamMember, TeamSummary } from "@/types";

interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  created_by: string | null;
  created_by_name: string | null;
  member_count: number;
}

const mapTeamRow = (row: TeamRow): TeamSummary => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  parentId: row.parent_id,
  memberCount: Number(row.member_count ?? 0),
  createdAt: row.created_at,
  createdBy: row.created_by
    ? {
        id: row.created_by,
        name: row.created_by_name ?? "",
      }
    : null,
});

export interface TeamPayload {
  name: string;
  description?: string | null;
  parentId?: string | null;
}

export const listTeams = async (): Promise<TeamSummary[]> => {
  const result = await query<TeamRow>(
    `SELECT
       t.id,
       t.name,
       t.description,
       t.parent_id,
       t.created_at,
       t.created_by,
       CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
       COALESCE(tm.member_count, 0) AS member_count
     FROM teams t
     LEFT JOIN (
       SELECT team_id, COUNT(*)::int AS member_count
       FROM team_members
       GROUP BY team_id
     ) tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = t.created_by
     ORDER BY lower(t.name)`
  );
  return result.rows.map(mapTeamRow);
};

export const getTeamById = async (teamId: string): Promise<TeamDetail> => {
  const rows = await query<TeamRow>(
    `SELECT
       t.id,
       t.name,
       t.description,
       t.parent_id,
       t.created_at,
       t.created_by,
       CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
       COALESCE(tm.member_count, 0) AS member_count
     FROM teams t
     LEFT JOIN (
       SELECT team_id, COUNT(*)::int AS member_count
       FROM team_members
       GROUP BY team_id
     ) tm ON tm.team_id = t.id
     LEFT JOIN users u ON u.id = t.created_by
     WHERE t.id = $1`,
    [teamId]
  );
  const team = assertFound(rows.rows[0], "Team not found");

  const members = await query<TeamMember>(
    `SELECT
       tm.user_id AS id,
       CONCAT(u.first_name, ' ', u.last_name) AS name,
       u.email,
       tm.added_at AS "addedAt",
       CONCAT(added_by.first_name, ' ', added_by.last_name) AS "addedBy",
       COALESCE(array_remove(array_agg(DISTINCT r.name), NULL), '{}') AS roles
     FROM team_members tm
     INNER JOIN users u ON u.id = tm.user_id
     LEFT JOIN users added_by ON added_by.id = tm.added_by
     LEFT JOIN user_roles ur ON ur.user_id = tm.user_id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE tm.team_id = $1
     GROUP BY tm.user_id, tm.added_at, added_by.first_name, added_by.last_name, u.first_name, u.last_name, u.email
     ORDER BY lower(u.first_name), lower(u.last_name)`,
    [teamId]
  );

  const children = await query<{ id: string; name: string }>(
    `SELECT id, name FROM teams WHERE parent_id = $1 ORDER BY lower(name)`,
    [teamId]
  );

  const parent = team.parent_id
    ? await query<{ id: string; name: string }>(`SELECT id, name FROM teams WHERE id = $1`, [team.parent_id]).then((res) =>
        res.rows[0] ?? null
      )
    : null;

  return {
    ...mapTeamRow(team),
    members: members.rows.map((row) => ({
      ...row,
      roles: row.roles ?? [],
    })),
    parent,
    children: children.rows,
  };
};

const validateParent = async (parentId: string | null, selfId?: string | null) => {
  if (!parentId) return;
  if (parentId === selfId) {
    throw new ApiError(400, "A team cannot be its own parent");
  }
  const exists = await query(`SELECT 1 FROM teams WHERE id = $1`, [parentId]);
  if (!exists.rowCount) {
    throw new ApiError(400, "Parent team not found");
  }
};

export const createTeam = async (payload: TeamPayload, actorId: string): Promise<TeamDetail> => {
  return withDb(async (client) => {
    await validateParent(payload.parentId ?? null);
    const result = await client.query<TeamRow>(
      `INSERT INTO teams (name, description, parent_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, parent_id, created_at, created_by,
                 (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = created_by) AS created_by_name,
                 0::int AS member_count`,
      [payload.name.trim(), payload.description ?? null, payload.parentId ?? null, actorId]
    );
    return getTeamById(result.rows[0].id);
  });
};

export const updateTeam = async (teamId: string, payload: TeamPayload): Promise<TeamDetail> => {
  await validateParent(payload.parentId ?? null, teamId);
  await withDb(async (client) => {
    await client.query(`UPDATE teams SET name = $1, description = $2, parent_id = $3, updated_at = NOW() WHERE id = $4`, [
      payload.name.trim(),
      payload.description ?? null,
      payload.parentId ?? null,
      teamId,
    ]);
  });
  return getTeamById(teamId);
};

export const deleteTeam = async (teamId: string) => {
  await withDb(async (client) => {
    const children = await client.query(`SELECT 1 FROM teams WHERE parent_id = $1 LIMIT 1`, [teamId]);
    if (children.rowCount) {
      throw new ApiError(400, "Reassign or remove child teams before deleting this team");
    }
    await client.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
  });
};

export const addTeamMembers = async (teamId: string, userIds: string[], actorId: string) => {
  if (!userIds?.length) {
    throw new ApiError(400, "No members provided");
  }
  await withDb(async (client) => {
    const tuples: string[] = [];
    const values: any[] = [];
    userIds.forEach((userId, index) => {
      values.push(teamId, userId, actorId);
      tuples.push(`($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`);
    });
    await client.query(
      `INSERT INTO team_members (team_id, user_id, added_by)
       VALUES ${tuples.join(",")}
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      values
    );
  });
  return getTeamById(teamId);
};

export const removeTeamMember = async (teamId: string, userId: string) => {
  await query(`DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`, [teamId, userId]);
  return getTeamById(teamId);
};
