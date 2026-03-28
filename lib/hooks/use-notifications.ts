"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationPreferences, UserNotification } from "@/types";

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useNotifications = (options: { unreadOnly?: boolean; limit?: number } = {}) => {
  const params = new URLSearchParams();
  params.set("scope", "inbox");
  if (options.unreadOnly) params.set("unreadOnly", "true");
  if (options.limit) params.set("limit", String(options.limit));
  return useQuery<{ data: UserNotification[]; meta: { unreadCount: number } }>({
    queryKey: ["notifications", options],
    queryFn: () => fetcher(`/api/notifications?${params.toString()}`),
    refetchInterval: 60_000,
  });
};

export const useNotificationPreferences = () =>
  useQuery<{ data: NotificationPreferences }>({
    queryKey: ["notification-preferences"],
    queryFn: () => fetcher(`/api/notifications?scope=preferences`),
  });

export const useUpdateNotificationPreferences = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) =>
      fetcher(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preferences", payload }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["notification-preferences"] });
    },
  });
};

export const useMarkNotification = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { notificationId: string; read?: boolean }) =>
      fetcher(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", ...payload }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
