"use client";

import { useDeferredValue, useMemo, useRef, useState, useEffect } from "react";
import { Filter, RefreshCw } from "lucide-react";
import type { ActivityCategory } from "@/types";
import { ActivityCard } from "@/components/activity/activity-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActivityFeed, useActivityStream } from "@/lib/hooks/use-activity";
import { useUserDirectorySearch } from "@/lib/hooks/use-users";
import { cn } from "@/lib/utils/cn";

const TYPE_OPTIONS: { label: string; value: ActivityCategory }[] = [
  { label: "Cases", value: "case" },
  { label: "Documents", value: "document" },
  { label: "Time", value: "time" },
  { label: "Billing", value: "billing" },
  { label: "Users", value: "user" },
  { label: "Comments", value: "comment" },
  { label: "Mentions", value: "mention" },
];

interface Props {
  caseId?: string;
  showFilters?: boolean;
  className?: string;
}

export const ActivityFeed = ({ caseId, showFilters = true, className }: Props) => {
  const [selectedTypes, setSelectedTypes] = useState<ActivityCategory[]>([]);
  const [userFilter, setUserFilter] = useState<{ id: string; title: string } | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const filters = useMemo(
    () => ({
      caseId,
      types: selectedTypes.length ? selectedTypes : undefined,
      userId: userFilter?.id,
      search: deferredSearch.trim() || undefined,
      from: dateRange.from,
      to: dateRange.to,
    }),
    [caseId, deferredSearch, dateRange, selectedTypes, userFilter]
  );

  const pageSize = caseId ? 12 : 20;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useActivityFeed(filters, {
    pageSize,
  });
  useActivityStream();

  const activities = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const userResults = useUserDirectorySearch(userSearchTerm, 6);

  const toggleType = (type: ActivityCategory) => {
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((value) => value !== type) : [...prev, type]));
  };

  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Activity feed</p>
          <p className="text-xs text-muted-foreground">Live stream of system events</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {showFilters && (
        <div className="mt-4 space-y-4 rounded-lg border bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={selectedTypes.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleType(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Search</p>
              <Input placeholder="Keyword" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="relative">
              <p className="text-xs text-muted-foreground">Filter by user</p>
              <Input
                placeholder="Start typing a name"
                value={userFilter?.title ?? userSearchTerm}
                onChange={(event) => {
                  setUserFilter(null);
                  setUserSearchTerm(event.target.value);
                }}
              />
              {userFilter && (
                <Button
                  size="sm"
                  variant="link"
                  className="absolute right-3 top-7 text-xs"
                  onClick={() => {
                    setUserFilter(null);
                    setUserSearchTerm("");
                  }}
                >
                  Clear
                </Button>
              )}
              {userSearchTerm.length >= 2 && !userFilter && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-card shadow">
                  {userResults.data?.data?.length ? (
                    userResults.data.data.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setUserFilter({ id: user.id, title: user.title });
                          setUserSearchTerm("");
                        }}
                      >
                        <p className="font-medium">{user.title}</p>
                        {user.subtitle && <p className="text-xs text-muted-foreground">{user.subtitle}</p>}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No matches</p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <Input type="date" value={dateRange.from ?? ""} onChange={(event) => setDateRange((prev) => ({ ...prev, from: event.target.value }))} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <Input type="date" value={dateRange.to ?? ""} onChange={(event) => setDateRange((prev) => ({ ...prev, to: event.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {isLoading && <p className="text-sm text-muted-foreground">Loading activity…</p>}
        {!isLoading && activities.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
        {hasNextPage && (
          <div ref={sentinelRef} className="mt-4 flex justify-center">
            <Button variant="ghost" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
