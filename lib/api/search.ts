import { query } from "@/lib/api/db";

export type SearchEntityType = "case" | "document" | "client" | "time_entry" | "user";

export interface GlobalSearchFilters {
  organizationId?: string;
  term: string;
  types?: SearchEntityType[];
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limitPerType?: number;
}

export interface SearchResultHit {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string | null;
  snippet?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  url: string;
  metadata?: Record<string, any> | null;
}

export interface GlobalSearchResponse {
  term: string;
  total: number;
  executionMs: number;
  groups: Record<SearchEntityType, SearchResultHit[]>;
}

const ENTITY_ORDER: SearchEntityType[] = ["case", "document", "client", "time_entry", "user"];

interface QueryContext {
  likeTerm: string | null;
  status?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  limit: number;
}

const normalizeTerm = (term: string): string | null => {
  const trimmed = (term ?? "").trim();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/[%_]+/g, "").slice(0, 200);
  return `%${sanitized}%`;
};

const normalizeDate = (value?: string | null): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export const performGlobalSearch = async (filters: GlobalSearchFilters): Promise<GlobalSearchResponse> => {
  const started = Date.now();
  const limit = Math.min(Math.max(filters.limitPerType ?? 5, 1), 25);
  const likeTerm = normalizeTerm(filters.term ?? "");
  const status = filters.status?.trim() || undefined;
  const dateFrom = normalizeDate(filters.dateFrom ?? null);
  const dateTo = normalizeDate(filters.dateTo ?? null);

  const baseGroups = ENTITY_ORDER.reduce<Record<SearchEntityType, SearchResultHit[]>>((acc, type) => {
    acc[type] = [];
    return acc;
  }, {} as Record<SearchEntityType, SearchResultHit[]>);

  if (!likeTerm) {
    return {
      term: filters.term ?? "",
      total: 0,
      executionMs: 0,
      groups: baseGroups,
    };
  }

  const context: QueryContext = { likeTerm, status, dateFrom, dateTo, limit };
  const requestedTypes = (filters.types?.length ? filters.types : ENTITY_ORDER).filter((type): type is SearchEntityType =>
    ENTITY_ORDER.includes(type)
  );

  const searchPromises = requestedTypes.map((type) => SEARCH_HANDLERS[type](context));
  const resolved = await Promise.all(searchPromises);

  resolved.forEach((hits, idx) => {
    baseGroups[requestedTypes[idx]] = hits;
  });

  const total = Object.values(baseGroups).reduce((sum, arr) => sum + arr.length, 0);

  return {
    term: filters.term,
    total,
    executionMs: Date.now() - started,
    groups: baseGroups,
  };
};

const SEARCH_HANDLERS: Record<SearchEntityType, (ctx: QueryContext) => Promise<SearchResultHit[]>> = {
  case: async (ctx) => {
    const result = await query<{
      id: string;
      title: string;
      matterNumber: string;
      clientName: string;
      description: string | null;
      status: string;
      updatedAt: string;
    }>(
      `SELECT
        m.id,
        m.title,
        m.matter_number as "matterNumber",
        c.legal_name as "clientName",
        LEFT(COALESCE(m.description, ''), 160) as description,
        m.status,
        m.updated_at as "updatedAt"
      FROM matters m
      INNER JOIN clients c ON c.id = m.client_id
      WHERE m.deleted_at IS NULL
        AND ($1::text IS NULL OR (
          m.title ILIKE $1
          OR m.matter_number ILIKE $1
          OR c.legal_name ILIKE $1
        ))
        AND ($2::text IS NULL OR m.status = $2)
        AND ($3::timestamptz IS NULL OR m.updated_at >= $3)
        AND ($4::timestamptz IS NULL OR m.updated_at <= $4)
      ORDER BY m.updated_at DESC
      LIMIT $5`,
      [ctx.likeTerm, ctx.status ?? null, ctx.dateFrom, ctx.dateTo, ctx.limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      type: "case" as const,
      title: row.title,
      subtitle: `${row.clientName} • ${row.matterNumber}`,
      snippet: row.description,
      status: row.status,
      updatedAt: row.updatedAt,
      url: `/cases/${row.id}`,
      metadata: {
        matterNumber: row.matterNumber,
        client: row.clientName,
      },
    }));
  },
  document: async (ctx) => {
    const result = await query<{
      id: string;
      title: string;
      documentType: string | null;
      status: string;
      snippet: string | null;
      updatedAt: string;
      matterTitle: string | null;
      clientName: string | null;
    }>(
      `SELECT
        d.id,
        d.title,
        d.document_type as "documentType",
        d.status,
        LEFT(COALESCE(d.notes, d.title), 160) as snippet,
        d.updated_at as "updatedAt",
        m.title as "matterTitle",
        c.legal_name as "clientName"
      FROM documents d
      LEFT JOIN matters m ON m.id = d.matter_id
      LEFT JOIN clients c ON c.id = d.client_id
      WHERE d.deleted_at IS NULL
        AND ($1::text IS NULL OR (
          d.title ILIKE $1
          OR COALESCE(d.document_type, '') ILIKE $1
          OR COALESCE(d.notes, '') ILIKE $1
        ))
        AND ($2::text IS NULL OR d.status = $2)
        AND ($3::timestamptz IS NULL OR d.updated_at >= $3)
        AND ($4::timestamptz IS NULL OR d.updated_at <= $4)
      ORDER BY d.updated_at DESC
      LIMIT $5`,
      [ctx.likeTerm, ctx.status ?? null, ctx.dateFrom, ctx.dateTo, ctx.limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      type: "document" as const,
      title: row.title,
      subtitle: row.matterTitle ?? row.clientName ?? "Standalone document",
      snippet: row.snippet,
      status: row.status,
      updatedAt: row.updatedAt,
      url: `/documents/${row.id}`,
      metadata: {
        documentType: row.documentType,
        matter: row.matterTitle,
        client: row.clientName,
      },
    }));
  },
  client: async (ctx) => {
    const result = await query<{
      id: string;
      legalName: string;
      displayName: string | null;
      status: string;
      updatedAt: string;
      reference: string | null;
    }>(
      `SELECT
        c.id,
        c.legal_name as "legalName",
        c.display_name as "displayName",
        c.status,
        c.updated_at as "updatedAt",
        c.firm_reference_code as reference
      FROM clients c
      WHERE c.deleted_at IS NULL
        AND ($1::text IS NULL OR (
          c.legal_name ILIKE $1
          OR COALESCE(c.display_name, '') ILIKE $1
          OR COALESCE(c.firm_reference_code, '') ILIKE $1
        ))
        AND ($2::text IS NULL OR c.status = $2)
        AND ($3::timestamptz IS NULL OR c.updated_at >= $3)
        AND ($4::timestamptz IS NULL OR c.updated_at <= $4)
      ORDER BY c.updated_at DESC
      LIMIT $5`,
      [ctx.likeTerm, ctx.status ?? null, ctx.dateFrom, ctx.dateTo, ctx.limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      type: "client" as const,
      title: row.legalName,
      subtitle: row.displayName ?? row.reference ?? undefined,
      snippet: row.displayName ? `Also known as ${row.displayName}` : undefined,
      status: row.status,
      updatedAt: row.updatedAt,
      url: `/clients/${row.id}`,
      metadata: {
        reference: row.reference,
      },
    }));
  },
  time_entry: async (ctx) => {
    const result = await query<{
      id: string;
      description: string;
      status: string;
      workDate: string;
      hours: string;
      amount: string;
      lawyer: string;
      matterTitle: string;
    }>(
      `SELECT
        t.id,
        t.description,
        t.status,
        t.work_date as "workDate",
        t.hours::text as hours,
        t.amount::text as amount,
        CONCAT(u.first_name, ' ', u.last_name) as lawyer,
        m.title as "matterTitle"
      FROM time_entries t
      INNER JOIN users u ON u.id = t.user_id
      INNER JOIN matters m ON m.id = t.matter_id
      WHERE t.deleted_at IS NULL
        AND ($1::text IS NULL OR (
          t.description ILIKE $1
          OR m.title ILIKE $1
          OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
        ))
        AND ($2::text IS NULL OR t.status = $2)
        AND ($3::timestamptz IS NULL OR t.updated_at >= $3)
        AND ($4::timestamptz IS NULL OR t.updated_at <= $4)
      ORDER BY t.updated_at DESC
      LIMIT $5`,
      [ctx.likeTerm, ctx.status ?? null, ctx.dateFrom, ctx.dateTo, ctx.limit]
    );

    return result.rows.map((row) => {
      const hours = Number(row.hours ?? 0);
      const amount = Number(row.amount ?? 0);
      const rate = hours > 0 ? amount / hours : 0;
      return {
        id: row.id,
        type: "time_entry" as const,
        title: row.description,
        subtitle: `${row.lawyer} • ${row.matterTitle}`,
        snippet: `${hours.toFixed(2)}h • £${amount.toFixed(2)}${rate ? ` (@ £${rate.toFixed(2)}/h)` : ""}`,
        status: row.status,
        updatedAt: row.workDate,
        url: `/billing/time-entries/${row.id}`,
        metadata: {
          hours,
          amount,
          lawyer: row.lawyer,
        },
      };
    });
  },
  user: async (ctx) => {
    const result = await query<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: string;
      updatedAt: string;
      userType: string;
    }>(
      `SELECT
        u.id,
        u.first_name as "firstName",
        u.last_name as "lastName",
        u.email,
        u.status,
        u.updated_at as "updatedAt",
        u.user_type as "userType"
      FROM users u
      WHERE u.deleted_at IS NULL
        AND ($1::text IS NULL OR (
          CONCAT(u.first_name, ' ', u.last_name) ILIKE $1
          OR u.email ILIKE $1
        ))
        AND ($2::text IS NULL OR u.status = $2)
        AND ($3::timestamptz IS NULL OR u.updated_at >= $3)
        AND ($4::timestamptz IS NULL OR u.updated_at <= $4)
      ORDER BY u.updated_at DESC
      LIMIT $5`,
      [ctx.likeTerm, ctx.status ?? null, ctx.dateFrom, ctx.dateTo, ctx.limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      type: "user" as const,
      title: `${row.firstName} ${row.lastName}`,
      subtitle: row.email,
      snippet: `Role: ${row.userType}`,
      status: row.status,
      updatedAt: row.updatedAt,
      url: `/teams/${row.id}`,
      metadata: {
        userType: row.userType,
      },
    }));
  },
};
