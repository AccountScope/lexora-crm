import { Sidebar } from "@/components/layout/sidebar";
import { SessionTimeoutWarning } from "@/components/auth/session-timeout-warning";
import { TopBar } from "@/components/layout/top-bar";
import { SecurityBanner } from "@/components/layout/security-banner";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <SecurityBanner />
        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>
        <SessionTimeoutWarning />
      </div>
    </div>
  );
};
