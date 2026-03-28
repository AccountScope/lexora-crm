"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurityStatus } from "@/lib/hooks/use-security";

export const SecurityBanner = () => {
  const { data } = useSecurityStatus();
  const status = data?.data;

  if (!status) return null;

  const warnings: { id: string; node: React.ReactNode }[] = [];

  if (!status.email.verified) {
    warnings.push({
      id: "email",
      node: (
        <div className="flex flex-1 flex-col gap-1">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <ShieldAlert className="h-4 w-4" />
            Verify your email to continue using Lexora.
          </p>
          <p className="text-xs text-amber-900/80">
            We emailed <span className="font-medium">{status.email.address ?? "your account"}</span>. You cannot access core workflows until your inbox is confirmed.
          </p>
        </div>
      ),
    });
  }

  if (status.twoFactor.required && (!status.twoFactor.enabled || !status.twoFactor.verified)) {
    const deadlineText = status.twoFactor.forceDeadline ? `Enable 2FA by ${new Date(status.twoFactor.forceDeadline).toLocaleDateString()}.` : "Enable 2FA to protect your account.";
    warnings.push({
      id: "2fa",
      node: (
        <div className="flex flex-1 flex-col gap-1">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
            <AlertTriangle className="h-4 w-4" />
            Two-factor authentication required.
          </p>
          <p className="text-xs text-amber-900/80">{deadlineText}</p>
        </div>
      ),
    });
  }

  if (!warnings.length) {
    return null;
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:gap-6">
          {warnings.map((warning) => (
            <div key={warning.id} className="flex flex-1 items-start gap-3">
              {warning.node}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!status.email.verified && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/verify-email">Verify email</Link>
            </Button>
          )}
          {status.twoFactor.required && (!status.twoFactor.enabled || !status.twoFactor.verified) && (
            <Button size="sm" asChild>
              <Link href="/settings/security">Secure account</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
