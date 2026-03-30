"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  trend,
  loading = false,
}: MetricCardProps) {
  const variantStyles = {
    default: "border-l-primary",
    success: "border-l-success",
    warning: "border-l-warning",
    danger: "border-l-destructive",
  };

  const iconStyles = {
    default: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-destructive bg-destructive/10",
  };

  const changeColor = 
    trend === "up" 
      ? "text-success" 
      : trend === "down" 
      ? "text-destructive" 
      : "text-muted-foreground";

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-l-4 transition-all hover:shadow-md",
        variantStyles[variant],
        loading && "animate-pulse"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            {loading ? (
              <div className="mt-2 h-8 w-32 rounded bg-muted animate-pulse" />
            ) : (
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {value}
              </p>
            )}
            {change !== undefined && !loading && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                <span className={cn("font-medium", changeColor)}>
                  {change > 0 ? "+" : ""}{change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <div 
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              iconStyles[variant]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
