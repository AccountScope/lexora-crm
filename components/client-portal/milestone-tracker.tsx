"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Clock, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface Milestone {
  id: string;
  milestoneName: string;
  milestoneOrder: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt: string | null;
  estimatedCompletionDate: string | null;
}

interface MilestoneTrackerProps {
  matterId: string;
}

export function MilestoneTracker({ matterId }: MilestoneTrackerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["matter-milestones", matterId],
    queryFn: async () => {
      const res = await fetch(`/api/matters/${matterId}/milestones`);
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
  });

  const milestones: Milestone[] = data?.milestones || [];
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const totalCount = milestones.filter((m) => m.status !== "skipped").length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "pending":
        return <Circle className="w-5 h-5 text-gray-400" />;
      case "skipped":
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="default" className="bg-blue-500">
            In Progress
          </Badge>
        );
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "skipped":
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return null;
    }
  };

  const getEstimatedTimeMessage = (estimatedDate: string | null) => {
    if (!estimatedDate) return null;

    const daysUntil = differenceInDays(new Date(estimatedDate), new Date());

    if (daysUntil < 0) {
      return (
        <span className="text-xs text-red-600">
          {Math.abs(daysUntil)} days overdue
        </span>
      );
    } else if (daysUntil === 0) {
      return <span className="text-xs text-orange-600">Due today</span>;
    } else if (daysUntil <= 7) {
      return (
        <span className="text-xs text-yellow-600">
          Due in {daysUntil} {daysUntil === 1 ? "day" : "days"}
        </span>
      );
    } else {
      return (
        <span className="text-xs text-muted-foreground">
          Due {format(new Date(estimatedDate), "dd MMM yyyy")}
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matter Progress</CardTitle>
          <CardDescription>Loading milestones...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-2 bg-gray-200 rounded w-full" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <div className="flex-1 h-4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (milestones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matter Progress</CardTitle>
          <CardDescription>Track key milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <Circle className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No milestones set</p>
            <p className="text-xs text-muted-foreground">
              Milestones will appear here when added by your solicitor
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matter Progress</CardTitle>
        <CardDescription>
          {completedCount} of {totalCount} milestones completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Milestones list */}
        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={cn(
                "relative flex gap-4 pb-4",
                index < milestones.length - 1 && "border-b"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 pt-0.5">
                {getStatusIcon(milestone.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Step {milestone.milestoneOrder}
                      </span>
                      {getStatusBadge(milestone.status)}
                    </div>
                    <h4 className="text-sm font-medium mt-1">
                      {milestone.milestoneName}
                    </h4>
                  </div>
                </div>

                {/* Completion/Estimated date */}
                {milestone.status === "completed" && milestone.completedAt && (
                  <p className="text-xs text-green-600">
                    Completed {format(new Date(milestone.completedAt), "dd MMM yyyy")}
                  </p>
                )}
                {milestone.status !== "completed" &&
                  milestone.estimatedCompletionDate && (
                    <div>{getEstimatedTimeMessage(milestone.estimatedCompletionDate)}</div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Estimated completion */}
        {totalCount > 0 && completedCount < totalCount && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated completion</span>
              <span className="font-medium">
                {milestones
                  .filter((m) => m.status !== "completed" && m.estimatedCompletionDate)
                  .sort((a, b) =>
                    new Date(b.estimatedCompletionDate!).getTime() -
                    new Date(a.estimatedCompletionDate!).getTime()
                  )[0]?.estimatedCompletionDate
                  ? format(
                      new Date(
                        milestones.filter(
                          (m) => m.status !== "completed" && m.estimatedCompletionDate
                        )[0]!.estimatedCompletionDate!
                      ),
                      "dd MMM yyyy"
                    )
                  : "TBD"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
