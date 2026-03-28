"use client";

import { useCases } from "@/lib/hooks/use-cases";
import { useUpcomingDeadlines } from "@/lib/hooks/use-deadlines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const DashboardOverview = () => {
  const { data, isFetching } = useCases({});
  const { data: deadlinesData } = useUpcomingDeadlines(5);
  const matters = data?.data ?? [];
  const recent = matters.slice(0, 4);
  const upcomingDeadlines = deadlinesData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Lexora Command Center</h1>
        <p className="text-muted-foreground">Monitor cases, documents, and client communications from a single secure pane.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active matters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{matters.length}</p>
            <p className="text-sm text-muted-foreground">Tracked across all practice groups.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{matters.length * 4}</p>
            <p className="text-sm text-muted-foreground">Chain-of-custody enforced uploads.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Client portal sync</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">99.98%</p>
            <p className="text-sm text-muted-foreground">Uptime in the last 30 days.</p>
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
  );
};
