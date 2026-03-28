"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TeamDetail, TeamSummary } from "@/types";
import type { TeamPayload } from "@/lib/admin/teams";

const fetchJSON = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useAdminTeams = () =>
  useQuery<{ data: TeamSummary[] }>({
    queryKey: ["admin", "teams"],
    queryFn: () => fetchJSON<{ data: TeamSummary[] }>("/api/admin/teams"),
  });

export const useAdminTeam = (teamId?: string) =>
  useQuery<{ data: TeamDetail }>({
    queryKey: ["admin", "teams", teamId],
    enabled: Boolean(teamId),
    queryFn: () => fetchJSON<{ data: TeamDetail }>(`/api/admin/teams/${teamId}`),
  });

const useInvalidate = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["admin", "teams"] });
};

export const useCreateTeam = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: TeamPayload) =>
      fetchJSON<{ data: TeamDetail }>("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateTeam = (teamId: string) => {
  const invalidate = useInvalidate();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamPayload) =>
      fetchJSON<{ data: TeamDetail }>(`/api/admin/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      client.invalidateQueries({ queryKey: ["admin", "teams", teamId] });
    },
  });
};

export const useDeleteTeam = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (teamId: string) =>
      fetchJSON(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
      }),
    onSuccess: () => invalidate(),
  });
};

export const useTeamMemberActions = (teamId: string) => {
  const client = useQueryClient();
  return {
    addMembers: useMutation({
      mutationFn: (userIds: string[]) =>
        fetchJSON<{ data: TeamDetail }>(`/api/admin/teams/${teamId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        }),
      onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "teams", teamId] }),
    }),
    removeMember: useMutation({
      mutationFn: (userId: string) =>
        fetchJSON<{ data: TeamDetail }>(`/api/admin/teams/${teamId}/members?userId=${userId}`, {
          method: "DELETE",
        }),
      onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "teams", teamId] }),
    }),
  };
};
