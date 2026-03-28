"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { ActivityFilters, ActivityRecord } from "@/types";

const fetchActivities = async (params: URLSearchParams) => {
  const response = await fetch(`/api/activity?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<{ data: ActivityRecord[]; meta: { nextCursor?: string | null } }>; 
};

const buildParams = (filters: ActivityFilters, cursor?: string | null) => {
  const params = new URLSearchParams();
  if (filters.types?.length) params.set("types", filters.types.join(","));
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.caseId) params.set("caseId", filters.caseId);
  if (filters.documentId) params.set("documentId", filters.documentId);
  if (filters.search) params.set("q", filters.search);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (cursor) params.set("cursor", cursor);
  return params;
};

export const useActivityFeed = (filters: ActivityFilters = {}, options: { pageSize?: number } = {}) => {
  const limit = options.pageSize ?? 20;
  return useInfiniteQuery({
    queryKey: ["activities", filters, limit],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const params = buildParams(filters, pageParam ?? undefined);
      params.set("limit", String(limit));
      return fetchActivities(params);
    },
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    refetchInterval: 60_000,
  });
};

export const useActivityStream = () => {
  const client = useQueryClient();
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const source = new EventSource("/api/notifications/stream");
    const handler = () => {
      client.invalidateQueries({ queryKey: ["activities"] });
    };
    source.addEventListener("activity", handler);
    return () => {
      source.removeEventListener("activity", handler);
      source.close();
    };
  }, [client]);
};
