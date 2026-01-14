import React from 'react';
import { motion } from 'framer-motion';

/* ==================================================================================
   TYPES & CONFIG
   ================================================================================== */
export type InsightType = 'PAYMENT_DUE' | 'CC_CUTOFF_NEAR' | 'DUPLICATE_WARNING' | 'INFO';

export interface InsightCardProps {
  type: InsightType;
  title: string;
  body: string;
  onDismiss: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const TYPE_CONFIG: Record<InsightType, { icon: string, bg: string, text: string }> = {
  PAYMENT_DUE: {
    icon: 'receipt_long',
    bg: 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900',
    text: 'text-rose-600 dark:text-rose-400'
  },
  CC_CUTOFF_NEAR: {
    icon: 'credit_card',
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900',
    text: 'text-amber-600 dark:text-amber-400'
  },
  DUPLICATE_WARNING: {
    icon: 'warning',
    bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-900',
    text: 'text-orange-600 dark:text-orange-400'
  },
  INFO: {
    icon: 'info',
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900',
    text: 'text-blue-600 dark:text-blue-400'
  }
};

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
export const InsightCard: React.FC<InsightCardProps> = ({
  type, title, body, onDismiss, onAction, actionLabel
}) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.INFO;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, margin: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-2xl p-4 border shadow-sm ${cfg.bg}`}
    >
      <div className="flex gap-4">

        {/* ICON AREA */}
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60 dark:bg-black/20 ${cfg.text}`}>
          <span className="material-symbols-outlined text-[20px]">{cfg.icon}</span>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`text-sm font-bold leading-tight ${cfg.text}`}>{title}</h4>
            <button onClick={(e) => { e.stopPropagation(); onDismiss(); }} className="opacity-50 hover:opacity-100 transition-opacity p-1 -mt-2 -mr-2">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          <p className="text-xs font-medium opacity-80 mt-1 leading-snug line-clamp-2">
            {body}
          </p>

          {onAction && actionLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-black/40 transition-colors shadow-sm"
            >
              {actionLabel}
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};