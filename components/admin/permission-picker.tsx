"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { PERMISSION_CATEGORIES } from "@/lib/admin/permission-matrix";

interface PermissionPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  className?: string;
}

export const PermissionPicker = ({ value, onChange, disabled, className }: PermissionPickerProps) => {
  const toggle = (key: string) => {
    if (disabled) return;
    const next = value.includes(key) ? value.filter((item) => item !== key) : [...value, key];
    onChange(next);
  };

  const toggleCategory = (keys: string[]) => {
    if (disabled) return;
    const hasAll = keys.every((permission) => value.includes(permission));
    const filtered = value.filter((permission) => !keys.includes(permission));
    onChange(hasAll ? filtered : [...filtered, ...keys]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {PERMISSION_CATEGORIES.map((category) => {
        const permissions = category.permissions.map((permission) => permission.key);
        const hasAll = permissions.every((permission) => value.includes(permission));
        return (
          <div key={category.key} className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{category.label}</p>
                {category.description ? (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => toggleCategory(permissions)}
                disabled={disabled}
              >
                {hasAll ? "Unselect" : "Select all"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {category.permissions.map((permission) => (
                <label key={permission.key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.includes(permission.key)}
                    onCheckedChange={() => toggle(permission.key)}
                    disabled={disabled}
                  />
                  <div>
                    <Label className="cursor-pointer text-sm font-medium">{permission.label}</Label>
                    {permission.description ? (
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
