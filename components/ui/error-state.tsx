"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorStateProps {
  title?: string
  message: string
  retry?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
  action
}: ErrorStateProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
      </AlertDescription>
      {(retry || action) && (
        <div className="mt-4 flex gap-2">
          {retry && (
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </Alert>
  )
}
