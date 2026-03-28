"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  History,
  Loader2,
  ArrowUpRight,
  Info,
  CornerDownLeft,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SearchResultHit {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  snippet?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  url: string;
}

interface SearchResponse {
  data: {
    term: string;
    total: number;
    executionMs: number;
    groups: Record<string, SearchResultHit[]>;
  };
}

const ENTITY_LABELS: Record<string, string> = {
  case: "Cases",
  document: "Documents",
  client: "Clients",
  time_entry: "Time entries",
  user: "Users",
};

const TYPE_OPTIONS = [
  { label: "Cases", value: "case" },
  { label: "Documents", value: "document" },
  { label: "Clients", value: "client" },
  { label: "Time", value: "time_entry" },
  { label: "Users", value: "user" },
];

const STATUS_OPTIONS = ["OPEN", "PENDING", "ON_HOLD", "CLOSED", "UNBILLED", "DRAFT", "FINAL"];

const useDebounce = (value: string, delay = 160) => {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const fetchSearchResults = async (params: {
  term: string;
  types: string[];
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const searchParams = new URLSearchParams({ term: params.term });
  if (params.types.length && params.types.length < TYPE_OPTIONS.length) {
    searchParams.set("types", params.types.join(","));
  }
  if (params.status) searchParams.set("status", params.status);
  if (params.dateFrom) searchParams.set("from", params.dateFrom);
  if (params.dateTo) searchParams.set("to", params.dateTo);

  const res = await fetch(`/api/search?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as SearchResponse;
};

export const GlobalSearch = () => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");
  const [selectedTypes, setSelectedTypes] = React.useState<Set<string>>(new Set(TYPE_OPTIONS.map((t) => t.value)));
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>();
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);

  const debouncedTerm = useDebounce(term);
  const enabled = open && debouncedTerm.trim().length > 1;
  const typeArray = React.useMemo(() => Array.from(selectedTypes).sort(), [selectedTypes]);

  const { data, isFetching, error } = useQuery({
    queryKey: ["global-search", debouncedTerm, typeArray, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      fetchSearchResults({
        term: debouncedTerm,
        types: typeArray,
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled,
    staleTime: 30_000,
  });

  const groups = data?.data.groups ?? {};
  const totalHits = data?.data.total ?? 0;

  React.useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const stored = localStorage.getItem("lexora:recent-searches");
    if (!stored) return;
    try {
      setRecentSearches(JSON.parse(stored));
    } catch (_) {
      // ignore malformed cache
    }
  }, [open]);

  const persistRecent = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const next = [trimmed, ...recentSearches.filter((entry: any) => entry !== trimmed)].slice(0, 8);
      setRecentSearches(next);
      localStorage.setItem("lexora:recent-searches", JSON.stringify(next));
    },
    [recentSearches]
  );

  const toggleType = (value: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      if (next.size === 0) {
        return new Set([value]);
      }
      return next;
    });
  };

  const handleResultSelect = (hit: SearchResultHit, action: "open" | "details" = "open") => {
    persistRecent(term || debouncedTerm);
    const targetUrl = action === "open" ? hit.url : `${hit.url}?view=details`;
    router.push(targetUrl);
    setOpen(false);
  };

  const renderGroups = () => {
    if (!enabled) return null;
    return Object.entries(groups)
      .filter(([, hits]) => hits?.length)
      .map(([type, hits]) => (
        <Command.Group key={type} heading={`${ENTITY_LABELS[type] ?? type} (${hits.length})`}>
          {hits.map((hit) => (
            <Command.Item
              key={`${type}-${hit.id}`}
              value={`${type}-${hit.id}`}
              onSelect={() => handleResultSelect(hit)}
              className="flex items-start justify-between gap-4 rounded-md border px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{hit.title}</p>
                  {hit.status && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{hit.status}</span>}
                </div>
                {hit.subtitle && <p className="truncate text-xs text-muted-foreground">{hit.subtitle}</p>}
                {hit.snippet && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleResultSelect(hit, "open");
                  }}
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleResultSelect(hit, "details");
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      ));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-primary hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 truncate">Search cases, documents, clients…</span>
        <kbd className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <Command.Dialog open={open} onOpenChange={setOpen} label="Global Search" className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-xl bg-background shadow-2xl">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              value={term}
              onValueChange={setTerm}
              placeholder="Search Lexora (⌘K)"
              className="w-full bg-transparent text-sm outline-none"
              autoFocus
            />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CornerDownLeft className="h-3 w-3" /> Enter to open
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleType(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    selectedTypes.has(option.value) ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Select value={statusFilter ?? ""} onValueChange={(value) => setStatusFilter(value || undefined)}>
              <SelectTrigger className="h-7 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <Input value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} type="date" className="h-7 w-32 text-xs" />
              </div>
              <span className="text-muted-foreground">→</span>
              <Input value={dateTo} onChange={(event) => setDateTo(event.target.value)} type="date" className="h-7 w-32 text-xs" />
            </div>
          </div>
          <Command.List className="max-h-[60vh] overflow-y-auto px-4 py-3">
            {isFetching && (
              <Command.Loading>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Fetching results…
                </div>
              </Command.Loading>
            )}
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {(error as Error).message || "Search failed"}
              </div>
            )}
            {enabled && !isFetching && totalHits === 0 && (
              <Command.Empty>
                <p className="text-center text-sm text-muted-foreground">No matches yet. Try a broader query.</p>
              </Command.Empty>
            )}
            {renderGroups()}
            {!enabled && recentSearches.length > 0 && (
              <Command.Group heading="Recent searches">
                {recentSearches.map((entry: any) => (
                  <Command.Item key={entry} onSelect={() => setTerm(entry)} value={entry} className="flex items-center gap-2 px-3 py-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{entry}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </div>
      </Command.Dialog>
    </>
  );
};
