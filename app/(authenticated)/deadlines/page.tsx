"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DeadlineCalendarView } from "@/components/deadlines/calendar-view";
import { DeadlineForm } from "@/components/deadlines/deadline-form";
import {
  useCreateDeadlineTemplate,
  useDeadlineTemplates,
  useDeadlines,
  useUpcomingDeadlines,
} from "@/lib/hooks/use-deadlines";
import type { DeadlineRecord } from "@/types/domain";

const priorityColors: Record<string, string> = {
  HIGH: "bg-destructive/15 text-destructive border-destructive/40",
  MEDIUM: "bg-amber-500/15 text-amber-700 border-amber-200",
  LOW: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
};

const statusFilters = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Overdue", value: "overdue" },
  { label: "Completed", value: "completed" },
];

export default function DeadlinesPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [range, setRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    return { start, end };
  });
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");
  const { data: deadlinesData, isLoading } = useDeadlines({
    rangeStart: range.start,
    rangeEnd: range.end,
    overdueOnly: statusFilter === "overdue",
    upcomingOnly: statusFilter === "upcoming",
    statuses: statusFilter === "completed" ? ["COMPLETED"] : undefined,
  });
  const { data: upcoming } = useUpcomingDeadlines(5);
  const { data: templates } = useDeadlineTemplates();
  const templateMutation = useCreateDeadlineTemplate();
  const deadlines = deadlinesData?.data ?? [];

  const overdueCount = deadlines.filter((deadline) => deadline.isOverdue).length;

  const onRangeChange = (next: { start: Date; end: Date }) => {
    setRange({ start: next.start.toISOString(), end: next.end.toISOString() });
  };

  const handleTemplateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      label: String(formData.get("label")),
      offsetDays: Number(formData.get("offsetDays")),
      reminderOffsets: String(formData.get("reminders"))
        .split(",")
        .map((entry) => Number(entry.trim()))
        .filter((entry) => !Number.isNaN(entry)),
      jurisdiction: String(formData.get("jurisdiction")),
      description: String(formData.get("description")),
    };
    await templateMutation.mutateAsync(payload);
    event.currentTarget.reset();
  };

  const listView = useMemo(() => (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deadline</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Case</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deadlines.map((deadline) => (
            <TableRow key={deadline.id} className="align-top">
              <TableCell>
                <p className="font-medium">{deadline.title}</p>
                {deadline.description && (
                  <p className="text-xs text-muted-foreground">{deadline.description}</p>
                )}
                {deadline.isOverdue && deadline.status !== "COMPLETED" && (
                  <Badge className="mt-2" variant="warning">
                    Overdue
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(deadline.dueDate).toLocaleString()}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true })}
                </p>
              </TableCell>
              <TableCell>
                {deadline.case ? (
                  <div>
                    <p className="text-sm font-medium">{deadline.case.title}</p>
                    <p className="text-xs text-muted-foreground">{deadline.case.matterNumber}</p>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unlinked</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[deadline.priority] ?? "bg-primary/10 text-primary border-transparent"}>
                  {deadline.priority}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={deadline.status === "COMPLETED" ? "success" : "secondary"}>{deadline.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
          {!deadlines.length && (
            <TableRow>
              <TableCell className="text-sm text-muted-foreground" colSpan={5}>
                No deadlines match this filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  ), [deadlines]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Critical deadlines</h1>
          <p className="text-sm text-muted-foreground">Never miss a court filing or client promise again.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create deadline</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Quick add deadline</DialogTitle>
            </DialogHeader>
            <DeadlineForm onSuccess={() => {}} templates={templates?.data ?? []} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Next up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcoming?.data ?? []).map((deadline) => (
              <div key={deadline.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{deadline.title}</p>
                  <Badge className={priorityColors[deadline.priority] ?? "bg-primary/10 text-primary border-transparent"}>
                    {deadline.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true })}
                </p>
              </div>
            ))}
            {!(upcoming?.data?.length ?? 0) && <p className="text-xs text-muted-foreground">No upcoming items.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold text-destructive">{overdueCount}</div>
            <p className="text-sm text-muted-foreground">
              Items past due in the current window. Review and resolve.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Rules engine</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={handleTemplateSubmit}>
              <Input name="label" placeholder="Template name" required />
              <Input name="jurisdiction" placeholder="Jurisdiction" />
              <Input name="offsetDays" placeholder="Offset days" required type="number" />
              <Input name="reminders" placeholder="Reminders (7,3,1)" />
              <Input name="description" placeholder="Notes" />
              <Button className="w-full" disabled={templateMutation.isPending} type="submit" variant="secondary">
                {templateMutation.isPending ? "Saving…" : "Save rule"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs className="w-full md:w-auto" onValueChange={(val) => setView(val as "calendar" | "list")} value={view}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs className="w-full md:w-auto" onValueChange={setStatusFilter} value={statusFilter}>
            <TabsList>
              {statusFilters.map((filter) => (
                <TabsTrigger key={filter.value} value={filter.value}>
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="mt-4">
          {view === "calendar" ? (
            <DeadlineCalendarView deadlines={deadlines} onRangeChange={onRangeChange} />
          ) : (
            listView
          )}
        </div>
      </div>
    </div>
  );
}
