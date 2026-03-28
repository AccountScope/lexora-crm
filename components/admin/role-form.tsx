"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PermissionPicker } from "@/components/admin/permission-picker";

const schema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
});

export type RoleFormValues = z.infer<typeof schema>;

interface RoleFormProps {
  initialValues?: RoleFormValues;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  submitting?: boolean;
  disabled?: boolean;
}

export const RoleForm = ({ initialValues, onSubmit, submitting, disabled }: RoleFormProps) => {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { name: "", description: "", permissions: [] },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Role name</label>
          <Input placeholder="e.g. Billing Manager" disabled={disabled} {...form.register("name")}></Input>
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            rows={3}
            placeholder="Describe what this role can do"
            disabled={disabled}
            {...form.register("description")}
          />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Permissions</p>
        <PermissionPicker
          value={form.watch("permissions") ?? []}
          onChange={(next) => form.setValue("permissions", next, { shouldDirty: true })}
          disabled={disabled}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting || disabled}>
          Save role
        </Button>
      </div>
    </form>
  );
};
