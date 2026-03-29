"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, CheckCircle, XCircle, Loader2, FileText, AlertCircle } from "lucide-react";

interface LEDESExporterProps {
  invoiceId: string;
  matterNumber: string;
  clientId: string;
}

export function LEDESExporter({ invoiceId, matterNumber, clientId }: LEDESExporterProps) {
  const [format, setFormat] = useState<"1998B" | "2000">("1998B");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [validation, setValidation] = useState<{
    valid: boolean;
    errors: string[];
  } | null>(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/ledes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
          clientId,
          matterNumber,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Export failed");
      }

      return res.blob();
    },
    onSuccess: (blob) => {
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LEDES_${format}_${invoiceNumber || Date.now()}.${
        format === "1998B" ? "txt" : "xml"
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${invoiceId}/ledes/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Validation failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setValidation(data);
    },
  });

  const handleExport = () => {
    if (!invoiceNumber) {
      alert("Please enter an invoice number");
      return;
    }
    exportMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>LEDES Export</CardTitle>
            <CardDescription>
              Generate LEDES format for corporate client e-billing systems
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            One-Click Export
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format selection */}
        <div className="space-y-3">
          <Label>LEDES Format</Label>
          <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1998B" id="1998B" />
              <Label htmlFor="1998B" className="font-normal cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>LEDES 1998B</span>
                  <Badge variant="secondary" className="text-xs">
                    Most Common
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pipe-delimited format. Works with Legal Tracker, Tymetrix, SimpleLegal.
                </p>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="2000" id="2000" />
              <Label htmlFor="2000" className="font-normal cursor-pointer">
                <div>
                  <span>LEDES 2000</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    XML format. Required by some corporate legal departments.
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              placeholder="INV-2026-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must match the invoice number in your e-billing system
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Client ID</Label>
              <Input value={clientId} disabled />
            </div>
            <div>
              <Label>Matter Number</Label>
              <Input value={matterNumber} disabled />
            </div>
          </div>
        </div>

        {/* Validation results */}
        {validation && (
          <Alert variant={validation.valid ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {validation.valid ? (
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {validation.valid ? (
                    <span className="font-medium">Validation passed!</span>
                  ) : (
                    <div className="space-y-2">
                      <span className="font-medium">
                        {validation.errors.length} error(s) found:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {validation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Info panel */}
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-sm space-y-2">
            <p className="font-medium">What is LEDES?</p>
            <p>
              LEDES (Legal Electronic Data Exchange Standard) is required by most
              corporate clients for electronic billing. Our one-click export:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Generates perfect format (no manual Excel work)</li>
              <li>Auto-maps activity codes (UTBMS standard)</li>
              <li>Validates before export (catches errors)</li>
              <li>Works with Legal Tracker, Tymetrix, SimpleLegal</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Saves 2-3 hours per invoice vs manual formatting.
            </p>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => validateMutation.mutate()}
            variant="outline"
            disabled={!invoiceNumber || validateMutation.isPending}
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate
              </>
            )}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!invoiceNumber || exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export LEDES
              </>
            )}
          </Button>
        </div>

        {/* Success message */}
        {exportMutation.isSuccess && (
          <Alert>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              <span className="font-medium">Export successful!</span>
              <p className="text-sm mt-1">
                LEDES file downloaded. Upload to your e-billing system.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error message */}
        {exportMutation.isError && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>
              {(exportMutation.error as Error).message}
            </AlertDescription>
          </Alert>
        )}

        {/* Supported systems */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Supported e-billing systems:</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">Legal Tracker</Badge>
            <Badge variant="outline" className="text-xs">Tymetrix</Badge>
            <Badge variant="outline" className="text-xs">SimpleLegal</Badge>
            <Badge variant="outline" className="text-xs">Collaborati</Badge>
            <Badge variant="outline" className="text-xs">BusyLamp</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
