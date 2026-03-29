"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TeamForm, type TeamFormValues } from "@/components/admin/team-form";
import { MemberPicker } from "@/components/admin/member-picker";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAdminTeam,
  useAdminTeams,
  useDeleteTeam,
  useTeamMemberActions,
  useUpdateTeam,
} from "@/lib/hooks/use-admin-teams";
import { searchDirectory } from "@/lib/hooks/use-admin-roles";
import type { DirectoryUser } from "@/types";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function TeamDetailPage() {
  const params = useParams<{ id: string }>();
  const teamId = params?.id;
  const router = useRouter();
  const { data, isLoading } = useAdminTeam(teamId);
  const team = data?.data;
  const { data: allTeams } = useAdminTeams();
  const update = useUpdateTeam(teamId as string);
  const deleter = useDeleteTeam();
  const memberActions = useTeamMemberActions(teamId as string);
  const [filter, setFilter] = useState<string>("all");

  const parentOptions = useMemo(() => {
    if (!allTeams?.data || !team) return [];
    const banned = new Set([team.id, ...(team.children?.map((child) => child.id) ?? [])]);
    return allTeams.data.filter((candidate) => !banned.has(candidate.id)).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
    }));
  }, [allTeams?.data, team]);

  const availableRoleFilters = useMemo(() => {
    const unique = new Set<string>();
    team?.members.forEach((member) => member.roles?.forEach((roleName) => unique.add(roleName)));
    return Array.from(unique.values());
  }, [team?.members]);

  const filteredMembers = useMemo(() => {
    if (!team?.members) return [];
    if (filter === "all") return team.members;
    return team.members.filter((member) => member.roles?.includes(filter));
  }, [team?.members, filter]);

  const handleSubmit = async (values: TeamFormValues) => {
    await update.mutateAsync(values);
  };

  const handleDelete = async () => {
    if (!team) return;
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    await deleter.mutateAsync(team.id);
    router.push("/admin/teams");
  };

  const handleAddUser = async (user: DirectoryUser) => {
    await memberActions.addMembers.mutateAsync([user.id]);
  };

  if (!teamId) {
    return <p>Missing team id</p>;
  }

  if (isLoading || !team) {
    return <p>Loading team…</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Link href="/admin/teams">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <span>{team.name}</span>
          </div>
        }
        description={team.description || "No description provided"}
        action={
          <Button variant="destructive" onClick={handleDelete} disabled={deleter.isPending}>
            {deleter.isPending ? "Deleting..." : "Delete Team"}
          </Button>
        }
      />

      <section className="rounded-lg border p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Team profile</h2>
          <p className="text-sm text-muted-foreground">Update the team name, description, or parent team.</p>
        </div>
        <TeamForm
          initialValues={{
            name: team.name,
            description: team.description ?? "",
            parentId: team.parent?.id ?? null,
          }}
          parentOptions={parentOptions}
          onSubmit={handleSubmit}
          submitting={update.isPending}
        />
        {update.error ? (
          <p className="mt-2 text-sm text-destructive">{(update.error as Error).message}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Parent:</span> {team.parent?.name ?? "Top level"}
          </div>
          <div>
            <span className="font-medium text-foreground">Children:</span>
            {team.children?.length ? team.children.map((child) => child.name).join(", ") : "None"}
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Members</h2>
              <p className="text-sm text-muted-foreground">
                Assign people to this team for shared access, routing, and billing.
              </p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {availableRoleFilters.map((roleName) => (
                  <SelectItem key={roleName} value={roleName}>
                    {roleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
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
                      No members in this view.
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
            excludedIds={team.members.map((member) => member.id)}
            onSelect={handleAddUser}
          />
        </div>
      </section>

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        Team-based permissions are coming soon. For now, use teams to route cases, assign billing, and filter reports.
      </div>
    </div>
  );
}
