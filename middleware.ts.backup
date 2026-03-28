import { NextRequest, NextResponse } from "next/server";

/**
 * Simplified Edge-Compatible Middleware
 * 
 * IMPORTANT: This file CANNOT import any code that uses:
 * - Node.js crypto module
 * - Database connections (pg, mysql, etc.)
 * - File system operations
 * 
 * Security is maintained because each API route independently calls:
 * - requireUser() for authentication
 * - Role checks for authorization
 * - 2FA/email verification checks
 * 
 * This middleware only:
 * 1. Allows static assets
 * 2. Allows public routes
 * 3. Checks for basic session cookie existence
 * 4. Redirects unauthenticated users to login
 */

// Public routes (no auth required)
const PUBLIC_ROUTES = new Set([
  "/login",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/accept-invitation",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/auth/two-factor",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/webhooks/stripe",
  "/api/health",
]);

// Static file prefixes
const STATIC_PREFIXES = ["/_next", "/favicon", "/assets", "/manifest", "/robots", "/sw.js"];

function isPublicRoute(pathname: string): boolean {
  // Exact match
  if (PUBLIC_ROUTES.has(pathname)) return true;
  
  // Prefix match for public routes with dynamic segments
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route + "/")) return true;
  }
  
  return false;
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Allow static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 3. Check for session cookie
  const sessionToken = request.cookies.get("lexora-session")?.value;
  
  if (!sessionToken) {
    const isApi = pathname.startsWith("/api");
    
    if (isApi) {
      // API requests without session → 401
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Page requests without session → redirect to login
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/login") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Session exists → allow request
  // Note: Detailed checks (user exists, role, 2FA, email verified) 
  // happen in each API route via requireUser()
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
