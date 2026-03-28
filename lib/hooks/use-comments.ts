"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommentRecord } from "@/types";

interface CommentEntity {
  entityType: string;
  entityId: string;
}

const fetchComments = async (params: URLSearchParams) => {
  const res = await fetch(`/api/comments?${params.toString()}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<{ data: CommentRecord[]; meta: { nextCursor?: string | null } }>;
};

export const useComments = (entity: CommentEntity, options: { pageSize?: number } = {}) => {
  const limit = options.pageSize ?? 15;
  return useInfiniteQuery({
    queryKey: ["comments", entity.entityType, entity.entityId, limit],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("entityType", entity.entityType);
      params.set("entityId", entity.entityId);
      params.set("limit", String(limit));
      if (pageParam) params.set("cursor", pageParam);
      return fetchComments(params);
    },
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    refetchInterval: 60_000,
  });
};

const jsonRequest = async <T>(url: string, init: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export const useCreateComment = (entity: CommentEntity) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { content: string; parentId?: string | null; attachments?: any[] }) =>
      jsonRequest<{ data: CommentRecord }>("/api/comments", {
        method: "POST",
        body: JSON.stringify({ ...entity, ...payload }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comments", entity.entityType, entity.entityId], exact: false });
    },
  });
};

export const useUpdateComment = (entity: CommentEntity) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: { commentId: string; content: string }) =>
      jsonRequest<{ data: CommentRecord }>("/api/comments", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comments", entity.entityType, entity.entityId], exact: false });
    },
  });
};

export const useDeleteComment = (entity: CommentEntity) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => jsonRequest<{ ok: boolean }>(`/api/comments?commentId=${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comments", entity.entityType, entity.entityId], exact: false });
    },
  });
};

export const useToggleCommentLike = (entity: CommentEntity) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (args: { commentId: string; action: "like" | "unlike" }) =>
      jsonRequest<{ data: CommentRecord }>("/api/comments", {
        method: "PATCH",
        body: JSON.stringify(args),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comments", entity.entityType, entity.entityId], exact: false });
    },
  });
};
