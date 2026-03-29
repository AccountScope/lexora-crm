"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Download,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

interface ReconciliationDashboardProps {
  trustAccountId: string;
}

export function AutoReconciliationDashboard({ trustAccountId }: ReconciliationDashboardProps) {
  const queryClient = useQueryClient();

  // Fetch latest reconciliation run
  const { data, isLoading } = useQuery({
    queryKey: ["reconciliation", trustAccountId],
    queryFn: async () => {
      const res = await fetch(`/api/trust-accounts/${trustAccountId}/reconciliation`);
      if (!res.ok) throw new Error("Failed to fetch reconciliation");
      return res.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  // Run reconciliation mutation
  const runReconciliation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trust-accounts/${trustAccountId}/reconciliation/run`, {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Reconciliation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation", trustAccountId] });
    },
  });

  const latestRun = data?.latestRun;
  const suggestions = data?.suggestions || [];
  const discrepancies = data?.discrepancies || [];
  const bankConnection = data?.bankConnection;

  const isReconciled = latestRun?.sraCompliant && discrepancies.length === 0;
  const needsReview = latestRun?.status === "pending_review";

  return (
    <div className="space-y-6">
      {/* Status card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Auto-Reconciliation
              </CardTitle>
              <CardDescription>
                Automated three-way reconciliation with SRA compliance
              </CardDescription>
            </div>
            <Button
              onClick={() => runReconciliation.mutate()}
              disabled={runReconciliation.isPending || isLoading}
              size="sm"
            >
              {runReconciliation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : latestRun ? (
            <>
              {/* Overall status */}
              <div className={cn(
                "flex items-center gap-4 p-4 rounded-lg border-2",
                isReconciled
                  ? "bg-green-50 border-green-200"
                  : needsReview
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              )}>
                {isReconciled ? (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                ) : needsReview ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {isReconciled
                      ? "✅ Reconciled"
                      : needsReview
                      ? "⚠️ Needs Review"
                      : "❌ Discrepancies Found"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Last run: {format(new Date(latestRun.completedAt || latestRun.startedAt), "dd MMM yyyy 'at' HH:mm")}
                  </p>
                </div>
                {latestRun.sraCompliant && (
                  <Badge variant="default" className="bg-green-500">
                    SRA Compliant
                  </Badge>
                )}
              </div>

              {/* Three-way balances */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Bank Balance</p>
                  <p className="text-2xl font-bold">
                    £{(latestRun.bankBalance || 0).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Client Ledger</p>
                  <p className="text-2xl font-bold">
                    £{(latestRun.clientLedgerBalance || 0).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Difference</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    Math.abs((latestRun.totalDiscrepancyAmount || 0)) < 0.01
                      ? "text-green-600"
                      : "text-red-600"
                  )}>
                    £{Math.abs(latestRun.totalDiscrepancyAmount || 0).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-muted-foreground">Matched</span>
                  <span className="text-lg font-semibold">{latestRun.matchesFound || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm text-muted-foreground">Discrepancies</span>
                  <span className="text-lg font-semibold text-red-600">
                    {latestRun.discrepanciesFound || 0}
                  </span>
                </div>
              </div>

              {/* Bank connection status */}
              {bankConnection && (
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      bankConnection.enabled ? "bg-green-500" : "bg-gray-300"
                    )} />
                    <div>
                      <p className="text-sm font-medium">{bankConnection.bankName}</p>
                      <p className="text-xs text-muted-foreground">
                        Account: •••• {bankConnection.accountNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {bankConnection.syncFrequency}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!latestRun.sraReportGenerated}>
                  <Download className="w-4 h-4 mr-2" />
                  SRA Report
                </Button>
                {needsReview && (
                  <Button size="sm">
                    Review Discrepancies →
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-4">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">No reconciliation run yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Run Now" to start automated reconciliation
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Match Suggestions</CardTitle>
            <CardDescription>
              Review these suggested matches (confidence-based)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion: any) => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {(suggestion.confidence * 100).toFixed(0)}% match
                      </Badge>
                      <span className="text-sm font-medium">
                        £{suggestion.amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.matchReason}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm">
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discrepancies */}
      {discrepancies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Discrepancies ({discrepancies.length})
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discrepancies.map((disc: any) => (
                <Alert key={disc.id} variant="destructive">
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{disc.description}</p>
                        <p className="text-xs mt-1">
                          Difference: £{Math.abs(disc.differenceAmount || 0).toFixed(2)}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {disc.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info panel */}
      <Alert>
        <Sparkles className="w-4 h-4" />
        <AlertTitle>How Auto-Reconciliation Works</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>Our AI-powered system:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Syncs transactions from your bank daily (Open Banking)</li>
            <li>Matches bank transactions to trust ledger automatically (90%+ accuracy)</li>
            <li>Runs three-way reconciliation (bank vs client ledger vs office)</li>
            <li>Detects discrepancies and suggests corrections</li>
            <li>Generates SRA-compliant reports instantly</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Saves 3 hours per month per account. Your accountant reviews in 5 minutes vs 3 hours.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
