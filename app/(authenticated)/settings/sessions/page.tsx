"use client";

import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useActiveSessions, useRevokeSession, useRevokeOtherSessions, useRememberPreference } from "@/lib/hooks/use-sessions";

export default function SessionSettingsPage() {
  const { data, isLoading } = useActiveSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const rememberToggle = useRememberPreference();

  const sessions = data?.data ?? [];
  const remember = data?.meta.rememberMe ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Active sessions</h1>
        <p className="text-sm text-muted-foreground">See every device logged into Lexora and revoke anything unfamiliar.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Devices & locations</CardTitle>
            <CardDescription>Idle sessions are terminated automatically after {data?.meta.idleTimeoutMinutes ?? 30} minutes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active sessions.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {sessions.map((session) => (
                  <div key={session.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {session.device ?? session.browser ?? "Unknown device"}
                        {session.current && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Current</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location ?? "Location unknown"} • Last active {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">IP {session.ipAddress ?? "N/A"} • Expires {new Date(session.expiresAt).toLocaleString()}</p>
                    </div>
                    {!session.current && (
                      <Button variant="outline" size="sm" onClick={() => revoke.mutate(session.id)} disabled={revoke.isPending}>
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Remember me</p>
                <p className="text-xs text-muted-foreground">Stay signed in for 30 days on this browser.</p>
              </div>
              <Switch
                checked={remember}
                onCheckedChange={(checked) => rememberToggle.mutate(checked)}
                disabled={rememberToggle.isPending}
              />
            </div>
            <Button variant="secondary" onClick={() => revokeOthers.mutate()} disabled={revokeOthers.isPending}>
              Revoke all other sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
