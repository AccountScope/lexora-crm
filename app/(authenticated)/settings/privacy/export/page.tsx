"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileArchive, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

export default function DataExportPage() {
  const [loading, setLoading] = useState(false);
  const [exports, setExports] = useState<any[]>([]);

  const requestExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gdpr/export", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert("Export requested! You'll receive an email when it's ready (usually within 24 hours).");
        // Refresh exports list
      }
    } catch (error) {
      alert("Failed to request export");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      processing: { variant: "default", icon: Clock, label: "Processing" },
      ready: { variant: "default", icon: CheckCircle2, label: "Ready" },
      downloaded: { variant: "outline", icon: CheckCircle2, label: "Downloaded" },
      expired: { variant: "destructive", icon: AlertCircle, label: "Expired" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Export Your Data"
        description="Download a copy of all your personal data stored in LEXORA"
      />

      <Card>
        <CardHeader>
          <CardTitle>Request Data Export</CardTitle>
          <CardDescription>
            We'll prepare a ZIP file containing all your data in machine-readable format (JSON).
            This typically takes a few hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">What's included:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your profile information</li>
              <li>All cases/matters you're involved in</li>
              <li>Your time entries and billing records</li>
              <li>Document metadata (files are included for documents you uploaded)</li>
              <li>Login history (last 100 attempts)</li>
              <li>Audit logs (your activity history)</li>
            </ul>
          </div>

          <Button onClick={requestExport} disabled={loading} className="gap-2">
            <FileArchive className="h-4 w-4" />
            {loading ? "Requesting..." : "Request Data Export"}
          </Button>

          <p className="text-xs text-muted-foreground">
            This is provided under GDPR Article 15 (Right to Access). Your export will be available
            for 7 days after it's ready.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Your previous export requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No export requests yet
            </p>
          ) : (
            <div className="space-y-3">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Export {new Date(exp.createdAt).toLocaleDateString()}
                      </p>
                      {getStatusBadge(exp.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exp.status === "ready" && exp.expiresAt && (
                        <>Expires {new Date(exp.expiresAt).toLocaleDateString()}</>
                      )}
                      {exp.status === "downloaded" && exp.downloadedAt && (
                        <>Downloaded {new Date(exp.downloadedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>

                  {exp.status === "ready" && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
