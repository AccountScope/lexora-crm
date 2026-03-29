export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Prevent static generation for this dynamic page
export const dynamic = 'force-dynamic';

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data?.error as string) ?? "Request failed");
  }
  return res.json();
};

interface EmailStatus {
  email: string;
  verified: boolean;
  lastSentAt?: string | null;
  expiresAt?: string | null;
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const loadStatus = async () => {
    try {
      const response = await fetchJson("/api/auth/verify-email");
      setStatus(response.data);
    } catch (error) {
      // Ignore 401s when the user isn't signed in.
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    fetchJson("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", token }),
    })
      .then(() => {
        setMessage("Email verified successfully. You can close this tab or return to Lexora.");
        loadStatus();
      })
      .catch((error: any) => {
        setMessage(error?.message ?? "Verification link invalid or expired");
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const resend = async () => {
    setMessage("");
    try {
      await fetchJson("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      setMessage("Verification email sent");
      loadStatus();
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to resend email");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verify your email</CardTitle>
          <p className="text-sm text-muted-foreground">Confirm ownership of your inbox to continue using Lexora.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <p className="rounded border border-muted bg-muted/30 px-3 py-2 text-sm">{message}</p>}
          {status ? (
            <div className="space-y-1 text-sm">
              <p>
                Address: <span className="font-semibold">{status.email}</span>
              </p>
              <p>Status: {status.verified ? "Verified" : "Pending"}</p>
              {status.lastSentAt && <p>Last sent: {new Date(status.lastSentAt).toLocaleString()}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sign in to see which email we have on file.</p>
          )}
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={resend} disabled={!status || status.verified || isLoading}>
              Resend verification email
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => loadStatus()}>
              Refresh status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
