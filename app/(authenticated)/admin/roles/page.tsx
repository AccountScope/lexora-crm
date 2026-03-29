"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminRoles } from "@/lib/hooks/use-admin-roles";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Shield } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function RolesPage() {
  const { data, isLoading } = useAdminRoles();
  const roles = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Control what every team member can access inside Lexora"
        action={
          <Button asChild>
            <Link href="/admin/roles/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Link>
          </Button>
        }
      />
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : roles.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No roles yet"
          description="Create custom roles to organize permissions and control access across your team."
          action={{
            label: "Create your first role",
            onClick: () => window.location.href = "/admin/roles/create",
          }}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-center">Users</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{role.description || "—"}</TableCell>
                  <TableCell className="text-center">{role.userCount}</TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? "secondary" : "default"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <Link className="text-primary hover:underline" href={`/admin/roles/${role.id}`}>
                      View details
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
