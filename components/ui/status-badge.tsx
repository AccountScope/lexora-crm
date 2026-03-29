"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const statusConfig = {
  OPEN: {
    variant: "default" as const,
    label: "Open",
    description: "Matter is active and work is in progress"
  },
  PENDING: {
    variant: "warning" as const,
    label: "Pending",
    description: "Awaiting client response, court date, or external action"
  },
  ON_HOLD: {
    variant: "secondary" as const,
    label: "On Hold",
    description: "Temporarily paused - no active work scheduled"
  },
  CLOSED: {
    variant: "success" as const,
    label: "Closed",
    description: "Matter completed and archived"
  },
  DRAFT: {
    variant: "secondary" as const,
    label: "Draft",
    description: "Matter not yet active - in preparation"
  }
}

interface StatusBadgeProps {
  status: keyof typeof statusConfig
  showTooltip?: boolean
}

export function StatusBadge({ status, showTooltip = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.DRAFT

  if (!showTooltip) {
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className="cursor-help">
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
