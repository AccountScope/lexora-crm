"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

interface BackupCodesProps {
  codes: string[];
  onDismiss?: () => void;
}

export const BackupCodes = ({ codes, onDismiss }: BackupCodesProps) => {
  const content = useMemo(() => codes.join("\n"), [codes]);

  const download = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lexora-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    const windowRef = window.open("", "_blank");
    if (!windowRef) return;
    windowRef.document.write(`<pre>${content}</pre>`);
    windowRef.document.close();
    windowRef.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup codes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Store these 10 single-use codes in a safe place. They will not be shown again. Each code can replace a TOTP code once.
        </p>
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {codes.map((code) => (
              <code key={code} className="rounded bg-background px-3 py-2 text-sm font-semibold tracking-widest">
                {code}
              </code>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" className="gap-2" onClick={download}>
            <Download className="h-4 w-4" /> Download
          </Button>
          <Button type="button" variant="outline" className="gap-2" onClick={print}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          {onDismiss && (
            <Button type="button" onClick={onDismiss}>
              Done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
