"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  TimeEntry,
  TimeEntryTemplate,
  BillingDashboardMetrics,
  InvoiceSummary,
} from "@/types";

interface TimeEntryResponse {
  entries: TimeEntry[];
  total: number;
  summary: {
    billableHours: number;
    nonBillableHours: number;
    unbilledAmount: number;
  };
  templates: TimeEntryTemplate[];
}

interface InvoiceResponse {
  invoices: InvoiceSummary[];
  total: number;
  metrics: BillingDashboardMetrics;
}

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

const toQueryString = (params: Record<string, any>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const str = search.toString();
  return str ? `?${str}` : "";
};

export const useTimeEntries = (filters: Record<string, any> = {}) => {
  const query = toQueryString(filters);
  return useQuery<{ data: TimeEntryResponse }>({
    queryKey: ["time-entries", filters],
    queryFn: () => fetcher<{ data: TimeEntryResponse }>(`/api/time-entries${query}`),
  });
};

export const useCreateTimeEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
};

export const useBulkTimeEntries = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { entries: Record<string, any>[]; batchLabel?: string }) => {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
};

export const useTemplateMutation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, mode: "template" }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
};

export const useInvoices = (filters: Record<string, any> = {}) => {
  const query = toQueryString(filters);
  return useQuery<{ data: InvoiceResponse }>({
    queryKey: ["invoices", filters],
    queryFn: () => fetcher<{ data: InvoiceResponse }>(`/api/invoices${query}`),
  });
};

export const useCreateInvoice = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["invoices"] });
      client.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
};
