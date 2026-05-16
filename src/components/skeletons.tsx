import { Skeleton } from "@/components/ui/skeleton";

/* ------------- Generic atoms ------------- */

export function ShimmerBlock({ className = "" }: { className?: string }) {
  return <Skeleton className={className} />;
}

function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-16 opacity-70" />
    </div>
  );
}

function TokenRowSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3 w-24 opacity-70" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
        <Skeleton className="h-3 w-14 ml-auto opacity-70" />
      </div>
    </div>
  );
}

function PoolCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 opacity-70" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4 opacity-70" />
        <Skeleton className="h-3 w-1/2 opacity-70" />
      </div>
    </div>
  );
}

function LpRowSkeleton() {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20 opacity-70" />
          </div>
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-3 w-16 ml-auto opacity-70" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/60">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

/* ------------- Page-level shells ------------- */

export function PoolGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {Array.from({ length: count }).map((_, i) => (
        <PoolCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PoolStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PortfolioTokensSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <TokenRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function LPositionsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-2">
      <div className="glass-strong rounded-2xl p-4 flex items-center justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-3 w-16 ml-auto" />
          <Skeleton className="h-7 w-10 ml-auto" />
        </div>
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <LpRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function ActivityFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5 opacity-70" />
            </div>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SwapCardSkeleton() {
  return (
    <div className="animated-border rounded-3xl mx-auto w-full max-w-md">
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-36 opacity-70" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <div className="flex justify-center -my-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}

export function LiquidityCardSkeleton() {
  return (
    <div className="animated-border rounded-3xl mx-auto w-full max-w-md">
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </div>
  );
}
