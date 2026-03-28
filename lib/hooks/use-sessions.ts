"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ActiveSession, PasswordHealthMeta } from "@/types";

interface SessionsResponse {
  data: ActiveSession[];
  meta: {
    password: PasswordHealthMeta;
    rememberMe: boolean;
    idleTimeoutMinutes: number;
  };
}

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
};

export const useActiveSessions = () =>
  useQuery<SessionsResponse>({
    queryKey: ["auth-sessions"],
    queryFn: () => fetcher<SessionsResponse>("/api/auth/sessions"),
    refetchInterval: 60_000,
  });

export const useRevokeSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetcher("/api/auth/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "revoke", sessionId }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth-sessions"] }),
  });
};

export const useRevokeOtherSessions = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetcher("/api/auth/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "revoke-others" }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth-sessions"] }),
  });
};

export const useExtendSession = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (rememberMe?: boolean) =>
      fetcher("/api/auth/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "extend", rememberMe }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth-sessions"] }),
  });
};

export const useRememberPreference = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (rememberMe: boolean) =>
      fetcher("/api/auth/sessions", {
        method: "POST",
        body: JSON.stringify({ action: "remember", rememberMe }),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["auth-sessions"] }),
  });
};
