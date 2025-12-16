import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  { icon: 'trending_down', label: 'Gasto', colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', path: '/new?type=expense' },
  { icon: 'trending_up', label: 'Ingreso', colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/new?type=income' },
  { icon: 'swap_horiz', label: 'Transferencia', colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', path: '/new?type=transfer' },
  { icon: 'event_repeat', label: 'Recurrente', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/recurring/new' },
  { icon: 'credit_score', label: 'MSI', colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', path: '/installments/new' },
  { icon: 'handshake', label: 'Préstamo', colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', path: '/loans/new' },
];

// Pages where the main BottomNav is visible (so we don't show MobileFAB)
const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

const QuickActionButton: React.FC<{
  action: typeof QUICK_ACTIONS[0],
  onClick: () => void
}> = ({ action, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 group w-full"
  >
    <div
      className={`size-12 rounded-xl flex items-center justify-center shadow-sm border border-transparent hover:border-black/5 dark:hover:border-white/10 active:scale-95 transition-all duration-200 ${action.colorClass}`}
    >
      <span className="material-symbols-outlined text-xl">{action.icon}</span>
    </div>
    <span className="text-[10px] font-medium text-app-text tracking-tight">{action.label}</span>
  </button>
);

export const MobileFAB: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  // Don't render if we're on a main nav page (BottomNav is already visible there)
  const isMainNavPage = MAIN_NAV_PAGES.includes(location.pathname);
  if (isMainNavPage) return null;

  const handleQuickAction = (path: string) => {
    setTimeout(() => {
      setIsMenuOpen(false);
      navigate(path);
    }, 50);
  };

  return (
    <>
      {/* Backdrop */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in touch-none"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Quick Actions Sheet */}
      <div
        className={`lg:hidden fixed left-4 right-4 z-50 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 80px)'
        }}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 rounded-[24px] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Nueva Transacción</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="size-6 rounded-full bg-app-subtle flex items-center justify-center text-app-muted hover:text-app-text transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-y-3 gap-x-2 place-items-center">
            {QUICK_ACTIONS.map(action => (
              <QuickActionButton
                key={action.label}
                action={action}
                onClick={() => handleQuickAction(action.path)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`
          lg:hidden fixed z-50 size-12 rounded-full flex items-center justify-center
          shadow-lg shadow-app-primary/30
          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          active:scale-90
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
        <span className="material-symbols-outlined text-2xl font-medium leading-none">add</span>
      </button>
    </>
  );
};

export default MobileFAB;
