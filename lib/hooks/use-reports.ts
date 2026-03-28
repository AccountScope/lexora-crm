"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ReportConfig,
  ReportDetailPayload,
  ReportListItem,
  ReportResultPayload,
  ReportSchedule,
  SavedReportRecord,
} from "@/types";
import type { ReportScheduleInput } from "@/lib/api/validation";

interface ReportsResponse {
  reports: ReportListItem[];
  prebuilt: { id: string; name: string; description: string; type: string; category: string }[];
}

interface ReportDetailResponse {
  report: ReportDetailPayload;
  result?: ReportResultPayload;
}

const jsonFetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json() as Promise<T>;
};

export const useReportsList = () =>
  useQuery<{ data: ReportsResponse }>({
    queryKey: ["reports"],
    queryFn: () => jsonFetcher<{ data: ReportsResponse }>("/api/reports"),
  });

export const useReportDetail = (reportId?: string, run?: boolean) =>
  useQuery<{ data: ReportDetailResponse }>({
    queryKey: ["report", reportId, run],
    enabled: Boolean(reportId),
    queryFn: () => jsonFetcher<{ data: ReportDetailResponse }>(`/api/reports/${reportId}${run ? "?run=1" : ""}`),
  });

export const useReportPreview = () =>
  useMutation<{ data: ReportResultPayload }, Error, { config: ReportConfig }>({
    mutationFn: ({ config }) =>
      jsonFetcher<{ data: ReportResultPayload }>("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview", config }),
      }),
  });

export const useCreateReport = () => {
  const client = useQueryClient();
  return useMutation<{ data: SavedReportRecord }, Error, { payload: Partial<SavedReportRecord> & { config: ReportConfig } }>({
    mutationFn: ({ payload }) =>
      jsonFetcher<{ data: SavedReportRecord }>("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "create", payload }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useUpdateReport = (reportId: string) => {
  const client = useQueryClient();
  return useMutation<{ data: ReportDetailPayload }, Error, { payload: Partial<SavedReportRecord> & { config?: ReportConfig } }>({
    mutationFn: ({ payload }) =>
      jsonFetcher<{ data: ReportDetailPayload }>(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["reports"] });
      client.invalidateQueries({ queryKey: ["report", reportId] });
    },
  });
};

export const useDeleteReport = () => {
  const client = useQueryClient();
  return useMutation<unknown, Error, { reportId: string }>({
    mutationFn: ({ reportId }) =>
      jsonFetcher(`/api/reports/${reportId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useRunReport = () =>
  useMutation<{ data: ReportResultPayload }, Error, { reportId: string; overrides?: Partial<ReportConfig> }>({
    mutationFn: ({ reportId, overrides }) =>
      jsonFetcher<{ data: ReportResultPayload }>(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", overrides }),
      }),
  });

export const useScheduleMutation = (reportId: string) => {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ["report", reportId] });
  };
  const create = useMutation<{ data: ReportSchedule }, Error, ReportScheduleInput>({
    mutationFn: (payload) =>
      jsonFetcher<{ data: ReportSchedule }>(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule:add", payload }),
      }),
    onSuccess: invalidate,
  });
  const update = useMutation<{ data: ReportSchedule }, Error, { scheduleId: string; payload: ReportScheduleInput }>({
    mutationFn: ({ scheduleId, payload }) =>
      jsonFetcher<{ data: ReportSchedule }>(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule:update", scheduleId, payload }),
      }),
    onSuccess: invalidate,
  });
  const toggle = useMutation<unknown, Error, { scheduleId: string; enabled: boolean }>({
    mutationFn: ({ scheduleId, enabled }) =>
      jsonFetcher(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule:toggle", scheduleId, enabled }),
      }),
    onSuccess: invalidate,
  });
  const remove = useMutation<unknown, Error, { scheduleId: string }>({
    mutationFn: ({ scheduleId }) =>
      jsonFetcher(`/api/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule:delete", scheduleId }),
      }),
    onSuccess: invalidate,
  });
  return { create, update, toggle, remove };
};
