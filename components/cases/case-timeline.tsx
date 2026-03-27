"use client";

import type { CaseTimelineEvent } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

const categoryColor: Record<string, string> = {
  document: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  note: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200",
  assignment: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  status: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200",
  custody: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-200",
  billing: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200",
};

export const CaseTimeline = ({ events }: { events?: CaseTimelineEvent[] }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Case timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] pr-4">
          <ol className="relative space-y-6">
            {(events ?? []).map((event) => (
              <li key={event.id} className="pl-6">
                <span className="absolute left-0 top-2 h-3 w-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {format(new Date(event.occurredAt), "dd MMM yyyy HH:mm")}
                  <Badge className={cn("capitalize", categoryColor[event.category] ?? "")}>{event.category}</Badge>
                </div>
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-sm text-muted-foreground">{event.description ?? "—"}</p>
                {event.actor && <p className="text-xs text-muted-foreground">By {event.actor}</p>}
              </li>
            ))}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
