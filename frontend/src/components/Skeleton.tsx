import React from 'react';

// Base Skeleton Component
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton ${className}`} />
);

// Skeleton Text Line
export const SkeletonText = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton skeleton-text ${className}`} />
);

// Skeleton Title
export const SkeletonTitle = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton skeleton-title ${className}`} />
);

// Skeleton Avatar
export const SkeletonAvatar = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton skeleton-avatar ${className}`} />
);

// Skeleton Card - For Dashboard Cards
export const SkeletonCard = () => (
  <div className="bg-app-card border border-app-border rounded-2xl p-4 animate-fade-in">
    <SkeletonTitle />
    <div className="skeleton h-8 w-1/2 rounded-lg" />
  </div>
);

// Skeleton Transaction Item
export const SkeletonTransaction = () => (
  <div className="flex items-center gap-4 bg-app-card border border-app-border p-3 rounded-xl">
    <SkeletonAvatar />
    <div className="flex-1">
      <div className="skeleton h-4 w-3/4 mb-2 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
    <div className="skeleton h-6 w-16 rounded" />
  </div>
);

// Skeleton Transaction List
export const SkeletonTransactionList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonTransaction key={i} />
    ))}
  </div>
);

// Skeleton Chart
export const SkeletonChart = ({ height = '200px' }: { height?: string }) => (
  <div className="bg-app-card border border-app-border rounded-2xl p-5">
    <SkeletonTitle />
    <div className="skeleton rounded-xl" style={{ height }} />
  </div>
);

// Skeleton Stats Grid (for Dashboard)
export const SkeletonStatsGrid = () => (
  <div className="grid grid-cols-2 gap-4">
    <SkeletonCard />
    <SkeletonCard />
  </div>
);

// Generic App Loading Skeleton
export const SkeletonAppLoading = () => (
  <div className="pb-28 px-4 space-y-6 animate-fade-in min-h-screen bg-app-bg">
    {/* Generic Header */}
    <div className="flex items-center justify-between pt-4">
      <div className="skeleton h-8 w-32 rounded-lg" />
      <SkeletonAvatar />
    </div>

    {/* Generic Content */}
    <div className="space-y-4 pt-4">
      <div className="skeleton h-32 w-full rounded-2xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
      <div className="skeleton h-12 w-full rounded-xl" />
    </div>
  </div>
);

// Full Page skeleton for Dashboard
export const SkeletonDashboard = () => (
  <div className="pb-28 px-4 space-y-6 animate-fade-in">
    {/* Header */}
    <div className="flex items-center gap-4 pt-4">
      <SkeletonAvatar />
      <div className="flex-1">
        <div className="skeleton h-3 w-16 mb-2 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
    </div>

    {/* Stats Grid */}
    <SkeletonStatsGrid />

    {/* Chart */}
    <SkeletonChart height="200px" />

    {/* Transactions List */}
    <div>
      <div className="skeleton h-6 w-32 mb-4 rounded" />
      <SkeletonTransactionList count={3} />
    </div>
  </div>
);

export default Skeleton;
