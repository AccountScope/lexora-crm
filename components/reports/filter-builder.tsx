"use client";

import { Plus, X } from "lucide-react";
import type { ReportFilter } from "@/types";
import type { ReportFieldDefinition } from "@/lib/reports/definitions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FilterBuilderProps {
  fields: ReportFieldDefinition[];
  filters: ReportFilter[];
  logic: "AND" | "OR";
  onLogicChange: (value: "AND" | "OR") => void;
  onChange: (filters: ReportFilter[]) => void;
}

const operatorLabels: Record<ReportFilter["operator"], string> = {
  equals: "Equals",
  contains: "Contains",
  greater_than: ">",
  less_than: "<",
  between: "Between",
  in_list: "In list",
};

export const FilterBuilder = ({ fields, filters, logic, onLogicChange, onChange }: FilterBuilderProps) => {
  const addFilter = () => {
    const firstField = fields[0];
    if (!firstField) return;
    onChange([
      ...filters,
      {
        field: firstField.key,
        operator: firstField.filterOperators[0] ?? "equals",
        value: "",
      },
    ]);
  };

  const updateFilter = (index: number, patch: Partial<ReportFilter>) => {
    onChange(filters.map((filter, idx) => (idx === index ? { ...filter, ...patch } : filter)));
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, idx) => idx !== index));
  };

  const renderValueInput = (filter: ReportFilter, definition?: ReportFieldDefinition, index?: number) => {
    const type = definition?.type ?? "string";
    if (filter.operator === "between") {
      return (
        <div className="flex gap-2">
          <Input
            type={type === "date" ? "date" : "text"}
            value={(filter.value as string) ?? ""}
            onChange={(event) => updateFilter(index!, { value: event.target.value })}
          />
          <Input
            type={type === "date" ? "date" : "text"}
            value={(filter.valueTo as string) ?? ""}
            onChange={(event) => updateFilter(index!, { valueTo: event.target.value })}
          />
        </div>
      );
    }
    if (filter.operator === "in_list") {
      return (
        <Textarea
          rows={2}
          placeholder="Comma separated"
          value={(filter.value as string) ?? ""}
          onChange={(event) => updateFilter(index!, { value: event.target.value })}
        />
      );
    }
    if (type === "boolean") {
      return (
        <Select
          value={String(filter.value ?? "true")}
          onValueChange={(value) => updateFilter(index!, { value: value === "true" } as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        type={type === "date" ? "date" : type === "number" || type === "currency" ? "number" : "text"}
        value={(filter.value as string | number | undefined) ?? ""}
        onChange={(event) => updateFilter(index!, { value: event.target.value })}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Filters</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Logic</Label>
          <Select value={logic} onValueChange={(value: "AND" | "OR") => onLogicChange(value)}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" size="sm" variant="outline" onClick={addFilter} disabled={!fields.length}>
            <Plus className="mr-2 h-4 w-4" /> Add filter
          </Button>
        </div>
      </div>
      {!filters.length && <p className="text-sm text-muted-foreground">No filters yet.</p>}
      <div className="space-y-3">
        {filters.map((filter, index) => {
          const definition = fields.find((field) => field.key === filter.field) ?? fields[0];
          const operators = definition?.filterOperators ?? ["equals"];
          return (
            <div key={`${filter.field}-${index}`} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
              <div className="md:col-span-1">
                <Label className="text-xs text-muted-foreground">Field</Label>
                <Select
                  value={filter.field}
                  onValueChange={(value) => {
                    const target = fields.find((field) => field.key === value);
                    updateFilter(index, {
                      field: value,
                      operator: target?.filterOperators[0] ?? "equals",
                      value: "",
                      valueTo: undefined,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fields.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Operator</Label>
                <Select value={filter.operator} onValueChange={(value) => updateFilter(index, { operator: value as ReportFilter["operator"], value: "", valueTo: undefined })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {operatorLabels[operator]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Value</Label>
                {renderValueInput(filter, definition, index)}
              </div>
              <div className="flex items-end justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => removeFilter(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
