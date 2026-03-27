"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClientPortalCase } from "@/types";

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const usePortalCases = () =>
  useQuery<{ data: ClientPortalCase[] }>({
    queryKey: ["portal", "cases"],
    queryFn: () => fetcher<{ data: ClientPortalCase[] }>("/api/portal/cases"),
  });

export const usePortalMessages = (params: { matterId?: string; clientId?: string }) => {
  return useQuery<{ data: any[] }>({
    queryKey: ["portal", "messages", params],
    enabled: Boolean(params.matterId && params.clientId),
    queryFn: () =>
      fetcher<{ data: any[] }>(
        `/api/portal/messages?matterId=${params.matterId}&clientId=${params.clientId}`
      ),
  });
};

export const useSendPortalMessage = (params: { matterId: string; clientId: string }) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { message: string; direction?: "inbound" | "outbound" }) => {
      const res = await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, ...payload }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["portal", "messages", params] });
    },
  });
};
