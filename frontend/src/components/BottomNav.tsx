import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Context & Types
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { TransactionType, TransactionFormInitialData } from '../types';

/* ==================================================================================
   CONSTANTS
   ================================================================================== */
const QUICK_ACTIONS = [
  { id: 'expense', label: 'Gasto', icon: 'remove', color: 'bg-rose-500 text-white', type: 'expense' },
  { id: 'income', label: 'Ingreso', icon: 'add', color: 'bg-emerald-500 text-white', type: 'income' },
  { id: 'transfer', label: 'Transf.', icon: 'sync_alt', color: 'bg-blue-500 text-white', type: 'transfer' },
  { id: 'recurring', label: 'Recurrente', icon: 'event_repeat', color: 'bg-purple-500 text-white', action: 'recurring' },
  { id: 'installments', label: 'Plazos', icon: 'credit_card', color: 'bg-indigo-500 text-white', action: 'installments' },
  { id: 'loan', label: 'Préstamo', icon: 'handshake', color: 'bg-amber-500 text-white', action: 'loan' },
  { id: 'goal', label: 'Nueva Meta', icon: 'savings', color: 'bg-teal-500 text-white', action: 'goal' },
  { id: 'invest', label: 'Inversión', icon: 'trending_up', color: 'bg-cyan-600 text-white', action: 'invest' },
];

const MAIN_NAV = ['/', '/history', '/accounts', '/more'];

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Global Context Actions
  const {
    openTransactionSheet,
    openRecurringSheet,
    openInstallmentSheet,
    openLoanSheet,
    openGoalSheet,
    openInvestmentSheet
  } = useGlobalSheets();

  // Haptic Feedback Helper
  const haptic = () => {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(5);
  };

  const handleAction = (item: any) => {
    haptic();
    setIsMenuOpen(false);
    setTimeout(() => {
      if (item.action === 'recurring') openRecurringSheet();
      else if (item.action === 'installments') openInstallmentSheet();
      else if (item.action === 'loan') openLoanSheet();
      else if (item.action === 'goal') openGoalSheet();
      else if (item.action === 'invest') openInvestmentSheet();
      else openTransactionSheet(null, { type: item.type as TransactionType });
    }, 100);
  };

  if (!MAIN_NAV.includes(location.pathname) && !MAIN_NAV.some(p => p !== '/' && location.pathname.startsWith(p))) return null;

  return (
    <>
      {/* --- OVERLAY BACKDROP --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] touch-none lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --- QUICK ACTION BUBBLE MENU --- */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed bottom-[84px] left-4 right-4 z-50 max-w-sm mx-auto lg:hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div className="bg-app-surface/95 backdrop-blur-xl rounded-[28px] p-5 shadow-2xl border border-app-border">
              <div className="flex justify-between items-center mb-5 px-2">
                <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Nueva Transacción</span>
                <button onClick={() => setIsMenuOpen(false)} className="bg-app-subtle size-6 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">close</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TAB BAR --- */}
      <nav className="fixed bottom-0 w-full z-50 bg-app-surface/90 backdrop-blur-md border-t border-app-border pb-safe lg:hidden">
        <div className="flex justify-around items-center h-[60px] px-2 max-w-md mx-auto relative">

          {/* Home */}
          <NavItem to="/" icon="space_dashboard" label="Inicio" isActive={location.pathname === '/'} onClick={haptic} />

          {/* History */}
          <NavItem to="/history" icon="receipt_long" label="Historial" isActive={location.pathname.startsWith('/history')} onClick={haptic} />

          {/* FAB (Floating Action Button) */}
          <div className="relative -top-5">
            <button
              onClick={() => { haptic(); setIsMenuOpen(!isMenuOpen); }}
              className={`
                 size-14 rounded-full flex items-center justify-center shadow-lg
                 border-4 border-app-bg transition-transform active:scale-95
                 ${isMenuOpen ? 'bg-app-text text-app-bg rotate-45' : 'bg-app-primary text-white'}
              `}
            >
              <span className="material-symbols-outlined text-[30px] font-medium">add</span>
            </button>
          </div>

          {/* Accounts */}
          <NavItem to="/accounts" icon="account_balance_wallet" label="Cuentas" isActive={location.pathname.startsWith('/accounts')} onClick={haptic} />

          {/* Menu */}
          <NavItem to="/more" icon="grid_view" label="Menú" isActive={location.pathname.startsWith('/more')} onClick={haptic} />

        </div>
      </nav>
    </>
  );
};

/* --- NavItem Sub-component --- */
const NavItem = ({ to, icon, label, isActive, onClick }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center gap-1 h-full select-none touch-manipulation group ${isActive ? 'text-app-primary' : 'text-app-muted'}`}
  >
    <div className="relative px-5 py-1 rounded-2xl">
      {isActive && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-app-primary/10 rounded-2xl"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span className={`relative z-10 material-symbols-outlined text-[26px] transition-all duration-300 ${isActive ? 'scale-110 font-semibold' : 'scale-100 font-light group-hover:scale-105'}`}>
        {icon}
      </span>
    </div>
    <span className={`text-[10px] tracking-tight transition-all duration-300 ${isActive ? 'font-bold opacity-100 translate-y-0' : 'font-medium opacity-70 group-hover:opacity-90'}`}>
      {label}
    </span>
  </Link>
);

export default BottomNav;