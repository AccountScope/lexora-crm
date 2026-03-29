"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: "lift" | "glow" | "border" | "none"
  animateIn?: boolean
}

/**
 * Card component with smooth hover animations and entrance effects
 */
export function AnimatedCard({
  hoverEffect = "lift",
  animateIn = true,
  className,
  children,
  ...props
}: AnimatedCardProps) {
  const hoverClasses = {
    lift: "hover:shadow-lg hover:-translate-y-1 transition-all duration-200",
    glow: "hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-200",
    border: "hover:border-primary transition-colors duration-200",
    none: ""
  }

  const animateClasses = animateIn
    ? "animate-in fade-in slide-in-from-bottom-4 duration-500"
    : ""

  return (
    <Card
      className={cn(
        hoverClasses[hoverEffect],
        animateClasses,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
