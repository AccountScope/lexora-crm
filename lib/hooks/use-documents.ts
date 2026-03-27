"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VaultDocument, CustodyEvent } from "@/types";

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useDocuments = (filters: { matterId?: string; clientId?: string; search?: string }) => {
  const query = new URLSearchParams();
  if (filters.matterId) query.set("matterId", filters.matterId);
  if (filters.clientId) query.set("clientId", filters.clientId);
  if (filters.search) query.set("search", filters.search);
  const queryString = query.toString();
  const url = queryString ? `/api/documents?${queryString}` : "/api/documents";
  return useQuery<{ data: VaultDocument[] }>({
    queryKey: ["documents", filters],
    queryFn: () => request<{ data: VaultDocument[] }>(url),
  });
};

export const useChainOfCustody = (documentId?: string) =>
  useQuery<{ data: CustodyEvent[] }>({
    queryKey: ["documents", documentId, "chain"],
    enabled: Boolean(documentId),
    queryFn: () => request<{ data: CustodyEvent[] }>(`/api/documents/${documentId}/chain-of-custody`),
  });

export const useDocumentUpload = (filters: { matterId?: string; clientId?: string }) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["documents", filters] });
    },
  });
};
