"use client";

import { useCaseDetail, useCaseNotes, useCaseTimeline } from "@/lib/hooks/use-cases";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { CaseNotes } from "@/components/cases/case-notes";
import { CaseTeam } from "@/components/cases/case-team";
import { DocumentVault } from "@/components/documents/document-vault";
import { DocumentChain } from "@/components/documents/document-chain";
import { CaseEmails } from "@/components/email/case-emails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CaseDetailView = ({ matterId }: { matterId: string }) => {
  const { data, isLoading, error } = useCaseDetail(matterId);
  const detail = data?.data;
  const notes = useCaseNotes(matterId);
  const timeline = useCaseTimeline(matterId);

  if (isLoading) {
    return (
      <div className="container-page space-y-6 page-transition pb-12">
        <div className="skeleton-loader h-32 w-full" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton-loader h-64 w-full" />
            <div className="skeleton-loader h-64 w-full" />
          </div>
          <div className="skeleton-loader h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="container-page page-transition pb-12">
        <Card className="border-red-200 dark:border-red-900/30">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <p className="text-lg font-semibold">Failed to load case</p>
              <p className="text-sm mt-2">
                {error ? (error as Error).message : 'Case not found'}
              </p>
            </div>
            <button 
              onClick={() => window.location.href = '/cases'}
              className="btn-premium btn-secondary-premium btn-md mt-4"
            >
              Back to Cases
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl">{detail.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Matter {detail.matterNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{detail.status}</Badge>
            {detail.practiceArea && <Badge variant="secondary">{detail.practiceArea}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{detail.description ?? "No description"}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Client</p>
              <p className="font-medium text-foreground">{detail.client.displayName ?? detail.client.legalName}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Lead attorney</p>
              <p className="font-medium text-foreground">{detail.leadAttorney?.name ?? "Unassigned"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Team size</p>
              <p className="font-medium text-foreground">{detail.team.length} contributors</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CaseTimeline events={timeline.data?.data} />
          <CaseNotes matterId={matterId} notes={notes.data?.data} />
        </div>
        <CaseTeam team={detail.team} />
      </div>
      <CaseEmails caseId={matterId} />
      <DocumentVault matterId={matterId} clientId={detail.client.id} />
      {detail.documents.length > 0 && (
        <DocumentChain
          documentIds={detail.documents.map((doc: any) => ({ id: doc.id, title: doc.title }))}
        />
      )}
    </div>
  );
};
