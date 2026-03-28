"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAdminRoles, useAdminUserActions } from "@/lib/hooks/use-admin";
import { useRouter } from "next/navigation";
import type { AdminUserDetail, UserStatus } from "@/types";

interface Props {
  user: AdminUserDetail;
}

const statusOptions: UserStatus[] = ["ACTIVE", "INVITED", "SUSPENDED", "DISABLED"];

export const UserForm = ({ user }: Props) => {
  const router = useRouter();
  const [formState, setFormState] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    status: user.status,
    roleId: user.roles[0]?.id ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const { updateUser, verifyUser, resetPassword } = useAdminUserActions();
  const rolesQuery = useAdminRoles();
  const roleOptions = (rolesQuery.data as any)?.data ?? rolesQuery.data ?? [];

  const handleChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    await updateUser.mutateAsync({ userId: user.id, ...formState });
    setMessage("Profile updated");
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">First name</label>
          <Input value={formState.firstName} onChange={(event) => handleChange("firstName", event.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Last name</label>
          <Input value={formState.lastName} onChange={(event) => handleChange("lastName", event.target.value)} required />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" value={formState.email} onChange={(event) => handleChange("email", event.target.value)} required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Phone</label>
          <Input value={formState.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select value={formState.status} onValueChange={(value) => handleChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Role</label>
        <Select value={formState.roleId || ""} onValueChange={(value) => handleChange("roleId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((role: RoleSummary) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border px-3 py-2">
        <span className="text-sm font-medium">Email verification:</span>
        <Badge variant={user.emailVerified ? "success" : "outline"}>{user.emailVerified ? "Verified" : "Pending"}</Badge>
        {!user.emailVerified && (
          <Button type="button" size="sm" variant="secondary" onClick={() => verifyUser.mutate(user.id)}>
            Mark verified
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={() => resetPassword.mutate(user.id)}>
          Send reset link
        </Button>
      </div>
      {message && <p className="text-sm text-emerald-600">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={updateUser.isPending}>
          {updateUser.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={`mailto:${user.email}`}>Email user</a>
        </Button>
      </div>
    </form>
  );
};

type RoleSummary = {
  id: string;
  name: string;
};
