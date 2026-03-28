import { z } from "zod";

export const caseStatusEnum = z.enum(["OPEN", "PENDING", "ON_HOLD", "CLOSED"]);

export const createCaseSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(3),
  matterNumber: z.string().min(3),
  practiceArea: z.string().optional(),
  status: caseStatusEnum.default("OPEN"),
  description: z.string().optional(),
  opensOn: z.string().optional(),
  closesOn: z.string().optional().nullable(),
  leadAttorneyId: z.string().uuid().optional().nullable(),
});

export const updateCaseSchema = createCaseSchema.partial();

export const caseNoteSchema = z.object({
  matterId: z.string().uuid(),
  note: z.string().min(1),
  visibility: z
    .enum(["INTERNAL_ONLY", "FIRM_CONFIDENTIAL", "CLIENT_VISIBLE", "CLIENT_DOWNLOADABLE", "RESTRICTED"])
    .default("FIRM_CONFIDENTIAL"),
});

export const documentUploadSchema = z.object({
  matterId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  classification: z
    .enum(["INTERNAL_ONLY", "FIRM_CONFIDENTIAL", "CLIENT_VISIBLE", "CLIENT_DOWNLOADABLE", "RESTRICTED"])
    .default("FIRM_CONFIDENTIAL"),
  documentType: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const timeEntrySchema = z.object({
  clientId: z.string().uuid(),
  matterId: z.string().uuid(),
  workDate: z.string(),
  description: z.string().min(3),
  hours: z.coerce.number().positive(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  billable: z.boolean().default(true),
  activityCode: z.string().optional(),
  templateId: z.string().uuid().optional(),
  notes: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

export const bulkTimeEntrySchema = z.object({
  entries: z.array(timeEntrySchema).min(1),
  batchLabel: z.string().optional(),
});

export const timeEntryTemplateSchema = z.object({
  label: z.string().min(2),
  description: z.string().optional(),
  defaultHours: z.coerce.number().positive(),
  defaultRate: z.coerce.number().nonnegative(),
  defaultBillable: z.boolean().default(true),
  defaultActivityCode: z.string().optional(),
  clientId: z.string().uuid().optional().nullable(),
  matterId: z.string().uuid().optional().nullable(),
});

export const invoiceLineItemSchema = z.object({
  timeEntryId: z.string().uuid().optional(),
  description: z.string().min(3),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100).default(0).optional(),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().uuid(),
  matterId: z.string().uuid().optional().nullable(),
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  currencyCode: z.string().length(3).default("GBP"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  sendEmail: z.boolean().optional().default(false),
  emailRecipients: z.array(z.string().email()).optional(),
  lineItems: z.array(invoiceLineItemSchema).min(1),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CaseNoteInput = z.infer<typeof caseNoteSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type BulkTimeEntryInput = z.infer<typeof bulkTimeEntrySchema>;
export type TimeEntryTemplateInput = z.infer<typeof timeEntryTemplateSchema>;
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const deadlinePriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const deadlineStatusEnum = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "MISSED"]);

export const deadlineInputSchema = z.object({
  mode: z.enum(["deadline", "template"]).default("deadline"),
  title: z.string().min(3),
  description: z.string().optional(),
  caseId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  assignedToEmail: z.string().email().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  priority: deadlinePriorityEnum.default("MEDIUM"),
  status: deadlineStatusEnum.default("PLANNED"),
  reminderOffsets: z.array(z.number().int()).optional(),
  recurrenceRule: z.string().optional(),
  recurrenceEndsOn: z.string().optional(),
  ruleTemplateId: z.string().uuid().optional(),
  offsetDays: z.number().int().optional(),
  sourceDate: z.string().optional(),
});

export const deadlineTemplateSchema = z.object({
  label: z.string().min(3),
  jurisdiction: z.string().optional(),
  description: z.string().optional(),
  offsetDays: z.number().int().default(30),
  defaultPriority: deadlinePriorityEnum.default("MEDIUM"),
  defaultStatus: deadlineStatusEnum.default("PLANNED"),
  reminderOffsets: z.array(z.number().int()).default([7, 3, 1]),
});

export const deadlineUpdateSchema = z.object({
  deadlineId: z.string().uuid(),
  status: deadlineStatusEnum.optional(),
  reminderOffsets: z.array(z.number().int()).optional(),
});

export const notificationPreferenceSchema = z.object({
  emailFrequency: z.enum(["INSTANT", "DAILY", "WEEKLY"]).default("INSTANT"),
  channels: z.array(z.enum(["EMAIL", "IN_APP", "PUSH"])).min(1),
  quietHoursStart: z.string().optional().nullable(),
  quietHoursEnd: z.string().optional().nullable(),
  digestHour: z.number().int().min(0).max(23).default(7),
  toggles: z.record(
    z.enum([
      "DEADLINE_REMINDER",
      "CASE_UPDATE",
      "DOCUMENT_UPLOADED",
      "INVOICE_SENT",
      "NEW_CASE_ASSIGNMENT",
      "CLIENT_PORTAL_MESSAGE",
    ]),
    z.boolean()
  ),
});

export const notificationActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("mark-read"),
    notificationId: z.string().uuid(),
    read: z.boolean().default(true),
  }),
  z.object({
    action: z.literal("preferences"),
    payload: notificationPreferenceSchema,
  }),
]);

const commentAttachmentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(1),
  mimeType: z.string().optional().nullable(),
  sizeBytes: z.number().int().nonnegative().optional().nullable(),
});

export const commentCreateSchema = z.object({
  entityType: z.enum(["case", "document", "time_entry", "billing", "user"]),
  entityId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional().nullable(),
  attachments: z.array(commentAttachmentSchema).optional(),
});

export const commentUpdateSchema = z.object({
  commentId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export const commentActionSchema = z.object({
  action: z.enum(["like", "unlike"]),
  commentId: z.string().uuid(),
});

export type DeadlineInput = z.infer<typeof deadlineInputSchema>;
export type DeadlineTemplateInput = z.infer<typeof deadlineTemplateSchema>;
export type DeadlineUpdateInput = z.infer<typeof deadlineUpdateSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferenceSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;


export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(12),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(12),
});

export const sessionActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("revoke"), sessionId: z.string().uuid() }),
  z.object({ action: z.literal("revoke-others") }),
  z.object({ action: z.literal("extend"), rememberMe: z.boolean().optional() }),
  z.object({ action: z.literal("remember"), rememberMe: z.boolean() }),
]);

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SessionActionInput = z.infer<typeof sessionActionSchema>;

const reportTypeEnum = z.enum(["cases", "time", "billing", "documents", "users"]);

export const reportFilterSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(["equals", "contains", "greater_than", "less_than", "between", "in_list"]),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()])), z.null()]).optional(),
  valueTo: z.union([z.string(), z.number(), z.null()]).optional(),
});

export const reportDateRangeSchema = z.object({
  preset: z.enum(["last_7_days", "last_30_days", "last_90_days", "all_time", "custom"]).default("last_30_days"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

export const reportConfigSchema = z.object({
  type: reportTypeEnum,
  dateRange: reportDateRangeSchema.optional(),
  fields: z.array(z.string()).min(1),
  filters: z.array(reportFilterSchema).default([]),
  filterLogic: z.enum(["AND", "OR"]).default("AND").optional(),
  groupBy: z.string().optional().nullable(),
  sort: z
    .object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional()
    .nullable(),
  limit: z.number().int().min(1).max(1000).optional(),
  visualization: z
    .object({
      chart: z.enum(["bar", "line", "pie", "table"]).default("table"),
      metric: z.string().optional(),
      seriesField: z.string().optional(),
    })
    .optional(),
});

export const reportInputSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional().nullable(),
  type: reportTypeEnum,
  config: reportConfigSchema,
  isTemplate: z.boolean().optional().default(false),
});

export const reportScheduleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  timeOfDay: z.string().default("08:00:00"),
  recipients: z.array(z.string().email()).min(1),
  format: z.enum(["excel", "pdf", "csv"]).default("excel"),
  enabled: z.boolean().optional().default(true),
});

export type ReportConfigInput = z.infer<typeof reportConfigSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
export type ReportScheduleInput = z.infer<typeof reportScheduleSchema>;


export const conflictCheckSchema = z.object({
  clientName: z.string().min(2),
  opposingParties: z.array(z.string().min(2)).min(1),
  otherParties: z.array(z.string().min(2)).optional(),
  caseType: z.string().optional(),
  description: z.string().optional(),
});

export const conflictStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "waived", "rejected", "escalated"]).optional(),
  resolutionNotes: z.string().optional().nullable(),
});

export const conflictWaiverSchema = z.object({
  waiverText: z.string().min(20),
  caseId: z.string().uuid().optional().nullable(),
  signedDocumentId: z.string().uuid().optional().nullable(),
  signedBy: z.string().optional(),
  signedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const watchListEntrySchema = z.object({
  partyName: z.string().min(2),
  reason: z.string().optional(),
});

export type ConflictCheckInput = z.infer<typeof conflictCheckSchema>;
export type ConflictStatusInput = z.infer<typeof conflictStatusSchema>;
export type ConflictWaiverInput = z.infer<typeof conflictWaiverSchema>;
export type WatchListEntryInput = z.infer<typeof watchListEntrySchema>;
