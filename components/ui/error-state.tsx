"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ErrorStateProps {
  title?: string
  message?: string
  retry?: () => void
  showIcon?: boolean
}

export function ErrorState({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  retry,
  showIcon = true
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50 duration-300">
      <Alert variant="destructive" className="max-w-md">
        <div className="flex items-start gap-3">
          {showIcon && <AlertCircle className="h-5 w-5 mt-0.5" />}
          <div className="flex-1 text-left">
            <AlertTitle className="mb-1">{title}</AlertTitle>
            <AlertDescription className="text-sm">{message}</AlertDescription>
            {retry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retry}
                className="mt-3"
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  )
}
