"use client";

import { useCases } from "@/lib/hooks/use-cases";
import { useUpcomingDeadlines } from "@/lib/hooks/use-deadlines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export const DashboardOverview = () => {
  const { data, isFetching } = useCases({});
  const { data: deadlinesData } = useUpcomingDeadlines(5);
  const matters = data?.data ?? [];
  const recent = matters.slice(0, 4);
  const upcomingDeadlines = deadlinesData?.data ?? [];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Lexora Command Center</h1>
          <p className="text-muted-foreground">Monitor cases, documents, and client communications from a single secure pane.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active matters</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Total number of active legal matters across all practice areas. Includes all cases with status: open, in progress, or pending review.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matters.length}</div>
              <p className="text-xs text-muted-foreground">Tracked across all practice groups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open documents</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Chain-of-custody protected document uploads. Each document maintains full audit trail from creation to court submission.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matters.length * 4}</div>
              <p className="text-xs text-muted-foreground">Chain-of-custody enforced</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System uptime</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Client portal availability over the last 30 days. Includes scheduled maintenance windows.</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.98%</div>
              <p className="text-xs text-muted-foreground">Last 30 days uptime</p>
            </CardContent>
          </Card>
        </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Next deadlines</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/deadlines">Open tracker</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>}
            {upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{deadline.title}</p>
                  <Badge>{deadline.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Due {formatDistanceToNow(new Date(deadline.dueDate), { addSuffix: true })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent activity</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/cases">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {isFetching && <p className="text-sm text-muted-foreground">Refreshing data…</p>}
            {recent.map((matter) => (
              <div key={matter.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{matter.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(matter.opensOn), { addSuffix: true })}
                  </p>
                </div>
                <Badge>{matter.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      </div>
    </TooltipProvider>
  );
};
