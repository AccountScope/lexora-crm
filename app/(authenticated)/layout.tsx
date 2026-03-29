import { ErrorBoundary } from "@/components/error-boundary";
import { QuickActionsFAB } from "@/components/ui/quick-actions-fab";

// Force all authenticated routes to be dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.NodeType;
}) {
  return (
    <ErrorBoundary>
      {children}
      <QuickActionsFAB />
    </ErrorBoundary>
  );
}
