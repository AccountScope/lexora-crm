import type { Role } from "../rbac/roles";
import type { AuditActor } from "../audit/types";

export type AuthMode = "supabase" | "jwt";

export interface AuthUser extends AuditActor {
  role: Role;
  emailVerified?: boolean;
  issuedAt?: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthProvider {
  mode: AuthMode;
  getUserFromRequest(request: Request): Promise<AuthUser | null>;
  verifyToken(token: string): Promise<AuthUser | null>;
  issueTokens?(payload: Record<string, unknown>): Promise<AuthTokens>;
  revokeSession?(identity: { userId: string; token?: string }): Promise<void>;
}

export interface AuthContext {
  user: AuthUser | null;
  token?: string;
  mode: AuthMode;
}
