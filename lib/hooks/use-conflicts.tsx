"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConflictCheckDetail,
  ConflictCheckRecord,
  ConflictMatchRecord,
  ConflictSummaryCounts,
  ConflictWaiverRecord,
  WatchListEntry,
} from "@/types";
import type { ConflictCheckInput, ConflictStatusInput, ConflictWaiverInput } from "@/lib/api/validation";

const fetcher = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

interface ConflictCheckResponse {
  data: ConflictCheckRecord[];
  meta: { page: number; pageSize: number; total: number };
}

interface ConflictDetailResponse {
  data: ConflictCheckDetail;
}

interface ConflictRunResponse {
  data: {
    checkId: string;
    summary: ConflictSummaryCounts;
    conflicts: ConflictMatchRecord[];
    decisions: {
      preventCaseCreation: boolean;
      requireAdminApproval: boolean;
      notifyEthics: boolean;
      watchListHits: string[];
    };
  };
}

interface ConflictWaiverResponse {
  data: ConflictWaiverRecord;
}

export const useConflictChecks = (filters: { search?: string; status?: string; page?: number; pageSize?: number } = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 20));

  return useQuery<ConflictCheckResponse>({
    queryKey: ["conflicts", filters],
    queryFn: () => fetcher<ConflictCheckResponse>(`/api/conflicts?${params.toString()}`),
  });
};

export const useConflictCheck = (id?: string) =>
  useQuery<ConflictDetailResponse>({
    queryKey: ["conflict", id],
    enabled: Boolean(id),
    queryFn: () => fetcher<ConflictDetailResponse>(`/api/conflicts/${id}`),
  });

export const useRunConflictCheck = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConflictCheckInput) =>
      fetcher<ConflictRunResponse>("/api/conflicts/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["conflicts"] });
    },
  });
};

export const useUpdateConflictStatus = (id: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConflictStatusInput) =>
      fetcher<ConflictDetailResponse>(`/api/conflicts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["conflict", id] });
      client.invalidateQueries({ queryKey: ["conflicts"] });
    },
  });
};

export const useCreateConflictWaiver = (id: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ConflictWaiverInput) =>
      fetcher<ConflictWaiverResponse>(`/api/conflicts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["conflict", id] });
    },
  });
};

interface WatchListResponse {
  data: WatchListEntry[];
}

export const useWatchList = () =>
  useQuery<WatchListResponse>({
    queryKey: ["watch-list"],
    queryFn: () => fetcher<WatchListResponse>("/api/conflicts/watch-list"),
  });

export const useAddWatchListEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { partyName: string; reason?: string }) =>
      fetcher<WatchListResponse>("/api/conflicts/watch-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["watch-list"] });
    },
  });
};

export const useRemoveWatchListEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      fetcher<{ ok: boolean }>(`/api/conflicts/watch-list?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["watch-list"] });
    },
  });
};
