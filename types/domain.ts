export type MatterStatus = "OPEN" | "PENDING" | "ON_HOLD" | "CLOSED";
export type DocumentStatus = "DRAFT" | "FINAL" | "ARCHIVED";
export type DataClassification =
  | "INTERNAL_ONLY"
  | "FIRM_CONFIDENTIAL"
  | "CLIENT_VISIBLE"
  | "CLIENT_DOWNLOADABLE"
  | "RESTRICTED";

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
