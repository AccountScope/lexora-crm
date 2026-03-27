import { query, withDb } from "@/lib/api/db";
import type { CaseDetail, CaseNote, CaseSummary, CaseTimelineEvent, CaseTeamMember } from "@/types";
import type { CreateCaseInput, UpdateCaseInput, CaseNoteInput } from "@/lib/api/validation";
import { ApiError, assertFound } from "@/lib/api/errors";

const NOTE_DOCUMENT_TYPE = "CASE_NOTE";

export const listCases = async (params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<CaseSummary[]> => {
  const { search, status } = params ?? {};
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  const result = await query<CaseSummary>(
    `
    SELECT
      m.id,
      m.matter_number as "matterNumber",
      m.title,
      m.status,
      m.practice_area as "practiceArea",
      m.opens_on as "opensOn",
      m.closes_on as "closesOn",
      json_build_object(
        'id', c.id,
        'legalName', c.legal_name,
        'displayName', c.display_name,
        'status', c.status
      ) as client,
      CASE WHEN u.id IS NULL THEN NULL ELSE json_build_object(
        'id', u.id,
        'name', CONCAT(u.first_name, ' ', u.last_name),
        'email', u.email
      ) END as "leadAttorney"
    FROM matters m
    INNER JOIN clients c ON c.id = m.client_id
    LEFT JOIN users u ON u.id = m.lead_attorney_id
    WHERE m.deleted_at IS NULL
      AND ($1::text IS NULL OR (
        m.title ILIKE '%' || $1 || '%'
        OR m.matter_number ILIKE '%' || $1 || '%'
      ))
      AND ($2::text IS NULL OR m.status = $2)
    ORDER BY m.created_at DESC
    LIMIT $3 OFFSET $4
    `,
    [search ?? null, status ?? null, limit, offset]
  );

  return result.rows;
};

export const createCase = async (input: CreateCaseInput, userId: string) => {
  const matterId = await withDb(async (client) => {
    const matter = await client.query(
      `INSERT INTO matters (
        client_id,
        matter_number,
        title,
        description,
        status,
        practice_area,
        lead_attorney_id,
        opens_on,
        closes_on
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        input.clientId,
        input.matterNumber,
        input.title,
        input.description ?? null,
        input.status ?? "OPEN",
        input.practiceArea ?? null,
        input.leadAttorneyId ?? null,
        input.opensOn ?? new Date().toISOString().slice(0, 10),
        input.closesOn ?? null,
      ]
    );

    await client.query(
      `INSERT INTO matter_participants (matter_id, user_id, participant_role, is_primary)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (matter_id, user_id) DO UPDATE SET participant_role = EXCLUDED.participant_role, is_primary = EXCLUDED.is_primary`,
      [matter.rows[0].id, userId, "Creator", true]
    );

    return matter.rows[0].id;
  });

  return getCaseById(matterId);
};

export const updateCase = async (matterId: string, input: UpdateCaseInput) => {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined) return;
    const column =
      key === "matterNumber"
        ? "matter_number"
        : key === "practiceArea"
        ? "practice_area"
        : key === "leadAttorneyId"
        ? "lead_attorney_id"
        : key === "opensOn"
        ? "opens_on"
        : key === "closesOn"
        ? "closes_on"
        : key;
    updates.push(`${column} = $${idx}`);
    values.push(value);
    idx += 1;
  });

  if (!updates.length) {
    throw new ApiError(400, "No updates provided");
  }

  values.push(matterId);

  await query(`UPDATE matters SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx}`, values);
  return getCaseById(matterId);
};

export const archiveCase = async (matterId: string, userId: string) => {
  await withDb(async (client) => {
    await client.query(`UPDATE matters SET status = 'CLOSED', deleted_at = NOW() WHERE id = $1`, [matterId]);
    await client.query(
      `INSERT INTO matter_participants (matter_id, user_id, participant_role, is_primary)
       VALUES ($1,$2,$3,false)
       ON CONFLICT (matter_id, user_id) DO NOTHING`,
      [matterId, userId, "Archived"]
    );
  });
};

export const getCaseById = async (matterId: string): Promise<CaseDetail> => {
  const base = await query<CaseSummary & { description: string | null }>(
    `SELECT
      m.id,
      m.matter_number as "matterNumber",
      m.title,
      m.status,
      m.practice_area as "practiceArea",
      m.opens_on as "opensOn",
      m.closes_on as "closesOn",
      m.description,
      json_build_object('id', c.id, 'legalName', c.legal_name, 'displayName', c.display_name, 'status', c.status) as client,
      CASE WHEN u.id IS NULL THEN NULL ELSE json_build_object('id', u.id, 'name', CONCAT(u.first_name, ' ', u.last_name), 'email', u.email) END as "leadAttorney"
    FROM matters m
    INNER JOIN clients c ON c.id = m.client_id
    LEFT JOIN users u ON u.id = m.lead_attorney_id
    WHERE m.id = $1 AND m.deleted_at IS NULL`,
    [matterId]
  );
  const record = assertFound(base.rows[0], "Matter not found");

  const [team, notes, timeline] = await Promise.all([
    getCaseTeam(matterId),
    listCaseNotes(matterId),
    getCaseTimeline(matterId),
  ]);

  const documentsResult = await query(
    `SELECT
      d.id,
      d.matter_id as "matterId",
      d.client_id as "clientId",
      d.title,
      d.document_type as "documentType",
      d.status,
      d.tags,
      d.data_classification as "classification",
      json_build_object(
        'id', dv.id,
        'documentId', dv.document_id,
        'versionNumber', dv.version_number,
        'storageBucket', dv.storage_bucket,
        'storagePath', dv.storage_path,
        'fileSizeBytes', dv.file_size_bytes,
        'mimeType', dv.mime_type,
        'checksum', dv.checksum,
        'uploadedBy', dv.uploaded_by,
        'createdAt', dv.created_at
      ) as "latestVersion"
    FROM documents d
    LEFT JOIN document_versions dv ON dv.id = d.latest_version_id
    WHERE d.matter_id = $1 AND d.deleted_at IS NULL
    ORDER BY d.updated_at DESC
    LIMIT 100`,
    [matterId]
  );

  return {
    ...record,
    description: record.description,
    team,
    notes,
    timeline,
    documents: documentsResult.rows,
  };
};

const getCaseTeam = async (matterId: string): Promise<CaseTeamMember[]> => {
  const result = await query<CaseTeamMember>(
    `SELECT
      mp.user_id as "userId",
      CONCAT(u.first_name, ' ', u.last_name) as "fullName",
      u.email,
      mp.participant_role as role,
      mp.is_primary as "isPrimary"
    FROM matter_participants mp
    INNER JOIN users u ON u.id = mp.user_id
    WHERE mp.matter_id = $1
    ORDER BY mp.is_primary DESC, mp.created_at ASC`,
    [matterId]
  );
  return result.rows;
};

export const listCaseNotes = async (matterId: string): Promise<CaseNote[]> => {
  const result = await query<CaseNote>(
    `SELECT
      d.id,
      d.matter_id as "matterId",
      d.created_by as "authorId",
      CONCAT(u.first_name, ' ', u.last_name) as "authorName",
      d.data_classification as visibility,
      COALESCE(d.notes, d.title) as note,
      d.created_at as "createdAt"
    FROM documents d
    INNER JOIN users u ON u.id = d.created_by
    WHERE d.matter_id = $1
      AND d.document_type = $2
      AND d.deleted_at IS NULL
    ORDER BY d.created_at DESC
    LIMIT 200`,
    [matterId, NOTE_DOCUMENT_TYPE]
  );
  return result.rows;
};

export const addCaseNote = async (input: CaseNoteInput, userId: string) => {
  const { matterId, note, visibility } = input;
  const insert = await query(
    `INSERT INTO documents (
      matter_id,
      title,
      document_type,
      status,
      tags,
      created_by,
      data_classification,
      notes
    ) VALUES ($1,$2,$3,'DRAFT',$4,$5,$6,$7)
    RETURNING id`,
    [
      matterId,
      note.slice(0, 120),
      NOTE_DOCUMENT_TYPE,
      ['note'],
      userId,
      visibility,
      note,
    ]
  );
  const [created] = await listCaseNotes(matterId);
  return created ?? { ...input, id: insert.rows[0].id, authorId: userId, authorName: "" };
};

export const getCaseTimeline = async (matterId: string): Promise<CaseTimelineEvent[]> => {
  const result = await query<CaseTimelineEvent>(
    `SELECT * FROM (
      SELECT
        m.id,
        m.id as "matterId",
        m.created_at as "occurredAt",
        'Matter created' as label,
        m.description as description,
        'status' as category,
        CONCAT(u.first_name, ' ', u.last_name) as actor
      FROM matters m
      LEFT JOIN users u ON u.id = m.lead_attorney_id
      WHERE m.id = $1
      UNION ALL
      SELECT
        d.id,
        d.matter_id as "matterId",
        d.created_at as "occurredAt",
        'Note added' as label,
        d.notes as description,
        'note' as category,
        CONCAT(u.first_name, ' ', u.last_name) as actor
      FROM documents d
      INNER JOIN users u ON u.id = d.created_by
      WHERE d.matter_id = $1 AND d.document_type = $2
      UNION ALL
      SELECT
        coc.id,
        d.matter_id as "matterId",
        coc.occurred_at as "occurredAt",
        coc.event_type as label,
        coc.metadata::text as description,
        'custody' as category,
        CONCAT(u.first_name, ' ', u.last_name) as actor
      FROM document_chain_of_custody coc
      INNER JOIN document_versions dv ON dv.id = coc.document_version_id
      LEFT JOIN users u ON u.id = coc.performed_by
      INNER JOIN documents d ON d.id = dv.document_id
      WHERE d.matter_id = $1
      UNION ALL
      SELECT
        mp.user_id::text || '-' || mp.matter_id,
        mp.matter_id as "matterId",
        mp.created_at as "occurredAt",
        'Team assignment' as label,
        mp.participant_role as description,
        'assignment' as category,
        CONCAT(u.first_name, ' ', u.last_name) as actor
      FROM matter_participants mp
      INNER JOIN users u ON u.id = mp.user_id
      WHERE mp.matter_id = $1
    ) AS events
    ORDER BY "occurredAt" DESC
    LIMIT 200`,
    [matterId, NOTE_DOCUMENT_TYPE]
  );
  return result.rows;
};
