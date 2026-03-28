import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/admin/user-form";
import { getAdminUserById } from "@/lib/admin/users";

interface PageProps {
  params: { id: string };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const user = await getAdminUserById(params.id).catch(() => null);
  if (!user) {
    notFound();
  }
  const profile = user;
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">User</Badge>
        <h1 className="text-3xl font-semibold">{profile.fullName || profile.email}</h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm user={profile} />
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent logins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.loginHistory.length === 0 && <p className="text-muted-foreground">No login history yet.</p>}
            {profile.loginHistory.map((session) => (
              <div key={session.id} className="rounded-md border px-3 py-2">
                <p className="font-medium">{session.device ?? "Browser"}</p>
                <p className="text-xs text-muted-foreground">{session.ipAddress ?? "—"} · {new Date(session.occurredAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.auditLog.length === 0 && <p className="text-muted-foreground">No changes recorded.</p>}
            {profile.auditLog.map((entry) => (
              <div key={entry.id} className="rounded-md border px-3 py-2">
                <p className="font-medium">{entry.eventType}</p>
                <p className="text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
