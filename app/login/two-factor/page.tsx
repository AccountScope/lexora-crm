-e export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

"use client";

// Prevent static generation for this dynamic page
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSecurityStatus } from "@/lib/hooks/use-security";

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data?.error as string) ?? "Request failed");
  }
  return res.json();
};

export default function TwoFactorChallengePage() {
  const { data, refetch } = useSecurityStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<string>("");
  const nextUrl = searchParams.get("next") ?? "/dashboard";
  const recoveryToken = searchParams.get("token");

  useEffect(() => {
    if (!recoveryToken) return;
    fetchJson("/api/auth/two-factor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete-recovery", token: recoveryToken }),
    })
      .then(() => {
        setTokenStatus("Two-factor disabled for recovery. Please re-enable after signing in.");
        refetch();
      })
      .catch((error: any) => {
        setTokenStatus(error?.message ?? "Recovery link invalid");
      });
  }, [recoveryToken, refetch]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!code) {
      setMessage("Enter a code to continue");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login-verify", method, code }),
      });
      router.replace(nextUrl);
    } catch (error: any) {
      setMessage(error?.message ?? "Verification failed");
      await refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestRecovery = async () => {
    setMessage("");
    try {
      await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-recovery" }),
      });
      setMessage("Recovery email sent");
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to send recovery email");
    }
  };

  const status = data?.data.twoFactor;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Enter your security code</CardTitle>
          <p className="text-sm text-muted-foreground">Two-factor authentication protects privileged data inside Lexora.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenStatus && <p className="rounded border border-muted bg-muted/20 px-3 py-2 text-sm">{tokenStatus}</p>}
          {status?.lockedUntil && (
            <p className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Locked until {new Date(status.lockedUntil).toLocaleString()}
            </p>
          )}
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-2 ${method === "totp" ? "border-primary text-primary" : "border-muted-foreground/30"}`}
              onClick={() => setMethod("totp")}
            >
              Authenticator code
            </button>
            <button
              type="button"
              className={`flex-1 rounded border px-3 py-2 ${method === "backup" ? "border-primary text-primary" : "border-muted-foreground/30"}`}
              onClick={() => setMethod("backup")}
            >
              Backup code
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={method === "totp" ? "123456" : "ABCDE-FGHIJ"}
                maxLength={method === "totp" ? 6 : 11}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              {status && (
                <p className="text-xs text-muted-foreground">
                  Attempts remaining: {status.attemptsRemaining}. Backup codes left: {status.backupCodesRemaining}.
                </p>
              )}
            </div>
            {message && <p className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Checking…" : "Verify"}
            </Button>
          </form>
          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p>
              <button type="button" className="underline" onClick={requestRecovery} disabled={status?.recoveryPending}>
                Lost your device? Email recovery link
              </button>
            </p>
            <p>
              Need to update your secret? Manage it in the security center once signed in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
