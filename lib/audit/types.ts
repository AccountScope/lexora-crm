export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.password.reset.requested"
  | "auth.password.reset.completed"
  | "auth.password.changed"
  | "auth.password.breach_detected"
  | "auth.token.issued"
  | "auth.token.revoked"
  | "auth.token.invalid"
  | "auth.authorization.denied"
  | "auth.authorization.granted"
  | "auth.session.created"
  | "auth.session.revoked"
  | "auth.session.invalidated"
  | "auth.session.extended";

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
