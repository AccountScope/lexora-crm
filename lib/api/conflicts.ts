import { query } from "@/lib/api/db";
import { ApiError, assertFound } from "@/lib/api/errors";
import type {
  ConflictAuditEntry,
  ConflictCheckDetail,
  ConflictCheckRecord,
  ConflictMatchRecord,
  ConflictSeverity,
  ConflictStatus,
  ConflictType,
  ConflictWaiverRecord,
  WatchListEntry,
} from "@/types";

interface ConflictCheckRow {
  id: string;
  clientName: string;
  opposingParties: string[];
  otherParties: string[];
  caseType: string | null;
  description: string | null;
  status: ConflictStatus;
  resolutionNotes: string | null;
  requestedById: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
  resolvedByEmail: string | null;
  createdAt: string;
  resolvedAt: string | null;
  totalConflicts: number;
  highConflicts: number;
  mediumConflicts: number;
  lowConflicts: number;
  totalCount?: number;
}

interface ConflictListParams {
  search?: string;
  status?: ConflictStatus;
  limit?: number;
  offset?: number;
}

const mapUser = (
  id: string | null,
  name: string | null,
  email: string | null
): { id: string; name: string; email?: string | null } | null => {
  if (!id) return null;
  return { id, name: name ?? "", email: email ?? undefined };
};

const mapConflictCheckRow = (row: ConflictCheckRow): ConflictCheckRecord => ({
  id: row.id,
  clientName: row.clientName,
  opposingParties: row.opposingParties ?? [],
  otherParties: row.otherParties ?? [],
  caseType: row.caseType,
  description: row.description ?? undefined,
  status: row.status,
  resolutionNotes: row.resolutionNotes ?? undefined,
  requestedBy: mapUser(row.requestedById, row.requestedByName, row.requestedByEmail) ?? {
    id: row.requestedById ?? "",
    name: row.requestedByName ?? "",
    email: row.requestedByEmail ?? undefined,
  },
  resolvedBy: mapUser(row.resolvedById, row.resolvedByName, row.resolvedByEmail),
  summary: {
    total: Number(row.totalConflicts ?? 0),
    high: Number(row.highConflicts ?? 0),
    medium: Number(row.mediumConflicts ?? 0),
    low: Number(row.lowConflicts ?? 0),
  },
  createdAt: row.createdAt,
  resolvedAt: row.resolvedAt ?? undefined,
});

export const listConflictChecks = async ({
  search,
  status,
  limit = 20,
  offset = 0,
}: ConflictListParams) => {
  const result = await query<ConflictCheckRow>(
    `SELECT
       cc.id,
       cc.client_name as "clientName",
       cc.opposing_parties as "opposingParties",
       cc.other_parties as "otherParties",
       cc.case_type as "caseType",
       cc.description,
       cc.status,
       cc.resolution_notes as "resolutionNotes",
       ru.id as "requestedById",
       CONCAT(ru.first_name, ' ', ru.last_name) as "requestedByName",
       ru.email as "requestedByEmail",
       su.id as "resolvedById",
       CONCAT(su.first_name, ' ', su.last_name) as "resolvedByName",
       su.email as "resolvedByEmail",
       cc.created_at as "createdAt",
       cc.resolved_at as "resolvedAt",
       COALESCE(stats.total_conflicts, 0) as "totalConflicts",
       COALESCE(stats.high_conflicts, 0) as "highConflicts",
       COALESCE(stats.medium_conflicts, 0) as "mediumConflicts",
       COALESCE(stats.low_conflicts, 0) as "lowConflicts",
       COUNT(*) OVER() as "totalCount"
     FROM conflict_checks cc
     LEFT JOIN users ru ON ru.id = cc.requested_by
     LEFT JOIN users su ON su.id = cc.resolved_by
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) as total_conflicts,
         COUNT(*) FILTER (WHERE severity = 'high') as high_conflicts,
         COUNT(*) FILTER (WHERE severity = 'medium') as medium_conflicts,
         COUNT(*) FILTER (WHERE severity = 'low') as low_conflicts
       FROM conflicts_found cf
       WHERE cf.conflict_check_id = cc.id
     ) stats ON TRUE
     WHERE
       ($1::conflict_status IS NULL OR cc.status = $1::conflict_status)
       AND (
         $2::text IS NULL OR (
           cc.client_name ILIKE '%' || $2 || '%'
           OR EXISTS (
             SELECT 1 FROM unnest(cc.opposing_parties) part WHERE part ILIKE '%' || $2 || '%'
           )
           OR EXISTS (
             SELECT 1 FROM unnest(cc.other_parties) part WHERE part ILIKE '%' || $2 || '%'
           )
         )
       )
     ORDER BY cc.created_at DESC
     LIMIT $3 OFFSET $4`,
    [status ?? null, search ?? null, limit, offset]
  );

  const total = result.rows[0]?.totalCount ?? 0;
  return {
    data: result.rows.map(mapConflictCheckRow),
    total,
  };
};

interface ConflictMatchRow {
  id: string;
  conflictCheckId: string;
  caseId: string | null;
  caseNumber: string | null;
  caseTitle: string | null;
  caseStatus: string | null;
  lawyerName: string | null;
  conflictType: string;
  severity: string;
  partyName: string;
  description: string | null;
  createdAt: string;
}

interface ConflictWaiverRow {
  id: string;
  conflictCheckId: string;
  caseId: string | null;
  waiverText: string;
  signedDocumentId: string | null;
  signedBy: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const mapConflictRow = (row: ConflictMatchRow): ConflictMatchRecord => ({
  id: row.id,
  conflictCheckId: row.conflictCheckId,
  caseId: row.caseId,
  caseNumber: row.caseNumber,
  caseTitle: row.caseTitle,
  caseStatus: row.caseStatus,
  lawyerName: row.lawyerName,
  conflictType: row.conflictType as ConflictType,
  severity: row.severity as ConflictSeverity,
  partyName: row.partyName,
  description: row.description ?? undefined,
  createdAt: row.createdAt,
});

const mapWaiverRow = (row: ConflictWaiverRow): ConflictWaiverRecord => ({
  id: row.id,
  conflictCheckId: row.conflictCheckId,
  caseId: row.caseId ?? undefined,
  waiverText: row.waiverText,
  signedDocumentId: row.signedDocumentId ?? undefined,
  signedBy: row.signedBy ?? undefined,
  signedAt: row.signedAt ?? undefined,
  expiresAt: row.expiresAt ?? undefined,
  createdAt: row.createdAt,
});

const buildAuditTrail = (
  record: ConflictCheckRecord,
  waivers: ConflictWaiverRecord[]
): ConflictAuditEntry[] => {
  const entries: ConflictAuditEntry[] = [
    {
      id: `${record.id}-created`,
      action: "check_created",
      actor: record.requestedBy,
      notes: record.description,
      timestamp: record.createdAt,
    },
  ];

  if (record.resolvedAt && record.status !== "pending") {
    entries.push({
      id: `${record.id}-status`,
      action: `status_${record.status}`,
      actor: record.resolvedBy ?? record.requestedBy,
      notes: record.resolutionNotes,
      timestamp: record.resolvedAt,
    });
  }

  waivers.forEach((waiver) => {
    entries.push({
      id: `waiver-${waiver.id}`,
      action: "waiver_created",
      actor: record.resolvedBy ?? record.requestedBy,
      notes: waiver.signedBy ? `Signed by ${waiver.signedBy}` : undefined,
      timestamp: waiver.createdAt,
    });
  });

  return entries;
};

export const getConflictCheckDetail = async (id: string): Promise<ConflictCheckDetail> => {
  const base = await query<ConflictCheckRow>(
    `SELECT
       cc.id,
       cc.client_name as "clientName",
       cc.opposing_parties as "opposingParties",
       cc.other_parties as "otherParties",
       cc.case_type as "caseType",
       cc.description,
       cc.status,
       cc.resolution_notes as "resolutionNotes",
       ru.id as "requestedById",
       CONCAT(ru.first_name, ' ', ru.last_name) as "requestedByName",
       ru.email as "requestedByEmail",
       su.id as "resolvedById",
       CONCAT(su.first_name, ' ', su.last_name) as "resolvedByName",
       su.email as "resolvedByEmail",
       cc.created_at as "createdAt",
       cc.resolved_at as "resolvedAt",
       COALESCE(stats.total_conflicts, 0) as "totalConflicts",
       COALESCE(stats.high_conflicts, 0) as "highConflicts",
       COALESCE(stats.medium_conflicts, 0) as "mediumConflicts",
       COALESCE(stats.low_conflicts, 0) as "lowConflicts"
     FROM conflict_checks cc
     LEFT JOIN users ru ON ru.id = cc.requested_by
     LEFT JOIN users su ON su.id = cc.resolved_by
     LEFT JOIN LATERAL (
       SELECT
         COUNT(*) as total_conflicts,
         COUNT(*) FILTER (WHERE severity = 'high') as high_conflicts,
         COUNT(*) FILTER (WHERE severity = 'medium') as medium_conflicts,
         COUNT(*) FILTER (WHERE severity = 'low') as low_conflicts
       FROM conflicts_found cf
       WHERE cf.conflict_check_id = cc.id
     ) stats ON TRUE
     WHERE cc.id = $1`,
    [id]
  );

  const record = mapConflictCheckRow(assertFound(base.rows[0], "Conflict check not found"));

  const conflictsResult = await query<ConflictMatchRow>(
    `SELECT
       cf.id,
       cf.conflict_check_id as "conflictCheckId",
       cf.case_id as "caseId",
       m.matter_number as "caseNumber",
       m.title as "caseTitle",
       m.status as "caseStatus",
       CONCAT(u.first_name, ' ', u.last_name) as "lawyerName",
       cf.conflict_type as "conflictType",
       cf.severity,
       cf.party_name as "partyName",
       cf.description,
       cf.created_at as "createdAt"
     FROM conflicts_found cf
     LEFT JOIN matters m ON m.id = cf.case_id
     LEFT JOIN users u ON u.id = m.lead_attorney_id
     WHERE cf.conflict_check_id = $1
     ORDER BY cf.severity DESC, cf.created_at DESC`,
    [id]
  );

  const waiversResult = await query<ConflictWaiverRow>(
    `SELECT
       cw.id,
       cw.conflict_check_id as "conflictCheckId",
       cw.case_id as "caseId",
       cw.waiver_text as "waiverText",
       cw.signed_document_id as "signedDocumentId",
       cw.signed_by as "signedBy",
       cw.signed_at as "signedAt",
       cw.expires_at as "expiresAt",
       cw.created_at as "createdAt"
     FROM conflict_waivers cw
     WHERE cw.conflict_check_id = $1
     ORDER BY cw.created_at DESC`,
    [id]
  );

  const conflicts = conflictsResult.rows.map(mapConflictRow);
  const waivers = waiversResult.rows.map(mapWaiverRow);

  return {
    ...record,
    conflicts,
    waivers,
    auditTrail: buildAuditTrail(record, waivers),
  };
};

interface ConflictStatusInput {
  status?: ConflictStatus;
  resolutionNotes?: string | null;
}

export const updateConflictStatus = async (
  conflictId: string,
  payload: ConflictStatusInput,
  userId: string
) => {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (payload.status) {
    sets.push(`status = $${idx}`);
    params.push(payload.status);
    idx += 1;
    if (payload.status === "pending") {
      sets.push("resolved_by = NULL");
      sets.push("resolved_at = NULL");
    } else {
      sets.push(`resolved_by = $${idx}`);
      params.push(userId);
      idx += 1;
      sets.push("resolved_at = NOW()");
    }
  }

  if (payload.resolutionNotes !== undefined) {
    sets.push(`resolution_notes = $${idx}`);
    params.push(payload.resolutionNotes);
    idx += 1;
  }

  if (!sets.length) {
    throw new ApiError(400, "No updates provided");
  }

  params.push(conflictId);
  await query(
    `UPDATE conflict_checks SET ${sets.join(", ")}
     WHERE id = $${idx}`,
    params
  );

  return getConflictCheckDetail(conflictId);
};

interface ConflictWaiverInput {
  caseId?: string | null;
  waiverText: string;
  signedDocumentId?: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  expiresAt?: string | null;
}

export const createConflictWaiver = async (
  conflictId: string,
  payload: ConflictWaiverInput
): Promise<ConflictWaiverRecord> => {
  const result = await query<ConflictWaiverRow>(
    `INSERT INTO conflict_waivers (
       conflict_check_id,
       case_id,
       waiver_text,
       signed_document_id,
       signed_by,
       signed_at,
       expires_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING
       id,
       conflict_check_id as "conflictCheckId",
       case_id as "caseId",
       waiver_text as "waiverText",
       signed_document_id as "signedDocumentId",
       signed_by as "signedBy",
       signed_at as "signedAt",
       expires_at as "expiresAt",
       created_at as "createdAt"`,
    [
      conflictId,
      payload.caseId ?? null,
      payload.waiverText,
      payload.signedDocumentId ?? null,
      payload.signedBy ?? null,
      payload.signedAt ?? null,
      payload.expiresAt ?? null,
    ]
  );

  return mapWaiverRow(result.rows[0]);
};

interface WatchListRow {
  id: string;
  partyName: string;
  reason: string | null;
  createdAt: string;
  addedById: string | null;
  addedByName: string | null;
  addedByEmail: string | null;
}

const mapWatchListRow = (row: WatchListRow): WatchListEntry => ({
  id: row.id,
  partyName: row.partyName,
  reason: row.reason ?? undefined,
  createdAt: row.createdAt,
  addedBy: mapUser(row.addedById, row.addedByName, row.addedByEmail),
});

export const listWatchListEntries = async (): Promise<WatchListEntry[]> => {
  const result = await query<WatchListRow>(
    `SELECT
       w.id,
       w.party_name as "partyName",
       w.reason,
       w.created_at as "createdAt",
       w.added_by as "addedById",
       CONCAT(u.first_name, ' ', u.last_name) as "addedByName",
       u.email as "addedByEmail"
     FROM watch_list w
     LEFT JOIN users u ON u.id = w.added_by
     ORDER BY w.created_at DESC`
  );

  return result.rows.map(mapWatchListRow);
};

export const addWatchListEntry = async (
  partyName: string,
  reason: string | undefined,
  userId: string
): Promise<WatchListEntry> => {
  try {
    const inserted = await query<WatchListRow>(
      `INSERT INTO watch_list (party_name, reason, added_by)
       VALUES ($1,$2,$3)
       RETURNING
         id,
         party_name as "partyName",
         reason,
         created_at as "createdAt",
         added_by as "addedById",
         NULL::text as "addedByName",
         NULL::text as "addedByEmail"`,
      [partyName.trim(), reason ?? null, userId]
    );
    return mapWatchListRow(inserted.rows[0]);
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new ApiError(409, "Party already exists on the watch list");
    }
    throw error;
  }
};

export const removeWatchListEntry = async (id: string) => {
  const result = await query("DELETE FROM watch_list WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    throw new ApiError(404, "Watch list entry not found");
  }
};
