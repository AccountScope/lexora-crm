import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "./lib/auth";
import { DEFAULT_ROUTE_POLICIES } from "./lib/rbac/policies";
import { authorizeRequest } from "./lib/rbac/authorizer";
import { logAuthEvent } from "./lib/audit/logger";
import { getSecurityOverview } from "./lib/auth/two-factor";

const PUBLIC_PAGE_PREFIXES = ["/verify-email"];
const PUBLIC_API_PREFIXES = ["/api/auth/verify-email", "/api/auth/two-factor"];
const STATIC_PREFIXES = ["/_next", "/favicon", "/assets", "/manifest", "/robots"];
const TWO_FACTOR_ROUTE = "/login/two-factor";
const SECURITY_SETTINGS_ROUTE = "/settings/security";

const isPrefixed = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");
  const isStatic = STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublicApi = isApi && isPrefixed(pathname, PUBLIC_API_PREFIXES);
  const isPublicPage = !isApi && isPrefixed(pathname, PUBLIC_PAGE_PREFIXES);

  if (isStatic || isPublicApi || isPublicPage) {
    return NextResponse.next();
  }

  const authContext = await getAuthContext(request);

  if (!authContext.user) {
    if (isApi) {
      await logAuthEvent({
        type: "auth.authorization.denied",
        success: false,
        context: { resource: pathname },
        details: { reason: "unauthenticated" },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const overview = await getSecurityOverview({
    authUserId: authContext.user.id,
    role: authContext.user.role,
    cookieHeader: request.headers.get("cookie"),
  });

  if (!overview.email.verified && !pathname.startsWith("/verify-email")) {
    if (isApi) {
      return NextResponse.json({ error: "Email verification required" }, { status: 403 });
    }
    const verifyUrl = new URL("/verify-email", request.url);
    verifyUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(verifyUrl);
  }

  const twoFactor = overview.twoFactor;
  const isSecurityRoute = pathname.startsWith(SECURITY_SETTINGS_ROUTE);
  const isTwoFactorPage = pathname.startsWith(TWO_FACTOR_ROUTE);

  if (twoFactor.required) {
    if (!twoFactor.enabled && twoFactor.blocking && !isSecurityRoute) {
      if (isApi) {
        return NextResponse.json({ error: "Two-factor enrollment required" }, { status: 423 });
      }
      const enforceUrl = new URL(SECURITY_SETTINGS_ROUTE, request.url);
      enforceUrl.searchParams.set("enforce", "1");
      enforceUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(enforceUrl);
    }
    if (twoFactor.enabled && !twoFactor.verified && !isTwoFactorPage) {
      if (isApi) {
        return NextResponse.json({ error: "Two-factor verification required" }, { status: 423 });
      }
      const challengeUrl = new URL(TWO_FACTOR_ROUTE, request.url);
      challengeUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(challengeUrl);
    }
  }

  if (!isApi) {
    return NextResponse.next();
  }

  const decision = authorizeRequest({
    role: authContext.user.role,
    policies: DEFAULT_ROUTE_POLICIES,
    path: pathname,
    method: request.method,
  });

  if (!decision.allowed) {
    await logAuthEvent({
      type: "auth.authorization.denied",
      success: false,
      actor: authContext.user,
      context: { resource: pathname },
      details: { reason: decision.reason },
    });

    return NextResponse.json(
      { error: "Forbidden", reason: decision.reason },
      { status: 403 }
    );
  }

  await logAuthEvent({
    type: "auth.authorization.granted",
    success: true,
    actor: authContext.user,
    context: { resource: pathname },
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lexora-user-id", authContext.user.id);
  requestHeaders.set("x-lexora-user-role", authContext.user.role);

  if (authContext.user.email) {
    requestHeaders.set("x-lexora-user-email", authContext.user.email);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
