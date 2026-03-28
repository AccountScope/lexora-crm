import { ConflictDetailView } from "@/components/conflicts/conflict-detail-view";

export default function ConflictDetailPage({ params }: { params: { id: string } }) {
  return <ConflictDetailView conflictId={params.id} />;
}
