"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConflictCheck, useUpdateConflictStatus } from "@/lib/hooks/use-conflicts";
import { ConflictResults } from "@/components/conflicts/conflict-results";
import { WaiverGenerator } from "@/components/conflicts/waiver-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusLabels = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accept case" },
  { value: "waived", label: "Waive with consent" },
  { value: "rejected", label: "Reject case" },
  { value: "escalated", label: "Escalate" },
];

export const ConflictDetailView = ({ conflictId }: { conflictId: string }) => {
  const { data, isLoading } = useConflictCheck(conflictId);
  const detail = data?.data;
  const [status, setStatus] = useState(detail?.status ?? "pending");
  const [notes, setNotes] = useState(detail?.resolutionNotes ?? "");
  const mutation = useUpdateConflictStatus(conflictId);

  useEffect(() => {
    if (detail) {
      setStatus(detail.status);
      setNotes(detail.resolutionNotes ?? "");
    }
  }, [detail]);

  const parties = useMemo(() => Array.from(new Set(detail?.conflicts.map((conflict: any) => conflict.partyName) ?? [])), [
    detail,
  ]);

  if (isLoading || !detail) {
    return <p className="text-sm text-muted-foreground">Loading conflict check…</p>;
  }

  const submit = () => {
    mutation.mutate({ status, resolutionNotes: notes || undefined });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">{detail.clientName}</CardTitle>
            <p className="text-sm text-muted-foreground">Requested by {detail.requestedBy.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{detail.status}</Badge>
            <Badge variant="outline">{parties.length} parties</Badge>
            <Badge variant="outline">{detail.summary.total} conflicts</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <p className="text-xs uppercase">Created</p>
            <p className="font-medium text-foreground">{new Date(detail.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase">Opposing parties</p>
            <p className="font-medium text-foreground">{detail.opposingParties.join(", ")}</p>
          </div>
          <div>
            <p className="text-xs uppercase">Other parties</p>
            <p className="font-medium text-foreground">{detail.otherParties.join(", ") || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_1fr]">
        <div className="space-y-4">
          <ConflictResults summary={detail.summary} conflicts={detail.conflicts} />
          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.auditTrail.map((entry: any) => (
                <div key={entry.id} className="border-l-2 border-border pl-4 text-sm">
                  <p className="font-medium text-foreground">{entry.action.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()} · {entry.actor?.name ?? "System"}
                  </p>
                  {entry.notes && <p className="text-muted-foreground">{entry.notes}</p>}
                </div>
              ))}
              {!detail.auditTrail.length && <p className="text-sm text-muted-foreground">No activity recorded.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Waivers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {detail.waivers.map((waiver) => (
                <div key={waiver.id} className="rounded-md border p-3">
                  <p className="font-medium text-foreground">Signed by {waiver.signedBy ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    {waiver.signedAt ? new Date(waiver.signedAt).toLocaleDateString() : "Pending signature"}
                  </p>
                  <p className="text-xs text-muted-foreground">Expires {waiver.expiresAt ? new Date(waiver.expiresAt).toLocaleDateString() : "N/A"}</p>
                </div>
              ))}
              {!detail.waivers.length && <p className="text-sm text-muted-foreground">No waivers saved.</p>}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusLabels.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resolution notes</Label>
                <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={submit} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Update"}
              </Button>
            </CardFooter>
          </Card>
          <WaiverGenerator
            conflictCheckId={conflictId}
            clientName={detail.clientName}
            parties={parties}
            caseType={detail.caseType}
            defaultSummary={detail.description ?? undefined}
          />
        </div>
      </div>
    </div>
  );
};
