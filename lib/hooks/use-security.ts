"use client";

import { useQuery } from "@tanstack/react-query";

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
};

export interface TwoFactorStatusResponse {
  data: {
    email: {
      address?: string | null;
      verified: boolean;
      lastSentAt?: string | null;
      expiresAt?: string | null;
    };
    twoFactor: {
      enabled: boolean;
      verified: boolean;
      required: boolean;
      blocking: boolean;
      forceDeadline?: string | null;
      forceStartedAt?: string | null;
      backupCodesRemaining: number;
      attemptsRemaining: number;
      lockedUntil?: string | null;
      recoveryPending: boolean;
    };
  };
}

export const useSecurityStatus = () =>
  useQuery<TwoFactorStatusResponse>({
    queryKey: ["security-status"],
    queryFn: () => fetcher<TwoFactorStatusResponse>("/api/auth/two-factor"),
    refetchInterval: 30_000,
  });
