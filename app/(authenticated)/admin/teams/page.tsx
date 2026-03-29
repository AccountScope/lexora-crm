"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminTeams } from "@/lib/hooks/use-admin-teams";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Users } from "lucide-react";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function TeamsPage() {
  const { data, isLoading } = useAdminTeams();
  const teams = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teams"
        description="Organize staff into practice groups and manage access together"
        action={
          <Button asChild>
            <Link href="/admin/teams/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Link>
          </Button>
        }
      />
      
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create teams to organize your staff into practice groups and manage permissions together."
          action={{
            label: "Create your first team",
            onClick: () => window.location.href = "/admin/teams/create",
          }}
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created on</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{team.description || "—"}</TableCell>
                  <TableCell>{team.memberCount}</TableCell>
                  <TableCell>{team.createdBy?.name ?? "—"}</TableCell>
                  <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right text-sm">
                    <Link className="text-primary hover:underline" href={`/admin/teams/${team.id}`}>
                      View team
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
