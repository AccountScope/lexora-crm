"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, BarChart, CheckCircle } from "lucide-react";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      // Show modal after a short delay
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsOpen(false);
  };

  const steps = [
    {
      title: "Welcome to Lexora CRM! 🎉",
      description: "Your complete legal practice management solution",
      icon: CheckCircle,
      content: (
        <div className="space-y-4 text-center">
          <p className="text-lg">
            Lexora helps you manage cases, track time, handle billing, and collaborate with your team — all in one place.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-primary/5 rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Case Management</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Time Tracking</p>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg">
              <BarChart className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Analytics</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Organize Your Cases",
      description: "Create and manage all your legal matters in one place",
      icon: Briefcase,
      content: (
        <div className="space-y-4">
          <img 
            src="/images/onboarding/cases.png" 
            alt="Cases dashboard" 
            className="w-full rounded-lg border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Track all case details, clients, and deadlines</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Link documents, time entries, and invoices</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Generate professional reports instantly</span>
            </li>
          </ul>
          <Button className="w-full" onClick={() => window.location.href = '/cases'}>
            Go to Cases
          </Button>
        </div>
      ),
    },
    {
      title: "Track Your Time Effortlessly",
      description: "Log billable hours with powerful tracking tools",
      icon: Clock,
      content: (
        <div className="space-y-4">
          <img 
            src="/images/onboarding/time.png" 
            alt="Time tracking" 
            className="w-full rounded-lg border"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <ul className="space-y-2 text-left">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Manual entry or real-time timer</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Pre-built templates for common tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Convert to invoices automatically</span>
            </li>
          </ul>
          <Button className="w-full" onClick={() => window.location.href = '/time'}>
            Start Tracking Time
          </Button>
        </div>
      ),
    },
    {
      title: "You're All Set! 🚀",
      description: "Ready to explore Lexora",
      icon: CheckCircle,
      content: (
        <div className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <p className="text-lg">
            You're ready to start managing your legal practice more efficiently!
          </p>
          <div className="bg-primary/5 p-4 rounded-lg text-left">
            <h4 className="font-semibold mb-2">Quick Tips:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Use the Quick Actions card on your dashboard</li>
              <li>• Press <kbd className="px-2 py-1 bg-white border rounded">?</kbd> anytime for help</li>
              <li>• Explore the sidebar to discover all features</li>
              <li>• Check Settings to customize your workspace</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            You can always access this tour from Help → Getting Started
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
              <DialogDescription>{currentStepData.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep ? "bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep === 0 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            )}
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Get Started
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
