"use client";

import { useRouter } from "next/navigation";
import { TeamForm, type TeamFormValues } from "@/components/admin/team-form";
import { useAdminTeams } from "@/lib/hooks/use-admin-teams";
import { useCreateTeam } from "@/lib/hooks/use-admin-teams";

export default function CreateTeamPage() {
  const router = useRouter();
  const { data } = useAdminTeams();
  const mutation = useCreateTeam();
  const parentOptions = data?.data ?? [];

  const handleSubmit = async (values: TeamFormValues) => {
    const response = await mutation.mutateAsync(values);
    router.push(`/admin/teams/${response.data.id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create team</h1>
        <p className="text-sm text-muted-foreground">Group users into departments or pods for easier assignment.</p>
      </div>
      <TeamForm
        parentOptions={parentOptions.map((team) => ({ id: team.id, name: team.name }))}
        onSubmit={handleSubmit}
        submitting={mutation.isPending}
      />
      {mutation.error ? (
        <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
      ) : null}
    </div>
  );
}
