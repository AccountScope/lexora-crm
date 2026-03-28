"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardKpis } from "@/lib/api/analytics";

interface Props {
  data?: DashboardKpis;
  isLoading?: boolean;
}

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const KPI_META: Array<{
  key: keyof DashboardKpis;
  label: string;
  helper: string;
  format: (value: number) => string;
}> = [
  {
    key: "totalActiveCases",
    label: "Total active cases",
    helper: "Matters currently progressing",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "unbilledAmount",
    label: "Unbilled hours",
    helper: "Ready to invoice",
    format: (value) => GBP.format(value),
  },
  {
    key: "openTasks",
    label: "Open tasks & deadlines",
    helper: "Documented as TASK items",
    format: (value) => value.toLocaleString(),
  },
  {
    key: "recentActivityCount",
    label: "Recent activity",
    helper: "Events in last 7 days",
    format: (value) => value.toLocaleString(),
  },
];

export const KpiCards = ({ data, isLoading }: Props) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KPI_META.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
            <p className="text-xs text-muted-foreground/80">{kpi.helper}</p>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <p className="text-3xl font-semibold">{kpi.format(data[kpi.key])}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
