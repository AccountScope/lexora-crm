import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getInvitationByToken } from "@/lib/admin/invitations";
import { ApiError } from "@/lib/api/errors";
import { AcceptInvitationForm } from "@/components/admin/accept-invitation-form";

interface PageProps {
  searchParams: Record<string, string | undefined>;
}

export default async function AcceptInvitationPage({ searchParams }: PageProps) {
  const token = searchParams?.token;
  if (!token) {
    return <ErrorState title="Missing token" description="Add the invitation token from your email to continue." />;
  }
  try {
    const invitation = await getInvitationByToken(token);
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12">
        <Card className="shadow-xl">
          <CardHeader className="space-y-2">
            <Badge variant="outline" className="w-fit">
              Invitation
            </Badge>
            <CardTitle>Join Lexora</CardTitle>
            <p className="text-sm text-muted-foreground">
              You were invited to join as <strong>{invitation.role?.name ?? "team member"}</strong>. Complete the secure setup below.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <InvitationMeta invitation={invitation} />
            <AcceptInvitationForm invitation={invitation} token={token} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Invitation link is invalid.";
    return <ErrorState title="Unable to continue" description={message} />;
  }
}

const InvitationMeta = ({ invitation }: { invitation: Awaited<ReturnType<typeof getInvitationByToken>> }) => (
  <div className="grid gap-2 text-sm">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Email</span>
      <span className="font-medium">{invitation.email}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Role</span>
      <span className="font-medium">{invitation.role?.name ?? "Team member"}</span>
    </div>
    {invitation.invitedBy?.name && (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Invited by</span>
        <span className="font-medium">{invitation.invitedBy.name}</span>
      </div>
    )}
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Expires</span>
      <span className="font-medium">{new Date(invitation.expiresAt).toLocaleString()}</span>
    </div>
    {invitation.customMessage && (
      <div className="rounded-md border bg-muted/40 p-3 text-sm italic text-muted-foreground">“{invitation.customMessage}”</div>
    )}
  </div>
);

const ErrorState = ({ title, description }: { title: string; description: string }) => (
  <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12 text-center">
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </div>
);
