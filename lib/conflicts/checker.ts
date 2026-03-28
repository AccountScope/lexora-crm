import { query, withDb } from "@/lib/api/db";
import { randomUUID } from "crypto";
import type {
  ConflictMatchRecord,
  ConflictSeverity,
  ConflictSummaryCounts,
  ConflictType,
} from "@/types";
import { createFuzzyMatcher, normalizePartyName, type FuzzyMatchResult } from "@/lib/conflicts/fuzzy-match";

const severityRank: Record<ConflictSeverity, number> = { high: 3, medium: 2, low: 1 };

const sanitizeList = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => Boolean(value))
    )
  );

interface MatterCandidateRow {
  id: string;
  matterNumber: string;
  title: string;
  status: string;
  clientId: string;
  clientName: string;
  clientDisplayName?: string | null;
  lawyerName?: string | null;
}

interface WatchListRow {
  id: string;
  partyName: string;
  reason?: string | null;
}

interface ConflictDraft {
  caseId?: string | null;
}
interface ConflictInsertRow {
  id: string;
  conflictCheckId: string;
  caseId?: string | null;
  conflictType: ConflictType;
  severity: ConflictSeverity;
  partyName: string;
  description?: string | null;
  createdAt: string;
}

interface DetectionResult {
  drafts: ConflictDraft[];
  summary: ConflictSummaryCounts;
  watchHits: WatchListRow[];
}

const loadMatterCandidates = async (): Promise<MatterCandidateRow[]> => {
  const result = await query<MatterCandidateRow>(
    `SELECT
       m.id,
       m.matter_number as "matterNumber",
       m.title,
       m.status,
       c.id as "clientId",
       c.legal_name as "clientName",
       c.display_name as "clientDisplayName",
       CONCAT(u.first_name, ' ', u.last_name) as "lawyerName"
     FROM matters m
     INNER JOIN clients c ON c.id = m.client_id
     LEFT JOIN users u ON u.id = m.lead_attorney_id
     WHERE m.deleted_at IS NULL`
  );
  return result.rows;
};

const loadWatchList = async (): Promise<WatchListRow[]> => {
  const result = await query<WatchListRow>(
    `SELECT id, party_name as "partyName", reason FROM watch_list ORDER BY created_at DESC`
  );
  return result.rows;
};

const computeSummary = (drafts: ConflictDraft[]): ConflictSummaryCounts => ({
  total: drafts.length,
  high: drafts.filter((draft) => draft.severity === "high").length,
  medium: drafts.filter((draft) => draft.severity === "medium").length,
  low: drafts.filter((draft) => draft.severity === "low").length,
});

const formatDescription = (draft: ConflictDraft) => {
  if (!draft.caseNumber || !draft.caseTitle) {
    return draft.description ?? "Potential conflict flagged";
  }
  return (
    draft.description ??
    `Conflict against ${draft.partyName} in matter ${draft.caseNumber} – ${draft.caseTitle}`
  );
};

const dedupeConflicts = (drafts: ConflictDraft[]): ConflictDraft[] => {
  const map = new Map<string, ConflictDraft>();
  drafts.forEach((draft) => {
    const key = [draft.caseId ?? "none", draft.conflictType, normalizePartyName(draft.partyName)].join("|");
    const existing = map.get(key);
    if (!existing) {
      map.set(key, draft);
      return;
    }
    if (severityRank[draft.severity] > severityRank[existing.severity]) {
      map.set(key, draft);
    }
  });
  return Array.from(map.values());
};

const detectConflicts = (
  clientName: string,
  opposingParties: string[],
  otherParties: string[],
  matters: MatterCandidateRow[],
  watchList: WatchListRow[]
): DetectionResult => {
  const matcher = createFuzzyMatcher(
    matters.map((matter) => ({
      id: matter.id,
      name: matter.clientName,
      aliases: [matter.clientDisplayName ?? ""].filter(Boolean),
      payload: matter,
    }))
  );

  const drafts: ConflictDraft[] = [];

  const pushMatches = (
    matches: FuzzyMatchResult<MatterCandidateRow>[],
    opts: { type: ConflictType; severity: ConflictSeverity; severityForClosed?: ConflictSeverity }
  ) => {
    matches.forEach((match) => {
      const matter = match.candidate.payload;
      const isClosed = matter.status === "CLOSED";
      const severity = isClosed && opts.severityForClosed ? opts.severityForClosed : opts.severity;
      const conflictType = isClosed && opts.type === "direct" ? "former_client" : opts.type;
      drafts.push({
        caseId: matter.id,
        caseNumber: matter.matterNumber,
        caseTitle: matter.title,
        caseStatus: matter.status,
        lawyerName: matter.lawyerName ?? undefined,
        conflictType,
        severity,
        partyName: matter.clientName,
      });
    });
  };

  const directMatches = matcher.search(clientName, { limit: 10, minConfidence: 0.6 });
  pushMatches(directMatches, { type: "direct", severity: "high", severityForClosed: "medium" });

  opposingParties.forEach((name) => {
    const matches = matcher.search(name, { limit: 10, minConfidence: 0.55 });
    pushMatches(matches, { type: "opposing", severity: "medium", severityForClosed: "low" });
  });

  otherParties.forEach((name) => {
    const matches = matcher.search(name, { limit: 5, minConfidence: 0.5 });
    pushMatches(matches, { type: "related", severity: "low" });
  });

  const deduped = dedupeConflicts(
    drafts.map((draft) => ({ ...draft, description: formatDescription(draft) }))
  );

  const namesPool = [clientName, ...opposingParties, ...otherParties]
    .map(normalizePartyName)
    .filter(Boolean);

  const watchHits = watchList.filter((watch) => {
    const watchName = normalizePartyName(watch.partyName);
    return namesPool.some((name) => name.includes(watchName) || watchName.includes(name));
  });

  watchHits.forEach((hit) => {
    deduped.push({
      conflictType: "third_party",
      severity: "high",
      partyName: hit.partyName,
      description: hit.reason ?? "Watch list alert",
    });
  });

  const uniqueDrafts = dedupeConflicts(deduped).map((draft) => ({
    ...draft,
    description: formatDescription(draft),
  }));

  return {
    drafts: uniqueDrafts,
    summary: computeSummary(uniqueDrafts),
    watchHits,
  };
};

export interface ConflictCheckPayload {
  clientName: string;
  opposingParties: string[];
  otherParties?: string[];
  caseType?: string;
  description?: string;
  requestedBy: string;
}

export interface ConflictDecision {
  preventCaseCreation: boolean;
  requireAdminApproval: boolean;
  notifyEthics: boolean;
  watchListHits: string[];
}

export interface ConflictCheckRunResult {
  checkId: string;
  summary: ConflictSummaryCounts;
  conflicts: ConflictMatchRecord[];
  decisions: ConflictDecision;
}

export const runConflictCheck = async (payload: ConflictCheckPayload): Promise<ConflictCheckRunResult> => {
  const clientName = payload.clientName.trim();
  const opposingParties = sanitizeList(payload.opposingParties ?? []);
  const otherParties = sanitizeList(payload.otherParties ?? []);

  if (!clientName) {
    throw new Error("Client name is required for conflict checks");
  }
  if (!opposingParties.length) {
    throw new Error("At least one opposing party is required for conflict checks");
  }

  const [matters, watchList] = await Promise.all([loadMatterCandidates(), loadWatchList()]);
  const detection = detectConflicts(clientName, opposingParties, otherParties, matters, watchList);

  const decisions: ConflictDecision = {
    preventCaseCreation: detection.summary.high > 0 || detection.watchHits.length > 0,
    requireAdminApproval:
      detection.summary.high === 0 && detection.summary.medium > 0 && detection.watchHits.length === 0,
    notifyEthics:
      detection.summary.high > 0 || detection.watchHits.length > 0 || detection.summary.medium > 0,
    watchListHits: detection.watchHits.map((hit) => hit.partyName),
  };

  const { checkId, insertedConflicts } = await withDb(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO conflict_checks (
         client_name,
         opposing_parties,
         other_parties,
         case_type,
         description,
         requested_by
       ) VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id`,
      [clientName, opposingParties, otherParties, payload.caseType ?? null, payload.description ?? null, payload.requestedBy]
    );

    const id = inserted.rows[0].id;
    let rows: ConflictInsertRow[] = [];

    if (detection.drafts.length) {
      const columns = ["conflict_check_id", "case_id", "conflict_type", "severity", "party_name", "description"];
      const values: string[] = [];
      const params: any[] = [];

      detection.drafts.forEach((draft, index) => {
        const paramIndex = index * columns.length;
        values.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
        params.push(id, draft.caseId ?? null, draft.conflictType, draft.severity, draft.partyName, draft.description ?? null);
      });

      const insertedRows = await client.query<ConflictInsertRow>(
        `INSERT INTO conflicts_found (${columns.join(", ")}) VALUES ${values.join(",")}
         RETURNING id, conflict_check_id as "conflictCheckId", case_id as "caseId", conflict_type as "conflictType", severity, party_name as "partyName", description, created_at as "createdAt"`,
        params
      );
      rows = insertedRows.rows;
    }

    return { checkId: id, insertedConflicts: rows };
  });

  const conflicts: ConflictMatchRecord[] = detection.drafts.map((draft, index) => {
    const inserted = insertedConflicts[index];
    return {
      id: inserted?.id ?? randomUUID(),
      conflictCheckId: checkId,
      caseId: inserted?.caseId ?? draft.caseId ?? null,
      caseNumber: draft.caseNumber ?? null,
      caseTitle: draft.caseTitle ?? null,
      caseStatus: draft.caseStatus ?? null,
      lawyerName: draft.lawyerName ?? null,
      conflictType: inserted?.conflictType ?? draft.conflictType,
      severity: inserted?.severity ?? draft.severity,
      partyName: inserted?.partyName ?? draft.partyName,
      description: inserted?.description ?? draft.description ?? null,
      createdAt: inserted?.createdAt ?? new Date().toISOString(),
    };
  });

  return {
    checkId,
    summary: detection.summary,
    conflicts,
    decisions,
  };
};
