"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStatePremiumProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
  variant?: "default" | "primary" | "muted";
  className?: string;
}

export function EmptyStatePremium({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  tips,
  variant = "default",
  className,
}: EmptyStatePremiumProps) {
  const iconContainerStyles = {
    default: "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
    primary: "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/10",
    muted: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950",
  };

  const iconStyles = {
    default: "text-gray-400 dark:text-gray-600",
    primary: "text-blue-600 dark:text-blue-400",
    muted: "text-gray-300 dark:text-gray-700",
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-6",
      className
    )}>
      {/* Icon */}
      <div className={cn(
        "mb-6 flex h-24 w-24 items-center justify-center rounded-2xl shadow-lg",
        iconContainerStyles[variant]
      )}>
        <Icon className={cn("h-12 w-12", iconStyles[variant])} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="text-h3 text-gray-900 dark:text-white mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-body text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {action && (
            <Button
              onClick={action.onClick}
              size="lg"
              className="rounded-xl gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/20"
            >
              {action.icon && <action.icon className="h-5 w-5" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size="lg"
              className="rounded-xl"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="w-full max-w-lg mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
            Quick Tips
          </h4>
          <ul className="space-y-3 text-left">
            {tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                </div>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Compact variant for smaller sections
export function EmptyStateCompact({
  icon: Icon,
  title,
  description,
  action,
}: Omit<EmptyStatePremiumProps, "tips" | "secondaryAction" | "variant">) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-600" strokeWidth={1.5} />
      </div>

      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h4>

      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          size="sm"
          className="rounded-lg gap-2"
        >
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
