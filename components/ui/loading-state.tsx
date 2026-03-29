"use client"

import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  }

  const containerPadding = {
    sm: "p-4",
    md: "p-8",
    lg: "p-12"
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerPadding[size]} text-center animate-in fade-in-50 duration-300`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }

  return <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
}
