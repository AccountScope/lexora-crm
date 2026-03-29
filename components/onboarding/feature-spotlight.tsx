"use client"

import { useState, useEffect } from "react"
import { X, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Step {
  title: string
  description: string
  target?: string // CSS selector for element to highlight
  position?: "top" | "bottom" | "left" | "right"
}

interface FeatureSpotlightProps {
  steps: Step[]
  onComplete: () => void
  onSkip: () => void
  storageKey: string // localStorage key to track if user has seen this
}

/**
 * Feature Spotlight - Interactive onboarding overlay
 * Shows new users around key features with step-by-step highlighting
 */
export function FeatureSpotlight({
  steps,
  onComplete,
  onSkip,
  storageKey
}: FeatureSpotlightProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already seen this spotlight
    const hasShown = localStorage.getItem(storageKey)
    if (!hasShown) {
      setIsVisible(true)
    }
  }, [storageKey])

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
    setIsVisible(false)
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true")
    setIsVisible(false)
    onSkip()
  }

  if (!isVisible) return null

  const step = steps[currentStep]

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300" />
      
      {/* Spotlight card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        idx === currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
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

          {/* Content */}
          <p className="text-muted-foreground mb-6">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep < steps.length - 1 ? (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  "Get started"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
