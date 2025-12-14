import React from 'react';

// --- Primitives ---

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-zinc-800 rounded-lg ${className}`} />
);

// --- Component Skeletons ---

export const SkeletonText = ({ className = '', w = 'w-3/4' }: { className?: string; w?: string }) => (
  <div className={`h-4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse ${w} ${className}`} />
);

export const SkeletonAvatar = ({ size = 'size-10', className = '' }: { size?: string; className?: string }) => (
  <div className={`${size} rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0 animate-pulse ${className}`} />
);

export const SkeletonIcon = ({ className = '' }: { className?: string }) => (
  <div className={`size-10 rounded-xl bg-gray-200 dark:bg-zinc-800 shrink-0 animate-pulse ${className}`} />
);

// --- Module Skeletons ---

// Transaction Row (Match swipeable item height)
export const SkeletonTransaction = () => (
  <div className="flex items-center gap-4 py-3 border-b border-app-border/50 last:border-0 px-2">
    <SkeletonIcon />
    <div className="flex-1 space-y-2">
      <SkeletonText w="w-1/3" />
      <SkeletonText w="w-1/4" className="h-3" />
    </div>
    <div className="flex flex-col items-end gap-1.5">
      <SkeletonText w="w-16" />
    </div>
  </div>
);

// Standard Card
export const SkeletonCard = ({ h = 'h-32' }: { h?: string }) => (
  <div className={`w-full bg-app-surface border border-app-border rounded-2xl p-5 ${h} animate-pulse bg-gray-50/50 dark:bg-zinc-900/30`} />
);

// Chart Area
export const SkeletonChart = ({ height = 'h-64' }: { height?: string }) => (
  <div className={`w-full bg-app-surface border border-app-border rounded-2xl p-5 ${height}`}>
    <div className="flex justify-between items-center mb-6">
      <SkeletonText w="w-32" />
      <SkeletonText w="w-16" />
    </div>
    <div className="flex items-end gap-2 h-3/4 pb-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-t-lg animate-pulse" style={{ height: `${Math.random() * 60 + 20}%` }} />
      ))}
    </div>
  </div>
);

// --- Page Skeletons ---

export const SkeletonTransactionList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-1">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonTransaction key={i} />
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div className="min-h-screen bg-app-bg pb-20">
    {/* Sidebar Placeholder (Desktop) */}
    <div className="hidden lg:block fixed left-0 top-0 bottom-0 w-72 border-r border-app-border bg-app-surface" />

    <div className="lg:pl-72 max-w-7xl mx-auto px-4 md:px-8 pt-6">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <SkeletonAvatar size="size-12" />
        <div className="space-y-2">
          <SkeletonText w="w-48" className="h-6" />
          <SkeletonText w="w-32" />
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* Main Balance (Span 2) */}
        <div className="lg:col-span-2 h-40 bg-app-surface border border-app-border rounded-3xl p-6 relative overflow-hidden">
          <SkeletonText w="w-32" className="mb-4" />
          <SkeletonText w="w-64" className="h-10" />
        </div>

        {/* Quick Stats */}
        <div className="h-40 bg-app-surface border border-app-border rounded-3xl p-5" />
        <div className="h-40 bg-app-surface border border-app-border rounded-3xl p-5" />

        {/* Chart (Span 3) */}
        <div className="lg:col-span-3 h-[300px] bg-app-surface border border-app-border rounded-3xl p-6 relative">
          <SkeletonText w="w-40" className="mb-8" />
          <div className="w-full h-48 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        </div>

        {/* Recent Transactions (Span 1) */}
        <div className="lg:col-span-1 h-[300px] bg-app-surface border border-app-border rounded-3xl p-5 space-y-4">
          <SkeletonText w="w-24" />
          <SkeletonTransaction />
          <SkeletonTransaction />
          <SkeletonTransaction />
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonAppLoading = () => (
  <div className="h-dvh flex items-center justify-center bg-app-bg">
    <div className="flex flex-col items-center gap-4">
      <div className="size-16 rounded-2xl bg-app-primary/10 animate-pulse" />
      <SkeletonText w="w-32" />
    </div>
  </div>
);

export default Skeleton;