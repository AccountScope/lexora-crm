"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Clock, FileText, DollarSign, X } from "lucide-react";
import { useState, useEffect } from "react";

export function WelcomeCard() {
  const [isVisible, setIsVisible] = useState(true);
  const [userName, setUserName] = useState("there");

  useEffect(() => {
    // Check if user has dismissed the welcome card
    const dismissed = localStorage.getItem("welcomeCardDismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }

    // Get user name from localStorage or API
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("welcomeCardDismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    {
      icon: Briefcase,
      label: "New Case",
      href: "/cases/new",
      color: "text-blue-600",
      bg: "bg-blue-50 hover:bg-blue-100",
    },
    {
      icon: Clock,
      label: "Log Time",
      href: "/time",
      color: "text-green-600",
      bg: "bg-green-50 hover:bg-green-100",
    },
    {
      icon: FileText,
      label: "Upload Document",
      href: "/documents",
      color: "text-purple-600",
      bg: "bg-purple-50 hover:bg-purple-100",
    },
    {
      icon: DollarSign,
      label: "Create Invoice",
      href: "/invoices/new",
      color: "text-orange-600",
      bg: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={handleDismiss}
        aria-label="Dismiss welcome card"
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <CardTitle className="text-2xl">
          {getGreeting()}, {userName}! 👋
        </CardTitle>
        <p className="text-muted-foreground">
          Welcome to Lexora CRM. Here's what you can do right now:
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors ${action.bg} group`}
              >
                <Icon className={`h-8 w-8 mb-2 ${action.color} group-hover:scale-110 transition-transform`} />
                <span className="text-sm font-medium text-center">{action.label}</span>
              </a>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-primary/10">
          <h4 className="font-semibold mb-2">Getting Started Checklist</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
              <span className="text-muted-foreground">Account created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              <span>Create your first case</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              <span>Log a time entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              <span>Invite a team member</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
