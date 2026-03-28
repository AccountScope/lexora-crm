"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { BackupCodes } from "@/components/auth/backup-codes";
import { useSecurityStatus } from "@/lib/hooks/use-security";

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data?.error as string) ?? (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }
  return res.json();
};

export default function SecuritySettingsPage() {
  const { data, isLoading, refetch } = useSecurityStatus();
  const [setupPayload, setSetupPayload] = useState<{ base32: string; otpauthUrl: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const overview = data?.data;

  const refresh = async () => {
    await refetch();
    setSetupPayload(null);
  };

  const initTwoFactor = async () => {
    setMessage("");
    setIsEnrolling(true);
    try {
      const response = await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init" }),
      });
      setSetupPayload({ base32: response.data.base32, otpauthUrl: response.data.otpauthUrl });
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to start setup");
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyTwoFactor = async (code: string) => {
    setMessage("");
    try {
      const response = await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", code }),
      });
      setBackupCodes(response.data.backupCodes);
      setSetupPayload(null);
      await refresh();
    } catch (error: any) {
      setMessage(error?.message ?? "Verification failed");
      throw error;
    }
  };

  const disableTwoFactor = async () => {
    const input = window.prompt("Enter a 6-digit code or backup code to disable 2FA");
    if (!input) return;
    setIsProcessing(true);
    setMessage("");
    try {
      const payload = /^\d{6}$/.test(input)
        ? { action: "disable", code: input }
        : { action: "disable", backupCode: input };
      await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setBackupCodes(null);
      await refresh();
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to disable 2FA");
    } finally {
      setIsProcessing(false);
    }
  };

  const regenerateCodes = async () => {
    setIsProcessing(true);
    setMessage("");
    try {
      const response = await fetchJson("/api/auth/two-factor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate-backup-codes" }),
      });
      setBackupCodes(response.data.codes);
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to regenerate codes");
    } finally {
      setIsProcessing(false);
    }
  };

  const requestRecovery = async () => {
    setIsProcessing(true);
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
    } finally {
      setIsProcessing(false);
    }
  };

  const resendVerification = async () => {
    setMessage("");
    try {
      await fetchJson("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      setMessage("Verification email sent");
    } catch (error: any) {
      setMessage(error?.message ?? "Unable to resend email");
    }
  };

  const twoFactorEnabled = overview?.twoFactor.enabled;
  const canDisable = twoFactorEnabled && !overview?.twoFactor.required;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Security controls</h1>
          <p className="text-sm text-muted-foreground">Manage verification status, multi-factor auth, and account recovery.</p>
        </div>
      </div>
      {message && <p className="rounded-md border border-muted bg-muted/30 px-3 py-2 text-sm">{message}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant={overview?.email.verified ? "default" : "secondary"}>{overview?.email.verified ? "Verified" : "Pending"}</Badge>
              <p className="text-sm">{overview?.email.address ?? "Unknown"}</p>
            </div>
            {!overview?.email.verified && (
              <p className="text-sm text-muted-foreground">
                Confirm your address to unlock the workspace. Check spam or request a new email.
              </p>
            )}
            <Button variant="outline" disabled={overview?.email.verified} onClick={resendVerification}>
              Resend verification email
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Two-factor authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant={twoFactorEnabled ? "default" : "secondary"}>{twoFactorEnabled ? "Enabled" : "Disabled"}</Badge>
              {overview?.twoFactor.required && <Badge variant="outline">Required</Badge>}
              {overview?.twoFactor.blocking && <Badge variant="warning">Blocked</Badge>}
            </div>
            <ul className="text-sm text-muted-foreground">
              <li>Attempts remaining: {overview?.twoFactor.attemptsRemaining ?? "-"}</li>
              <li>Backup codes remaining: {overview?.twoFactor.backupCodesRemaining ?? "-"}</li>
              {overview?.twoFactor.lockedUntil && <li>Locked until {new Date(overview.twoFactor.lockedUntil).toLocaleString()}</li>}
              {overview?.twoFactor.forceDeadline && (
                <li className="text-destructive">Enable by {new Date(overview.twoFactor.forceDeadline).toLocaleDateString()}</li>
              )}
            </ul>
            <div className="flex flex-wrap gap-3">
              {!twoFactorEnabled && (
                <Button onClick={initTwoFactor} disabled={isEnrolling || isLoading}>
                  {isEnrolling ? "Preparing…" : "Enable 2FA"}
                </Button>
              )}
              {canDisable && (
                <Button variant="outline" onClick={disableTwoFactor} disabled={isProcessing}>
                  Disable 2FA
                </Button>
              )}
              {twoFactorEnabled && (
                <Button variant="secondary" onClick={regenerateCodes} disabled={isProcessing}>
                  Regenerate backup codes
                </Button>
              )}
              {twoFactorEnabled && (
                <Button variant="ghost" onClick={requestRecovery} disabled={isProcessing || overview?.twoFactor.recoveryPending}>
                  Lost access?
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {setupPayload && (
        <TwoFactorSetup otpauthUrl={setupPayload.otpauthUrl} secretKey={setupPayload.base32} onVerify={verifyTwoFactor} />
      )}
      {backupCodes && <BackupCodes codes={backupCodes} onDismiss={() => setBackupCodes(null)} />}
    </div>
  );
}
