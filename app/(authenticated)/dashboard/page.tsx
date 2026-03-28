"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardAnalyticsPayload } from "@/lib/api/analytics";
import { Clock3, FilePlus2, UploadCloud, Briefcase } from "lucide-react";

const fetchAnalytics = async () => {
  const res = await fetch("/api/analytics");
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return (await res.json()) as { data: DashboardAnalyticsPayload };
};

const quickActions = [
  { label: "Create new case", description: "Open intake workflow", icon: Briefcase, href: "/cases/new" },
  { label: "Start timer", description: "Track a billable entry", icon: Clock3, href: "/time-entries/new" },
  { label: "Upload document", description: "Add evidence or filings", icon: UploadCloud, href: "/documents/upload" },
  { label: "Create invoice", description: "Generate billing packet", icon: FilePlus2, href: "/billing/invoices/new" },
];

export default function DashboardPage() {
  const { data, isFetching, refetch, isError, error } = useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: 60_000,
  });

  const analytics = data?.data;
  const isLoading = isFetching && !analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Intelligence Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor global activity, billing, workloads, and custody events in one viewport.</p>
          </div>
          <div className="flex items-center gap-3">
            {analytics?.generatedAt && (
              <p className="text-xs text-muted-foreground">Updated {new Date(analytics.generatedAt).toLocaleTimeString()}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Refresh
            </Button>
          </div>
        </div>
        {isError && (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        )}
      </div>
      <KpiCards data={analytics?.kpis} isLoading={isLoading} />
      <DashboardCharts data={analytics?.charts} isLoading={isLoading} />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <ActivityFeed items={analytics?.activity} isLoading={isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => (
              <div key={action.href}>
                <Button variant="ghost" className="w-full justify-start gap-3 text-left" asChild>
                  <Link href={action.href} className="flex flex-1 items-center gap-3">
                    <action.icon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </Link>
                </Button>
                {index < quickActions.length - 1 && <div className="my-4 h-px w-full bg-border" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
