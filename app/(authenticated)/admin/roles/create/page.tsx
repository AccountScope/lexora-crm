"use client";

import { useRouter } from "next/navigation";
import { RoleForm, type RoleFormValues } from "@/components/admin/role-form";
import { useCreateRole } from "@/lib/hooks/use-admin-roles";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";

export default function CreateRolePage() {
  const router = useRouter();
  const mutation = useCreateRole();
  const { toast } = useToast();

  const handleSubmit = async (values: RoleFormValues) => {
    try {
      const response = await mutation.mutateAsync(values);
      const roleId = response.data.id;
      toast({
        title: "Role created",
        description: "The new role has been created successfully.",
      });
      router.push(`/admin/roles/${roleId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Create Role"
        description="Bundle permissions into a reusable role for your team"
      />
      <RoleForm onSubmit={handleSubmit} submitting={mutation.isPending} />
    </div>
  );
}
