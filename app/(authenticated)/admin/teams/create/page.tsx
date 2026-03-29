"use client";

import { useRouter } from "next/navigation";
import { TeamForm, type TeamFormValues } from "@/components/admin/team-form";
import { useAdminTeams } from "@/lib/hooks/use-admin-teams";
import { useCreateTeam } from "@/lib/hooks/use-admin-teams";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";

export default function CreateTeamPage() {
  const router = useRouter();
  const { data } = useAdminTeams();
  const mutation = useCreateTeam();
  const { toast } = useToast();
  const parentOptions = data?.data ?? [];

  const handleSubmit = async (values: TeamFormValues) => {
    try {
      const response = await mutation.mutateAsync(values);
      toast({
        title: "Team created",
        description: "The new team has been created successfully.",
      });
      router.push(`/admin/teams/${response.data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create Team"
        description="Group users into departments or pods for easier assignment"
      />
      <TeamForm
        parentOptions={parentOptions.map((team) => ({ id: team.id, name: team.name }))}
        onSubmit={handleSubmit}
        submitting={mutation.isPending}
      />
    </div>
  );
}
