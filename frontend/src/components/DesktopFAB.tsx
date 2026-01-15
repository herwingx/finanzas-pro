import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Context
import { useGlobalSheets } from '../context/GlobalSheetContext';

/* ==================================================================================
   CONFIGURATION CONSTANTS
   ================================================================================== */
const ACTIONS = [
  { id: 'expense', label: 'Gasto', icon: 'remove', color: 'bg-rose-500 text-white', exclude: [] },
  { id: 'income', label: 'Ingreso', icon: 'add', color: 'bg-emerald-500 text-white', exclude: [] },
  { id: 'transfer', label: 'Transferencia', icon: 'sync_alt', color: 'bg-blue-500 text-white', exclude: [] },
  { id: 'recurring', label: 'Recurrente', icon: 'event_repeat', color: 'bg-purple-500 text-white', exclude: [] },
  { id: 'installments', label: 'Plazos', icon: 'credit_card', color: 'bg-indigo-500 text-white', exclude: [] },
  { id: 'loan', label: 'Préstamo', icon: 'handshake', color: 'bg-amber-500 text-white', exclude: [] },
  { id: 'goal', label: 'Nueva Meta', icon: 'savings', color: 'bg-teal-500 text-white', exclude: [] },
  { id: 'invest', label: 'Inversión', icon: 'trending_up', color: 'bg-cyan-600 text-white', exclude: [] },
];

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
export const DesktopFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {
    openTransactionSheet,
    openRecurringSheet,
    openInstallmentSheet,
    openLoanSheet,
    openGoalSheet,
    openInvestmentSheet
  } = useGlobalSheets();

  // Filter based on current page context (e.g. don't show "Add Loan" if already on Loans Page main view if redundant)
  // Logic simplified: Filter actions based on `exclude` path prefixes.
  const visibleActions = ACTIONS.filter(action =>
    !action.exclude.some(path => location.pathname.startsWith(path))
  ).reverse(); // Reverse for bottom-to-top stacking order visual

  const handleAction = (id: string) => {
    setIsOpen(false);
    // Slight delay for smooth UI transition
    setTimeout(() => {
      switch (id) {
        case 'expense': openTransactionSheet(null, { type: 'expense' }); break;
        case 'income': openTransactionSheet(null, { type: 'income' }); break;
        case 'transfer': openTransactionSheet(null, { type: 'transfer' }); break;
        case 'recurring': openRecurringSheet(); break;
        case 'installments': openInstallmentSheet(); break;
        case 'loan': openLoanSheet(); break;
        case 'goal': openGoalSheet(); break;
        case 'invest': openInvestmentSheet(); break;
      }
    }, 100);
  };

  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden lg:block fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 2. FAB CONTAINER */}
      <div className="hidden lg:flex flex-col items-end fixed bottom-8 right-8 z-50">

        {/* Actions Stack */}
        <AnimatePresence>
          {isOpen && (
            <div className="flex flex-col items-end gap-3 mb-4 pr-1">
              {visibleActions.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex items-center gap-3 group"
                >
                  {/* Label Tooltip */}
                  <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold text-app-text shadow-lg border border-black/5 dark:border-white/10 whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none">
                    {action.label}
                  </span>

                  {/* Button */}
                  <button
                    onClick={() => handleAction(action.id)}
                    className={`size-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 ${action.color}`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{action.icon}</span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* 3. MAIN TRIGGER BUTTON */}
        {/* 3. MAIN TRIGGER BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            size-14 rounded-full flex items-center justify-center shadow-2xl z-50
            transition-all duration-300 hover:scale-105 active:scale-95
            ${isOpen ? 'bg-app-text text-app-bg rotate-45' : 'bg-app-primary text-white hover:bg-app-primary-dark'}
          `}
        >
          <span className="material-symbols-outlined text-[32px] font-medium">add</span>
        </button>

      </div>
    </>
  );
};