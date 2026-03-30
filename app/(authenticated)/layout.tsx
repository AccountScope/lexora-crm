"use client";

import { ErrorBoundary } from "@/components/error-boundary";
import { QuickActionsFAB } from "@/components/ui/quick-actions-fab";
import { GlobalSearch } from "@/components/search/global-search";
import { useGlobalSearch } from "@/hooks/use-global-search";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useGlobalSearch();

  return (
    <ErrorBoundary>
      {children}
      <QuickActionsFAB />
      <GlobalSearch open={open} onOpenChange={setOpen} />
    </ErrorBoundary>
  );
}
