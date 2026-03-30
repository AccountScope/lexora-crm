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
  // PHASE 6: Enhanced empty state options
  quickAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  demoPrompt?: string
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
  tips,
  quickAction,
  demoPrompt
}: EmptyStateProps) {
  const QuickIcon = quickAction?.icon;
  
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50 duration-500">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {/* PHASE 6: More engaging description */}
      <p className="mb-6 mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">
        {description}
      </p>
      
      {/* PHASE 6: Enhanced action hierarchy */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {/* Primary action */}
        {action && (
          <Button onClick={action.onClick} size="lg" className="flex-1">
            {action.label}
          </Button>
        )}
        {actionLabel && actionHref && (
          <Button asChild size="lg" className="flex-1">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        )}
        
        {/* Secondary action */}
        {secondaryActionLabel && secondaryActionHref && (
          <Button variant="outline" asChild size="lg" className="flex-1">
            <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
          </Button>
        )}
      </div>
      
      {/* PHASE 6: Quick action shortcut */}
      {quickAction && (
        <Button 
          variant="ghost" 
          onClick={quickAction.onClick}
          className="mt-4 gap-2"
        >
          {QuickIcon && <QuickIcon className="h-4 w-4" />}
          {quickAction.label}
        </Button>
      )}
      
      {/* PHASE 6: Demo/example prompt */}
      {demoPrompt && (
        <div className="mt-6 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground max-w-md">
          <p className="font-medium text-foreground mb-1">💡 Example</p>
          <p className="italic">{demoPrompt}</p>
        </div>
      )}
      
      {tips && tips.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Quick tips
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-md">
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
