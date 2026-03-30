"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger" | "purple" | "blue";
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  subtitle?: string;
  className?: string;
}

export function MetricCardPremium({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = "default",
  trend,
  loading = false,
  subtitle,
  className,
}: MetricCardProps) {
  // Premium gradient backgrounds
  const variantGradients = {
    default: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10",
    success: "from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10",
    warning: "from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10",
    danger: "from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10",
    purple: "from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10",
    blue: "from-sky-50 to-sky-100/50 dark:from-sky-950/20 dark:to-sky-900/10",
  };

  const iconContainerStyles = {
    default: "bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20",
    success: "bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/20",
    warning: "bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20",
    danger: "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20",
    blue: "bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/20",
  };

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-600 dark:text-gray-400",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br shadow-sm transition-all duration-300 hover-lift-lg",
        "hover:shadow-2xl hover:scale-[1.03]",
        variantGradients[variant],
        loading && "animate-pulse",
        className
      )}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 dark:to-transparent" />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              {title}
            </p>
            
            {/* Value */}
            {loading ? (
              <div className="h-10 w-32 rounded-lg bg-white/60 dark:bg-gray-800/60 animate-pulse" />
            ) : (
              <>
                <p className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 font-numeric-tabular">
                  {value}
                </p>
                
                {/* Subtitle */}
                {subtitle && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {subtitle}
                  </p>
                )}
              </>
            )}
            
            {/* Change indicator */}
            {change !== undefined && !loading && (
              <div className="flex items-center gap-2 mt-3">
                <div className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                  trend === "up" && "bg-green-100 dark:bg-green-900/30",
                  trend === "down" && "bg-red-100 dark:bg-red-900/30",
                  trend === "neutral" && "bg-gray-100 dark:bg-gray-800",
                )}>
                  <TrendIcon className={cn("h-3.5 w-3.5", trendColors[trend || "neutral"])} />
                  <span className={trendColors[trend || "neutral"]}>
                    {change > 0 ? "+" : ""}{change}%
                  </span>
                </div>
                {changeLabel && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Icon */}
          <div 
            className={cn(
              "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl",
              "transition-transform duration-300 group-hover:scale-110",
              iconContainerStyles[variant]
            )}
          >
            <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
        </div>
      </CardContent>
      
      {/* Subtle bottom border accent */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-1",
        variant === "default" && "bg-gradient-to-r from-blue-400 to-blue-600",
        variant === "success" && "bg-gradient-to-r from-green-400 to-green-600",
        variant === "warning" && "bg-gradient-to-r from-amber-400 to-amber-600",
        variant === "danger" && "bg-gradient-to-r from-red-400 to-red-600",
        variant === "purple" && "bg-gradient-to-r from-purple-400 to-purple-600",
        variant === "blue" && "bg-gradient-to-r from-sky-400 to-sky-600",
      )} />
    </Card>
  );
}

// Skeleton loader
export function MetricCardSkeleton() {
  return (
    <Card className="rounded-2xl overflow-hidden animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-14 w-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );
}
