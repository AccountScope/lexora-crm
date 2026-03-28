export interface PermissionDefinition {
  key: string;
  label: string;
  description?: string;
}

export interface PermissionCategory {
  key: string;
  label: string;
  description?: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: "cases",
    label: "Cases",
    permissions: [
      { key: "cases.view", label: "View cases" },
      { key: "cases.create", label: "Create cases" },
      { key: "cases.edit", label: "Edit cases" },
      { key: "cases.delete", label: "Delete cases" },
      { key: "cases.assign", label: "Assign team members" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    permissions: [
      { key: "documents.view", label: "View documents" },
      { key: "documents.upload", label: "Upload documents" },
      { key: "documents.download", label: "Download documents" },
      { key: "documents.delete", label: "Delete documents" },
    ],
  },
  {
    key: "time",
    label: "Timekeeping",
    permissions: [
      { key: "time.view_own", label: "View own time entries" },
      { key: "time.view_all", label: "View all time entries" },
      { key: "time.create", label: "Create time entries" },
      { key: "time.edit", label: "Edit time entries" },
      { key: "time.delete", label: "Delete time entries" },
    ],
  },
  {
    key: "billing",
    label: "Billing",
    permissions: [
      { key: "billing.view", label: "View invoices" },
      { key: "billing.create_invoice", label: "Create invoices" },
      { key: "billing.edit_invoice", label: "Edit invoices" },
      { key: "billing.send_invoice", label: "Send invoices" },
    ],
  },
  {
    key: "admin",
    label: "Administration",
    permissions: [
      { key: "admin.manage_users", label: "Manage users" },
      { key: "admin.manage_roles", label: "Manage roles" },
      { key: "admin.view_audit_logs", label: "View audit logs" },
    ],
  },
  {
    key: "system",
    label: "System",
    permissions: [{ key: "system.all", label: "All permissions" }],
  },
];

export const PERMISSION_DEFINITIONS = PERMISSION_CATEGORIES.flatMap((category) =>
  category.permissions.map((permission) => ({ ...permission, category: category.key }))
);

export const PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((item) => item.key);
