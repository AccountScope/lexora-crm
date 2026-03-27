"use client";

import type { CaseSummary } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, Shield, Users } from "lucide-react";

const metrics = [
  { key: "OPEN", label: "Open", icon: Briefcase },
  { key: "PENDING", label: "Pending", icon: Clock },
  { key: "ON_HOLD", label: "On hold", icon: Shield },
  { key: "CLOSED", label: "Closed", icon: Users },
];

export const CaseSummaryCards = ({ data }: { data?: CaseSummary[] }) => {
  const counts = metrics.map((metric) => ({
    ...metric,
    count: data?.filter((item) => item.status === metric.key).length ?? 0,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {counts.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.key} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <Badge variant="secondary">{metric.key}</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-semibold">{metric.count}</p>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
