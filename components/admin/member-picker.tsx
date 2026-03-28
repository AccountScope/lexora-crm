"use client";

import { useEffect, useMemo, useState } from "react";
import type { DirectoryUser } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface MemberPickerProps {
  onSelect: (user: DirectoryUser) => Promise<void> | void;
  search: (query: string) => Promise<DirectoryUser[]>;
  excludedIds?: string[];
  placeholder?: string;
  className?: string;
}

export const MemberPicker = ({ onSelect, search, excludedIds = [], placeholder, className }: MemberPickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(null);
      return;
    }
    const handle = setTimeout(() => {
      setLoading(true);
      search(query)
        .then((data) => {
          setResults(data);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unable to search users");
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, search]);

  return (
    <div className={cn("space-y-3", className)}>
      <Input
        placeholder={placeholder ?? "Search by name or email"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        {loading ? <p className="text-sm text-muted-foreground">Searching…</p> : null}
        {!loading && query && results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found</p>
        ) : null}
        {results.slice(0, 8).map((user) => {
          const alreadyAdded = excluded.has(user.id);
          return (
            <div key={user.id} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.roles?.length ? (
                  <p className="text-xs text-muted-foreground">{user.roles.join(", ")}</p>
                ) : null}
              </div>
              <Button size="sm" variant="outline" disabled={alreadyAdded} onClick={() => onSelect(user)}>
                {alreadyAdded ? "Added" : "Add"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
