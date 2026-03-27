export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.token.issued"
  | "auth.token.revoked"
  | "auth.token.invalid"
  | "auth.authorization.denied"
  | "auth.authorization.granted";

export interface AuditActor {
  id: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditContext {
  requestId?: string;
  traceId?: string;
  resource?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  actor?: AuditActor;
  context?: AuditContext;
  success: boolean;
  details?: Record<string, unknown>;
}
