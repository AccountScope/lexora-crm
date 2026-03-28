"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DirectoryUser, RoleDetail, RoleSummary } from "@/types";
import type { RolePayload } from "@/lib/admin/roles";

const fetchJSON = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useAdminRoles = () =>
  useQuery<{ data: RoleSummary[] }>({
    queryKey: ["admin", "roles"],
    queryFn: () => fetchJSON<{ data: RoleSummary[] }>("/api/admin/roles"),
  });

export const useAdminRole = (roleId?: string) =>
  useQuery<{ data: RoleDetail }>({
    queryKey: ["admin", "roles", roleId],
    enabled: Boolean(roleId),
    queryFn: () => fetchJSON<{ data: RoleDetail }>(`/api/admin/roles/${roleId}`),
  });

const useInvalidate = () => {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: ["admin", "roles"] });
  };
};

export const useCreateRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: RolePayload) =>
      fetchJSON<{ data: RoleDetail }>("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidate(),
  });
};

export const useUpdateRole = (roleId: string) => {
  const invalidate = useInvalidate();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) =>
      fetchJSON<{ data: RoleDetail }>(`/api/admin/roles/${roleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      client.invalidateQueries({ queryKey: ["admin", "roles", roleId] });
    },
  });
};

export const useDeleteRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (roleId: string) =>
      fetchJSON(`/api/admin/roles/${roleId}`, {
        method: "DELETE",
      }),
    onSuccess: () => invalidate(),
  });
};

export const useRoleMemberActions = (roleId: string) => {
  const client = useQueryClient();
  return {
    addMembers: useMutation({
      mutationFn: (userIds: string[]) =>
        fetchJSON<{ data: RoleDetail }>(`/api/admin/roles/${roleId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        }),
      onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "roles", roleId] }),
    }),
    removeMember: useMutation({
      mutationFn: (userId: string) =>
        fetchJSON<{ data: RoleDetail }>(`/api/admin/roles/${roleId}/members?userId=${userId}`, {
          method: "DELETE",
        }),
      onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "roles", roleId] }),
    }),
  };
};

export const searchDirectory = async (query: string): Promise<DirectoryUser[]> => {
  const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const json = await res.json();
  return json.data ?? [];
};
