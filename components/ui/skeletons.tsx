import { Skeleton } from "./skeleton";

// PHASE 2: Premium skeleton loaders (no spinners)

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MattersListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between mb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ClientsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MatterDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* 3-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-card">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      {/* Rows */}
      <div className="divide-y">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-full mb-3" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
