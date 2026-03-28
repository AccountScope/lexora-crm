"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ConflictCheckRecord } from "@/types";

const statusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Waived", value: "waived" },
  { label: "Rejected", value: "rejected" },
  { label: "Escalated", value: "escalated" },
];

const statusBadge: Record<string, string> = {
  pending: "outline",
  accepted: "secondary",
  waived: "secondary",
  rejected: "destructive",
  escalated: "destructive",
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const useDebouncedValue = (value: string, delay = 400) => {
  const [state, setState] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setState(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return state;
};

const exportPdf = (records: ConflictCheckRecord[]) => {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.text("Conflict checks", 14, 16);
  autoTable(doc, {
    startY: 22,
    head: [["Date", "Requestor", "Client", "Opposing parties", "Summary", "Status"]],
    body: records.map((record) => [
      formatDate(record.createdAt),
      record.requestedBy.name,
      record.clientName,
      record.opposingParties.join(", "),
      `${record.summary.high} high / ${record.summary.medium} med / ${record.summary.low} low`,
      record.status,
    ]),
  });
  doc.save("lexora-conflicts.pdf");
};

const exportCsv = (records: ConflictCheckRecord[]) => {
  const escape = (value: string) => value.replace(/"/g, '""');
  const header = ["Date", "Requestor", "Client", "Opposing parties", "Other parties", "Status", "Summary"];
  const rows = records.map((record) => [
    formatDate(record.createdAt),
    record.requestedBy.name,
    record.clientName,
    escape(record.opposingParties.join(";")),
    escape(record.otherParties.join(";")),
    record.status,
    `${record.summary.total} total (${record.summary.high}/${record.summary.medium}/${record.summary.low})`,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lexora-conflicts.csv";
  link.click();
  URL.revokeObjectURL(url);
};


export const ConflictRecordsView = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const debouncedSearch = useDebouncedValue(search);
  const filters = useMemo(() => ({ search: debouncedSearch || undefined, status: status || undefined }), [debouncedSearch, status]);
  // TODO: Implement conflict hooks
  const { data, isFetching } = { data: { data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } }, isFetching: false }; // useConflictChecks(filters);
  const conflicts = data?.data ?? [];
  const watchList = { data: { data: [] } }; // useWatchList();
  const addEntry = { mutate: () => {}, mutateAsync: async () => {}, isPending: false }; // useAddWatchListEntry();
  const removeEntry = { mutate: () => {}, mutateAsync: async () => {}, isPending: false }; // useRemoveWatchListEntry();
  const [watchParty, setWatchParty] = useState("");
  const [watchReason, setWatchReason] = useState("");

  const handleAddWatch = async () => {
    if (!watchParty.trim()) return;
    await addEntry.mutateAsync({ partyName: watchParty.trim(), reason: watchReason || undefined });
    setWatchParty("");
    setWatchReason("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Conflict history</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by client or party"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="max-w-xs"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.label} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCsv(conflicts)} disabled={!conflicts.length}>
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportPdf(conflicts)} disabled={!conflicts.length}>
                Export PDF
              </Button>
              <Button size="sm" asChild>
                <Link href="/conflicts/check">Run new check</Link>
              </Button>
            </div>
          </CardContent>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Requestor</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Opposing parties</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict: any) => (
                    <TableRow key={conflict.id}>
                      <TableCell>{formatDate(conflict.createdAt)}</TableCell>
                      <TableCell>{conflict.requestedBy.name}</TableCell>
                      <TableCell>{conflict.clientName}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {conflict.opposingParties.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {conflict.summary.high} high / {conflict.summary.medium} med / {conflict.summary.low} low
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadge[conflict.status] ?? "outline"}>{conflict.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="link" className="p-0" asChild>
                          <Link href={`/conflicts/${conflict.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!conflicts.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                        {isFetching ? "Loading conflicts…" : "No conflict checks recorded"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {data?.meta && (
            <CardFooter className="text-xs text-muted-foreground">
              Showing {(data.meta.page - 1) * data.meta.pageSize + 1}–
              {Math.min(data.meta.page * data.meta.pageSize, data.meta.total)} of {data.meta.total}
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Watch list</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="watch-party">Party name</Label>
              <Input
                id="watch-party"
                value={watchParty}
                onChange={(event) => setWatchParty(event.target.value)}
                placeholder="VIP client, restricted party"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="watch-reason">Reason</Label>
              <Textarea
                id="watch-reason"
                rows={3}
                value={watchReason}
                onChange={(event) => setWatchReason(event.target.value)}
                placeholder="Explain why this party is monitored"
              />
            </div>
            <Button type="button" onClick={handleAddWatch} disabled={addEntry.isPending}>
              {addEntry.isPending ? "Adding…" : "Add to watch list"}
            </Button>
            <div className="space-y-2">
              {(watchList.data?.data ?? []).map((entry: any) => (
                <div key={entry.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{entry.partyName}</p>
                      <p className="text-xs text-muted-foreground">{entry.reason ?? "No reason provided"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry.mutateAsync(entry.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {!watchList.data?.data?.length && (
                <p className="text-sm text-muted-foreground">No parties on watch list.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
