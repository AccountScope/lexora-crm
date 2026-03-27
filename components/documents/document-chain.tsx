"use client";

import { useEffect, useState } from "react";
import { useChainOfCustody } from "@/lib/hooks/use-documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Props {
  documentIds: { id: string; title: string }[];
}

export const DocumentChain = ({ documentIds }: Props) => {
  const [selected, setSelected] = useState(documentIds[0]?.id);

  const firstId = documentIds[0]?.id;

  useEffect(() => {
    if (!selected && firstId) {
      setSelected(firstId);
    }
  }, [selected, firstId]);

  const { data } = useChainOfCustody(selected);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>Chain of custody</CardTitle>
        <Select value={selected} onValueChange={(value) => setSelected(value)}>
          <SelectTrigger className="w-72 rounded-md border px-3 py-2 text-sm">
            <SelectValue placeholder="Choose document" />
          </SelectTrigger>
          <SelectContent className="rounded-md border bg-background text-sm shadow">
            {documentIds.map((doc) => (
              <SelectItem key={doc.id} value={doc.id} className="px-3 py-2">
                {doc.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-3">
        {(data?.data ?? []).map((event) => (
          <div key={event.id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{event.eventType}</p>
              <Badge variant="outline">
                {format(new Date(event.occurredAt), "dd MMM yyyy HH:mm")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Performed by: {event.performedBy ?? "System"}</p>
            {event.metadata && (
              <pre className="mt-2 rounded bg-muted p-2 text-xs">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
            {event.hashVerification && (
              <p className="mt-2 text-xs text-muted-foreground">Checksum: {event.hashVerification}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
