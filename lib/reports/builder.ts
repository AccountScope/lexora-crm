import { query, withDb } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { getReportDefinition, reportTypeOptions } from "@/lib/reports/definitions";
import { PREBUILT_REPORTS, getPrebuiltReport } from "@/lib/reports/prebuilt";
import {
  reportConfigSchema,
  reportInputSchema,
  reportScheduleSchema,
  type ReportConfigInput,
  type ReportInput,
  type ReportScheduleInput,
} from "@/lib/api/validation";
import type {
  ReportConfig,
  ReportDetailPayload,
  ReportGroupedRow,
  ReportListItem,
  ReportResultPayload,
  ReportSchedule,
  SavedReportRecord,
} from "@/types";

const MAX_PREVIEW_ROWS = 200;

const formatDate = (value: Date) => value.toISOString().slice(0, 10);

const resolveDateRange = (range?: ReportConfig["dateRange"]) => {
  if (!range) return { startDate: undefined, endDate: undefined };
  if (range.preset === "custom") {
    return { startDate: range.startDate ?? undefined, endDate: range.endDate ?? undefined };
  }
  const today = new Date();
  const end = range.preset === "all_time" ? undefined : formatDate(today);
  let start: string | undefined;
  switch (range.preset) {
    case "last_7_days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      start = formatDate(d);
      break;
    }
    case "last_30_days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      start = formatDate(d);
      break;
    }
    case "last_90_days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 89);
      start = formatDate(d);
      break;
    }
    default:
      start = undefined;
  }
  return { startDate: start, endDate: end };
};

const normalizeFilterValue = (fieldType: string, raw: any) => {
  if (raw === null || raw === undefined || raw === "") return null;
  if (["number", "currency", "duration"].includes(fieldType)) {
    const num = Number(raw);
    if (Number.isNaN(num)) return null;
    return num;
  }
  if (fieldType === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    const value = String(raw).toLowerCase();
    return value === "true" || value === "1" || value === "yes";
  }
  return raw;
};

const normalizeOutputValue = (fieldType: string, value: any) => {
  if (value === null || value === undefined) return null;
  if (["number", "currency", "duration"].includes(fieldType)) {
    return Number(value);
  }
  if (fieldType === "boolean") {
    return Boolean(value);
  }
  return value;
};

interface WhereBuilder {
  clauses: string[];
  params: any[];
  push: (value: any) => string;
}

const createWhereBuilder = () => {
  const builder: WhereBuilder = {
    clauses: [],
    params: [],
    push(value: any) {
      builder.params.push(value);
      return `$${builder.params.length}`;
    },
  };
  return builder;
};

const buildFilters = (
  builder: WhereBuilder,
  config: ReportConfig,
  definitionFields: ReturnType<typeof getReportDefinition>["fields"]
) => {
  const logic = config.filterLogic === "OR" ? "OR" : "AND";
  const localClauses: string[] = [];
  config.filters?.forEach((filter) => {
    const field = definitionFields[filter.field];
    if (!field) {
      throw new ApiError(400, `Field ${filter.field} is not available for filtering`);
    }
    if (!field.filterOperators.includes(filter.operator)) {
      throw new ApiError(400, `Operator ${filter.operator} is not supported for ${field.label}`);
    }
    const column = field.select;
    switch (filter.operator) {
      case "equals":
        localClauses.push(`${column} = ${builder.push(normalizeFilterValue(field.type, filter.value))}`);
        break;
      case "contains":
        localClauses.push(`${column} ILIKE '%' || ${builder.push(filter.value ?? "")} || '%'`);
        break;
      case "greater_than":
        localClauses.push(`${column} > ${builder.push(normalizeFilterValue(field.type, filter.value))}`);
        break;
      case "less_than":
        localClauses.push(`${column} < ${builder.push(normalizeFilterValue(field.type, filter.value))}`);
        break;
      case "between": {
        localClauses.push(
          `${column} BETWEEN ${builder.push(normalizeFilterValue(field.type, filter.value))} AND ${builder.push(
            normalizeFilterValue(field.type, filter.valueTo)
          )}`
        );
        break;
      }
      case "in_list": {
        const values = Array.isArray(filter.value)
          ? filter.value
          : String(filter.value ?? "")
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean);
        if (!values.length) return;
        const placeholders = values.map((val) => builder.push(normalizeFilterValue(field.type, val))).join(", ");
        localClauses.push(`${column} IN (${placeholders})`);
        break;
      }
      default:
        break;
    }
  });
  if (localClauses.length) {
    builder.clauses.push(`(${localClauses.join(` ${logic} `)})`);
  }
};


const buildBaseQuery = (definition: ReturnType<typeof getReportDefinition>, config: ReportConfig) => {
  const builder = createWhereBuilder();
  if (definition.baseWhere) {
    builder.clauses.push(definition.baseWhere);
  }
  if (definition.dateField) {
    const { startDate, endDate } = resolveDateRange(config.dateRange);
    if (startDate) {
      builder.clauses.push(`${definition.dateField} >= ${builder.push(startDate)}`);
    }
    if (endDate) {
      builder.clauses.push(`${definition.dateField} <= ${builder.push(endDate)}`);
    }
  }
  buildFilters(builder, config, definition.fields);
  const whereClause = builder.clauses.length ? `WHERE ${builder.clauses.join(" AND ")}` : "";
  const joins = definition.joins?.length ? ` ${definition.joins.join(" ")}` : "";
  return { whereClause, joins, params: builder.params };
};

const buildRows = (records: any[], fields: string[], definitionFields: ReturnType<typeof getReportDefinition>["fields"]) => {
  return records.map((record) => {
    const entry: Record<string, any> = {};
    fields.forEach((key) => {
      const field = definitionFields[key];
      if (!field) return;
      entry[key] = normalizeOutputValue(field.type, record[key]);
    });
    return entry;
  });
};

const buildGroupedResults = async (
  definition: ReturnType<typeof getReportDefinition>,
  config: ReportConfig,
  baseQuery: { whereClause: string; joins: string; params: any[] }
) => {
  if (!config.groupBy) return null;
  const groupOption = definition.groupBy.find((option) => option.key === config.groupBy);
  if (!groupOption) return null;
  const primaryMetric = definition.metrics[0];
  if (!primaryMetric) return null;
  const secondaryMetric = definition.metrics[1];
  const selectParts = [
    `${groupOption.expression} as group_label`,
    `${primaryMetric.expression} as primary_value`,
  ];
  if (secondaryMetric) {
    selectParts.push(`${secondaryMetric.expression} as secondary_value`);
  }
  const sql = `SELECT ${selectParts.join(", ")}
    FROM ${definition.table} ${definition.alias}${baseQuery.joins}
    ${baseQuery.whereClause}
    GROUP BY ${groupOption.expression}
    ORDER BY primary_value DESC
    LIMIT 30`;
  const grouped = await query<{ group_label: string | null; primary_value: number; secondary_value?: number }>(sql, baseQuery.params);
  const rows: ReportGroupedRow[] = grouped.rows.map((row) => ({
    label: row.group_label ?? "(Blank)",
    value: Number(row.primary_value ?? 0),
    secondary: row.secondary_value !== undefined ? Number(row.secondary_value ?? 0) : undefined,
  }));
  return { field: groupOption.key, rows };
};

const buildKpis = async (
  definition: ReturnType<typeof getReportDefinition>,
  baseQuery: { whereClause: string; joins: string; params: any[] }
) => {
  if (!definition.metrics.length) return [];
  const selectParts = definition.metrics.map((metric, index) => `${metric.expression} as metric_${index}`);
  const sql = `SELECT ${selectParts.join(", ")}
    FROM ${definition.table} ${definition.alias}${baseQuery.joins}
    ${baseQuery.whereClause}`;
  const metricRow = await query(sql, baseQuery.params);
  const row = metricRow.rows[0] ?? {};
  return definition.metrics.map((metric, index) => {
    const raw = row[`metric_${index}`];
    const value = normalizeOutputValue(metric.type, raw) ?? 0;
    const formattedValue = metric.prefix
      ? `${metric.prefix}${Number(value).toLocaleString()}`
      : metric.suffix
      ? `${Number(value).toLocaleString()}${metric.suffix}`
      : Number(value).toLocaleString();
    return {
      label: metric.label,
      value: formattedValue,
    };
  });
};

export const runReport = async (input: ReportConfig, options?: { limit?: number }): Promise<ReportResultPayload> => {
  const config = reportConfigSchema.parse(input) as ReportConfigInput;
  const definition = getReportDefinition(config.type);
  const selectedFields = (config.fields?.length ? config.fields : definition.defaultFields).filter((key) => definition.fields[key]);
  if (!selectedFields.length) {
    throw new ApiError(400, "Select at least one field");
  }
  const baseQuery = buildBaseQuery(definition, config);
  const selectColumns = selectedFields.map((key) => `${definition.fields[key].select} AS "${key}"`);
  selectColumns.push("COUNT(*) OVER() AS __total_count");
  const sortField = config.sort?.field && definition.fields[config.sort.field] ? definition.fields[config.sort.field] : undefined;
  const orderClause = sortField ? `ORDER BY ${sortField.select} ${config.sort?.direction?.toUpperCase() === "ASC" ? "ASC" : "DESC"}` : "";
  const limit = Math.min(options?.limit ?? config.limit ?? 50, MAX_PREVIEW_ROWS);
  const sql = `SELECT ${selectColumns.join(", ")}
    FROM ${definition.table} ${definition.alias}${baseQuery.joins}
    ${baseQuery.whereClause}
    ${orderClause}
    LIMIT ${limit}`;
  const result = await query(sql, baseQuery.params);
  const totalRows = result.rows[0]?.__total_count ? Number(result.rows[0].__total_count) : result.rows.length;
  const rows = buildRows(
    result.rows.map((row) => {
      const clone = { ...row };
      delete clone.__total_count;
      return clone;
    }),
    selectedFields,
    definition.fields
  );
  const grouped = await buildGroupedResults(definition, config, baseQuery);
  const kpis = await buildKpis(definition, baseQuery);
  const chartMetricKey = config.visualization?.metric ?? definition.metrics[0]?.key;
  const metricDefinition = definition.metrics.find((metric) => metric.key === chartMetricKey) ?? definition.metrics[0];
  const chart = grouped && metricDefinition
    ? {
        type: config.visualization?.chart === "pie" ? "pie" : config.visualization?.chart === "line" ? "line" : "bar",
        labels: grouped.rows.map((row) => row.label),
        datasets: [
          {
            label: metricDefinition.label,
            data: grouped.rows.map((row) => row.value),
          },
        ],
        prefix: metricDefinition.prefix,
        suffix: metricDefinition.suffix,
      }
    : undefined;
  return {
    columns: selectedFields.map((key) => ({
      key,
      label: definition.fields[key].label,
      type: definition.fields[key].type,
    })),
    rows,
    totalRows,
    grouped,
    chart,
    kpis,
    generatedAt: new Date().toISOString(),
  };
};

const parseReportRecord = (record: any): SavedReportRecord => ({
  id: record.id,
  name: record.name,
  description: record.description,
  type: record.type,
  config: reportConfigSchema.parse(record.config) as ReportConfig,
  isTemplate: record.is_template,
  createdBy: record.created_by,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const listReportsForUser = async (userId: string): Promise<ReportListItem[]> => {
  const result = await query<ReportListItem & { config: any; schedule_count: number; last_run_at: string | null }>(
    `SELECT
      r.id,
      r.name,
      r.description,
      r.type,
      r.config,
      r.is_template,
      r.created_by,
      r.created_at,
      r.updated_at,
      COALESCE(stats.schedule_count, 0) as schedule_count,
      stats.last_run_at
    FROM reports r
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int as schedule_count, MAX(rs.last_run_at) as last_run_at
      FROM report_schedules rs
      WHERE rs.report_id = r.id
    ) stats ON true
    WHERE r.created_by = $1 AND r.is_template = false
    ORDER BY r.updated_at DESC`,
    [userId]
  );
  return result.rows.map((row) => ({
    ...parseReportRecord(row),
    scheduleCount: row.schedule_count ?? 0,
    nextRunAt: null,
    lastRunAt: row.last_run_at,
  }));
};

export const getReportDetail = async (reportId: string, userId?: string): Promise<ReportDetailPayload> => {
  const prebuilt = getPrebuiltReport(reportId);
  if (prebuilt) {
    return {
      id: `prebuilt-${prebuilt.id}`,
      name: prebuilt.name,
      description: prebuilt.description,
      type: prebuilt.type,
      config: prebuilt.config,
      isTemplate: true,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schedules: [],
    };
  }
  const record = await query(
    `SELECT * FROM reports WHERE id = $1`,
    [reportId]
  );
  if (!record.rowCount) {
    throw new ApiError(404, "Report not found");
  }
  const data = record.rows[0];
  if (userId && data.created_by !== userId) {
    throw new ApiError(403, "You do not have access to this report");
  }
  const schedules = await query<ReportSchedule>(
    `SELECT id, report_id as "reportId", frequency, day_of_week as "dayOfWeek", day_of_month as "dayOfMonth",
      time_of_day as "timeOfDay", recipients, format, enabled, last_run_at as "lastRunAt", created_at as "createdAt"
    FROM report_schedules
    WHERE report_id = $1
    ORDER BY created_at DESC`,
    [reportId]
  );
  return {
    ...parseReportRecord(data),
    schedules: schedules.rows,
  };
};

export const createReport = async (input: ReportInput, userId: string): Promise<SavedReportRecord> => {
  const payload = reportInputSchema.parse(input);
  const result = await query(
    `INSERT INTO reports (name, description, type, config, is_template, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [payload.name, payload.description ?? null, payload.type, payload.config, payload.isTemplate ?? false, userId]
  );
  return parseReportRecord(result.rows[0]);
};

export const updateReport = async (
  reportId: string,
  input: Partial<ReportInput>,
  userId: string
): Promise<SavedReportRecord> => {
  const existing = await getReportDetail(reportId, userId);
  const nextConfig = input.config ? reportConfigSchema.parse(input.config) : existing.config;
  const name = input.name ?? existing.name;
  const description = input.description ?? existing.description;
  await query(
    `UPDATE reports
     SET name = $1, description = $2, config = $3, updated_at = NOW()
     WHERE id = $4 AND created_by = $5`,
    [name, description ?? null, nextConfig, reportId, userId]
  );
  return getReportDetail(reportId, userId);
};

export const deleteReport = async (reportId: string, userId: string) => {
  await query(`DELETE FROM reports WHERE id = $1 AND created_by = $2`, [reportId, userId]);
};

export const createSchedule = async (
  reportId: string,
  input: ReportScheduleInput,
  userId: string
): Promise<ReportSchedule> => {
  await getReportDetail(reportId, userId);
  const payload = reportScheduleSchema.parse(input);
  const result = await query<ReportSchedule>(
    `INSERT INTO report_schedules (
      report_id, frequency, day_of_week, day_of_month, time_of_day, recipients, format, enabled
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, report_id as "reportId", frequency, day_of_week as "dayOfWeek", day_of_month as "dayOfMonth",
      time_of_day as "timeOfDay", recipients, format, enabled, last_run_at as "lastRunAt", created_at as "createdAt"`,
    [
      reportId,
      payload.frequency,
      payload.dayOfWeek ?? null,
      payload.dayOfMonth ?? null,
      payload.timeOfDay ?? "08:00:00",
      payload.recipients,
      payload.format,
      payload.enabled ?? true,
    ]
  );
  return result.rows[0];
};

export const updateSchedule = async (
  scheduleId: string,
  input: ReportScheduleInput,
  userId: string
): Promise<ReportSchedule> => {
  const payload = reportScheduleSchema.parse(input);
  const existing = await query<{ report_id: string }>(`SELECT report_id FROM report_schedules WHERE id = $1`, [scheduleId]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Schedule not found");
  }
  await getReportDetail(existing.rows[0].report_id, userId);
  const result = await query<ReportSchedule>(
    `UPDATE report_schedules
     SET frequency = $1,
         day_of_week = $2,
         day_of_month = $3,
         time_of_day = $4,
         recipients = $5,
         format = $6,
         enabled = $7
     WHERE id = $8
     RETURNING id, report_id as "reportId", frequency, day_of_week as "dayOfWeek", day_of_month as "dayOfMonth",
       time_of_day as "timeOfDay", recipients, format, enabled, last_run_at as "lastRunAt", created_at as "createdAt"`,
    [
      payload.frequency,
      payload.dayOfWeek ?? null,
      payload.dayOfMonth ?? null,
      payload.timeOfDay ?? "08:00:00",
      payload.recipients,
      payload.format,
      payload.enabled ?? true,
      scheduleId,
    ]
  );
  return result.rows[0];
};

export const toggleSchedule = async (scheduleId: string, enabled: boolean, userId: string) => {
  const existing = await query<{ report_id: string }>(`SELECT report_id FROM report_schedules WHERE id = $1`, [scheduleId]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Schedule not found");
  }
  await getReportDetail(existing.rows[0].report_id, userId);
  await query(`UPDATE report_schedules SET enabled = $1 WHERE id = $2`, [enabled, scheduleId]);
};

export const deleteSchedule = async (scheduleId: string, userId: string) => {
  const existing = await query<{ report_id: string }>(`SELECT report_id FROM report_schedules WHERE id = $1`, [scheduleId]);
  if (!existing.rowCount) {
    throw new ApiError(404, "Schedule not found");
  }
  await getReportDetail(existing.rows[0].report_id, userId);
  await query(`DELETE FROM report_schedules WHERE id = $1`, [scheduleId]);
};

export const listPrebuiltReports = () => PREBUILT_REPORTS;
export const reportTypeChoices = reportTypeOptions;
