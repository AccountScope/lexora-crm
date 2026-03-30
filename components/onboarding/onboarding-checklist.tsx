"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle, 
  X, 
  Briefcase, 
  User, 
  Clock, 
  Users,
  PiggyBank,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  action?: () => void;
}

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: "create-matter",
      title: "Create your first matter",
      description: "Add a legal case to get started",
      icon: Briefcase,
      completed: false,
      action: () => window.location.href = "/cases",
    },
    {
      id: "add-client",
      title: "Add a client",
      description: "Import or create a new client profile",
      icon: User,
      completed: false,
      action: () => window.location.href = "/clients",
    },
    {
      id: "log-time",
      title: "Log your first time entry",
      description: "Track billable hours",
      icon: Clock,
      completed: false,
      action: () => window.location.href = "/time",
    },
    {
      id: "invite-team",
      title: "Invite a team member",
      description: "Collaborate with your colleagues",
      icon: Users,
      completed: false,
      action: () => window.location.href = "/settings/team",
    },
    {
      id: "setup-trust",
      title: "Set up trust account",
      description: "Manage client funds securely",
      icon: PiggyBank,
      completed: false,
      action: () => window.location.href = "/trust-accounting",
    },
  ]);

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (dismissed) return null;

  return (
    <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Dismiss Button */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>

      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Get Started with LEXORA</CardTitle>
            <CardDescription>
              Complete these steps to unlock the full potential
            </CardDescription>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {completedCount} of {totalCount} completed
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-all",
                  item.completed
                    ? "border-success/50 bg-success/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="mt-0.5 transition-transform hover:scale-110"
                >
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h4 className={cn(
                      "text-sm font-medium",
                      item.completed && "text-muted-foreground line-through"
                    )}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                {/* Action Button */}
                {!item.completed && item.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={item.action}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    Start
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <div className="mt-4 rounded-lg border border-success/50 bg-success/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
            <p className="mt-2 font-medium text-success">
              Congratulations! You've completed the setup.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You're ready to manage your legal practice like a pro.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
