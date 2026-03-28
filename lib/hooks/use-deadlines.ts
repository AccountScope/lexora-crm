"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeadlineRecord, DeadlineTemplate } from "@/types";

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

const buildQuery = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
    } else {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const useDeadlines = (filters: {
  statuses?: string[];
  rangeStart?: string;
  rangeEnd?: string;
  scope?: string;
  limit?: number;
  overdueOnly?: boolean;
  upcomingOnly?: boolean;
} = {}) => {
  const queryString = useMemo(() => buildQuery({ scope: "list", ...filters }), [filters]);
  return useQuery<{ data: DeadlineRecord[]; meta?: Record<string, any> }>({
    queryKey: ["deadlines", filters],
    queryFn: () => fetcher(`/api/deadlines${queryString}`),
  });
};

export const useUpcomingDeadlines = (limit = 5) =>
  useQuery<{ data: DeadlineRecord[] }>({
    queryKey: ["deadlines", "upcoming", limit],
    queryFn: () => fetcher(`/api/deadlines?scope=upcoming&limit=${limit}`),
  });

export const useDeadlineTemplates = () =>
  useQuery<{ data: DeadlineTemplate[] }>({
    queryKey: ["deadline-templates"],
    queryFn: () => fetcher(`/api/deadlines?scope=templates`),
  });

export const useCreateDeadline = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) =>
      fetcher(`/api/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["deadlines"] });
      client.invalidateQueries({ queryKey: ["deadlines", "upcoming"] });
    },
  });
};

export const useCreateDeadlineTemplate = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) =>
      fetcher(`/api/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, mode: "template" }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["deadline-templates"] });
    },
  });
};

export const useUpdateDeadline = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) =>
      fetcher(`/api/deadlines`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["deadlines"] });
      client.invalidateQueries({ queryKey: ["deadlines", "upcoming"] });
    },
  });
};
