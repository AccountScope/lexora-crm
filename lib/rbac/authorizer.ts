import { hasPermission, roleSatisfies } from "./permissions";
import type { Permission } from "./permissions";
import type { Role } from "./roles";
import type { RoutePolicy } from "./policies";

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  policy?: RoutePolicy;
}

interface AuthorizeParams {
  role: Role;
  policies: RoutePolicy[];
  path: string;
  method?: string;
}

export const authorizeRequest = ({
  role,
  policies,
  path,
  method,
}: AuthorizeParams): AuthorizationResult => {
  const policy = policies.find((candidate) => candidate.matcher.test(path));

  if (!policy) {
    return { allowed: true };
  }

  if (policy.methods && method && !policy.methods.includes(method.toUpperCase())) {
    return {
      allowed: false,
      policy,
      reason: `HTTP method ${method} is not permitted by policy`,
    };
  }

  if (policy.requiresRole && !roleSatisfies(role, policy.requiresRole)) {
    return {
      allowed: false,
      policy,
      reason: `Role ${role} does not satisfy required role ${policy.requiresRole}`,
    };
  }

  if (policy.requiresPermissions?.length) {
    const missing = policy.requiresPermissions.filter(
      (permission: Permission) => !hasPermission(role, permission)
    );

    if (missing.length) {
      return {
        allowed: false,
        policy,
        reason: `Missing permissions: ${missing.join(", ")}`,
      };
    }
  }

  return { allowed: true, policy };
};
