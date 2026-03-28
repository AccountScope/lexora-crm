"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Monitor, Smartphone, MapPin } from "lucide-react";
import { format } from "date-fns";

interface LoginAttempt {
  id: string;
  ipAddress: string;
  success: boolean;
  device?: string;
  browser?: string;
  location?: string;
  failureReason?: string;
  createdAt: string;
}

export default function LoginHistoryPage() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async () => {
    try {
      const res = await fetch("/api/auth/login-history");
      const data = await res.json();
      if (data.success) {
        setAttempts(data.attempts);
      }
    } catch (error) {
      console.error("Failed to fetch login history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (!device) return <Monitor className="h-4 w-4" />;
    if (device.toLowerCase().includes("mobile") || device.toLowerCase().includes("iphone")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login History</h1>
        <p className="text-muted-foreground mt-2">
          Review all login attempts to your account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Login Attempts</CardTitle>
          <CardDescription>
            Last 100 login attempts (successful and failed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No login attempts yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        {attempt.success ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(attempt.createdAt), "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(attempt.createdAt), "hh:mm a")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(attempt.device)}
                          <div>
                            <p className="text-sm">{attempt.device || "Unknown"}</p>
                            {attempt.browser && (
                              <p className="text-xs text-muted-foreground">{attempt.browser}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{attempt.location}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {attempt.ipAddress}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
