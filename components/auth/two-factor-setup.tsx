// @ts-ignore
"use client";

import { useEffect, useMemo, useState } from "react";
// @ts-ignore
import QRCode from "qrcode";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  code: z.string().min(6, "Enter the 6-digit code").max(6, "Enter the 6-digit code"),
});

type FormValues = z.infer<typeof schema>;

interface TwoFactorSetupProps {
  otpauthUrl: string;
  secretKey: string;
  onVerify: (code: string) => Promise<void>;
}

export const TwoFactorSetup = ({ otpauthUrl, secretKey, onVerify }: TwoFactorSetupProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { code: "" } });

  useEffect(() => {
    let cancelled = false;
    const renderQr = async () => {
      try {
        const data = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
        if (!cancelled) {
          setQrDataUrl(data);
        }
      } catch (qrError) {
        console.error("Failed to render QR code", qrError);
      }
    };
    renderQr();
    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  const manualKey = useMemo(() => secretKey.match(/.{1,4}/g)?.join(" ") ?? secretKey, [secretKey]);

  const submit = form.handleSubmit(async (values) => {
    setError("");
    setIsSubmitting(true);
    try {
      await onVerify(values.code);
      form.reset();
    } catch (err: any) {
      setError(err?.message ?? "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="2FA QR" className="h-48 w-48 rounded border bg-white p-2 shadow-sm" />
            ) : (
              <div className="flex h-48 w-48 items-center justify-center rounded border bg-muted" aria-busy="true">
                Generating QR…
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground">Scan with any TOTP authenticator app</p>
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Manual entry key</p>
              <code className="block rounded border bg-muted/50 p-3 text-sm tracking-widest">{manualKey}</code>
              <p className="text-xs text-muted-foreground">Enter manually if you cannot scan the QR code.</p>
            </div>
            <form className="space-y-3" onSubmit={submit}>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="code">
                  6-digit code
                </label>
                <Input
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="123456"
                  {...form.register("code")}
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Verifying…" : "Confirm setup"}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
