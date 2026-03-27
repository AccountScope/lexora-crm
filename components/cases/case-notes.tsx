"use client";

import { useState } from "react";
import type { CaseNote } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useCreateCaseNote } from "@/lib/hooks/use-cases";

const visibilityOptions = [
  { label: "Internal", value: "INTERNAL_ONLY" },
  { label: "Firm confidential", value: "FIRM_CONFIDENTIAL" },
  { label: "Client visible", value: "CLIENT_VISIBLE" },
];

export const CaseNotes = ({ matterId, notes }: { matterId: string; notes?: CaseNote[] }) => {
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState("FIRM_CONFIDENTIAL");
  const mutation = useCreateCaseNote(matterId);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    await mutation.mutateAsync({ note, visibility });
    setNote("");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Notes & comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a privileged note" />
          <div className="flex flex-wrap items-center gap-2">
            {visibilityOptions.map((option) => (
              <Button
                key={option.value}
                variant={visibility === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setVisibility(option.value)}
              >
                {option.label}
              </Button>
            ))}
            <Button disabled={mutation.isLoading} onClick={handleSubmit}>
              Save note
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          {(notes ?? []).map((entry) => (
            <div key={entry.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium">{entry.authorName}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{entry.note}</p>
              <Badge className="mt-2 text-xs" variant="secondary">
                {entry.visibility}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
