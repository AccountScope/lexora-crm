"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Team name is required"),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export type TeamFormValues = z.infer<typeof schema>;

interface TeamFormProps {
  initialValues?: TeamFormValues;
  parentOptions?: { id: string; name: string }[];
  onSubmit: (values: TeamFormValues) => Promise<void> | void;
  submitting?: boolean;
  disabled?: boolean;
}

export const TeamForm = ({ initialValues, parentOptions = [], onSubmit, submitting, disabled }: TeamFormProps) => {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues ?? { name: "", description: "", parentId: null },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Team name</label>
          <Input placeholder="e.g. Litigation" disabled={disabled} {...form.register("name")} />
          {form.formState.errors.name ? (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Parent team</label>
          <Select
            disabled={disabled}
            value={form.watch("parentId") ?? undefined}
            onValueChange={(value) => form.setValue("parentId", value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder={parentOptions.length ? "Select parent" : "No parent"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No parent</SelectItem>
              {parentOptions.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea rows={3} placeholder="Optional description" disabled={disabled} {...form.register("description")} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || submitting}>
          Save team
        </Button>
      </div>
    </form>
  );
};
