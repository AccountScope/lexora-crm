"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conflictCheckSchema, type ConflictCheckInput } from "@/lib/api/validation";
import { useRunConflictCheck } from "@/lib/hooks/use-conflicts";
import { ConflictResults } from "@/components/conflicts/conflict-results";
import type { ConflictMatchRecord, ConflictSummaryCounts } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

type ConflictRunData = {
  checkId: string;
  summary: ConflictSummaryCounts;
  conflicts: ConflictMatchRecord[];
  decisions: {
    preventCaseCreation: boolean;
    requireAdminApproval: boolean;
    notifyEthics: boolean;
    watchListHits: string[];
  };
};

const caseTypes = [
  { value: "litigation", label: "Litigation" },
  { value: "transactional", label: "Transactional" },
  { value: "regulatory", label: "Regulatory" },
  { value: "advisory", label: "Advisory" },
  { value: "other", label: "Other" },
];

export const ConflictCheckForm = () => {
  const form = useForm<ConflictCheckInput>({
    resolver: zodResolver(conflictCheckSchema),
    defaultValues: {
      clientName: "",
      caseType: undefined,
      description: "",
      opposingParties: [""],
      otherParties: [],
    },
  });

  const opposingFieldArray = useFieldArray({ control: form.control, name: "opposingParties" });
  const otherFieldArray = useFieldArray({ control: form.control, name: "otherParties" });
  const mutation = useRunConflictCheck();
  const [result, setResult] = useState<ConflictRunData | null>(null);

  const submit = form.handleSubmit(async (values) => {
    const payload: ConflictCheckInput = {
      ...values,
      opposingParties: values.opposingParties.filter((value) => value && value.trim().length > 0),
      otherParties: (values.otherParties ?? []).filter((value) => value && value.trim().length > 0),
    };
    const response = await mutation.mutateAsync(payload);
    setResult(response.data as ConflictRunData);
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Conflict check</CardTitle>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" placeholder="Acme Holdings" {...form.register("clientName")} />
              {form.formState.errors.clientName && (
                <p className="text-sm text-destructive">{form.formState.errors.clientName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Opposing parties</Label>
              <div className="space-y-2">
                {opposingFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Name"
                      {...form.register(`opposingParties.${index}` as const)}
                    />
                    {opposingFieldArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => opposingFieldArray.remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => opposingFieldArray.append("")}
                >
                  Add opposing party
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Other involved parties</Label>
              <div className="space-y-2">
                {otherFieldArray.fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="Witness, expert, or related entity"
                      {...form.register(`otherParties.${index}` as const)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => otherFieldArray.remove(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => otherFieldArray.append("")}>
                  Add related party
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="caseType">Case type</Label>
                <Select
                  value={form.watch("caseType") ?? ""}
                  onValueChange={(value) => form.setValue("caseType", value || undefined)}
                >
                  <SelectTrigger id="caseType">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unspecified</SelectItem>
                    {caseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Case description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the matter"
                  rows={4}
                  {...form.register("description" as any)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Checking…" : "Run conflict check"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => form.reset()}>
              Reset
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result && (
        <ConflictResults
          summary={result.summary}
          conflicts={result.conflicts}
          decisions={result.decisions}
        />
      )}
    </div>
  );
};
