import type { AuthMode } from "./types";

const parseAuthMode = (): AuthMode => {
  const value = (process.env.LEXORA_AUTH_MODE ?? "supabase").toLowerCase();
  if (value !== "supabase" && value !== "jwt") {
    throw new Error(
      `Invalid LEXORA_AUTH_MODE value: ${value}. Expected "supabase" or "jwt".`
    );
  }
  return value;
};

export const authMode = parseAuthMode();

export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

export const jwtConfig = {
  secret: process.env.LEXORA_JWT_SECRET,
  issuer: process.env.LEXORA_JWT_ISSUER ?? "lexora",
  audience: process.env.LEXORA_JWT_AUDIENCE ?? "lexora-clients",
  expiresInSeconds: Number(process.env.LEXORA_JWT_EXPIRES_IN ?? 60 * 60),
};

export const requireConfig = () => {
  if (authMode === "supabase") {
    if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
      throw new Error(
        "Supabase mode requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set"
      );
    }
  }

  if (authMode === "jwt") {
    if (!jwtConfig.secret) {
      throw new Error("JWT mode requires LEXORA_JWT_SECRET to be set");
    }
  }
};
