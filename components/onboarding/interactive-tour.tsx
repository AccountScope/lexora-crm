"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronRight, ChevronLeft, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface TourStep {
  title: string
  description: string
  target: string // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center"
  action?: "click" | "hover" | "none"
  highlightPadding?: number
  allowInteraction?: boolean
}

interface InteractiveTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  storageKey: string
  autoStart?: boolean
}

/**
 * Advanced interactive tour with element highlighting
 * Spotlights actual UI elements and guides user through interactions
 */
export function InteractiveTour({
  steps,
  onComplete,
  onSkip,
  storageKey,
  autoStart = true
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Check if tour should show
  useEffect(() => {
    if (!autoStart) return
    const hasCompleted = localStorage.getItem(storageKey)
    if (!hasCompleted) {
      // Small delay to let page render
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [storageKey, autoStart])

  // Update spotlight position when step changes
  useEffect(() => {
    if (!isVisible) return

    const step = steps[currentStep]
    if (!step.target) {
      setTargetRect(null)
      return
    }

    const updatePosition = () => {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        
        // Calculate tooltip position
        const padding = step.highlightPadding || 8
        const position = step.position || "bottom"
        
        let top = 0
        let left = 0

        switch (position) {
          case "top":
            top = rect.top - padding - 180 // Card height estimate
            left = rect.left + rect.width / 2 - 200 // Half card width
            break
          case "bottom":
            top = rect.bottom + padding
            left = rect.left + rect.width / 2 - 200
            break
          case "left":
            top = rect.top + rect.height / 2 - 90
            left = rect.left - padding - 420
            break
          case "right":
            top = rect.top + rect.height / 2 - 90
            left = rect.right + padding
            break
          case "center":
            top = window.innerHeight / 2 - 90
            left = window.innerWidth / 2 - 200
            break
        }

        // Keep tooltip on screen
        top = Math.max(20, Math.min(top, window.innerHeight - 200))
        left = Math.max(20, Math.min(left, window.innerWidth - 420))

        setTooltipPosition({ top, left })

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition)
    }
  }, [currentStep, isVisible, steps])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true")
    localStorage.setItem(`${storageKey}-progress`, JSON.stringify({
      completed: true,
      completedAt: new Date().toISOString(),
      stepsCompleted: steps.length
    }))
    setIsVisible(false)
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, "skipped")
    setIsVisible(false)
    onSkip()
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const padding = step.highlightPadding || 8

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
            className="animate-in fade-in duration-300"
          />
        </svg>
      </div>

      {/* Highlighted element border */}
      {targetRect && (
        <div
          className="fixed z-[101] pointer-events-none border-2 border-primary rounded-lg animate-pulse"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Interactive overlay for clickable elements */}
      {step.allowInteraction && targetRect && (
        <div
          className="fixed z-[102]"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Tour card */}
      <div
        ref={cardRef}
        className="fixed z-[103] w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        <Card className="p-6 shadow-2xl border-2">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Target className="h-3 w-3" />
                <span>Step {currentStep + 1} of {steps.length}</span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <p className="text-sm text-muted-foreground mb-6">
            {step.description}
          </p>

          {/* Action hint */}
          {step.action && step.action !== "none" && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-xs font-medium text-primary">
                {step.action === "click" && "👆 Click the highlighted element to continue"}
                {step.action === "hover" && "👉 Hover over the highlighted element"}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleSkip}
              size="sm"
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button onClick={handleNext} size="sm">
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
