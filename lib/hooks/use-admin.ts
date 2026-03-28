"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminUserMetrics, AdminUserSummary, InvitationRecord, RoleSummary } from "@/types";

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error((await res.text()) || "Request failed");
  }
  return res.json();
};

const buildQuery = (params: Record<string, any>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const useAdminUserMetrics = () =>
  useQuery<{ data: AdminUserMetrics } | AdminUserMetrics>({
    queryKey: ["admin", "users", "metrics"],
    queryFn: async () => {
      const res = await fetcher<{ data?: AdminUserMetrics }>("/api/admin/users?scope=metrics");
      return res.data ?? (res as any);
    },
  });

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export const useAdminUsers = (params: Record<string, any>) => {
  const query = useMemo(() => buildQuery({ scope: "list", ...params }), [params]);
  return useQuery<{ data: AdminUserListResponse } | AdminUserListResponse>({
    queryKey: ["admin", "users", "list", params],
    queryFn: async () => {
      const res = await fetcher<{ data?: AdminUserListResponse }>(`/api/admin/users${query}`);
      return res.data ?? (res as any);
    },
// @ts-expect-error - no overload
    placeholderData: (prev: any) => prev,
  });
};

export const useAdminRoles = () =>
  useQuery<{ data: RoleSummary[] } | RoleSummary[]>({
    queryKey: ["admin", "roles"],
    queryFn: async () => {
      const res = await fetcher<{ data?: RoleSummary[] }>("/api/admin/users?scope=roles");
      return res.data ?? (res as any);
    },
  });

export interface AdminInvitationListResponse {
  invitations: InvitationRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export const useAdminInvitations = (params: Record<string, any>) => {
  const query = useMemo(() => buildQuery({ ...params }), [params]);
  return useQuery<{ data: AdminInvitationListResponse } | AdminInvitationListResponse>({
    queryKey: ["admin", "invitations", params],
    queryFn: async () => {
      const res = await fetcher<{ data?: AdminInvitationListResponse }>(`/api/admin/invitations${query}`);
      return res.data ?? (res as any);
    },
    placeholderData: (prev: any) => prev,
  });
};

export const useAdminUserActions = () => {
  const client = useQueryClient();
  const invalidateUsers = () => {
    client.invalidateQueries({ queryKey: ["admin", "users"] });
  };
  return {
    bulkAction: useMutation({
      mutationFn: async (payload: { action: string; userIds: string[] }) =>
        fetcher(`/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      onSuccess: invalidateUsers,
    }),
    updateUser: useMutation({
      mutationFn: async (payload: Record<string, any>) =>
        fetcher(`/api/admin/users`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      onSuccess: () => invalidateUsers(),
    }),
    verifyUser: useMutation({
      mutationFn: async (userId: string) =>
        fetcher(`/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", userId }),
        }),
      onSuccess: invalidateUsers,
    }),
    resetPassword: useMutation({
      mutationFn: async (userId: string) =>
        fetcher(`/api/admin/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reset-password", userId }),
        }),
    }),
  };
};

export const useInvitationActions = () => {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["admin", "invitations"] });
  };
  return {
    resend: useMutation({
      mutationFn: async (invitationId: string) =>
        fetcher(`/api/admin/invitations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resend", invitationId }),
        }),
      onSuccess: invalidate,
    }),
    cancel: useMutation({
      mutationFn: async (invitationId: string) =>
        fetcher(`/api/admin/invitations`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", invitationId }),
        }),
      onSuccess: invalidate,
    }),
    create: useMutation({
      mutationFn: async (payload: { invites: InvitationCreateInput[] }) =>
        fetcher(`/api/admin/invitations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      onSuccess: invalidate,
    }),
  };
};

export interface InvitationCreateInput {
  email: string;
  roleId: string;
  customMessage?: string;
}
