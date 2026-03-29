"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/ui/page-header";

export default function AccountDeletionPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirmed || !password) {
      alert("Please confirm and enter your password");
      return;
    }

    if (!window.confirm("Are you ABSOLUTELY sure? This action cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          "Account deletion requested. You'll receive an email with a cancellation link. " +
          "Your account will be permanently deleted in 30 days unless you cancel."
        );
        window.location.href = "/";
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (error) {
      alert("Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Delete Account"
        description="Permanently delete your account and all associated data"
      />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning: This action cannot be undone</AlertTitle>
        <AlertDescription>
          Deleting your account will remove all your personal data after a 30-day grace period.
        </AlertDescription>
      </Alert>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Permanent Account Deletion</CardTitle>
          <CardDescription>
            Please read this carefully before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-destructive/50 p-4 space-y-2">
            <h3 className="font-medium text-destructive">What will be deleted:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Your profile information (name, email, phone)</li>
              <li>Your login credentials and sessions</li>
              <li>Your personal preferences and settings</li>
              <li>Your marketing consent records</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">What will be kept (legal requirement):</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Financial records (invoices, payments) - 7 years</li>
              <li>Case records where you're a participant (anonymized)</li>
              <li>Audit logs (anonymized for compliance)</li>
            </ul>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand this is permanent
                </label>
                <p className="text-sm text-muted-foreground">
                  My account will be deleted after 30 days. I can cancel within this period.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Confirm your password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!confirmed || !password || loading}
              className="gap-2 w-full"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Deleting..." : "Delete My Account"}
            </Button>

            <p className="text-xs text-muted-foreground">
              This is provided under GDPR Article 17 (Right to be Forgotten). You'll receive an
              email with a cancellation link valid for 30 days.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
