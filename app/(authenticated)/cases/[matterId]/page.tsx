import { CaseDetailView } from "@/components/cases/case-detail-view";

export default function CaseDetailPage({ params }: { params: { matterId: string } }) {
  return <CaseDetailView matterId={params.matterId} />;
}
