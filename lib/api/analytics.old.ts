import { query } from "@/lib/api/db";

export interface DashboardKpis {
  totalActiveCases: number;
  unbilledAmount: number;
  openTasks: number;
  recentActivityCount: number;
}

export interface ChartSeries {
  labels: string[];
  values: number[];
  suffix?: string;
  prefix?: string;
}

export type ActivityType = "case" | "document" | "time_entry" | "invoice";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  summary: string;
  detail?: string | null;
  actor?: string | null;
  occurredAt: string;
  status?: string | null;
  metadata?: Record<string, any> | null;
}

export interface DashboardAnalyticsPayload {
  generatedAt: string;
  kpis: DashboardKpis;
  charts: {
    casesByStatus: ChartSeries;
    monthlyRevenue: ChartSeries;
    timeByLawyer: ChartSeries;
    caseTimeline: ChartSeries;
  };
  activity: ActivityItem[];
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

export const getDashboardAnalytics = async (organizationId: string): Promise<DashboardAnalyticsPayload> => {
  const [activeCases, unbilledAmount, openTasks, recentActivityCount, casesByStatus, monthlyRevenue, timeByLawyer, caseTimeline, activity] =
    await Promise.all([
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM matters WHERE deleted_at IS NULL AND status != 'CLOSED' AND organization_id = $1`,
        [organizationId]
      ),
      query<{ total: string | null }>(
        `SELECT COALESCE(SUM(amount), 0)::text as total FROM time_entries WHERE deleted_at IS NULL AND status = 'UNBILLED' AND organization_id = $1`,
        [organizationId]
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM documents WHERE deleted_at IS NULL AND document_type = 'TASK' AND status != 'ARCHIVED'`
      ),
      query<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM audit_logs WHERE occurred_at >= NOW() - INTERVAL '7 days'`
      ),
      query<{ status: string; count: number }>(
        `SELECT status, COUNT(*)::int as count FROM matters WHERE deleted_at IS NULL GROUP BY status ORDER BY status`
      ),
      query<{ label: string; value: string }>(
        `WITH months_series AS (
          SELECT generate_series(
            date_trunc('month', NOW()) - INTERVAL '5 months',
            date_trunc('month', NOW()),
            '1 month'
          ) AS bucket
        )
        SELECT to_char(ms.bucket, 'Mon YYYY') as label,
               COALESCE(SUM(i.total_amount), 0)::text as value
        FROM months_series ms
        LEFT JOIN invoices i ON date_trunc('month', i.issue_date) = ms.bucket AND i.deleted_at IS NULL AND i.status IN ('SENT','PARTIALLY_PAID','PAID')
        GROUP BY ms.bucket
        ORDER BY ms.bucket`
      ),
      query<{ lawyer: string; hours: string }>(
        `SELECT
          CONCAT(u.first_name, ' ', u.last_name) as lawyer,
          COALESCE(SUM(t.hours), 0)::text as hours
        FROM time_entries t
        INNER JOIN users u ON u.id = t.user_id
        WHERE t.deleted_at IS NULL AND t.work_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY lawyer
        ORDER BY SUM(t.hours) DESC
        LIMIT 8`
      ),
      query<{ label: string; value: number }>(
        `WITH months_series AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'
          ) AS bucket
        )
        SELECT to_char(ms.bucket, 'Mon') as label,
               COUNT(m.id)::int as value
        FROM months_series ms
        LEFT JOIN matters m ON date_trunc('month', m.opens_on) = ms.bucket AND m.deleted_at IS NULL
        GROUP BY ms.bucket
        ORDER BY ms.bucket`
      ),
      query<{
        id: string;
        type: ActivityType;
        summary: string;
        detail: string | null;
        actor: string | null;
        occurredAt: string;
        status: string | null;
        metadata: any;
      }>(
        `SELECT * FROM (
          SELECT
            m.id::text as id,
            'case'::text as type,
            m.title as summary,
            CONCAT('Status ', m.status) as detail,
            CONCAT(u.first_name, ' ', u.last_name) as actor,
            m.updated_at as "occurredAt",
            m.status,
            jsonb_build_object('matterNumber', m.matter_number, 'client', c.legal_name) as metadata
          FROM matters m
          INNER JOIN clients c ON c.id = m.client_id
          LEFT JOIN users u ON u.id = m.lead_attorney_id
          WHERE m.updated_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT
            d.id::text,
            'document'::text,
            d.title,
            COALESCE(d.document_type, 'Document') as detail,
            CONCAT(u.first_name, ' ', u.last_name) as actor,
            d.updated_at,
            d.status,
            jsonb_build_object('matterId', d.matter_id, 'clientId', d.client_id) as metadata
          FROM documents d
          LEFT JOIN users u ON u.id = d.created_by
          WHERE d.updated_at >= NOW() - INTERVAL '30 days' AND d.deleted_at IS NULL
          UNION ALL
          SELECT
            t.id::text,
            'time_entry'::text,
            t.description,
            CONCAT('Hours ', t.hours::text),
            CONCAT(u.first_name, ' ', u.last_name) as actor,
            t.updated_at,
            t.status,
            jsonb_build_object('matterId', t.matter_id, 'amount', t.amount) as metadata
          FROM time_entries t
          INNER JOIN users u ON u.id = t.user_id
          WHERE t.updated_at >= NOW() - INTERVAL '30 days' AND t.deleted_at IS NULL
          UNION ALL
          SELECT
            i.id::text,
            'invoice'::text,
            CONCAT('Invoice ', i.invoice_number),
            CONCAT('£', i.total_amount::text) as detail,
            CONCAT(u.first_name, ' ', u.last_name) as actor,
            i.updated_at,
            i.status,
            jsonb_build_object('clientId', i.client_id, 'matterId', i.matter_id) as metadata
          FROM invoices i
          LEFT JOIN users u ON u.id = i.issued_by
          WHERE i.updated_at >= NOW() - INTERVAL '30 days' AND i.deleted_at IS NULL
        ) AS feed
        ORDER BY "occurredAt" DESC
        LIMIT 30`
      ),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalActiveCases: activeCases.rows[0]?.count ?? 0,
      unbilledAmount: toNumber(unbilledAmount.rows[0]?.total),
      openTasks: openTasks.rows[0]?.count ?? 0,
      recentActivityCount: recentActivityCount.rows[0]?.count ?? 0,
    },
    charts: {
      casesByStatus: {
        labels: casesByStatus.rows.map((row) => row.status),
        values: casesByStatus.rows.map((row) => row.count),
      },
      monthlyRevenue: {
        labels: monthlyRevenue.rows.map((row) => row.label),
        values: monthlyRevenue.rows.map((row) => toNumber(row.value)),
        prefix: "£",
      },
      timeByLawyer: {
        labels: timeByLawyer.rows.map((row) => row.lawyer),
        values: timeByLawyer.rows.map((row) => Number(Number(row.hours ?? 0).toFixed(2))),
        suffix: "h",
      },
      caseTimeline: {
        labels: caseTimeline.rows.map((row) => row.label),
        values: caseTimeline.rows.map((row) => row.value),
      },
    },
    activity: activity.rows,
  };
};
