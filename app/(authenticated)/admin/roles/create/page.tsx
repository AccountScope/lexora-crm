"use client";

import { useRouter } from "next/navigation";
import { RoleForm, type RoleFormValues } from "@/components/admin/role-form";
import { useCreateRole } from "@/lib/hooks/use-admin-roles";

export default function CreateRolePage() {
  const router = useRouter();
  const mutation = useCreateRole();

  const handleSubmit = async (values: RoleFormValues) => {
    const response = await mutation.mutateAsync(values);
    const roleId = response.data.id;
    router.push(`/admin/roles/${roleId}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create role</h1>
        <p className="text-sm text-muted-foreground">Bundle permissions into a reusable role for your team.</p>
      </div>
      <RoleForm onSubmit={handleSubmit} submitting={mutation.isPending} />
      {mutation.error ? (
        <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
      ) : null}
    </div>
  );
}
