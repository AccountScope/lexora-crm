import { ConflictRecordsView } from "@/components/conflicts/conflict-records-view";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ConflictsPage() {
  return (
    <ErrorBoundary>
      <ConflictRecordsView />
    </ErrorBoundary>
  );
}
