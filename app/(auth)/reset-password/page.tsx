"use client";


import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";

const schema = z
  .object({
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "valid" | "invalid" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    setStatus("idle");
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setStatus("valid"))
      .catch(() => {
        setStatus("invalid");
      });
  }, [token]);

  const submit = form.handleSubmit(async (values) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Unable to reset password");
      }
      setStatus("success");
      setTimeout(() => router.push("/login"), 4000);
    } catch (err: any) {
      setError(err.message ?? "Unable to reset password");
    }
  });

  const disabled = status === "invalid" || status === "success";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create a new password</CardTitle>
          <CardDescription>Passwords must meet Lexora's enterprise policy requirements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "invalid" && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Reset link is invalid or expired.</p>}
          {status === "success" && (
            <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
              Password updated. Redirecting you to login…
            </p>
          )}
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <Input type="password" autoComplete="new-password" disabled={disabled} {...form.register("password")} />
              <PasswordStrengthMeter password={form.watch("password")} />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm password</label>
              <Input type="password" autoComplete="new-password" disabled={disabled} {...form.register("confirm")} />
              {form.formState.errors.confirm && (
                <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={disabled || form.formState.isSubmitting || status === "idle"}>
              {form.formState.isSubmitting ? "Saving…" : "Reset password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
