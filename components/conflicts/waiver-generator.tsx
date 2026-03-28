"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateWaiverTemplate } from "@/lib/conflicts/waiver-template";
import { useCreateConflictWaiver } from "@/lib/hooks/use-conflicts";

interface WaiverGeneratorProps {
  conflictCheckId: string;
  clientName: string;
  parties: string[];
  caseType?: string | null;
  defaultSummary?: string;
}

export const WaiverGenerator = ({
  conflictCheckId,
  clientName,
  parties,
  caseType,
  defaultSummary,
}: WaiverGeneratorProps) => {
  const mutation = useCreateConflictWaiver(conflictCheckId);
  const [summary, setSummary] = useState(defaultSummary ?? "Potential representation conflict requiring client consent.");
  const [waiverText, setWaiverText] = useState(
    generateWaiverTemplate({
      clientName,
      conflictedParties: parties,
      conflictSummary: defaultSummary ?? "",
      caseType: caseType ?? undefined,
    })
  );
  const [caseId, setCaseId] = useState<string>("");
  const [signedBy, setSignedBy] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [signedDocumentId, setSignedDocumentId] = useState("");

  const regenerate = () => {
    setWaiverText(
      generateWaiverTemplate({
        clientName,
        conflictedParties: parties,
        conflictSummary: summary,
        caseType: caseType ?? undefined,
      })
    );
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(waiverText);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(waiverText, 180);
    doc.text(lines, 15, 20);
    doc.save(`conflict-waiver-${clientName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  const saveWaiver = async () => {
    await mutation.mutateAsync({
      waiverText,
      caseId: caseId || undefined,
      signedBy: signedBy || undefined,
      signedAt: signedAt || undefined,
      expiresAt: expiresAt || undefined,
      signedDocumentId: signedDocumentId || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conflict waiver</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          <Button type="button" variant="outline" size="sm" onClick={regenerate}>
            Regenerate letter
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Waiver letter</Label>
          <Textarea value={waiverText} onChange={(event) => setWaiverText(event.target.value)} rows={12} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyToClipboard}>
              Copy text
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadPdf}>
              Download PDF
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="caseId">Linked case ID</Label>
            <Input id="caseId" value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signedDocumentId">Signed document ID</Label>
            <Input
              id="signedDocumentId"
              value={signedDocumentId}
              onChange={(event) => setSignedDocumentId(event.target.value)}
              placeholder="Optional document UUID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signedBy">Signed by</Label>
            <Input id="signedBy" value={signedBy} onChange={(event) => setSignedBy(event.target.value)} placeholder={clientName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signedAt">Signed at</Label>
            <Input id="signedAt" type="date" value={signedAt} onChange={(event) => setSignedAt(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires at</Label>
            <Input id="expiresAt" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button" onClick={saveWaiver} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save waiver"}
        </Button>
      </CardFooter>
    </Card>
  );
};
