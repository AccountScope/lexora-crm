"use client";

import { useEffect, useMemo, useState } from "react";
import type { CaseSummary } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";

interface TimerProps {
  matters: CaseSummary[];
  onSubmit: (payload: {
    matterId: string;
    clientId: string;
    description: string;
    hours: number;
    workDate: string;
    billable: boolean;
    startedAt?: string;
    endedAt?: string;
    activityCode?: string;
  }) => Promise<void>;
  saving?: boolean;
}

interface TimerState {
  running: boolean;
  startedAt: string | null;
  matterId: string;
  description: string;
  billable: boolean;
  activityCode?: string;
}

const STORAGE_KEY = "lexora-time-tracker";

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

export const Timer = ({ matters, onSubmit, saving }: TimerProps) => {
  const [state, setState] = useState<TimerState>({
    running: false,
    startedAt: null,
    matterId: "",
    description: "",
    billable: true,
    activityCode: undefined,
  });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selectedMatter = useMemo(() => matters.find((matter) => matter.id === state.matterId), [matters, state.matterId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TimerState & { elapsedMs?: number };
        setState((current) => ({ ...current, ...parsed }));
        if (parsed.startedAt) {
          const diff = Date.now() - new Date(parsed.startedAt).getTime();
          setElapsedMs(parsed.elapsedMs ?? diff);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, elapsedMs }));
  }, [state, elapsedMs]);

  useEffect(() => {
    if (!state.running || !state.startedAt) return;
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - new Date(state.startedAt as string).getTime());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [state.running, state.startedAt]);

  const handleStart = () => {
    if (!state.matterId) {
      setError("Select a matter to start tracking.");
      return;
    }
    setError(null);
    const now = new Date().toISOString();
    setState((current) => ({ ...current, running: true, startedAt: now }));
    setElapsedMs(0);
  };

  const handleReset = () => {
    setState((current) => ({ ...current, running: false, startedAt: null }));
    setElapsedMs(0);
  };

  const handleStop = async () => {
    if (!state.startedAt || !state.matterId) {
      return;
    }
    const endedAt = new Date().toISOString();
    const startedAt = state.startedAt;
    const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
    const hours = Math.max(durationMs / 1000 / 3600, 0.1);
    const clientId = selectedMatter?.client.id;
    if (!clientId) {
      setError("Matter is missing client context.");
      return;
    }

    await onSubmit({
      matterId: state.matterId,
      clientId,
      description: state.description || `Timer entry for ${selectedMatter?.title}`,
      hours: Number(hours.toFixed(2)),
      workDate: endedAt.slice(0, 10),
      billable: state.billable,
      startedAt,
      endedAt,
      activityCode: state.activityCode,
    });

    setState((current) => ({
      ...current,
      running: false,
      startedAt: null,
      description: "",
    }));
    setElapsedMs(0);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick timer</CardTitle>
        <CardDescription>Start/stop precision tracking with matter context.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4">
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Matter</Label>
            <Select value={state.matterId} onValueChange={(value) => setState((current) => ({ ...current, matterId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select matter" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {matters.map((matter) => (
                  <SelectItem key={matter.id} value={matter.id}>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{matter.title}</span>
                      <span className="text-xs text-muted-foreground">{matter.client.displayName ?? matter.client.legalName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Draft response memo, board prep, mediation prep…"
              value={state.description}
              onChange={(event) => setState((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label>Activity code</Label>
              <Input
                placeholder="e.g. L110"
                value={state.activityCode ?? ""}
                onChange={(event) => setState((current) => ({ ...current, activityCode: event.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 px-2">
              <Switch
                id="timer-billable"
                checked={state.billable}
                onCheckedChange={(value) => setState((current) => ({ ...current, billable: value }))}
              />
              <Label htmlFor="timer-billable">Billable</Label>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/40 p-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Elapsed</div>
          <div className="text-4xl font-mono font-semibold">{formatDuration(elapsedMs)}</div>
          <div className="flex gap-2">
            {!state.running ? (
              <Button onClick={handleStart} disabled={!state.matterId || saving}>Start</Button>
            ) : (
              <Button variant="destructive" onClick={handleStop} disabled={saving}>
                Stop &amp; log
              </Button>
            )}
            <Button variant="outline" onClick={handleReset} disabled={state.running || (!state.startedAt && elapsedMs === 0)}>
              Reset
            </Button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className={cn("text-xs text-muted-foreground", !state.startedAt && "opacity-70")}>Started at: {state.startedAt ? new Date(state.startedAt).toLocaleString() : "—"}</div>
      </CardContent>
    </Card>
  );
};
