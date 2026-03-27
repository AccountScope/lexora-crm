import { ROLE_DEFINITIONS, ROLE_PRIORITY, type Role } from "./roles";

export type Permission =
  | "cases.read"
  | "cases.manage"
  | "cases.assign"
  | "documents.read"
  | "documents.manage"
  | "billing.view"
  | "billing.manage"
  | "users.manage"
  | "portal.view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "cases.read",
    "cases.manage",
    "cases.assign",
    "documents.read",
    "documents.manage",
    "billing.view",
    "billing.manage",
    "users.manage",
    "portal.view",
  ],
  lawyer: [
    "cases.read",
    "cases.manage",
    "cases.assign",
    "documents.read",
    "documents.manage",
    "billing.view",
    "portal.view",
  ],
  paralegal: ["cases.read", "documents.read", "documents.manage", "portal.view"],
  client: ["cases.read", "documents.read", "billing.view", "portal.view"],
};

export const getPermissionsForRole = (role: Role): Permission[] => {
  const definition = ROLE_DEFINITIONS[role];
  const inherited = definition.inheritsFrom?.flatMap((inheritedRole) =>
    getPermissionsForRole(inheritedRole)
  );

  return Array.from(new Set([...(ROLE_PERMISSIONS[role] ?? []), ...(inherited ?? [])]));
};

export const roleSatisfies = (current: Role, required: Role) =>
  ROLE_PRIORITY[current] >= ROLE_PRIORITY[required];

export const hasPermission = (role: Role, permission: Permission) =>
  getPermissionsForRole(role).includes(permission);
