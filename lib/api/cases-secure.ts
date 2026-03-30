/**
 * Cases/Matters API - SECURED WITH MULTI-TENANT ISOLATION
 * 
 * This is the fixed version with proper organization scoping.
 * ALL queries filter by organization_id to prevent data leakage.
 */

import { query, withDb } from "@/lib/api/db";
import type { CaseDetail, CaseNote, CaseSummary, CaseTimelineEvent, CaseTeamMember } from "@/types";
import type { CreateCaseInput, UpdateCaseInput, CaseNoteInput } from "@/lib/api/validation";
import { ApiError, assertFound } from "@/lib/api/errors";
import { verifyRecordOwnership } from "@/lib/api/tenant";

const NOTE_DOCUMENT_TYPE = "CASE_NOTE";

/**
 * List all matters for a specific organization.
 * SECURED: Only returns matters belonging to the user's organization.
 */
export const listCasesSecure = async (
  organizationId: string,
  params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CaseSummary[]> => {
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
      AND m.organization_id = $1
      AND ($2::text IS NULL OR (
        m.title ILIKE '%' || $2 || '%'
        OR m.matter_number ILIKE '%' || $2 || '%'
      ))
      AND ($3::text IS NULL OR m.status = $3)
    ORDER BY m.created_at DESC
    LIMIT $4 OFFSET $5
    `,
    [organizationId, search ?? null, status ?? null, limit, offset]
  );

  return result.rows;
};

/**
 * Create a new matter.
 * SECURED: Automatically assigns the matter to the user's organization.
 */
export const createCaseSecure = async (
  organizationId: string,
  input: CreateCaseInput,
  userId: string
) => {
  const matterId = await withDb(async (client) => {
    const matter = await client.query(
      `INSERT INTO matters (
        organization_id,
        client_id,
        matter_number,
        title,
        description,
        status,
        practice_area,
        lead_attorney_id,
        opens_on,
        closes_on
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        organizationId,
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

  return getCaseByIdSecure(organizationId, matterId);
};

/**
 * Update a matter.
 * SECURED: Verifies matter belongs to organization before updating.
 */
export const updateCaseSecure = async (
  organizationId: string,
  matterId: string,
  input: UpdateCaseInput
) => {
  // Verify ownership first
  await verifyRecordOwnership('matters', matterId, organizationId);

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

  values.push(organizationId);
  values.push(matterId);

  await query(
    `UPDATE matters 
     SET ${updates.join(", ")}, updated_at = NOW() 
     WHERE organization_id = $${idx} AND id = $${idx + 1}`,
    values
  );

  return getCaseByIdSecure(organizationId, matterId);
};

/**
 * Archive/close a matter.
 * SECURED: Verifies matter belongs to organization before archiving.
 */
export const archiveCaseSecure = async (
  organizationId: string,
  matterId: string,
  userId: string
) => {
  // Verify ownership first
  await verifyRecordOwnership('matters', matterId, organizationId);

  await withDb(async (client) => {
    await client.query(
      `UPDATE matters 
       SET status = 'CLOSED', deleted_at = NOW() 
       WHERE id = $1 AND organization_id = $2`,
      [matterId, organizationId]
    );

    await client.query(
      `INSERT INTO matter_participants (matter_id, user_id, participant_role, is_primary)
       VALUES ($1,$2,$3,false)
       ON CONFLICT (matter_id, user_id) DO NOTHING`,
      [matterId, userId, "Archived"]
    );
  });
};

/**
 * Get matter by ID.
 * SECURED: Only returns matter if it belongs to the user's organization.
 */
export const getCaseByIdSecure = async (
  organizationId: string,
  matterId: string
): Promise<CaseDetail> => {
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
    WHERE m.id = $1 
      AND m.organization_id = $2 
      AND m.deleted_at IS NULL`,
    [matterId, organizationId]
  );

  const record = assertFound(base.rows[0], "Matter not found");

  const [team, notes, timeline] = await Promise.all([
    getCaseTeamSecure(organizationId, matterId),
    listCaseNotesSecure(organizationId, matterId),
    getCaseTimelineSecure(organizationId, matterId),
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
    WHERE d.matter_id = $1 
      AND d.organization_id = $2
      AND d.deleted_at IS NULL
    ORDER BY d.updated_at DESC
    LIMIT 100`,
    [matterId, organizationId]
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

const getCaseTeamSecure = async (
  organizationId: string,
  matterId: string
): Promise<CaseTeamMember[]> => {
  const result = await query<CaseTeamMember>(
    `SELECT
      mp.user_id as "userId",
      CONCAT(u.first_name, ' ', u.last_name) as "fullName",
      u.email,
      mp.participant_role as role,
      mp.is_primary as "isPrimary"
    FROM matter_participants mp
    INNER JOIN users u ON u.id = mp.user_id
    INNER JOIN matters m ON m.id = mp.matter_id
    WHERE mp.matter_id = $1
      AND m.organization_id = $2
    ORDER BY mp.is_primary DESC, mp.created_at ASC`,
    [matterId, organizationId]
  );
  return result.rows;
};

export const listCaseNotesSecure = async (
  organizationId: string,
  matterId: string
): Promise<CaseNote[]> => {
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
      AND d.organization_id = $2
      AND d.document_type = $3
      AND d.deleted_at IS NULL
    ORDER BY d.created_at DESC
    LIMIT 200`,
    [matterId, organizationId, NOTE_DOCUMENT_TYPE]
  );
  return result.rows;
};

export const addCaseNoteSecure = async (
  organizationId: string,
  input: CaseNoteInput,
  userId: string
) => {
  const { matterId, note, visibility } = input;

  // Verify matter belongs to organization
  await verifyRecordOwnership('matters', matterId, organizationId);

  const insert = await query(
    `INSERT INTO documents (
      organization_id,
      matter_id,
      title,
      document_type,
      status,
      tags,
      created_by,
      data_classification,
      notes
    ) VALUES ($1,$2,$3,$4,'DRAFT',$5,$6,$7,$8)
    RETURNING id`,
    [
      organizationId,
      matterId,
      note.slice(0, 120),
      NOTE_DOCUMENT_TYPE,
      ['note'],
      userId,
      visibility,
      note,
    ]
  );

  const [created] = await listCaseNotesSecure(organizationId, matterId);
  return created ?? { ...input, id: insert.rows[0].id, authorId: userId, authorName: "" };
};

export const getCaseTimelineSecure = async (
  organizationId: string,
  matterId: string
): Promise<CaseTimelineEvent[]> => {
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
      WHERE m.id = $1 AND m.organization_id = $2
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
      WHERE d.matter_id = $1 
        AND d.organization_id = $2
        AND d.document_type = $3
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
      WHERE d.matter_id = $1 AND d.organization_id = $2
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
      INNER JOIN matters m ON m.id = mp.matter_id
      WHERE mp.matter_id = $1 AND m.organization_id = $2
    ) AS events
    ORDER BY "occurredAt" DESC
    LIMIT 200`,
    [matterId, organizationId, NOTE_DOCUMENT_TYPE]
  );
  return result.rows;
};
