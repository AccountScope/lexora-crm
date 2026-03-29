import { DocumentVault } from "@/components/documents/document-vault";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DocumentsPage() {
  return (
    <ErrorBoundary>
      <DocumentVault />
    </ErrorBoundary>
  );
}
