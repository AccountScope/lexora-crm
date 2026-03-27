import { authMode, requireConfig } from "./config";
import type { AuthContext, AuthMode, AuthProvider } from "./types";
import { supabaseProvider } from "./providers/supabase";
import { jwtProvider } from "./providers/jwt";

requireConfig();

const providers: Record<AuthMode, AuthProvider> = {
  supabase: supabaseProvider,
  jwt: jwtProvider,
};

export const authProvider = providers[authMode];

export const getAuthContext = async (request: Request): Promise<AuthContext> => {
  const user = await authProvider.getUserFromRequest(request);
  return { user, mode: authMode };
};

export const requireUser = async (request: Request) => {
  const context = await getAuthContext(request);
  if (!context.user) {
    throw new Error("Unauthorized");
  }
  return context.user;
};
