"use client";

import { useQuery } from "@tanstack/react-query";

interface UserSearchResult {
  id: string;
  title: string;
  subtitle?: string | null;
}

export const useUserDirectorySearch = (term: string, limit = 8) => {
  return useQuery<{ data: UserSearchResult[] }>({
    queryKey: ["user-search", term, limit],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("term", term.trim());
      params.set("types", "user");
      params.set("limit", String(limit));
      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const json = await res.json();
      return { data: json.data?.groups?.user ?? [] };
    },
  });
};
