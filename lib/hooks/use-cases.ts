"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseDetail, CaseSummary, CaseTimelineEvent, CaseNote } from "@/types";

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useCases = (filters: { search?: string; status?: string } = {}) => {
  const search = filters.search ? `&search=${encodeURIComponent(filters.search)}` : "";
  const status = filters.status ? `&status=${filters.status}` : "";
  return useQuery<{ data: CaseSummary[] }>({
    queryKey: ["cases", filters],
    queryFn: () => fetcher<{ data: CaseSummary[] }>(`/api/cases?pageSize=50${search}${status}`),
  });
};

export const useCaseDetail = (matterId: string) =>
  useQuery<{ data: CaseDetail }>({
    queryKey: ["case", matterId],
    enabled: Boolean(matterId),
    queryFn: () => fetcher<{ data: CaseDetail }>(`/api/cases/${matterId}`),
  });

export const useCaseNotes = (matterId: string) =>
  useQuery<{ data: CaseNote[] }>({
    queryKey: ["case", matterId, "notes"],
    enabled: Boolean(matterId),
    queryFn: () => fetcher<{ data: CaseNote[] }>(`/api/cases/${matterId}/notes`),
  });

export const useCaseTimeline = (matterId: string) =>
  useQuery<{ data: CaseTimelineEvent[] }>({
    queryKey: ["case", matterId, "timeline"],
    enabled: Boolean(matterId),
    queryFn: () => fetcher<{ data: CaseTimelineEvent[] }>(`/api/cases/${matterId}/timeline`),
  });

export const useCreateCase = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["cases"] });
    },
  });
};

export const useCreateCaseNote = (matterId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note: string; visibility: string }) => {
      const res = await fetch(`/api/cases/${matterId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, matterId }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["case", matterId, "notes"] });
      client.invalidateQueries({ queryKey: ["case", matterId, "timeline"] });
    },
  });
};
