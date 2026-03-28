import type { ReportColumnType, ReportFilterOperator, ReportType } from "@/types";

export interface ReportFieldDefinition {
  key: string;
  label: string;
  type: ReportColumnType;
  select: string;
  description?: string;
  sortable?: boolean;
  filterOperators: ReportFilterOperator[];
}

export interface ReportGroupOption {
  key: string;
  label: string;
  expression: string;
  description?: string;
}

export interface ReportMetricDefinition {
  key: string;
  label: string;
  expression: string;
  type: ReportColumnType;
  prefix?: string;
  suffix?: string;
}

export interface ReportTypeDefinition {
  type: ReportType;
  label: string;
  description: string;
  table: string;
  alias: string;
  joins?: string[];
  baseWhere?: string;
  dateField?: string;
  defaultFields: string[];
  fields: Record<string, ReportFieldDefinition>;
  groupBy: ReportGroupOption[];
  metrics: ReportMetricDefinition[];
}

const textOps: ReportFilterOperator[] = ["contains", "equals", "in_list"];
const statusOps: ReportFilterOperator[] = ["equals", "in_list"];
const numericOps: ReportFilterOperator[] = ["equals", "greater_than", "less_than", "between", "in_list"];
const dateOps: ReportFilterOperator[] = ["equals", "greater_than", "less_than", "between"];

const casesDefinition: ReportTypeDefinition = {
  type: "cases",
  label: "Cases",
  description: "Case inventory, performance, and client trends",
  table: "matters m",
  alias: "m",
  joins: [
    "INNER JOIN clients c ON c.id = m.client_id",
    "LEFT JOIN users u ON u.id = m.lead_attorney_id",
  ],
  baseWhere: "m.deleted_at IS NULL",
  dateField: "m.opens_on",
  defaultFields: ["title", "client_name", "status", "opens_on", "lead_attorney"],
  fields: {
    id: { key: "id", label: "Matter ID", type: "string", select: "m.id::text", filterOperators: textOps },
    matter_number: { key: "matter_number", label: "Matter #", type: "string", select: "m.matter_number", sortable: true, filterOperators: textOps },
    title: { key: "title", label: "Title", type: "string", select: "m.title", sortable: true, filterOperators: textOps },
    status: { key: "status", label: "Status", type: "string", select: "m.status", filterOperators: statusOps },
    client_name: {
      key: "client_name",
      label: "Client",
      type: "string",
      select: "COALESCE(c.display_name, c.legal_name)",
      sortable: true,
      filterOperators: textOps,
    },
    lead_attorney: {
      key: "lead_attorney",
      label: "Lead Attorney",
      type: "string",
      select: "COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Unassigned')",
      sortable: true,
      filterOperators: textOps,
    },
    opens_on: { key: "opens_on", label: "Opened", type: "date", select: "m.opens_on", sortable: true, filterOperators: dateOps },
    closes_on: { key: "closes_on", label: "Closed", type: "date", select: "m.closes_on", sortable: true, filterOperators: dateOps },
    practice_area: { key: "practice_area", label: "Practice area", type: "string", select: "m.practice_area", filterOperators: textOps },
    age_days: {
      key: "age_days",
      label: "Age (days)",
      type: "number",
      select: "COALESCE(EXTRACT(DAY FROM (COALESCE(m.closes_on, CURRENT_DATE) - m.opens_on)), 0)",
      sortable: true,
      filterOperators: numericOps,
    },
  },
  groupBy: [
    { key: "status", label: "Status", expression: "m.status" },
    { key: "client_name", label: "Client", expression: "COALESCE(c.display_name, c.legal_name)" },
    { key: "lead_attorney", label: "Lead attorney", expression: "COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Unassigned')" },
    { key: "practice_area", label: "Practice area", expression: "COALESCE(m.practice_area, 'Unspecified')" },
  ],
  metrics: [
    { key: "total_cases", label: "Total cases", expression: "COUNT(*)::int", type: "number" },
    {
      key: "avg_age",
      label: "Avg age (days)",
      expression: "COALESCE(AVG(EXTRACT(DAY FROM (COALESCE(m.closes_on, CURRENT_DATE) - m.opens_on))),0)::numeric",
      type: "number",
    },
  ],
};

const timeDefinition: ReportTypeDefinition = {
  type: "time",
  label: "Time entries",
  description: "Utilisation, billable mix, and lawyer productivity",
  table: "time_entries t",
  alias: "t",
  joins: [
    "INNER JOIN matters m ON m.id = t.matter_id",
    "INNER JOIN clients c ON c.id = t.client_id",
    "INNER JOIN users u ON u.id = t.user_id",
  ],
  baseWhere: "t.deleted_at IS NULL",
  dateField: "t.work_date",
  defaultFields: ["work_date", "description", "matter_title", "client_name", "hours", "amount"],
  fields: {
    work_date: { key: "work_date", label: "Work date", type: "date", select: "t.work_date", sortable: true, filterOperators: dateOps },
    description: { key: "description", label: "Description", type: "string", select: "t.description", filterOperators: textOps },
    matter_title: { key: "matter_title", label: "Matter", type: "string", select: "m.title", filterOperators: textOps },
    client_name: {
      key: "client_name",
      label: "Client",
      type: "string",
      select: "COALESCE(c.display_name, c.legal_name)",
      filterOperators: textOps,
    },
    lawyer: { key: "lawyer", label: "Lawyer", type: "string", select: "CONCAT(u.first_name, ' ', u.last_name)", filterOperators: textOps },
    hours: { key: "hours", label: "Hours", type: "number", select: "t.hours", sortable: true, filterOperators: numericOps },
    amount: { key: "amount", label: "Amount", type: "currency", select: "t.amount", sortable: true, filterOperators: numericOps },
    status: { key: "status", label: "Status", type: "string", select: "t.status", filterOperators: statusOps },
    billable: { key: "billable", label: "Billable", type: "boolean", select: "t.billable", filterOperators: statusOps },
    activity_code: { key: "activity_code", label: "Activity code", type: "string", select: "t.activity_code", filterOperators: textOps },
  },
  groupBy: [
    { key: "lawyer", label: "Lawyer", expression: "CONCAT(u.first_name, ' ', u.last_name)" },
    { key: "client_name", label: "Client", expression: "COALESCE(c.display_name, c.legal_name)" },
    { key: "matter_title", label: "Matter", expression: "m.title" },
    { key: "status", label: "Status", expression: "t.status" },
    { key: "billable", label: "Billable", expression: "t.billable::text" },
  ],
  metrics: [
    { key: "total_hours", label: "Total hours", expression: "COALESCE(SUM(t.hours),0)::numeric", type: "number", suffix: "h" },
    { key: "total_amount", label: "Total amount", expression: "COALESCE(SUM(t.amount),0)::numeric", type: "currency", prefix: "£" },
  ],
};

const billingDefinition: ReportTypeDefinition = {
  type: "billing",
  label: "Billing",
  description: "Revenue, realization, and collections",
  table: "invoices i",
  alias: "i",
  joins: [
    "INNER JOIN clients c ON c.id = i.client_id",
    "LEFT JOIN matters m ON m.id = i.matter_id",
  ],
  baseWhere: "i.deleted_at IS NULL",
  dateField: "i.issue_date",
  defaultFields: ["invoice_number", "client_name", "status", "issue_date", "total_amount", "balance_due"],
  fields: {
    invoice_number: { key: "invoice_number", label: "Invoice #", type: "string", select: "i.invoice_number", sortable: true, filterOperators: textOps },
    client_name: { key: "client_name", label: "Client", type: "string", select: "COALESCE(c.display_name, c.legal_name)", filterOperators: textOps },
    matter_title: { key: "matter_title", label: "Matter", type: "string", select: "m.title", filterOperators: textOps },
    status: { key: "status", label: "Status", type: "string", select: "i.status", filterOperators: statusOps },
    issue_date: { key: "issue_date", label: "Issue date", type: "date", select: "i.issue_date", sortable: true, filterOperators: dateOps },
    due_date: { key: "due_date", label: "Due date", type: "date", select: "i.due_date", filterOperators: dateOps },
    total_amount: { key: "total_amount", label: "Total", type: "currency", select: "i.total_amount", sortable: true, filterOperators: numericOps },
    balance_due: { key: "balance_due", label: "Balance", type: "currency", select: "i.balance_due", filterOperators: numericOps },
    tax_amount: { key: "tax_amount", label: "Tax", type: "currency", select: "i.tax_amount", filterOperators: numericOps },
  },
  groupBy: [
    { key: "status", label: "Status", expression: "i.status" },
    { key: "client_name", label: "Client", expression: "COALESCE(c.display_name, c.legal_name)" },
    { key: "matter_title", label: "Matter", expression: "COALESCE(m.title, 'Unassigned')" },
  ],
  metrics: [
    { key: "total_revenue", label: "Revenue", expression: "COALESCE(SUM(i.total_amount),0)::numeric", type: "currency", prefix: "£" },
    { key: "outstanding", label: "Outstanding", expression: "COALESCE(SUM(i.balance_due),0)::numeric", type: "currency", prefix: "£" },
  ],
};

const documentsDefinition: ReportTypeDefinition = {
  type: "documents",
  label: "Documents",
  description: "Document production, types, and storage",
  table: "documents d",
  alias: "d",
  joins: [
    "LEFT JOIN matters m ON m.id = d.matter_id",
    "LEFT JOIN clients c ON c.id = d.client_id",
    "LEFT JOIN users u ON u.id = d.created_by",
    "LEFT JOIN document_versions dv ON dv.id = d.latest_version_id",
  ],
  baseWhere: "d.deleted_at IS NULL",
  dateField: "d.created_at",
  defaultFields: ["title", "document_type", "status", "client_name", "updated_at"],
  fields: {
    title: { key: "title", label: "Title", type: "string", select: "d.title", filterOperators: textOps },
    document_type: { key: "document_type", label: "Type", type: "string", select: "COALESCE(d.document_type, 'General')", filterOperators: textOps },
    status: { key: "status", label: "Status", type: "string", select: "d.status", filterOperators: statusOps },
    client_name: { key: "client_name", label: "Client", type: "string", select: "COALESCE(c.display_name, c.legal_name)", filterOperators: textOps },
    matter_title: { key: "matter_title", label: "Matter", type: "string", select: "m.title", filterOperators: textOps },
    classification: { key: "classification", label: "Classification", type: "string", select: "d.data_classification", filterOperators: statusOps },
    updated_at: { key: "updated_at", label: "Updated", type: "date", select: "d.updated_at", sortable: true, filterOperators: dateOps },
    owner: { key: "owner", label: "Owner", type: "string", select: "COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'System')", filterOperators: textOps },
    file_size: { key: "file_size", label: "File size (MB)", type: "number", select: "COALESCE(dv.file_size_bytes,0) / 1024 / 1024", filterOperators: numericOps },
  },
  groupBy: [
    { key: "document_type", label: "Type", expression: "COALESCE(d.document_type, 'General')" },
    { key: "status", label: "Status", expression: "d.status" },
    { key: "classification", label: "Classification", expression: "d.data_classification" },
    { key: "client_name", label: "Client", expression: "COALESCE(c.display_name, c.legal_name)" },
  ],
  metrics: [
    { key: "total_documents", label: "Documents", expression: "COUNT(*)::int", type: "number" },
    { key: "storage_mb", label: "Storage (MB)", expression: "COALESCE(SUM(dv.file_size_bytes) / 1024 / 1024, 0)", type: "number" },
  ],
};

const usersDefinition: ReportTypeDefinition = {
  type: "users",
  label: "User activity",
  description: "Logins, active sessions, and security signals",
  table: "login_attempts la",
  alias: "la",
  joins: [
    "LEFT JOIN users u ON lower(u.email) = lower(la.email)",
  ],
  dateField: "la.created_at",
  defaultFields: ["event_time", "email", "user_name", "success", "ip_address", "device"],
  fields: {
    event_time: { key: "event_time", label: "Timestamp", type: "date", select: "la.created_at", sortable: true, filterOperators: dateOps },
    email: { key: "email", label: "Email", type: "string", select: "la.email", filterOperators: textOps },
    user_name: { key: "user_name", label: "User", type: "string", select: "COALESCE(CONCAT(u.first_name, ' ', u.last_name), 'Unknown')", filterOperators: textOps },
    success: { key: "success", label: "Success", type: "boolean", select: "la.success", filterOperators: statusOps },
    ip_address: { key: "ip_address", label: "IP", type: "string", select: "la.ip_address::text", filterOperators: textOps },
    device: { key: "device", label: "Device", type: "string", select: "COALESCE(la.device, 'Unknown')", filterOperators: textOps },
    browser: { key: "browser", label: "Browser", type: "string", select: "COALESCE(la.browser, 'Unknown')", filterOperators: textOps },
    location: { key: "location", label: "Location", type: "string", select: "COALESCE(la.location, 'Unknown')", filterOperators: textOps },
    failure_reason: { key: "failure_reason", label: "Failure reason", type: "string", select: "la.failure_reason", filterOperators: textOps },
  },
  groupBy: [
    { key: "success", label: "Success", expression: "la.success::text" },
    { key: "location", label: "Location", expression: "COALESCE(la.location, 'Unknown')" },
    { key: "device", label: "Device", expression: "COALESCE(la.device, 'Unknown')" },
    { key: "browser", label: "Browser", expression: "COALESCE(la.browser, 'Unknown')" },
  ],
  metrics: [
    { key: "total_events", label: "Attempts", expression: "COUNT(*)::int", type: "number" },
    { key: "success_rate", label: "Success %", expression: "COALESCE(AVG(CASE WHEN la.success THEN 1 ELSE 0 END) * 100, 0)", type: "number", suffix: "%" },
  ],
};

export const REPORT_DEFINITIONS: Record<ReportType, ReportTypeDefinition> = {
  cases: casesDefinition,
  time: timeDefinition,
  billing: billingDefinition,
  documents: documentsDefinition,
  users: usersDefinition,
};

export const getReportDefinition = (type: ReportType): ReportTypeDefinition => {
  return REPORT_DEFINITIONS[type];
};

export const reportTypeOptions = Object.values(REPORT_DEFINITIONS).map((definition) => ({
  value: definition.type,
  label: definition.label,
  description: definition.description,
}));

export const dateRangePresets = [
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
];
