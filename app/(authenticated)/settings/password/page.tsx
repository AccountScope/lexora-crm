"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import type { PasswordHealthMeta } from "@/types";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(12, "New password must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ApiResponse {
  data: PasswordHealthMeta;
}

const fetcher = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json();
};

export default function PasswordSettingsPage() {
  const client = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const { data, isLoading } = useQuery<ApiResponse>({ queryKey: ["password-meta"], queryFn: () => fetcher<ApiResponse>("/api/auth/password") });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" } });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      fetcher("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
      }),
    onSuccess: () => {
      form.reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      client.invalidateQueries({ queryKey: ["password-meta"] });
      setMessage("Password updated successfully");
    },
    onError: async (error: any) => {
      setMessage(error?.message ?? "Unable to update password");
    },
  });

  const expiresCopy = useMemo(() => {
    if (!data?.data?.passwordExpiresAt) return null;
    const date = new Date(data.data.passwordExpiresAt);
    return `Expires ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  }, [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Password & security</h1>
        <p className="text-sm text-muted-foreground">Rotate credentials regularly to stay within Lexora compliance guardrails.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Use a unique passphrase you don’t reuse elsewhere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current password</label>
                <Input type="password" autoComplete="current-password" {...form.register("currentPassword")} />
                {form.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.currentPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New password</label>
                <Input type="password" autoComplete="new-password" {...form.register("newPassword")} />
                <PasswordStrengthMeter password={form.watch("newPassword")} />
                {form.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm new password</label>
                <Input type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              {message && <p className="text-sm text-muted-foreground">{message}</p>}
              <Button className="w-full" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password policy</CardTitle>
            <CardDescription>Lexora enforces NIST-compliant password hygiene.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {isLoading ? (
              <p>Loading policy…</p>
            ) : (
              <ul className="list-disc space-y-2 pl-5">
                <li>Minimum 12 characters with uppercase, lowercase, number, and special character</li>
                <li>No reuse of your last 5 passwords</li>
                <li>Password expires every 90 days with 7-day warning</li>
                <li>Auto-check against breached credential databases</li>
              </ul>
            )}
            {data?.data?.passwordChangedAt && (
              <p>Last changed {new Date(data.data.passwordChangedAt).toLocaleDateString()}</p>
            )}
            {expiresCopy && <p>{expiresCopy}</p>}
            {data?.data?.forcePasswordChange && (
              <p className="text-destructive">Password change required before accessing sensitive areas.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
