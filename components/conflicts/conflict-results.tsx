import { ConflictCard } from "@/components/conflicts/conflict-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConflictMatchRecord, ConflictSummaryCounts } from "@/types";

interface ConflictDecisionProps {
  preventCaseCreation: boolean;
  requireAdminApproval: boolean;
  notifyEthics: boolean;
  watchListHits: string[];
}

interface ConflictResultsProps {
  summary: ConflictSummaryCounts;
  conflicts: ConflictMatchRecord[];
  decisions?: ConflictDecisionProps;
  onAction?: (action: "waive" | "reject" | "view", conflict: ConflictMatchRecord) => void;
}

const summaryCards: { key: keyof ConflictSummaryCounts; label: string }[] = [
  { key: "total", label: "Total conflicts" },
  { key: "high", label: "High risk" },
  { key: "medium", label: "Medium risk" },
  { key: "low", label: "Low risk" },
];

export const ConflictResults = ({ summary, conflicts, decisions, onAction }: ConflictResultsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                {card.label}
              </CardTitle>
              <p className="text-3xl font-semibold text-foreground">{summary[card.key]}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {decisions && (
        <Card>
          <CardHeader>
            <CardTitle>Conflict prevention</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Badge variant={decisions.preventCaseCreation ? "destructive" : "outline"}>
              {decisions.preventCaseCreation ? "Block case creation" : "Creation allowed"}
            </Badge>
            <Badge variant={decisions.requireAdminApproval ? "secondary" : "outline"}>
              {decisions.requireAdminApproval ? "Admin approval required" : "No approval needed"}
            </Badge>
            <Badge variant={decisions.notifyEthics ? "secondary" : "outline"}>
              {decisions.notifyEthics ? "Notify ethics team" : "No notification"}
            </Badge>
            {decisions.watchListHits.length > 0 && (
              <Badge variant="destructive">
                Watch list: {decisions.watchListHits.join(", ")}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {conflicts.length === 0 && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No conflicts were detected. You can proceed with the intake.
            </CardContent>
          </Card>
        )}
        {conflicts.map((conflict: any) => (
          <ConflictCard key={conflict.id} conflict={conflict} onAction={onAction} />
        ))}
      </div>
    </div>
  );
};
