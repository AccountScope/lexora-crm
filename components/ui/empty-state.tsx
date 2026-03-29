"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  // Old API (backwards compatible)
  action?: {
    label: string
    onClick: () => void
  }
  // New API
  actionLabel?: string
  actionHref?: string
  secondaryActionLabel?: string
  secondaryActionHref?: string
  tips?: string[]
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  secondaryActionLabel,
  secondaryActionHref,
  tips
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 duration-500">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      <div className="flex gap-2">
        {/* Old API with onClick */}
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {/* New API with href */}
        {actionLabel && actionHref && (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        {secondaryActionLabel && secondaryActionHref && (
          <Button variant="outline" asChild>
            <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
          </Button>
        )}
      </div>
      {tips && tips.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick tips
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left">
            {tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
