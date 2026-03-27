export const ROLES = ["admin", "lawyer", "paralegal", "client"] as const;

export type Role = typeof ROLES[number];

export interface RoleDefinition {
  name: Role;
  description: string;
  inheritsFrom?: Role[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  admin: {
    name: "admin",
    description: "Full system access including tenant, billing, and configuration.",
  },
  lawyer: {
    name: "lawyer",
    description: "Manages assigned cases, documents, and billing actions.",
    inheritsFrom: ["paralegal", "client"],
  },
  paralegal: {
    name: "paralegal",
    description: "Assists on cases with limited financial and configuration access.",
    inheritsFrom: ["client"],
  },
  client: {
    name: "client",
    description: "View-only access to shared case materials and invoices.",
  },
};

export const ROLE_PRIORITY: Record<Role, number> = {
  admin: 4,
  lawyer: 3,
  paralegal: 2,
  client: 1,
};

export const isRole = (value: string | undefined | null): value is Role =>
  !!value && (ROLES as readonly string[]).includes(value);
