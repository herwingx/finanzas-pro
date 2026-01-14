import React from 'react';

/* ==================================================================================
   PRIMITIVES
   ================================================================================== */
const PulseBox = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-zinc-800 rounded-xl ${className}`} />
);

/* ==================================================================================
   COMPONENT-SPECIFIC SKELETONS
   ================================================================================== */

// --- Dashboard ---
export const SkeletonDashboard = () => (
  <div className="w-full min-h-dvh bg-app-bg pb-12 pt-6 px-4 md:px-8 max-w-7xl mx-auto space-y-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <PulseBox className="size-12 rounded-full" />
        <div className="space-y-2">
          <PulseBox className="h-3 w-24" />
          <PulseBox className="h-6 w-48" />
        </div>
      </div>
      <PulseBox className="size-10 rounded-full" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Hero Card */}
      <div className="col-span-2 row-span-2 h-[260px] bg-app-surface border border-app-border rounded-[32px] p-6 flex flex-col justify-between">
        <div className="space-y-4">
          <PulseBox className="h-4 w-32 opacity-50" />
          <PulseBox className="h-14 w-3/4" />
        </div>
        <div className="space-y-2">
          <PulseBox className="h-3 w-20 opacity-50" />
          <PulseBox className="h-5 w-40" />
        </div>
      </div>

      {/* Quick Stats */}
      <PulseBox className="h-[120px] bg-app-surface border border-app-border rounded-3xl opacity-60" />
      <PulseBox className="h-[120px] bg-app-surface border border-app-border rounded-3xl opacity-60" />

      {/* Actions */}
      <div className="col-span-2 grid grid-cols-2 gap-3">
        <PulseBox className="h-14 rounded-2xl bg-app-primary/10" />
        <PulseBox className="h-14 rounded-2xl" />
      </div>

      {/* Chart */}
      <div className="col-span-2 lg:col-span-3 h-[300px] bg-app-surface border border-app-border rounded-[32px] p-6 space-y-4">
        <div className="flex justify-between">
          <PulseBox className="h-5 w-40" />
          <PulseBox className="h-4 w-20 opacity-50" />
        </div>
        <PulseBox className="flex-1 bg-gray-100 dark:bg-zinc-800/50 rounded-2xl mt-4" />
      </div>

      {/* Recent Txs */}
      <div className="col-span-2 lg:col-span-4 bg-app-surface border border-app-border rounded-[32px] p-6 space-y-4">
        <PulseBox className="h-5 w-48 mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-1">
            <PulseBox className="size-12 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <PulseBox className="h-4 w-1/3" />
              <PulseBox className="h-3 w-1/4 opacity-50" />
            </div>
            <PulseBox className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Accounts Page ---
export const SkeletonAccountsPage = () => (
  <div className="max-w-2xl mx-auto px-4 mt-4 space-y-8 animate-pulse">
    {/* 1. Finanical Summary Widget (KPIs) */}
    <div className="grid grid-cols-2 gap-3">
      {/* Net Worth Card (Col span 2) */}
      <div className="col-span-2 h-32 bg-app-surface border border-app-border rounded-[24px] p-5 flex flex-col justify-center gap-2">
        <div className="flex items-center gap-2 opacity-50">
          <PulseBox className="size-4 rounded-full" />
          <PulseBox className="h-3 w-32" />
        </div>
        <PulseBox className="h-10 w-48" />
      </div>

      {/* Assets Card */}
      <div className="h-24 bg-app-surface border border-app-border rounded-[24px] p-4 flex flex-col justify-center gap-2">
        <PulseBox className="h-3 w-24 opacity-60" />
        <PulseBox className="h-6 w-32" />
      </div>

      {/* Liabilities Card */}
      <div className="h-24 bg-app-surface border border-app-border rounded-[24px] p-4 flex flex-col justify-center gap-2">
        <PulseBox className="h-3 w-24 opacity-60" />
        <PulseBox className="h-6 w-32" />
      </div>
    </div>

    {/* 2. Accounts List */}
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex justify-between items-center px-1">
        <PulseBox className="h-4 w-24" />
        <PulseBox className="h-5 w-16 rounded-full" />
      </div>

      {/* List Items */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 md:p-5 bg-app-surface border border-app-border rounded-3xl h-[88px]">
          <PulseBox className="size-11 md:size-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <PulseBox className="h-4 w-32" />
              <PulseBox className="h-5 w-24" />
            </div>
            <PulseBox className="h-3 w-20 opacity-50" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonTransactionList = ({ count = 6 }) => (
  <div className="space-y-1 pt-2">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3 animate-pulse border-b border-app-border/40 last:border-0">
        <div className="flex items-center gap-3 w-full">
          <PulseBox className="size-10 rounded-xl shrink-0 opacity-80" />
          <div className="space-y-2 flex-1">
            <PulseBox className="h-3.5 w-1/3" />
            <PulseBox className="h-2.5 w-1/4 opacity-50" />
          </div>
          <PulseBox className="h-4 w-16 shrink-0" />
        </div>
      </div>
    ))}
  </div>
);

// --- Financial Reports ---
export const SkeletonReports = () => (
  <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-pulse">
    {/* Header Placeholders */}
    <PulseBox className="h-14 w-full mb-6 bg-transparent" />

    {/* Hero Card */}
    <div className="h-48 bg-app-surface border border-app-border rounded-[32px] p-6 flex flex-col justify-between">
      <div className="space-y-3 self-center items-center flex flex-col">
        <PulseBox className="h-3 w-32" />
        <PulseBox className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <PulseBox className="h-12 rounded-xl opacity-50" />
        <PulseBox className="h-12 rounded-xl opacity-50" />
        <PulseBox className="h-12 rounded-xl opacity-50" />
      </div>
    </div>

    {/* Donut Chart Block */}
    <div className="bg-app-surface border border-app-border rounded-[32px] p-6 h-[320px] flex flex-col">
      <PulseBox className="h-5 w-40 mb-6" />
      <div className="flex gap-6 items-center flex-1">
        <PulseBox className="size-36 rounded-full shrink-0 m-auto opacity-80 border-20px border-app-bg bg-transparent" />
        <div className="flex-1 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between"><PulseBox className="h-3 w-20" /><PulseBox className="h-3 w-10" /></div>
              <PulseBox className="h-2 w-full rounded-full opacity-30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// --- Financial Analysis ---
export const SkeletonFinancialAnalysis = () => (
  <div className="min-h-dvh bg-app-bg pb-safe pt-2 px-4 max-w-4xl mx-auto space-y-6 animate-pulse">
    <div className="h-10 w-full flex justify-between items-center">
      <PulseBox className="h-6 w-32" />
      <PulseBox className="h-10 w-32 rounded-xl" />
    </div>

    {/* 4 Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <PulseBox key={i} className="h-28 bg-app-surface border border-app-border opacity-70" />
      ))}
    </div>

    {/* Main Graph */}
    <div className="h-[350px] bg-app-surface border border-app-border rounded-[32px] p-5">
      <div className="flex justify-between mb-8">
        <PulseBox className="h-5 w-40" />
        <PulseBox className="h-5 w-24" />
      </div>
      <PulseBox className="h-[200px] w-full rounded-xl opacity-40 bg-linear-to-t from-gray-200 dark:from-zinc-800 to-transparent" />
    </div>

    {/* List Breakdown */}
    <div className="grid md:grid-cols-2 gap-4">
      <PulseBox className="h-40 bg-app-surface border border-app-border rounded-2xl" />
      <PulseBox className="h-40 bg-app-surface border border-app-border rounded-2xl" />
    </div>
  </div>
);

// --- Planning / Recurring ---
export const SkeletonPlanningWidget = () => (
  <div className="bg-app-surface border border-app-border rounded-[24px] p-5 space-y-6 animate-pulse shadow-sm">
    <div className="flex justify-between">
      <div className="space-y-2">
        <PulseBox className="h-5 w-32" />
        <PulseBox className="h-3 w-20 opacity-50" />
      </div>
      <PulseBox className="h-8 w-24 rounded-lg" />
    </div>
    <PulseBox className="h-2 w-full rounded-full opacity-60" />
    <div className="grid grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <PulseBox key={i} className="h-16 rounded-xl bg-app-bg opacity-80" />
      ))}
    </div>
  </div>
);

export const SkeletonRecurring = () => (
  <div className="min-h-dvh bg-app-bg px-4 pt-6 space-y-6 max-w-2xl mx-auto animate-pulse">
    <PulseBox className="h-8 w-40 mb-4" />
    <PulseBox className="h-24 bg-indigo-50 dark:bg-zinc-800/30 border border-indigo-100 rounded-3xl" />
    <div className="flex gap-3">
      <PulseBox className="h-10 w-24 rounded-xl" />
      <PulseBox className="h-10 w-24 rounded-xl" />
    </div>
    <SkeletonTransactionList count={4} />
  </div>
);

export const SkeletonAppLoading = () => (
  <div className="h-dvh w-full flex flex-col items-center justify-center bg-app-bg space-y-6">
    <PulseBox className="size-20 rounded-[20px] bg-app-primary/10 shadow-lg" />
    <div className="space-y-2 text-center flex flex-col items-center">
      <PulseBox className="h-4 w-32" />
      <PulseBox className="h-3 w-20 opacity-50" />
    </div>
  </div>
);

// --- Installments ---
export const SkeletonInstallmentList = () => (
  <div className="space-y-4 max-w-3xl mx-auto pt-4 px-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-app-surface border border-app-border rounded-3xl p-5 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3.5">
            <PulseBox className="size-10 rounded-xl shrink-0" />
            <div className="space-y-2">
              <PulseBox className="h-4 w-32" />
              <PulseBox className="h-3 w-20 opacity-50" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <PulseBox className="h-5 w-20" />
            <PulseBox className="h-2 w-8 opacity-50" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between"><PulseBox className="h-3 w-16 opacity-50" /><PulseBox className="h-3 w-16 opacity-50" /></div>
          <PulseBox className="h-1.5 w-full rounded-full opacity-60" />
        </div>
      </div>
    ))}
  </div>
);

// --- Investments ---
export const SkeletonInvestmentsPage = () => (
  <div className="min-h-dvh bg-app-bg pb-safe pt-2 px-4 max-w-4xl mx-auto space-y-6 animate-pulse">
    {/* Header Placeholders */}
    <div className="h-10 w-full flex justify-between items-center">
      <PulseBox className="h-6 w-32" />
      <PulseBox className="size-9 rounded-full" />
    </div>

    {/* Portfolio Summary */}
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 h-32 bg-app-surface border border-app-border rounded-[24px] p-5 flex flex-col justify-center gap-2">
        <PulseBox className="h-3 w-32 opacity-60" />
        <PulseBox className="h-10 w-48" />
      </div>
      <div className="h-20 bg-app-surface border border-app-border rounded-[24px] p-4 opacity-70" />
      <div className="h-20 bg-app-surface border border-app-border rounded-[24px] p-4 opacity-70" />
    </div>

    {/* Chart */}
    <div className="h-[320px] bg-app-surface border border-app-border rounded-[32px] flex items-center justify-center">
      <PulseBox className="size-48 rounded-full opacity-20 border-30 border-app-text" />
    </div>

    {/* List */}
    <div className="space-y-4">
      <PulseBox className="h-4 w-32 mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-app-surface border border-app-border rounded-3xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PulseBox className="size-10 rounded-xl" />
            <div className="space-y-2">
              <PulseBox className="h-4 w-32" />
              <PulseBox className="h-3 w-20 opacity-50" />
            </div>
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <PulseBox className="h-4 w-24" />
            <PulseBox className="h-3 w-16 opacity-50" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Generic Fallback ---
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <PulseBox className={className} />
);

export default Skeleton;