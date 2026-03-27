import type { Permission } from "./permissions";
import type { Role } from "./roles";

export interface RoutePolicy {
  matcher: RegExp;
  methods?: string[];
  requiresRole?: Role;
  requiresPermissions?: Permission[];
  description?: string;
}

export const DEFAULT_ROUTE_POLICIES: RoutePolicy[] = [
  {
    matcher: /^\/api\/admin\b/,
    requiresRole: "admin",
    description: "Administrative endpoints require full administrative rights.",
  },
  {
    matcher: /^\/api\/cases\/?.*/,
    requiresRole: "paralegal",
    description: "Case management endpoints require at least paralegal level access.",
  },
  {
    matcher: /^\/api\/billing\/?.*/,
    requiresRole: "lawyer",
    description: "Billing actions require lawyer (or above) role.",
  },
  {
    matcher: /^\/api\/portal\/?.*/,
    requiresRole: "client",
    description: "Client portal requires authenticated portal access.",
  },
];
