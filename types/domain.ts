export type MatterStatus = "OPEN" | "PENDING" | "ON_HOLD" | "CLOSED";
export type DocumentStatus = "DRAFT" | "FINAL" | "ARCHIVED";
export type DataClassification =
  | "INTERNAL_ONLY"
  | "FIRM_CONFIDENTIAL"
  | "CLIENT_VISIBLE"
  | "CLIENT_DOWNLOADABLE"
  | "RESTRICTED";

export type TimeEntryStatus = "UNBILLED" | "INVOICED" | "WRITEOFF" | "IN_PROGRESS" | "APPROVED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "VOID";

export interface ClientSummary {
  id: string;
  legalName: string;
  displayName?: string | null;
  status: string;
}

export interface CaseSummary {
  id: string;
  matterNumber: string;
  title: string;
  status: MatterStatus;
  practiceArea?: string | null;
  client: ClientSummary;
  leadAttorney?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  opensOn: string;
  closesOn?: string | null;
}

export interface CaseDetail extends CaseSummary {
  description?: string | null;
  team: CaseTeamMember[];
  notes: CaseNote[];
  timeline: CaseTimelineEvent[];
  documents: VaultDocument[];
}

export type CaseTeamMember = {
  userId: string;
  fullName: string;
  email?: string;
  role: string;
  isPrimary: boolean;
};

export interface CaseNote {
  id: string;
  matterId: string;
  authorId: string;
  authorName: string;
  visibility: DataClassification;
  note: string;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  matterId: string;
  occurredAt: string;
  label: string;
  description?: string;
  category: "document" | "note" | "assignment" | "billing" | "status" | "custody";
  actor?: string;
}

export interface VaultDocument {
  id: string;
  matterId?: string | null;
  clientId?: string | null;
  title: string;
  documentType?: string | null;
  status: DocumentStatus;
  tags?: string[];
  classification: DataClassification;
  latestVersion?: DocumentVersion;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  storageBucket: string;
  storagePath: string;
  fileSizeBytes: number;
  mimeType?: string | null;
  checksum?: string | null;
  uploadedBy: string;
  createdAt: string;
  notes?: string | null;
}

export interface CustodyEvent {
  id: string;
  documentVersionId: string;
  eventType: string;
  occurredAt: string;
  performedBy?: string | null;
  metadata?: Record<string, any> | null;
  hashVerification?: string | null;
}

export interface ClientPortalCase {
  id: string;
  clientId?: string;
  title: string;
  matterNumber: string;
  status: MatterStatus;
  lastUpdated: string;
  nextMilestone?: string;
  permittedDocuments: VaultDocument[];
  updates: CaseTimelineEvent[];
}

export interface TimeEntry {
  id: string;
  workDate: string;
  description: string;
  hours: number;
  hourlyRate: number;
  amount: number;
  status: TimeEntryStatus;
  billable: boolean;
  activityCode?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  notes?: string | null;
  templateId?: string | null;
  client: ClientSummary;
  matter: {
    id: string;
    title: string;
    matterNumber: string;
  };
  user: {
    id: string;
    name: string;
    email?: string;
  };
  invoiceId?: string | null;
}

export interface TimeEntryTemplate {
  id: string;
  label: string;
  description?: string | null;
  defaultHours: number;
  defaultRate: number;
  defaultBillable: boolean;
  defaultActivityCode?: string | null;
  clientId?: string | null;
  matterId?: string | null;
  ownerId: string;
}

export interface BillingRate {
  id: string;
  userId: string;
  clientId?: string | null;
  matterId?: string | null;
  hourlyRate: number;
  discountPercent?: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string | null;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  timeEntryId?: string | null;
  discountPercent?: number;
  discountAmount?: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paidOn: string;
  amount: number;
  method?: string | null;
  reference?: string | null;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  client: ClientSummary;
  matter?: {
    id: string;
    title: string;
    matterNumber: string;
  } | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  balanceDue: number;
  realizationRate?: number;
  payments: InvoicePayment[];
}

export interface BillingDashboardMetrics {
  outstandingTotal: number;
  unbilledTimeByClient: { clientId: string; clientName: string; matterId?: string | null; amount: number; hours: number }[];
  monthlyRevenue: { month: string; total: number }[];
  payments: InvoicePayment[];
  realizationRate: number;
  collectedAmount: number;
  billedAmount: number;
}

export type DeadlinePriority = "LOW" | "MEDIUM" | "HIGH";
export type DeadlineStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "MISSED";

export interface UserReference {
  id: string;
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
}

export interface DeadlineTemplate {
  id: string;
  label: string;
  jurisdiction?: string | null;
  description?: string | null;
  offsetDays: number;
  defaultPriority: DeadlinePriority;
  defaultStatus: DeadlineStatus;
  reminderOffsets: number[];
}

export interface DeadlineRecord {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string;
  startDate?: string | null;
  case?: Pick<CaseSummary, "id" | "title" | "matterNumber" | "status"> | null;
  assignee?: UserReference | null;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  reminderOffsets: number[];
  recurrenceRule?: string | null;
  recurrenceEndsOn?: string | null;
  recurrenceParentId?: string | null;
  ruleTemplateId?: string | null;
  offsetDays?: number | null;
  sourceDate?: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationChannel = "EMAIL" | "IN_APP" | "PUSH";
export type NotificationFrequency = "INSTANT" | "DAILY" | "WEEKLY";
export type NotificationType =
  | "DEADLINE_REMINDER"
  | "CASE_UPDATE"
  | "DOCUMENT_UPLOADED"
  | "INVOICE_SENT"
  | "NEW_CASE_ASSIGNMENT"
  | "CLIENT_PORTAL_MESSAGE";

export interface NotificationPreferences {
  userId: string;
  channels: NotificationChannel[];
  emailFrequency: NotificationFrequency;
  quietHours?: {
    start?: string | null;
    end?: string | null;
  };
  digestHour: number;
  toggles: Record<NotificationType, boolean>;
  updatedAt: string;
}

export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  url?: string | null;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, any> | null;
  relatedCaseId?: string | null;
  relatedDocumentId?: string | null;
  deadlineId?: string | null;
  priority?: DeadlinePriority;
}
