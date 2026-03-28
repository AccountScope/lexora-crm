"use client";

import { useMemo, useState } from "react";
import type { ReportConfig, ReportResultPayload } from "@/types";
import { reportTypeOptions, REPORT_DEFINITIONS, dateRangePresets } from "@/lib/reports/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterBuilder } from "@/components/reports/filter-builder";
import { ReportChart } from "@/components/reports/report-chart";
import { ReportTable } from "@/components/reports/report-table";
import { ExportButtons, type ExportFormat } from "@/components/reports/export-buttons";
import type { ReportFieldDefinition } from "@/lib/reports/definitions";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ReportBuilderProps {
  initialName?: string;
  initialDescription?: string;
  initialConfig?: ReportConfig;
  preview?: ReportResultPayload | null;
  previewing?: boolean;
  saving?: boolean;
  exporting?: boolean;
  onPreview: (config: ReportConfig) => Promise<void>;
  onSave?: (payload: { name: string; description?: string; config: ReportConfig }) => Promise<void>;
  onExport?: (format: ExportFormat, config: ReportConfig) => Promise<void>;
}

const defaultConfig = (type: ReportConfig["type"]): ReportConfig => {
  const definition = REPORT_DEFINITIONS[type];
  return {
    type,
    dateRange: { preset: "last_30_days" },
    fields: definition.defaultFields,
    filters: [],
    filterLogic: "AND",
    groupBy: definition.groupBy[0]?.key,
    sort: definition.defaultFields.length
      ? { field: definition.defaultFields[0], direction: "desc" }
      : undefined,
    limit: 50,
    visualization: { chart: definition.groupBy.length ? "bar" : "table", metric: definition.metrics[0]?.key },
  };
};

export const ReportBuilder = ({
  initialName = "Untitled report",
  initialDescription = "",
  initialConfig,
  preview,
  previewing,
  saving,
  exporting,
  onPreview,
  onSave,
  onExport,
}: ReportBuilderProps) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [config, setConfig] = useState<ReportConfig>(initialConfig ?? defaultConfig(reportTypeOptions[0].value as ReportConfig["type"]));

  const definition = REPORT_DEFINITIONS[config.type];
  const fieldList = useMemo<ReportFieldDefinition[]>(() => Object.values(definition.fields), [definition]);

  const updateConfig = (patch: Partial<ReportConfig>) => {
    setConfig((current) => ({
      ...current,
      ...patch,
      filters: patch.filters ?? current.filters,
      fields: patch.fields ?? current.fields,
    }));
  };

  const handleTypeChange = (value: string) => {
    const nextType = value as ReportConfig["type"];
    setConfig(defaultConfig(nextType));
  };

  const toggleField = (fieldKey: string) => {
    setConfig((current) => {
      const exists = current.fields.includes(fieldKey);
      if (exists && current.fields.length === 1) {
        return current;
      }
      const nextFields = exists ? current.fields.filter((field) => field !== fieldKey) : [...current.fields, fieldKey];
      return { ...current, fields: nextFields };
    });
  };

  const handlePreview = async () => {
    await onPreview(config);
  };

  const handleSave = async () => {
    if (!onSave) return;
    await onSave({ name, description, config });
  };

  const handleExport = async (format: ExportFormat) => {
    if (!onExport) return;
    await onExport(format, config);
  };

  const previewColumns = preview?.columns?.length
    ? preview.columns
    : config.fields.map((key) => ({ key, label: definition.fields[key]?.label ?? key, type: definition.fields[key]?.type ?? "string" }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Report type</Label>
            <Select value={config.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date range</Label>
              <Select
                value={config.dateRange?.preset ?? "last_30_days"}
                onValueChange={(value) =>
                  updateConfig({ dateRange: value === "custom" ? { preset: value, startDate: config.dateRange?.startDate, endDate: config.dateRange?.endDate } : { preset: value as ReportConfig["dateRange"]!["preset"] } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangePresets.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config.dateRange?.preset === "custom" && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="date"
                    value={config.dateRange.startDate ?? ""}
                    onChange={(event) => updateConfig({ dateRange: { ...config.dateRange, startDate: event.target.value } })}
                  />
                  <Input
                    type="date"
                    value={config.dateRange.endDate ?? ""}
                    onChange={(event) => updateConfig({ dateRange: { ...config.dateRange, endDate: event.target.value } })}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Group by</Label>
              <Select value={config.groupBy ?? ""} onValueChange={(value) => updateConfig({ groupBy: value || undefined })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {definition.groupBy.map((group) => (
                    <SelectItem key={group.key} value={group.key}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
              <div className="flex gap-2">
                <Select value={config.sort?.field ?? config.fields[0]} onValueChange={(value) => updateConfig({ sort: { ...(config.sort ?? { direction: "desc" }), field: value } })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.fields.map((fieldKey) => (
                      <SelectItem key={fieldKey} value={fieldKey}>
                        {definition.fields[fieldKey]?.label ?? fieldKey}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={config.sort?.direction ?? "desc"}
                  onValueChange={(value) => updateConfig({ sort: { ...(config.sort ?? { field: config.fields[0] }), direction: value as "asc" | "desc" } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Fields</Label>
            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="grid gap-2 md:grid-cols-2">
                {fieldList.map((field) => (
                  <label key={field.key} className={cn("flex items-center gap-2 text-sm", !fieldList.length && "opacity-50") }>
                    <Checkbox checked={config.fields.includes(field.key)} onCheckedChange={() => toggleField(field.key)} />
                    {field.label}
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>

          <FilterBuilder
            fields={fieldList}
            filters={config.filters}
            logic={config.filterLogic ?? "AND"}
            onLogicChange={(value) => updateConfig({ filterLogic: value })}
            onChange={(filters) => updateConfig({ filters })}
          />

          <div className="space-y-2">
            <Label>Visualization</Label>
            <div className="flex gap-2">
              <Select
                value={config.visualization?.chart ?? "table"}
                onValueChange={(value) => updateConfig({ visualization: { ...(config.visualization ?? {}), chart: value as ReportConfig["visualization"]!["chart"] } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={config.visualization?.metric ?? definition.metrics[0]?.key}
                onValueChange={(value) => updateConfig({ visualization: { ...(config.visualization ?? {}), metric: value } })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Metric" />
                </SelectTrigger>
                <SelectContent>
                  {definition.metrics.map((metric) => (
                    <SelectItem key={metric.key} value={metric.key}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handlePreview} disabled={previewing}>
              {previewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Preview
            </Button>
            {onSave && (
              <Button type="button" variant="secondary" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save report
              </Button>
            )}
            <ExportButtons disabled={!onExport || exporting} onExport={handleExport} />
          </div>
        </CardContent>
      </Card>

      {preview?.kpis?.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {preview.kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{kpi.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{kpi.value}</p>
                {kpi.helper && <p className="text-xs text-muted-foreground">{kpi.helper}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <ReportChart chart={preview?.chart} />

      <ReportTable columns={previewColumns} rows={preview?.rows ?? []} isLoading={previewing} />
    </div>
  );
};
