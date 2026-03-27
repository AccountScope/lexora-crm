import type { CaseTeamMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CaseTeam = ({ team }: { team: CaseTeamMember[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Assigned team</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {team.map((member) => (
        <div key={member.userId} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
          <div>
            <p className="font-medium">{member.fullName}</p>
            <p className="text-xs text-muted-foreground">{member.email ?? "No email"}</p>
          </div>
          <Badge variant={member.isPrimary ? "success" : "secondary"}>{member.role}</Badge>
        </div>
      ))}
    </CardContent>
  </Card>
);
