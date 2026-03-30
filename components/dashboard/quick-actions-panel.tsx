"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Clock, Users, FileText, CreditCard } from "lucide-react";

export function QuickActionsPanel() {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const actions = [
    {
      id: "new-matter",
      icon: Plus,
      label: "New Matter",
      description: "Start a new legal matter",
      color: "text-blue-500",
    },
    {
      id: "log-time",
      icon: Clock,
      label: "Log Time",
      description: "Record billable hours",
      color: "text-green-500",
    },
    {
      id: "add-client",
      icon: Users,
      label: "Add Client",
      description: "Register new client",
      color: "text-purple-500",
    },
    {
      id: "upload-document",
      icon: FileText,
      label: "Upload Document",
      description: "Add file to vault",
      color: "text-orange-500",
    },
    {
      id: "create-invoice",
      icon: CreditCard,
      label: "Create Invoice",
      description: "Generate new bill",
      color: "text-pink-500",
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 hover:bg-accent hover:shadow-sm transition-all"
                  onClick={() => setActiveDialog(action.id)}
                >
                  <div className={action.color}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {action.description}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs for each action */}
      <Dialog open={activeDialog === "new-matter"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Matter</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Matter creation form would go here...
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "log-time"} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time Entry</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Time logging form would go here...
          </p>
        </DialogContent>
      </Dialog>

      {/* Add more dialogs as needed */}
    </>
  );
}
