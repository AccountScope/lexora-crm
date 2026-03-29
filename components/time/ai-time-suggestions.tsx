"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Mail, FileText, Sparkles, Check, X, Edit2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface TimeSuggestion {
  id: string;
  source: "email" | "calendar" | "document";
  sourceId: string;
  date: string;
  suggestedHours: number;
  description: string;
  matterId: string | null;
  matterTitle: string | null;
  clientName: string | null;
  confidence: number;
  rawData: any;
  activityCode?: string;
}

interface AITimeSuggestionsProps {
  onApprove?: (suggestions: TimeSuggestion[]) => Promise<void>;
}

export function AITimeSuggestions({ onApprove }: AITimeSuggestionsProps) {
  const [source, setSource] = useState<"email" | "calendar" | "document">("email");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingSuggestion, setEditingSuggestion] = useState<TimeSuggestion | null>(null);
  const [editedHours, setEditedHours] = useState<number>(0);
  const [editedDescription, setEditedDescription] = useState<string>("");

  const queryClient = useQueryClient();

  // Fetch AI suggestions
  const {
    data: suggestionsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["time-suggestions", source],
    queryFn: async () => {
      const endDate = new Date().toISOString().slice(0, 10);
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const res = await fetch("/api/time/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, startDate, endDate, limit: 50 }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch suggestions");
      }

      return res.json();
    },
    enabled: true,
  });

  const suggestions: TimeSuggestion[] = suggestionsData?.suggestions || [];
  const stats = suggestionsData?.stats || {
    totalSuggestions: 0,
    totalHours: 0,
    highConfidence: 0,
    needsReview: 0,
  };

  // Approve suggestions mutation
  const approveMutation = useMutation({
    mutationFn: async (suggestionsToApprove: TimeSuggestion[]) => {
      // Call onApprove callback if provided
      if (onApprove) {
        await onApprove(suggestionsToApprove);
      }

      // In production: POST to /api/time/bulk endpoint
      // For now: just log
      console.log("Approving suggestions:", suggestionsToApprove);
    },
    onSuccess: () => {
      // Clear selections
      setSelectedIds(new Set());
      // Refetch suggestions
      queryClient.invalidateQueries({ queryKey: ["time-suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map((s) => s.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApproveSelected = async () => {
    const selected = suggestions.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) return;
    await approveMutation.mutateAsync(selected);
  };

  const handleReject = (id: string) => {
    // Remove from list (in production: mark as rejected in DB)
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleEdit = (suggestion: TimeSuggestion) => {
    setEditingSuggestion(suggestion);
    setEditedHours(suggestion.suggestedHours);
    setEditedDescription(suggestion.description);
  };

  const handleSaveEdit = () => {
    if (!editingSuggestion) return;
    
    // Update suggestion in place
    const updated = suggestions.map((s) =>
      s.id === editingSuggestion.id
        ? { ...s, suggestedHours: editedHours, description: editedDescription }
        : s
    );

    // In production: update via API
    console.log("Updated suggestion:", updated);
    setEditingSuggestion(null);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "calendar":
        return <Calendar className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge variant="default" className="bg-green-500">High</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge variant="secondary">Medium</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  const selectedSuggestions = suggestions.filter((s) => selectedIds.has(s.id));
  const selectedHours = selectedSuggestions.reduce((sum, s) => sum + s.suggestedHours, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <CardTitle>AI Time Capture</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
          <CardDescription>
            AI analyzes your emails, calendar, and documents to suggest time entries.
            Review and approve with one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source tabs */}
          <div className="flex gap-2">
            <Button
              variant={source === "email" ? "default" : "outline"}
              size="sm"
              onClick={() => setSource("email")}
            >
              <Mail className="w-4 h-4 mr-2" />
              Emails
            </Button>
            <Button
              variant={source === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setSource("calendar")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={source === "document" ? "default" : "outline"}
              size="sm"
              onClick={() => setSource("document")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Suggestions</p>
              <p className="text-2xl font-bold">{stats.totalSuggestions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{stats.totalHours.toFixed(1)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">High Confidence</p>
              <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Needs Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.needsReview}</p>
            </div>
          </div>

          {/* Bulk actions */}
          {suggestions.length > 0 && (
            <div className="flex items-center justify-between border-y py-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedIds.size === suggestions.length && suggestions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} of {suggestions.length} selected
                  {selectedIds.size > 0 && ` (${selectedHours.toFixed(1)} hours)`}
                </span>
              </div>
              <Button
                onClick={handleApproveSelected}
                disabled={selectedIds.size === 0 || approveMutation.isPending}
                size="sm"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Approve Selected
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Suggestions table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-destructive">Failed to load suggestions</p>
              <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No suggestions found</p>
              <p className="text-sm text-muted-foreground">
                Check back later or try a different source
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Matter</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map((suggestion) => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(suggestion.id)}
                          onCheckedChange={() => handleToggleSelect(suggestion.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSourceIcon(suggestion.source)}
                          <span className="text-sm capitalize">{suggestion.source}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(suggestion.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {suggestion.matterTitle ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{suggestion.matterTitle}</p>
                            {suggestion.clientName && (
                              <p className="text-xs text-muted-foreground">
                                {suggestion.clientName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-yellow-600">
                            No match
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate" title={suggestion.description}>
                          {suggestion.description}
                        </p>
                        {suggestion.activityCode && (
                          <p className="text-xs text-muted-foreground">
                            {suggestion.activityCode}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {suggestion.suggestedHours.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>{getConfidenceBadge(suggestion.confidence)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(suggestion)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(suggestion.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingSuggestion} onOpenChange={() => setEditingSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Suggestion</DialogTitle>
            <DialogDescription>
              Adjust the hours or description before approving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-hours">Hours</Label>
              <Input
                id="edit-hours"
                type="number"
                step="0.1"
                min="0.1"
                value={editedHours}
                onChange={(e) => setEditedHours(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSuggestion(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
