"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle, 
  Play,
  Briefcase,
  Users,
  Clock,
  FileText,
  CreditCard,
  Scale,
  Sparkles,
  ChevronRight,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  estimatedTime: string;
  href: string;
  completed: boolean;
}

export function LawyerOnboardingDashboard() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem("lexora-onboarding-completed") || "[]"))
  );

  const steps: OnboardingStep[] = [
    {
      id: "create-case",
      title: "Create Your First Matter",
      description: "Learn how to set up a new case with client details, matter type, and initial information.",
      icon: Briefcase,
      estimatedTime: "2 mins",
      href: "/cases/new",
      completed: completedSteps.has("create-case"),
    },
    {
      id: "add-client",
      title: "Add a Client",
      description: "Set up your client database with contact details, billing information, and preferences.",
      icon: Users,
      estimatedTime: "2 mins",
      href: "/clients/new",
      completed: completedSteps.has("add-client"),
    },
    {
      id: "track-time",
      title: "Track Your Time",
      description: "Use the timer or manual entry to track billable and non-billable time. See AI suggestions too!",
      icon: Clock,
      estimatedTime: "3 mins",
      href: "/time",
      completed: completedSteps.has("track-time"),
    },
    {
      id: "upload-document",
      title: "Upload a Document",
      description: "Store case documents securely with version control and chain of custody tracking.",
      icon: FileText,
      estimatedTime: "1 min",
      href: "/documents",
      completed: completedSteps.has("upload-document"),
    },
    {
      id: "create-invoice",
      title: "Create an Invoice",
      description: "Convert your time entries into a professional invoice. Try LEDES export for corporate clients!",
      icon: CreditCard,
      estimatedTime: "3 mins",
      href: "/billing",
      completed: completedSteps.has("create-invoice"),
    },
    {
      id: "trust-account",
      title: "Set Up Trust Accounting",
      description: "SRA-compliant trust account management. Track client funds with confidence.",
      icon: Scale,
      estimatedTime: "5 mins",
      href: "/trust-accounting",
      completed: completedSteps.has("trust-account"),
    },
    {
      id: "ai-features",
      title: "Explore AI Features",
      description: "See how AI captures time automatically, calculates deadlines, and reconciles trust accounts.",
      icon: Sparkles,
      estimatedTime: "5 mins",
      href: "/time?tab=ai",
      completed: completedSteps.has("ai-features"),
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  const markAsComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem("lexora-onboarding-completed", JSON.stringify([...newCompleted]));
  };

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Welcome to Lexora, Sabrina! 👋</CardTitle>
              <CardDescription className="text-blue-50">
                Let's get you set up in 20 minutes. Complete these steps to discover how Lexora
                saves you 10+ hours every week.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white text-blue-600 text-lg px-4 py-2">
              {completedCount} / {steps.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Setup Progress</span>
              <span className="font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-blue-400" />
            {completedCount === steps.length && (
              <p className="text-sm text-blue-50 mt-3">
                🎉 Congratulations! You've completed the onboarding. Ready to save time!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick start guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            What You'll Learn
          </CardTitle>
          <CardDescription>
            This guided tour shows you the essential features every lawyer needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Core Workflow</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Case management</li>
                <li>• Time tracking</li>
                <li>• Document storage</li>
                <li>• Billing & invoicing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Compliance</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• SRA trust accounting</li>
                <li>• Audit trails</li>
                <li>• Chain of custody</li>
                <li>• Data protection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Time Savers</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI time capture</li>
                <li>• Auto deadlines</li>
                <li>• LEDES export</li>
                <li>• Client portal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isNext = !step.completed && steps.slice(0, index).every((s) => s.completed);

          return (
            <Card
              key={step.id}
              className={cn(
                "transition-all",
                step.completed && "bg-green-50 border-green-200",
                isNext && "border-blue-500 border-2"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                      step.completed
                        ? "bg-green-500 text-white"
                        : isNext
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {index + 1}. {step.title}
                          </h3>
                          {isNext && (
                            <Badge variant="default" className="bg-blue-500">
                              Start here
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {step.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.estimatedTime}
                          </span>
                          {step.completed && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action button */}
                      {!step.completed && (
                        <Button
                          asChild
                          variant={isNext ? "default" : "outline"}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <a href={step.href}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help card */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>We're here to make your onboarding smooth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Video Tutorials</h4>
                <p className="text-xs text-muted-foreground">
                  Watch 2-minute videos for each feature
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">AI Help Chat</h4>
                <p className="text-xs text-muted-foreground">
                  Ask questions anytime (bottom right corner)
                </p>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              <strong>Testing Tip:</strong> Focus on steps 1-5 first (core workflow). 
              Steps 6-7 show advanced features that save the most time.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@lexora.ai">
                Contact Support →
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
