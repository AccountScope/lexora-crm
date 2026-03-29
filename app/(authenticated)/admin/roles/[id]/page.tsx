"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RoleForm, type RoleFormValues } from "@/components/admin/role-form";
import { MemberPicker } from "@/components/admin/member-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  searchDirectory,
  useAdminRole,
  useDeleteRole,
  useRoleMemberActions,
  useUpdateRole,
} from "@/lib/hooks/use-admin-roles";
import type { DirectoryUser } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roleId = params?.id;
  const { data, isLoading } = useAdminRole(roleId);
  const role = data?.data;
  const update = useUpdateRole(roleId as string);
  const remover = useDeleteRole();
  const memberActions = useRoleMemberActions(roleId as string);
  const [filter, setFilter] = useState<string>("all");

  const handleSubmit = async (values: RoleFormValues) => {
    await update.mutateAsync(values);
  };

  const handleDelete = async () => {
    if (!role) return;
    if (!role.isCustom) return;
    if (confirm(`Delete role "${role.name}"? This removes it from all users.`)) {
      await remover.mutateAsync(role.id);
      router.push("/admin/roles");
    }
  };

  const handleAddUser = async (user: DirectoryUser) => {
    await memberActions.addMembers.mutateAsync([user.id]);
  };

  const memberIds = useMemo(() => new Set(role?.users.map((member) => member.id) ?? []), [role?.users]);
  const availableFilters = useMemo(() => {
    const unique = new Set<string>();
    role?.users.forEach((member) => member.roles?.forEach((r) => unique.add(r)));
    return Array.from(unique.values());
  }, [role?.users]);

  const filteredMembers = useMemo(() => {
    if (!role?.users) return [];
    if (filter === "all") return role.users;
    return role.users.filter((member) => member.roles?.includes(filter));
  }, [role?.users, filter]);

  if (!roleId) {
    return <p>Missing role id</p>;
  }

  if (isLoading || !role) {
    return <p>Loading role…</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link href="/admin/roles">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <span>{role.name}</span>
            <Badge variant={role.isSystem ? "secondary" : "default"}>{role.isSystem ? "System" : "Custom"}</Badge>
          </div>
        }
        description={role.description || "No description provided"}
      />

      <section className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Role settings</h2>
            <p className="text-sm text-muted-foreground">Update the name, description, and permissions.</p>
          </div>
          {!role.isCustom ? null : (
            <Button variant="destructive" onClick={handleDelete} disabled={remover.isPending}>
              Delete role
            </Button>
          )}
        </div>
        <RoleForm
          initialValues={{
            name: role.name,
            description: role.description ?? "",
            permissions: role.permissions,
          }}
          onSubmit={handleSubmit}
          submitting={update.isPending}
          disabled={role.isSystem}
        />
        {update.error ? (
          <p className="mt-2 text-sm text-destructive">{(update.error as Error).message}</p>
        ) : null}
      </section>

      <section className="grid gap-6 rounded-lg border p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Assigned users</h2>
              <p className="text-sm text-muted-foreground">Users inherit every permission granted to this role.</p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                {availableFilters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.roles?.length ? member.roles.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => memberActions.removeMember.mutateAsync(member.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No members match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold">Add members</h3>
          <MemberPicker
            search={searchDirectory}
            excludedIds={Array.from(memberIds)}
            onSelect={handleAddUser}
          />
        </div>
      </section>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        Need a different permission model? <Link href="/admin/teams" className="text-primary underline">Use teams</Link> to
        mirror your firm hierarchy and combine them with roles for complete control.
      </div>
    </div>
  );
}
