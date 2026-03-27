import { SignJWT, jwtVerify } from "jose";
import { logAuthEvent } from "../../audit/logger";
import type { AuthProvider, AuthTokens, AuthUser } from "../types";
import { jwtConfig } from "../config";
import { isRole } from "../../rbac/roles";

const encoder = new TextEncoder();

const secretKey = () => {
  if (!jwtConfig.secret) {
    throw new Error("LEXORA_JWT_SECRET is not configured");
  }
  return encoder.encode(jwtConfig.secret);
};

const extractToken = (request: Request): string | null => {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) {
    return header.split("Bearer ")[1]?.trim() ?? null;
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const tokenCookie = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith("lexora-jwt="));

  return tokenCookie?.split("=")[1] ?? null;
};

const mapClaims = (claims: Record<string, any>): AuthUser => {
  const role = isRole(claims.role) ? claims.role : "client";
  return {
    id: String(claims.sub ?? claims.userId),
    email: claims.email,
    role,
    metadata: claims.metadata,
    issuedAt: claims.iat,
    expiresAt: claims.exp,
  };
};

const issueToken = async (payload: Record<string, unknown>) => {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(jwtConfig.issuer)
    .setAudience(jwtConfig.audience)
    .setIssuedAt()
    .setExpirationTime(`${jwtConfig.expiresInSeconds}s`)
    .sign(secretKey());

  return jwt;
};

export const jwtProvider: AuthProvider = {
  mode: "jwt",
  async getUserFromRequest(request) {
    const token = extractToken(request);
    if (!token) {
      await logAuthEvent({
        type: "auth.token.invalid",
        success: false,
        context: { resource: request.url },
        details: { reason: "missing token" },
      });
      return null;
    }
    return this.verifyToken(token);
  },
  async verifyToken(token: string) {
    try {
      const result = await jwtVerify(token, secretKey(), {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });

      const user = mapClaims(result.payload as Record<string, any>);
      await logAuthEvent({
        type: "auth.authorization.granted",
        success: true,
        actor: user,
      });
      return user;
    } catch (error: any) {
      await logAuthEvent({
        type: "auth.token.invalid",
        success: false,
        details: { reason: error?.message ?? "jwt_invalid" },
      });
      return null;
    }
  },
  async issueTokens(payload: Record<string, unknown>): Promise<AuthTokens> {
    const token = await issueToken(payload);
    await logAuthEvent({
      type: "auth.token.issued",
      success: true,
      details: { subject: payload.sub },
    });
    return {
      accessToken: token,
      expiresAt: Math.floor(Date.now() / 1000) + jwtConfig.expiresInSeconds,
    };
  },
  async revokeSession({ userId }) {
    await logAuthEvent({
      type: "auth.token.revoked",
      success: true,
      details: { userId },
    });
  },
};
