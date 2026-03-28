import { query } from "@/lib/api/db";
import type {
  DeadlineRecord,
  DeadlineTemplate,
  DeadlinePriority,
  DeadlineStatus,
} from "@/types";
import type { DeadlineInput, DeadlineTemplateInput, DeadlineUpdateInput } from "@/lib/api/validation";
import { ApiError, assertFound } from "@/lib/api/errors";
import { scheduleDeadlineReminderEmails } from "@/lib/email/send";
import { createNotification } from "@/lib/api/notifications";

const normalizeReminderOffsets = (offsets?: number[] | null): number[] => {
  if (!offsets?.length) {
    return [7, 3, 1];
  }
  const sanitized = Array.from(new Set(offsets.map((value) => Math.max(0, Math.floor(value))))).filter((v) => v >= 0);
  return sanitized.length ? sanitized.sort((a, b) => b - a) : [7, 3, 1];
};

const baseDeadlineSelect = `
  SELECT
    d.id,
    d.title,
    d.description,
    d.due_date as "dueDate",
    d.start_date as "startDate",
    d.priority,
    d.status,
    d.reminder_offsets as "reminderOffsets",
    d.recurrence_rule as "recurrenceRule",
    d.recurrence_ends_on as "recurrenceEndsOn",
    d.recurrence_parent_id as "recurrenceParentId",
    d.rule_template_id as "ruleTemplateId",
    d.offset_days as "offsetDays",
    d.source_date as "sourceDate",
    d.created_at as "createdAt",
    d.updated_at as "updatedAt",
    (d.due_date < NOW() AND d.status NOT IN ('COMPLETED','CANCELLED')) as "isOverdue",
    m.id as "caseId",
    m.title as "caseTitle",
    m.matter_number as "matterNumber",
    m.status as "caseStatus",
    u.id as "assigneeId",
    CONCAT(u.first_name, ' ', u.last_name) as "assigneeName",
    u.email as "assigneeEmail"
  FROM deadlines d
  LEFT JOIN matters m ON m.id = d.case_id
  LEFT JOIN users u ON u.id = d.assigned_to
`;

const buildWhereClauses = (filters: Record<string, any>) => {
  const clauses: string[] = ["d.deleted_at IS NULL"];
  const params: any[] = [];

  if (filters.caseId) {
    params.push(filters.caseId);
    clauses.push(`d.case_id = $${params.length}`);
  }
  if (filters.assignedTo) {
    params.push(filters.assignedTo);
    clauses.push(`d.assigned_to = $${params.length}`);
  }
  if (filters.statuses?.length) {
    params.push(filters.statuses);
    clauses.push(`d.status = ANY($${params.length})`);
  }
  if (filters.rangeStart) {
    params.push(filters.rangeStart);
    clauses.push(`d.due_date >= $${params.length}`);
  }
  if (filters.rangeEnd) {
    params.push(filters.rangeEnd);
    clauses.push(`d.due_date <= $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    clauses.push(`(d.title ILIKE $${params.length} OR m.title ILIKE $${params.length})`);
  }
  if (filters.overdueOnly) {
    clauses.push(`d.due_date < NOW()`);
    clauses.push(`d.status NOT IN ('COMPLETED', 'CANCELLED')`);
  }
  if (filters.upcomingOnly) {
    clauses.push(`d.due_date >= NOW()`);
  }
  return { clauses, params };
};

export const listDeadlines = async (filters: {
  caseId?: string;
  assignedTo?: string;
  statuses?: DeadlineStatus[];
  search?: string;
  rangeStart?: string;
  rangeEnd?: string;
  limit?: number;
  overdueOnly?: boolean;
  upcomingOnly?: boolean;
} = {}): Promise<DeadlineRecord[]> => {
  const { clauses, params } = buildWhereClauses(filters);
  const limit = filters.limit ?? 200;
  params.push(limit);
  const sql = `${baseDeadlineSelect} WHERE ${clauses.join(" AND ")} ORDER BY d.due_date ASC LIMIT $${params.length}`;
  const result = await query(sql, params);
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.dueDate,
    startDate: row.startDate,
    priority: row.priority,
    status: row.status,
    reminderOffsets: row.reminderOffsets ?? [],
    recurrenceRule: row.recurrenceRule,
    recurrenceEndsOn: row.recurrenceEndsOn,
    recurrenceParentId: row.recurrenceParentId,
    ruleTemplateId: row.ruleTemplateId,
    offsetDays: row.offsetDays,
    sourceDate: row.sourceDate,
    isOverdue: row.isOverdue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    case: row.caseId
      ? { id: row.caseId, title: row.caseTitle, matterNumber: row.matterNumber, status: row.caseStatus }
      : null,
    assignee: row.assigneeId
      ? { id: row.assigneeId, name: row.assigneeName, email: row.assigneeEmail }
      : null,
  }));
};

export const listUpcomingDeadlines = async (limit = 5) =>
  listDeadlines({ limit, upcomingOnly: true, statuses: ["PLANNED", "IN_PROGRESS"] });

export const listDeadlineTemplates = async (): Promise<DeadlineTemplate[]> => {
  const result = await query<DeadlineTemplate>(
    `SELECT
      id,
      label,
      jurisdiction,
      description,
      offset_days as "offsetDays",
      default_priority as "defaultPriority",
      default_status as "defaultStatus",
      reminder_offsets as "reminderOffsets"
    FROM court_deadline_templates
    ORDER BY label ASC`
  );
  return result.rows;
};

export const createDeadlineTemplate = async (input: DeadlineTemplateInput, userId: string): Promise<DeadlineTemplate> => {
  const insert = await query<DeadlineTemplate>(
    `INSERT INTO court_deadline_templates (
      label, jurisdiction, description, offset_days, default_priority, default_status, reminder_offsets, metadata, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, label, jurisdiction, description, offset_days as "offsetDays", default_priority as "defaultPriority", default_status as "defaultStatus", reminder_offsets as "reminderOffsets"`,
    [
      input.label,
      input.jurisdiction ?? null,
      input.description ?? null,
      input.offsetDays,
      input.defaultPriority,
      input.defaultStatus,
      normalizeReminderOffsets(input.reminderOffsets),
      null,
      userId,
    ]
  );
  return insert.rows[0];
};

const resolveAssigneeId = async (assignedTo?: string | null, assignedToEmail?: string | null) => {
  if (assignedTo) return assignedTo;
  if (!assignedToEmail) return null;
  const result = await query<{ id: string }>(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [assignedToEmail]);
  const user = result.rows[0];
  if (!user) {
    throw new ApiError(404, `No user found for ${assignedToEmail}`);
  }
  return user.id;
};

const computeDueDate = (input: DeadlineInput, template?: DeadlineTemplate | null) => {
  const source = input.sourceDate ? new Date(input.sourceDate) : null;
  if (template && source) {
    return new Date(source.getTime() + template.offsetDays * 24 * 60 * 60 * 1000);
  }
  if (source && typeof input.offsetDays === "number") {
    return new Date(source.getTime() + input.offsetDays * 24 * 60 * 60 * 1000);
  }
  if (input.dueDate) {
    return new Date(input.dueDate);
  }
  if (template && input.dueDate) {
    return new Date(input.dueDate);
  }
  throw new ApiError(400, "A due date or source date with offset is required");
};

const getDeadlineById = async (id: string): Promise<DeadlineRecord> => {
  const result = await query(`${baseDeadlineSelect} WHERE d.id = $1`, [id]);
  const row = result.rows[0];
  const record = assertFound(row, "Deadline not found");
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    dueDate: record.dueDate,
    startDate: record.startDate,
    priority: record.priority,
    status: record.status,
    reminderOffsets: record.reminderOffsets ?? [],
    recurrenceRule: record.recurrenceRule,
    recurrenceEndsOn: record.recurrenceEndsOn,
    recurrenceParentId: record.recurrenceParentId,
    ruleTemplateId: record.ruleTemplateId,
    offsetDays: record.offsetDays,
    sourceDate: record.sourceDate,
    isOverdue: record.isOverdue,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    case: record.caseId
      ? { id: record.caseId, title: record.caseTitle, matterNumber: record.matterNumber, status: record.caseStatus }
      : null,
    assignee: record.assigneeId
      ? { id: record.assigneeId, name: record.assigneeName, email: record.assigneeEmail }
      : null,
  };
};

export const createDeadline = async (input: DeadlineInput, userId: string): Promise<DeadlineRecord> => {
  const reminderOffsets = normalizeReminderOffsets(input.reminderOffsets);
  const template = input.ruleTemplateId
    ? assertFound(
        (await query(`SELECT id, offset_days as "offsetDays", default_priority as "defaultPriority", default_status as "defaultStatus", reminder_offsets as "reminderOffsets" FROM court_deadline_templates WHERE id = $1`, [input.ruleTemplateId])).rows[0],
        "Template not found"
      )
    : null;

  const dueDate = computeDueDate(input, template);
  const startDate = input.startDate ? new Date(input.startDate) : dueDate;
  const assignedTo = await resolveAssigneeId(input.assignedTo ?? null, input.assignedToEmail ?? null);
  const priority: DeadlinePriority = input.priority ?? template?.defaultPriority ?? "MEDIUM";
  const status: DeadlineStatus = input.status ?? template?.defaultStatus ?? "PLANNED";

  const insert = await query<{ id: string }>(
    `INSERT INTO deadlines (
      title,
      description,
      case_id,
      assigned_to,
      start_date,
      due_date,
      priority,
      status,
      reminder_offsets,
      recurrence_rule,
      recurrence_ends_on,
      rule_template_id,
      offset_days,
      source_date,
      computed_from_rule,
      created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING id`,
    [
      input.title,
      input.description ?? null,
      input.caseId ?? null,
      assignedTo,
      startDate?.toISOString() ?? null,
      dueDate.toISOString(),
      priority,
      status,
      reminderOffsets,
      input.recurrenceRule ?? null,
      input.recurrenceEndsOn ?? null,
      template?.id ?? null,
      input.offsetDays ?? template?.offsetDays ?? null,
      input.sourceDate ?? null,
      template ? true : Boolean(input.offsetDays),
      userId,
    ]
  );

  const created = await getDeadlineById(insert.rows[0].id);
  await scheduleDeadlineReminderEmails(created);
  if (created.assignee?.id) {
    const dueDateLabel = new Date(created.dueDate).toLocaleString();
    await createNotification({
      userId: created.assignee.id,
      type: "DEADLINE_REMINDER",
      title: created.title,
      message: `Due ${dueDateLabel}${created.case ? ' · ' + created.case.title : ''}`.trim(),
      url: created.case ? `/cases/${created.case.id}?tab=deadlines` : undefined,
      deadlineId: created.id,
      relatedCaseId: created.case?.id ?? null,
      priority: created.priority,
    });
  }
  return created;
};

export const updateDeadline = async (input: DeadlineUpdateInput): Promise<DeadlineRecord> => {
  const reminderOffsets = input.reminderOffsets ? normalizeReminderOffsets(input.reminderOffsets) : null;
  const updates: string[] = [];
  const params: any[] = [];

  if (input.status) {
    updates.push(`status = $${params.length + 1}`);
    params.push(input.status);
  }
  if (reminderOffsets) {
    updates.push(`reminder_offsets = $${params.length + 1}`);
    params.push(reminderOffsets);
  }
  if (!updates.length) {
    throw new ApiError(400, "No updates provided");
  }
  updates.push(`updated_at = NOW()`);
  params.push(input.deadlineId);

  await query(`UPDATE deadlines SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
  const updated = await getDeadlineById(input.deadlineId);

  if (reminderOffsets) {
    await scheduleDeadlineReminderEmails(updated, { rescheduleOnly: true });
  }

  if (input.status === "COMPLETED") {
    await query(`UPDATE deadlines SET completed_at = NOW() WHERE id = $1`, [input.deadlineId]);
  }
  if (input.status === "CANCELLED") {
    await query(`UPDATE deadlines SET canceled_at = NOW() WHERE id = $1`, [input.deadlineId]);
  }

  return updated;
};
