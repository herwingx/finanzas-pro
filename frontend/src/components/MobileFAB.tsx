import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalSheets } from '../context/GlobalSheetContext';

/**
 * MobileFAB - Floating Action Button for secondary pages on mobile
 * 
 * This component provides quick access to create transactions when the 
 * main BottomNav (with its central FAB) is not visible.
 * 
 * - Only renders on mobile (hidden on lg: screens)
 * - Only renders on secondary pages (not main nav pages)
 * - Opens the same quick actions menu as the BottomNav FAB
 */

const QUICK_ACTIONS = [
  { id: 'expense', label: 'Gasto', icon: 'remove', color: 'bg-rose-500 text-white', exclude: [] },
  { id: 'income', label: 'Ingreso', icon: 'add', color: 'bg-emerald-500 text-white', exclude: [] },
  { id: 'transfer', label: 'Transferencia', icon: 'sync_alt', color: 'bg-blue-500 text-white', exclude: [] },
  { id: 'recurring', label: 'Recurrente', icon: 'event_repeat', color: 'bg-purple-500 text-white', exclude: [] },
  { id: 'installments', label: 'Plazos', icon: 'credit_card', color: 'bg-indigo-500 text-white', exclude: [] },
  { id: 'loan', label: 'Préstamo', icon: 'handshake', color: 'bg-amber-500 text-white', exclude: [] },
  { id: 'goal', label: 'Nueva Meta', icon: 'savings', color: 'bg-teal-500 text-white', exclude: [] },
  { id: 'invest', label: 'Inversión', icon: 'trending_up', color: 'bg-cyan-600 text-white', exclude: [] },
];

// Pages where the main BottomNav is visible (so we don't show MobileFAB)
const MAIN_NAV = ['/', '/history', '/accounts', '/more'];

export const MobileFAB: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    openTransactionSheet,
    openRecurringSheet,
    openInstallmentSheet,
    openLoanSheet,
    openGoalSheet,
    openInvestmentSheet
  } = useGlobalSheets();

  // Close menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  // Don't render if we're on a main nav page (BottomNav is already visible there)
  // Also check if path starts with main nav items (except root '/')
  const isMainNavPage = MAIN_NAV.some(path => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));
  if (isMainNavPage) return null;

  const handleAction = (id: string) => {
    setIsMenuOpen(false);
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
      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] touch-none"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Quick Actions Sheet */}
      <div
        className={`lg:hidden fixed left-4 right-4 z-50 transition-all duration-300 ${isMenuOpen
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 80px)'
        }}
      >
        <div className="bg-app-surface/95 backdrop-blur-xl p-5 rounded-[28px] border border-app-border shadow-2xl">
          <div className="flex justify-between items-center mb-5 px-2">
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Nueva Transacción</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="size-6 rounded-full bg-app-subtle flex items-center justify-center text-app-muted hover:text-app-text transition-colors"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {QUICK_ACTIONS
              .filter(action => !action.exclude.some(p => location.pathname.startsWith(p)))
              .map(action => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
                >
                  <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg ${action.color}`}>
                    <span className="material-symbols-outlined text-[26px]">{action.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold text-app-text">{action.label}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`
          lg:hidden fixed z-50 size-14 rounded-full flex items-center justify-center
          shadow-lg
          transition-all duration-300 active:scale-95 border-4 border-app-bg
          ${isMenuOpen
            ? 'bg-app-text text-app-bg rotate-45'
            : 'bg-app-primary text-white'
          }
        `}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 20px)',
          right: '20px'
        }}
        aria-label="Nueva transacción"
      >
        <span className="material-symbols-outlined text-[30px] font-medium leading-none">add</span>
      </button>
    </>
  );
};

export default MobileFAB;
