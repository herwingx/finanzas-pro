import React from 'react';
import { motion } from 'framer-motion';

export interface InsightCardProps {
  type: 'PAYMENT_DUE' | 'CC_CUTOFF_NEAR' | 'DUPLICATE_WARNING' | 'INFO';
  title: string;
  body: string;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const TYPE_CONFIG = {
  PAYMENT_DUE: {
    icon: 'notifications_active',
    colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    borderClass: 'border-rose-100 dark:border-rose-500/20'
  },
  CC_CUTOFF_NEAR: {
    icon: 'credit_card_clock',
    colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    borderClass: 'border-amber-100 dark:border-amber-500/20'
  },
  DUPLICATE_WARNING: {
    icon: 'warning',
    colorClass: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
    borderClass: 'border-orange-100 dark:border-orange-500/20'
  },
  INFO: {
    icon: 'info',
    colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    borderClass: 'border-blue-100 dark:border-blue-500/20'
  }
};

export const InsightCard: React.FC<InsightCardProps> = ({
  type,
  title,
  body,
  onDismiss,
  onAction,
  actionLabel
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.INFO;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.99 }}
      className={`relative w-full p-4 rounded-2xl bg-app-surface border ${config.borderClass} shadow-sm overflow-hidden select-none`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.colorClass}`}>
          <span className="material-symbols-outlined text-[20px]">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="text-sm font-semibold text-app-text leading-tight mb-1">{title}</h4>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(); }}
              className="text-app-muted hover:text-app-text p-1 -mt-2 -mr-2 rounded-full"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <p className="text-xs text-app-muted leading-relaxed line-clamp-2">{body}</p>

          {onAction && actionLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              className="mt-3 text-xs font-semibold text-app-primary hover:underline flex items-center gap-1"
            >
              {actionLabel}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
