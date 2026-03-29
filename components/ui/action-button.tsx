"use client"

import { useState, useEffect } from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonProps extends ButtonProps {
  loading?: boolean
  success?: boolean
  successDuration?: number
  onSuccess?: () => void
}

/**
 * Button with loading and success states
 * Shows checkmark briefly after success, then returns to normal
 */
export function ActionButton({
  loading = false,
  success = false,
  successDuration = 2000,
  onSuccess,
  children,
  className,
  ...props
}: ActionButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (success) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
        onSuccess?.()
      }, successDuration)
      return () => clearTimeout(timer)
    }
  }, [success, successDuration, onSuccess])

  return (
    <Button
      className={cn(
        "transition-all duration-200",
        showSuccess && "bg-green-600 hover:bg-green-600",
        className
      )}
      disabled={loading || showSuccess}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {showSuccess && <Check className="mr-2 h-4 w-4" />}
      {showSuccess ? "Saved!" : children}
    </Button>
  )
}
