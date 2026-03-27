"use client";

import { useCases } from "@/lib/hooks/use-cases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const DashboardOverview = () => {
  const { data, isFetching } = useCases({});
  const matters = data?.data ?? [];
  const recent = matters.slice(0, 4);

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
  );
};
