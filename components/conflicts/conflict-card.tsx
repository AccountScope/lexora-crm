import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConflictMatchRecord } from "@/types";

const severityVariant: Record<string, string> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const conflictLabels: Record<string, string> = {
  direct: "Direct conflict",
  opposing: "Opposing party",
  related: "Related party",
  former_client: "Former client",
  third_party: "Watch list",
};

interface ConflictCardProps {
  conflict: ConflictMatchRecord;
  onAction?: (action: "waive" | "reject" | "view", conflict: ConflictMatchRecord) => void;
}

export const ConflictCard = ({ conflict, onAction }: ConflictCardProps) => {
  const severity = severityVariant[conflict.severity] ?? "outline";
  const label = conflictLabels[conflict.conflictType] ?? conflict.conflictType;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            {conflict.caseTitle ?? "Unlinked conflict"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {conflict.caseNumber ? `Matter ${conflict.caseNumber}` : conflict.partyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={severity}>{conflict.severity.toUpperCase()}</Badge>
          <Badge variant="outline">{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>{conflict.description ?? `Conflict involving ${conflict.partyName}`}</p>
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Party</p>
            <p className="font-medium text-foreground">{conflict.partyName}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Lawyer on record</p>
            <p className="font-medium text-foreground">{conflict.lawyerName ?? "Unassigned"}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {conflict.caseId ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/cases/${conflict.caseId}`}>View case</Link>
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAction?.("view", conflict)}
            disabled={!onAction}
          >
            View details
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onAction?.("waive", conflict)}>
          Waive conflict
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAction?.("reject", conflict)}>
          Reject intake
        </Button>
      </CardFooter>
    </Card>
  );
};
