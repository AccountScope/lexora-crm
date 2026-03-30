"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to LEXORA",
    description: "Let's take a quick tour of your new legal CRM. This will only take 2 minutes.",
  },
  {
    title: "Dashboard Overview",
    description: "Your dashboard shows key metrics: revenue, active matters, utilization rate, and outstanding invoices. All in real-time.",
  },
  {
    title: "Matters Management",
    description: "Click 'Matters' in the sidebar to see all your cases. You can filter by status, practice area, or assigned team member.",
  },
  {
    title: "Quick Actions",
    description: "Hover over any matter card to reveal quick actions: Log Time, Add Document, or Send Message.",
  },
  {
    title: "Time Tracking",
    description: "Our AI-powered time tracking automatically suggests entries based on your activity. Never miss billable hours again.",
  },
  {
    title: "Trust Accounting",
    description: "Manage client funds with confidence. Our system ensures SRA compliance with automated reconciliation.",
  },
  {
    title: "All Set!",
    description: "You're ready to go! Explore the platform and feel free to reach out if you need help.",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingTour({ onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show tour after a brief delay
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" />

      {/* Tour Card */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-scale-in px-4">
        <Card className="shadow-2xl">
          <CardContent className="p-6">
            {/* Close Button */}
            <button
              onClick={handleSkip}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Progress Dots */}
            <div className="mb-6 flex justify-center gap-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-2 bg-primary/50"
                      : "w-2 bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-2 pt-4">
                <div>
                  {!isFirstStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevious}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isLastStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkip}
                    >
                      Skip Tour
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="gap-1"
                  >
                    {isLastStep ? (
                      <>
                        <Check className="h-4 w-4" />
                        Get Started
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step Counter */}
              <div className="text-center text-xs text-muted-foreground">
                Step {currentStep + 1} of {tourSteps.length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
