import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logAuthEvent } from "../../audit/logger";
import type { AuthProvider, AuthUser } from "../types";
import { supabaseConfig } from "../config";
import { isRole } from "../../rbac/roles";

const cookieNames = ["sb-access-token", "lexora-session"];

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    throw new Error("Supabase credentials are missing");
  }

  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
};

const parseCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return {} as Record<string, string>;
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, value] = pair.split("=");
    if (key && value) {
      acc[key.trim()] = decodeURIComponent(value.trim());
    }
    return acc;
  }, {});
};

const extractToken = async (request: Request): Promise<string | null> => {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) {
    return header.split("Bearer ")[1]?.trim() ?? null;
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  for (const name of cookieNames) {
    const value = cookies[name];
    if (value) return value;
  }

  return null;
};

const mapUser = (user: any): AuthUser => {
  const roleFromMetadata = user.app_metadata?.role ?? user.user_metadata?.role;
  return {
    id: user.id,
    email: user.email ?? undefined,
    role: isRole(roleFromMetadata) ? roleFromMetadata : "client",
    metadata: user.user_metadata,
    emailVerified: user.email_confirmed_at != null,
  };
};

export const supabaseProvider: AuthProvider = {
  mode: "supabase",
  async getUserFromRequest(request) {
    const token = await extractToken(request);
    if (!token) {
      await logAuthEvent({
        type: "auth.token.invalid",
        success: false,
        context: { resource: request.url },
        details: { reason: "missing token" },
      });
      return null;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      await logAuthEvent({
        type: "auth.token.invalid",
        success: false,
        context: { resource: request.url },
        details: { reason: error?.message ?? "user_not_found" },
      });
      return null;
    }

    const user = mapUser(data.user);

    await logAuthEvent({
      type: "auth.authorization.granted",
      success: true,
      actor: user,
      context: { resource: request.url },
    });

    return user;
  },
  async verifyToken(token: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      await logAuthEvent({
        type: "auth.token.invalid",
        success: false,
        details: { reason: error?.message ?? "user_not_found" },
      });
      return null;
    }
    return mapUser(data.user);
  },
  async revokeSession({ token }) {
    if (!token) return;
    const supabase = getSupabaseClient();
    await supabase.auth.admin.signOut(token);
    await logAuthEvent({
      type: "auth.token.revoked",
      success: true,
      details: { tokenPrefix: token.slice(0, 6) },
    });
  },
};
