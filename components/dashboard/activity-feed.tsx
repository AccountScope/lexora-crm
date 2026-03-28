"use client";

import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem } from "@/lib/api/analytics";
import { Briefcase, FileText, Timer, ReceiptText } from "lucide-react";

interface Props {
  items?: ActivityItem[];
  isLoading?: boolean;
}

const ICONS = {
  case: Briefcase,
  document: FileText,
  time_entry: Timer,
  invoice: ReceiptText,
};

export const ActivityFeed = ({ items, isLoading }: Props) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity feed</CardTitle>
        <Badge variant="secondary">Live</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        )}
        {!isLoading && (!items || items.length === 0) && (
          <p className="text-sm text-muted-foreground">No recent updates in the last 30 days.</p>
        )}
        {!isLoading && items &&
          items.map((item) => {
            const Icon = ICONS[item.type] ?? Briefcase;
            return (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-4 rounded-lg border p-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-tight">{item.summary}</p>
                    {item.status && <Badge variant="outline">{item.status}</Badge>}
                  </div>
                  {item.detail && <p className="text-sm text-muted-foreground">{item.detail}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.actor && <span>By {item.actor}</span>}
                    <span>
                      {formatDistanceToNow(new Date(item.occurredAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
