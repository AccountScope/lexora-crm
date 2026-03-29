"use client";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorBoundary } from "@/components/error-boundary";

export default function ActivityPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Activity Feed"
          description="Recent system activity and updates across all matters"
        />
        <ActivityFeed />
      </div>
    </ErrorBoundary>
  );
}
