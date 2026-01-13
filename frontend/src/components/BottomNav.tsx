import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { TransactionType, TransactionFormInitialData } from '../types';

// --- Interfaces & Constants ---

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const QUICK_ACTIONS = [
  { icon: 'trending_down', label: 'Gasto', colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', path: '/new?type=expense' },
  { icon: 'trending_up', label: 'Ingreso', colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/new?type=income' },
  { icon: 'swap_horiz', label: 'Transf.', colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', path: '/new?type=transfer' },
  { icon: 'event_repeat', label: 'Fijo', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/recurring/new' },
  { icon: 'credit_score', label: 'MSI', colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', path: '/installments/new' },
  { icon: 'handshake', label: 'Préstamo', colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', path: '/loans/new' },
  { icon: 'savings', label: 'Meta', colorClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400', path: '/goals?action=new' },
  { icon: 'trending_up', label: 'Inversión', colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/investments?action=new' },
];

const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

// --- Helper: Haptic ---
const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(5);
  }
};

// --- Sub-components ---

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 h-full py-1 group select-none touch-manipulation relative"
  >
    <motion.div
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      className={`
         rounded-xl p-1 mb-0.5 transition-colors duration-200
         ${isActive ? 'text-app-primary' : 'text-app-muted group-hover:text-app-text'}
      `}
    >
      {/* Icon with animated fill */}
      <span className={`material-symbols-outlined text-[26px] transition-all duration-300 ${isActive ? 'filled-icon' : ''}`}
        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}>
        {icon}
      </span>

      {/* Active Indicator Dot (Optional Premium Detail) */}
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-app-primary rounded-full"
        />
      )}
    </motion.div>

    <span
      className={`text-[10px] font-medium leading-none tracking-wide transition-colors duration-200 
      ${isActive ? 'text-app-primary font-semibold' : 'text-app-muted'}
    `}>
      {label}
    </span>
  </Link>
);

const QuickActionButton: React.FC<{
  action: typeof QUICK_ACTIONS[0],
  onClick: () => void
}> = ({ action, onClick }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => { triggerHaptic(); onClick(); }}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div
      className={`size-14 rounded-2xl flex items-center justify-center shadow-sm border border-transparent hover:border-black/5 dark:hover:border-white/10 ${action.colorClass}`}
    >
      <span className="material-symbols-outlined text-2xl">{action.icon}</span>
    </div>
    <span className="text-[11px] font-medium text-app-text tracking-tight">{action.label}</span>
  </motion.button>
);


// --- Main Component ---

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    openInvestmentSheet,
    openGoalSheet,
    openInstallmentSheet,
    openLoanSheet,
    openRecurringSheet,
    openTransactionSheet
  } = useGlobalSheets();

  // Close menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  const shouldShow = MAIN_NAV_PAGES.includes(location.pathname);
  if (!shouldShow) return null;

  const toggleMenu = () => {
    triggerHaptic();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    triggerHaptic();
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleQuickAction = (path: string) => {
    // Intercept Global Sheets
    // ... (Reuse logic but with haptics already triggered by button)

    // Helper to close and execute
    const execute = (fn: () => void) => {
      setIsMenuOpen(false);
      setTimeout(fn, 150);
    };

    if (path.includes('/investments?action=new')) return execute(openInvestmentSheet);
    if (path.includes('/goals?action=new')) return execute(openGoalSheet);
    if (path.includes('/installments/new')) return execute(openInstallmentSheet);
    if (path.includes('/loans/new')) return execute(openLoanSheet);
    if (path.includes('/recurring/new')) return execute(openRecurringSheet);

    if (path.startsWith('/new')) {
      setIsMenuOpen(false);
      const split = path.split('?');
      const query = split.length > 1 ? split[1] : '';
      const params = new URLSearchParams(query);
      const type = (params.get('type') as TransactionType) || 'expense';
      const initialData: TransactionFormInitialData = { type };
      setTimeout(() => openTransactionSheet(null, initialData), 150);
      return;
    }

    // Normal Navigation
    setTimeout(() => {
      setIsMenuOpen(false);
      navigate(path);
    }, 50);
  };

  return (
    <>
      {/* DIMMED BACKDROP */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] touch-none"
            onClick={toggleMenu}
          />
        )}
      </AnimatePresence>

      {/* QUICK ACTIONS SHEET */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="lg:hidden fixed left-4 right-4 z-50 origin-bottom"
            style={{ bottom: 'calc(70px + env(safe-area-inset-bottom) + 20px)' }}
          >
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 rounded-[28px] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex justify-between items-center mb-5 px-1">
                <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Nueva Transacción</span>
                <button onClick={toggleMenu} className="size-6 rounded-full bg-app-subtle flex items-center justify-center text-app-muted">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-y-4 gap-x-2 place-items-center">
                {QUICK_ACTIONS.map(action => (
                  <QuickActionButton
                    key={action.label}
                    action={action}
                    onClick={() => handleQuickAction(action.path)}
                  />
                ))}
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white/95 dark:bg-zinc-900/95 rotate-45 border-b border-r border-black/5 dark:border-white/10 rounded-br"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-app-border pb-safe">
        <div className="h-[60px] relative flex items-center justify-around px-2 w-full max-w-md mx-auto">

          <NavItem to="/" icon="space_dashboard" label="Inicio" isActive={location.pathname === '/'} onClick={handleNavClick} />

          <NavItem to="/history" icon="receipt_long" label="Historial" isActive={location.pathname === '/history'} onClick={handleNavClick} />

          {/* CENTRAL FAB */}
          <div className="relative -top-5 w-14 shrink-0 flex justify-center z-10">
            <motion.button
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
              className={`
                    size-14 rounded-full flex items-center justify-center
                    shadow-[0_8px_20px_-4px_rgba(37,99,235,0.5)] dark:shadow-[0_8px_20px_-4px_rgba(37,99,235,0.3)]
                    border-[3px] border-white dark:border-zinc-950
                    bg-app-primary text-white
                    ${isMenuOpen ? 'bg-app-text text-app-bg' : ''}
                 `}
            >
              <span className="material-symbols-outlined text-[32px] font-medium leading-none">add</span>
            </motion.button>
          </div>

          <NavItem to="/accounts" icon="account_balance" label="Cuentas" isActive={location.pathname.startsWith('/accounts')} onClick={handleNavClick} />

          <NavItem to="/more" icon="apps" label="Más" isActive={location.pathname === '/more'} onClick={handleNavClick} />

        </div>
      </nav>
    </>
  );
};

export default BottomNav;