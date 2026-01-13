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
  <div className="w-full min-h-dvh bg-app-bg pb-6 md:pb-12">
    {/* Header */}
    <header className="pt-6 pb-2 px-4 md:px-8 max-w-[1400px] mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        {/* Mobile Avatar Placeholder */}
        <div className="size-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse md:hidden" />
        <div className="space-y-2">
          <SkeletonText w="w-24" className="h-3" />
          <SkeletonText w="w-32" className="h-7" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        <div className="size-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse hidden md:block" />
      </div>
    </header>

    <main className="px-4 md:px-8 py-4 max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* 1. Main Balance (Span 2) */}
      <div className="md:col-span-2 row-span-2 h-[260px] md:h-auto bg-app-surface border border-app-border rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
        <div className="space-y-4">
          <SkeletonText w="w-24" className="h-3" />
          <SkeletonText w="w-64" className="h-12 md:h-16" />
        </div>
        <div className="space-y-2">
          <SkeletonText w="w-20" className="h-3" />
          <SkeletonText w="w-40" className="h-6" />
        </div>
      </div>

      {/* 2. Stats Widgets */}
      <div className="h-32 bg-app-surface border border-app-border rounded-3xl p-5 flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <SkeletonText w="w-16" className="h-3" />
        </div>
        <SkeletonText w="w-32" className="h-8" />
      </div>
      <div className="h-32 bg-app-surface border border-app-border rounded-3xl p-5 flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <SkeletonText w="w-16" className="h-3" />
        </div>
        <SkeletonText w="w-32" className="h-8" />
      </div>

      {/* 3. Planning Widget (Span 4) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4">
        <SkeletonPlanningWidget />
      </div>

      {/* 4. Chart (Span 3) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-3 min-h-[300px] bg-app-surface border border-app-border rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <SkeletonText w="w-32" className="h-4" />
          <SkeletonText w="w-20" className="h-4" />
        </div>
        <div className="w-full h-48 bg-gray-100 dark:bg-zinc-800/10 rounded-xl animate-pulse mt-auto" />
      </div>

      {/* 5. Alertas (Span 1) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1 min-h-[200px] bg-app-surface border border-app-border rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
        <div className="size-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        <SkeletonText w="w-24" className="h-3" />
      </div>

      {/* 6. Recent Transactions (Full width) */}
      <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-app-surface border border-app-border rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <SkeletonText w="w-48" className="h-4" />
          <SkeletonText w="w-20" className="h-4" />
        </div>
        <div className="space-y-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                <div className="space-y-2">
                  <SkeletonText w="w-32" className="h-4" />
                  <SkeletonText w="w-24" className="h-2" />
                </div>
              </div>
              <SkeletonText w="w-20" className="h-5" />
            </div>
          ))}
        </div>
      </div>
    </main>
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

// Reports Page
export const SkeletonReports = () => (
  <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
    {/* Header placeholder */}
    <div className="h-14 mb-2" />

    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">

      {/* Hero Stats Card */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
        {/* Main result */}
        <div className="text-center mb-5 pb-5 border-b border-app-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SkeletonText w="w-40" className="h-3" />
          </div>
          <SkeletonText w="w-48" className="h-10 mx-auto" />
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-100 dark:bg-zinc-800/50 flex flex-col items-center gap-2">
              <SkeletonText w="w-16" className="h-3" />
              <SkeletonText w="w-20" className="h-5" />
            </div>
          ))}
        </div>
      </div>

      {/* 50/30/20 Section */}
      <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-200 dark:bg-zinc-800 size-10" />
            <div className="space-y-1.5">
              <SkeletonText w="w-32" className="h-4" />
              <SkeletonText w="w-24" className="h-3" />
            </div>
          </div>
          <SkeletonText w="w-32" className="h-8 rounded-lg" />
        </div>

        {/* Chart + Legend */}
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Donut Chart placeholder */}
          <div className="h-48 w-48 relative shrink-0">
            <div className="absolute inset-0 rounded-full border-14 border-gray-200 dark:border-zinc-800" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <SkeletonText w="w-12" className="h-3" />
              <SkeletonText w="w-16" className="h-5 mt-1" />
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-5 flex-1">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-gray-200 dark:bg-zinc-800" />
                    <SkeletonText w="w-20" />
                  </div>
                  <SkeletonText w="w-20" />
                </div>
                <div className="h-2.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full" />
                <div className="flex justify-between mt-1.5">
                  <SkeletonText w="w-24" className="h-3" />
                  <SkeletonText w="w-20" className="h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-app-subtle/50 rounded-2xl border border-app-border flex items-start gap-3">
        <div className="size-6 rounded-full bg-gray-200 dark:bg-zinc-800 shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonText w="w-full" className="h-3" />
          <SkeletonText w="w-3/4" className="h-3" />
        </div>
      </div>
    </div>
  </div>
);

// Recurring Page
export const SkeletonRecurring = () => (
  <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
    {/* Header placeholder */}
    <div className="h-14 mb-2" />

    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">

      {/* Section header */}
      <div className="flex justify-between items-center px-1">
        <SkeletonText w="w-32" className="h-3" />
        <SkeletonText w="w-16" className="h-6 rounded-lg" />
      </div>

      {/* Intro Card */}
      <div className="bento-card p-5 bg-linear-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900">
        <div className="flex gap-4">
          <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonText w="w-40" className="h-4" />
            <SkeletonText w="w-full" className="h-3" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['w-20', 'w-24', 'w-20'].map((w, i) => (
          <div key={i} className={`${w} h-9 rounded-xl bg-gray-200 dark:bg-zinc-800`} />
        ))}
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-app-surface border border-app-border p-4 rounded-2xl flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gray-200 dark:bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonText w="w-32" className="h-4" />
              <div className="flex items-center gap-1.5">
                <SkeletonText w="w-16" className="h-3" />
                <SkeletonText w="w-20" className="h-3" />
              </div>
              <SkeletonText w="w-24" className="h-3" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonText w="w-16" className="h-5" />
              <SkeletonText w="w-4" className="h-4" />
            </div>
          </div>
        ))}
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