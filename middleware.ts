import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "./lib/auth";
import { DEFAULT_ROUTE_POLICIES } from "./lib/rbac/policies";
import { authorizeRequest } from "./lib/rbac/authorizer";
import { logAuthEvent } from "./lib/audit/logger";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const authContext = await getAuthContext(request);

  if (!authContext.user) {
    await logAuthEvent({
      type: "auth.authorization.denied",
      success: false,
      context: { resource: pathname },
      details: { reason: "unauthenticated" },
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  matcher: ["/api/:path*"],
};
