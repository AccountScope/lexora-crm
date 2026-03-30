"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Briefcase, Users, FileText, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchResult {
  id: string;
  type: "matter" | "client" | "document";
  title: string;
  subtitle?: string;
  url: string;
}

interface GlobalSearchProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [openLocal, setOpenLocal] = useState(false);
  const isOpen = typeof open === "boolean" ? open : openLocal;
  const setOpen = onOpenChange ?? setOpenLocal;
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          router.push(results[selectedIndex].url);
          setOpen(false);
          setQuery("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, setOpen]);

  // Search function (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        // const data = await response.json();
        
        // Mock data for demo
        const mockResults: SearchResult[] = [
          {
            id: "1",
            type: "matter",
            title: "Smith vs. Johnson Employment Dispute",
            subtitle: "MAT-187 • Tech Innovations Ltd",
            url: "/cases/1",
          },
          {
            id: "2",
            type: "client",
            title: "Stratford Manufacturing Ltd",
            subtitle: "CLT-001 • 3 active matters",
            url: "/clients/c1000000-0000-0000-0000-000000000001",
          },
          {
            id: "3",
            type: "document",
            title: "Employment Contract - Final.pdf",
            subtitle: "Uploaded 2 days ago",
            url: "/documents/3",
          },
        ].map(r => ({...r, type: r.type as SearchResult["type"]})).
        filter((item) =>
          item.title.toLowerCase().includes(query.toLowerCase())
        );

        setResults(mockResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
    setQuery("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "matter":
        return Briefcase;
      case "client":
        return Users;
      case "document":
        return FileText;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "matter":
        return "text-blue-500";
      case "client":
        return "text-green-500";
      case "document":
        return "text-purple-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search matters, clients, documents..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-10 text-base"
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Start typing to search...
              </p>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono">
                  <span className="text-xs">↑</span>
                  <span className="text-xs">↓</span>
                </kbd>
                <span>Navigate</span>
                <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono">
                  <span className="text-xs">↵</span>
                </kbd>
                <span>Select</span>
                <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono">
                  <span className="text-xs">ESC</span>
                </kbd>
                <span>Close</span>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className={cn("shrink-0", getTypeColor(result.type))}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <kbd className="pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs">
                        ↵
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
          <span className="hidden sm:inline">
            Press{" "}
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-background px-1.5 font-mono">
              ⌘K
            </kbd>{" "}
            to search anytime
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
