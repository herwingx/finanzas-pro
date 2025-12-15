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

export const SkeletonPlanningWidget = () => (
  <div className="bg-app-surface border border-app-border rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonText w="w-32" />
        <SkeletonText w="w-24" className="h-3" />
      </div>
      <SkeletonText w="w-24" className="h-8 rounded-lg" />
    </div>

    {/* Progress Bar */}
    <div className="space-y-2">
      <div className="flex justify-between">
        <SkeletonText w="w-20" className="h-3" />
        <SkeletonText w="w-20" className="h-3" />
      </div>
      <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse" />
    </div>

    {/* KPI Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse p-3 space-y-2">
          <SkeletonText w="w-16" className="h-3" />
          <SkeletonText w="w-24" className="h-6" />
        </div>
      ))}
    </div>

    {/* Budget Bar */}
    <div className="space-y-2 pt-2">
      <SkeletonText w="w-32" className="h-3" />
      <div className="flex h-3 w-full rounded-full overflow-hidden gap-1">
        <div className="w-1/2 bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        <div className="w-1/3 bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        <div className="w-1/6 bg-gray-200 dark:bg-zinc-800 animate-pulse" />
      </div>
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="w-full">
    {/* Header */}
    <div className="flex items-center gap-4 py-4 md:py-6 px-4 md:px-6 lg:px-8">
      <SkeletonAvatar size="size-10 md:size-12" />
      <div className="space-y-2">
        <SkeletonText w="w-48" className="h-6" />
        <SkeletonText w="w-32" />
      </div>
    </div>

    <div className="px-4 md:px-6 lg:px-8">
      {/* Bento Grid - Now matching Dashboard.tsx responsive grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

        {/* Main Balance (Span 2) */}
        <div className="col-span-2 h-48 bg-app-surface border border-app-border rounded-3xl p-6 relative overflow-hidden">
          <SkeletonText w="w-32" className="mb-4" />
          <SkeletonText w="w-64" className="h-12" />
          <div className="mt-6 flex gap-3">
            <SkeletonText w="w-24" className="h-8 rounded-full" />
            <SkeletonText w="w-32" className="h-8" />
          </div>
        </div>

        {/* Quick Stats - Side by side on mobile (naturally 1 col each in 2-col grid) */}
        <div className="h-32 bg-app-surface border border-app-border rounded-3xl p-5 flex flex-col justify-between">
          <div className="size-10 rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <div className="space-y-1">
            <SkeletonText w="w-20" className="h-3" />
            <SkeletonText w="w-24" className="h-6" />
          </div>
        </div>
        <div className="h-32 bg-app-surface border border-app-border rounded-3xl p-5 flex flex-col justify-between">
          <div className="size-10 rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <div className="space-y-1">
            <SkeletonText w="w-20" className="h-3" />
            <SkeletonText w="w-24" className="h-6" />
          </div>
        </div>

        {/* Planning Widget (Span 2 or 4) */}
        <div className="col-span-2 xl:col-span-4">
          <SkeletonPlanningWidget />
        </div>

        {/* Chart (Span 2 or 3) */}
        <div className="col-span-2 xl:col-span-3 h-[320px] bg-app-surface border border-app-border rounded-3xl p-6 relative">
          <SkeletonText w="w-40" className="mb-8" />
          <div className="w-full h-48 bg-gray-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
        </div>

        {/* Top Categories (Span 2 or 1) */}
        <div className="col-span-2 xl:col-span-1 h-[320px] bg-app-surface border border-app-border rounded-3xl p-5 flex flex-col items-center justify-center space-y-4">
          <div className="size-32 rounded-full border-8 border-gray-200 dark:border-zinc-800 animate-pulse" />
          <div className="w-full space-y-2">
            <SkeletonTransaction />
            <SkeletonTransaction />
          </div>
        </div>

        {/* Recent Transactions (Span 2 or 4) */}
        <div className="col-span-2 xl:col-span-4 h-64 bg-app-surface border border-app-border rounded-3xl p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <SkeletonText w="w-48" />
            <SkeletonText w="w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SkeletonTransactionList count={3} />
          </div>
        </div>

      </div>
    </div>
  </div>
);

export const SkeletonFinancialAnalysis = () => (
  <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
    {/* Header Placeholder - assuming PageHeader is static or fast, but we can mock it layout-wise if needed. PageHeader usually renders immediately though. */}
    <div className="h-14 mb-4" />

    <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 pt-2 pb-8 animate-pulse">
      {/* Period Selector */}
      <div className="flex flex-col items-center gap-2">
        <div className="h-9 w-full max-w-md bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        <SkeletonText w="w-48" className="h-3" />
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-app-surface border border-app-border rounded-2xl p-4 flex flex-col items-center justify-center space-y-2">
            <div className="size-10 rounded-xl bg-gray-200 dark:bg-zinc-800" />
            <SkeletonText w="w-16" className="h-2" />
            <SkeletonText w="w-20" className="h-5" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-app-surface border border-app-border rounded-2xl h-72 p-5 space-y-4">
        <div className="flex justify-between">
          <SkeletonText w="w-32" />
          <SkeletonText w="w-20" />
        </div>
        <div className="h-48 bg-gray-100 dark:bg-zinc-800/50 rounded-xl" />
      </div>

      {/* Lists Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <SkeletonCard h="h-48" />
        <SkeletonCard h="h-48" />
      </div>
    </div>
  </div>
);

export const SkeletonAccountList = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-app-surface border border-app-border rounded-2xl p-4 md:p-5 flex gap-4 items-center animate-pulse">
        <div className="size-12 rounded-2xl bg-gray-200 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <SkeletonText w="w-32" />
            <SkeletonText w="w-20" />
          </div>
          <SkeletonText w="w-16" className="h-3" />
        </div>
      </div>
    ))}
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