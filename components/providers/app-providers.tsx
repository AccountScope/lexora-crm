"use client";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { OfflineProvider } from "@/components/providers/offline-provider";

interface Props {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: Props) => {
  return (
    <ThemeProvider>
      <QueryProvider>
        <OfflineProvider>{children}</OfflineProvider>
      </QueryProvider>
    </ThemeProvider>
  );
};
