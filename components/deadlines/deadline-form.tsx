"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { DeadlineTemplate } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDeadline } from "@/lib/hooks/use-deadlines";

interface Props {
  templates?: DeadlineTemplate[];
  onSuccess?: () => void;
}

const recurrenceOptions = [
  { value: "", label: "Does not repeat" },
  { value: "RRULE:FREQ=DAILY;INTERVAL=1", label: "Daily" },
  { value: "RRULE:FREQ=WEEKLY;INTERVAL=1", label: "Weekly" },
  { value: "RRULE:FREQ=MONTHLY;INTERVAL=1", label: "Monthly" },
];

export const DeadlineForm = ({ templates = [], onSuccess }: Props) => {
  const mutation = useCreateDeadline();
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      caseId: "",
      assignedToEmail: "",
      dueDate: "",
      sourceDate: "",
      offsetDays: "",
      priority: "MEDIUM",
      reminderString: "7,3,1",
      recurrenceRule: "",
      description: "",
    },
  });

  const sourceDate = watch("sourceDate");
  const offsetDays = watch("offsetDays");

  useEffect(() => {
    if (sourceDate && offsetDays) {
      const date = new Date(sourceDate);
      if (!Number.isNaN(date.getTime())) {
        const next = new Date(date.getTime() + Number(offsetDays) * 24 * 60 * 60 * 1000);
        setValue("dueDate", next.toISOString().slice(0, 16));
      }
    }
  }, [sourceDate, offsetDays, setValue]);

  const activeTemplate = useMemo(() => templates.find((tpl) => tpl.id === selectedTemplate), [selectedTemplate, templates]);

  useEffect(() => {
    if (activeTemplate) {
      setValue("priority", activeTemplate.defaultPriority);
      setValue("reminderString", activeTemplate.reminderOffsets.join(","));
      setValue("offsetDays", String(activeTemplate.offsetDays));
    }
  }, [activeTemplate, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    const reminderOffsets = values.reminderString
      .split(",")
      .map((entry: any) => Number(entry.trim()))
      .filter((entry: any) => !Number.isNaN(entry));
    const payload = {
      title: values.title,
      caseId: values.caseId || undefined,
      assignedToEmail: values.assignedToEmail || undefined,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      sourceDate: values.sourceDate || undefined,
      offsetDays: values.offsetDays ? Number(values.offsetDays) : undefined,
      priority: values.priority,
      reminderOffsets,
      recurrenceRule: values.recurrenceRule || undefined,
      ruleTemplateId: activeTemplate?.id,
      description: values.description,
    };
    await mutation.mutateAsync(payload);
    reset();
    setSelectedTemplate(undefined);
    onSuccess?.();
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input type="hidden" {...register("priority")} />
      <input type="hidden" {...register("recurrenceRule")} />
      <div className="grid gap-3">
        <label className="text-sm font-medium">Template</label>
        <Select value={selectedTemplate ?? ""} onValueChange={(value) => setSelectedTemplate(value || undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Select court rule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No template</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.label} · {template.offsetDays} days
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Title</label>
        <Input placeholder="e.g. Expert disclosure" {...register("title", { required: true })} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Linked matter ID</label>
        <Input placeholder="Matter UUID" {...register("caseId")} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Assign to (email)</label>
        <Input placeholder="lawyer@firm.com" type="email" {...register("assignedToEmail")} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Due date</label>
        <Input type="datetime-local" {...register("dueDate")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Base date</label>
          <Input type="date" {...register("sourceDate")} />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Offset (days)</label>
          <Input type="number" {...register("offsetDays")} />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Priority</label>
        <Select value={watch("priority") ?? "MEDIUM"} onValueChange={(value) => setValue("priority", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Reminders (days before)</label>
        <Input placeholder="7,3,1" {...register("reminderString")} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Recurrence</label>
        <Select value={watch("recurrenceRule") ?? ""} onValueChange={(value) => setValue("recurrenceRule", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Does not repeat" />
          </SelectTrigger>
          <SelectContent>
            {recurrenceOptions.map((option) => (
              <SelectItem key={option.value || "none"} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea rows={3} placeholder="Internal description" {...register("description")} />
      </div>
      <Button className="w-full" disabled={isSubmitting || mutation.isPending} type="submit">
        {mutation.isPending ? "Saving..." : "Save deadline"}
      </Button>
    </form>
  );
};
