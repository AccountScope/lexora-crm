"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminUserMetrics } from "@/lib/hooks/use-admin";

export const AdminDashboard = () => {
  const { data, isFetching } = useAdminUserMetrics();
  const metrics = (data as any)?.totalUsers ? (data as any) : (data as any)?.data;
  const roleBreakdown = metrics?.roles ?? [];
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Administration</h1>
        <p className="text-muted-foreground">Monitor overall user health, invitations, and role coverage.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total users" value={metrics?.totalUsers ?? 0} loading={isFetching} subtitle="Across the entire tenant" />
        <MetricCard title="Active" value={metrics?.activeUsers ?? 0} loading={isFetching} subtitle="Currently able to sign in" />
        <MetricCard title="Pending invites" value={metrics?.pendingInvitations ?? 0} loading={isFetching} subtitle="Awaiting acceptance" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Role distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Ensure coverage across practice roles.</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/users">Manage users</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {roleBreakdown.length === 0 && <p className="text-sm text-muted-foreground">No role data yet.</p>}
            {roleBreakdown.map((role: { role: string; count: number }) => (
              <div key={role.role} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="font-medium">{role.role}</span>
                <span className="text-sm text-muted-foreground">{role.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild>
              <Link href="/admin/users/invite">Invite a user</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/invitations">Review pending invitations</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">Audience directory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, loading, subtitle }: { title: string; value: number; loading: boolean; subtitle: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? <div className="h-8 w-16 animate-pulse rounded bg-muted" /> : <p className="text-4xl font-semibold">{value}</p>}
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </CardContent>
  </Card>
);
