"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/page-header";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timer } from "@/components/time/timer";
import { useCases } from "@/lib/hooks/use-cases";
import {
  useBulkTimeEntries,
  useCreateTimeEntry,
  useTemplateMutation,
  useTimeEntries,
} from "@/lib/hooks/use-billing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { CaseSummary, TimeEntryTemplate } from "@/types/domain";
import { format } from "date-fns";

const manualEntrySchema = z.object({
  matterId: z.string().uuid(),
  description: z.string().min(3),
  workDate: z.string().min(8),
  hours: z.coerce.number().positive(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  billable: z.boolean().default(true),
  activityCode: z.string().optional(),
});

type ManualEntryValues = z.infer<typeof manualEntrySchema>;

interface BulkRow extends ManualEntryValues {}

const defaultDate = () => new Date().toISOString().slice(0, 10);

const TimeTrackingPage = () => {
  const [filters, setFilters] = useState<{ clientId?: string; status?: string; billable?: string; startDate?: string; endDate?: string }>({});
  const { data: mattersData } = useCases();
  const matters = mattersData?.data ?? [];
  const clients = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    matters.forEach((matter) => {
      const label = matter.client.displayName ?? matter.client.legalName;
      map.set(matter.client.id, { id: matter.client.id, label });
    });
    return Array.from(map.values());
  }, [matters]);

  const billableFilter = filters.billable === undefined ? undefined : filters.billable === "true" ? true : filters.billable === "false" ? false : undefined;

  const { data: timeData, isFetching } = useTimeEntries({
    clientId: filters.clientId,
    status: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
    billable: billableFilter,
    limit: 100,
  });
  const entries = timeData?.data.entries ?? [];
  const summary = timeData?.data.summary ?? { billableHours: 0, nonBillableHours: 0, unbilledAmount: 0 };
  const templates = timeData?.data.templates ?? [];

  const createEntry = useCreateTimeEntry();
  const bulkEntry = useBulkTimeEntries();
  const templateMutation = useTemplateMutation();

  const manualForm = useForm<ManualEntryValues>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      matterId: "",
      description: "",
      workDate: defaultDate(),
      hours: 1,
      hourlyRate: undefined,
      billable: true,
    },
  });

  useEffect(() => {
    manualForm.register("matterId", { required: true });
  }, [manualForm]);

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    {
      matterId: "",
      description: "",
      workDate: defaultDate(),
      hours: 1,
      hourlyRate: undefined,
      billable: true,
      activityCode: undefined,
    },
  ]);

  const applyTemplate = (template: TimeEntryTemplate) => {
    manualForm.reset({
      matterId: template.matterId ?? "",
      description: template.description ?? template.label,
      workDate: defaultDate(),
      hours: template.defaultHours,
      hourlyRate: template.defaultRate,
      billable: template.defaultBillable,
      activityCode: template.defaultActivityCode ?? undefined,
    });
  };

  const submitManual = manualForm.handleSubmit(async (values) => {
    const matter = matters.find((item) => item.id === values.matterId);
    if (!matter) {
      return;
    }
    await createEntry.mutateAsync({
      ...values,
      clientId: matter.client.id,
    });
    manualForm.reset({ ...values, description: "", hours: 1 });
  });

  const saveTimerEntry = async (payload: any) => {
    await createEntry.mutateAsync(payload);
  };

  const addBulkRow = () => {
    setBulkRows((rows) => [
      ...rows,
      {
        matterId: "",
        description: "",
        workDate: defaultDate(),
        hours: 1,
        hourlyRate: undefined,
        billable: true,
      },
    ]);
  };

  const updateBulkRow = (index: number, key: keyof BulkRow, value: any) => {
    setBulkRows((rows) => rows.map((row, idx) => (idx === index ? { ...row, [key]: value } : row)));
  };

  const submitBulk = async () => {
    const payload = bulkRows
      .filter((row) => row.matterId && row.description)
      .map((row) => {
        const matter = matters.find((item) => item.id === row.matterId);
        if (!matter) return null;
        return { ...row, clientId: matter.client.id };
      })
      .filter(Boolean) as (BulkRow & { clientId: string })[];

    if (!payload.length) return;
    await bulkEntry.mutateAsync({ entries: payload, batchLabel: `Bulk-${format(new Date(), "yyyyMMdd-HHmm")}` });
    setBulkRows((rows) =>
      rows.map((row) => ({ ...row, description: "", hours: 1, hourlyRate: row.hourlyRate }))
    );
  };

  const createTemplate = async (template: Partial<TimeEntryTemplate>) => {
    await templateMutation.mutateAsync({
      label: template.label,
      description: template.description,
      defaultHours: template.defaultHours ?? 1,
      defaultRate: template.defaultRate ?? 0,
      defaultBillable: template.defaultBillable ?? true,
      defaultActivityCode: template.defaultActivityCode,
      clientId: template.clientId,
      matterId: template.matterId,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracking & Billing"
        description="Real-time capture, templates, and billing controls your partners will adopt on day one"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Billable hours</CardTitle>
            <CardDescription>Captured this period</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.billableHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Hours waiting to be monetized.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Non-billable</CardTitle>
            <CardDescription>Tracking for compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{summary.nonBillableHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Coaching opportunities.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unbilled value</CardTitle>
            <CardDescription>Waiting to invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">£{summary.unbilledAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Convert to cash via invoice generator.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Timer matters={matters} onSubmit={saveTimerEntry} saving={createEntry.isPending} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Manual entry</CardTitle>
            <CardDescription>Structured capture with rate controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submitManual}>
              <div className="md:col-span-1">
                <Label>Matter</Label>
                <Select value={manualForm.watch("matterId") ?? ""} onValueChange={(value) => manualForm.setValue("matterId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select matter" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {matters.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Work date</Label>
                <Input type="date" value={manualForm.watch("workDate") ?? defaultDate()} onChange={(event) => manualForm.setValue("workDate", event.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="Summarize work performed" {...manualForm.register("description")} />
              </div>
              <div>
                <Label>Hours</Label>
                <Input type="number" step="0.1" min="0" {...manualForm.register("hours", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Hourly rate (£)</Label>
                <Input type="number" step="1" min="0" {...manualForm.register("hourlyRate", { valueAsNumber: true })} />
              </div>
              <div>
                <Label>Activity code</Label>
                <Input placeholder="e.g. L440" {...manualForm.register("activityCode")} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={manualForm.watch("billable") ?? true} onCheckedChange={(value) => manualForm.setValue("billable", value)} />
                <Label>Billable</Label>
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="submit" disabled={createEntry.isPending}>Log time</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      Save as template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New time template</DialogTitle>
                    </DialogHeader>
                    <TemplateForm matters={matters} onSubmit={createTemplate} />
                  </DialogContent>
                </Dialog>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="bulk">Bulk entry</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div>
                <Label>Client</Label>
                <Select value={filters.clientId ?? ""} onValueChange={(value) => setFilters((current) => ({ ...current, clientId: value || undefined }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={filters.status ?? ""} onValueChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="UNBILLED">Unbilled</SelectItem>
                    <SelectItem value="INVOICED">Invoiced</SelectItem>
                    <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Billable</Label>
                <Select value={filters.billable ?? ""} onValueChange={(value) => setFilters((current) => ({ ...current, billable: value || undefined }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    <SelectItem value="true">Billable</SelectItem>
                    <SelectItem value="false">Non billable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>From</Label>
                  <Input type="date" value={filters.startDate ?? ""} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value || undefined }))} />
                </div>
                <div className="flex-1">
                  <Label>To</Label>
                  <Input type="date" value={filters.endDate ?? ""} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value || undefined }))} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Time entries</CardTitle>
              <CardDescription>{isFetching ? "Refreshing…" : `${entries.length} rows`}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matter</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="font-medium">{entry.matter.title}</div>
                        <div className="text-xs text-muted-foreground">{entry.description}</div>
                      </TableCell>
                      <TableCell>{entry.client.displayName ?? entry.client.legalName}</TableCell>
                      <TableCell>{format(new Date(entry.workDate), "dd MMM yyyy")}</TableCell>
                      <TableCell>{entry.hours.toFixed(2)}</TableCell>
                      <TableCell>£{entry.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "UNBILLED" ? "secondary" : "default"}>{entry.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!entries.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No entries match the filters yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Pre-approved narratives for recurring work.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{template.label}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm text-muted-foreground">{template.defaultHours}h @ £{template.defaultRate.toFixed(2)}</div>
                    <Button size="sm" onClick={() => applyTemplate(template)}>
                      Use template
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {!templates.length && <p className="text-sm text-muted-foreground">No templates yet—save one from the manual entry form.</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk capture</CardTitle>
              <CardDescription>Paste weekly sheets or enter multiple rows, then commit in one API call.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bulkRows.map((row, index) => (
                <div key={`bulk-${index}`} className="grid gap-3 md:grid-cols-5">
                  <Select value={row.matterId} onValueChange={(value) => updateBulkRow(index, "matterId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Matter" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {matters.map((matter) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          {matter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Description" value={row.description} onChange={(event) => updateBulkRow(index, "description", event.target.value)} />
                  <Input type="date" value={row.workDate} onChange={(event) => updateBulkRow(index, "workDate", event.target.value)} />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={row.hours}
                    onChange={(event) => {
                      const hoursValue = event.target.value;
                      updateBulkRow(index, "hours", hoursValue === "" ? 0 : Number(hoursValue));
                    }}
                  />
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={row.hourlyRate ?? ""}
                    onChange={(event) => {
                      const rateValue = event.target.value;
                      updateBulkRow(index, "hourlyRate", rateValue === "" ? undefined : Number(rateValue));
                    }}
                    placeholder="Rate"
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addBulkRow}>
                  Add row
                </Button>
                <Button type="button" onClick={submitBulk} disabled={bulkEntry.isPending}>
                  Submit {bulkRows.length} entr{bulkRows.length === 1 ? "y" : "ies"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface TemplateFormProps {
  matters: CaseSummary[];
  onSubmit: (template: Partial<TimeEntryTemplate>) => Promise<void>;
}

const TemplateForm = ({ matters, onSubmit }: TemplateFormProps) => {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [defaultHours, setDefaultHours] = useState(1);
  const [defaultRate, setDefaultRate] = useState(0);
  const [matterId, setMatterId] = useState<string>("");
  const [billable, setBillable] = useState(true);

  const submit = async () => {
    const selectedMatter = matters.find((matter) => matter.id === matterId);
    await onSubmit({
      label,
      description,
      defaultHours,
      defaultRate,
      defaultBillable: billable,
      matterId: matterId || undefined,
      clientId: selectedMatter?.client.id,
    });
    setLabel("");
    setDescription("");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Name</Label>
        <Input value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <div>
        <Label>Default matter</Label>
        <Select value={matterId} onValueChange={(value) => setMatterId(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Optional" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="">None</SelectItem>
            {matters.map((matter) => (
              <SelectItem key={matter.id} value={matter.id}>
                {matter.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Hours</Label>
          <Input type="number" step="0.1" min="0" value={defaultHours} onChange={(event) => setDefaultHours(Number(event.target.value))} />
        </div>
        <div>
          <Label>Rate</Label>
          <Input type="number" step="1" min="0" value={defaultRate} onChange={(event) => setDefaultRate(Number(event.target.value))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={billable} onCheckedChange={setBillable} />
        <Label>Billable</Label>
      </div>
      <Button onClick={submit} disabled={!label}>
        Save template
      </Button>
    </div>
  );
};

export default TimeTrackingPage;
