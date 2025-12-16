import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

// --- Interfaces & Constants ---

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
}

const QUICK_ACTIONS = [
  { icon: 'trending_down', label: 'Gasto', colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', path: '/new?type=expense' },
  { icon: 'trending_up', label: 'Ingreso', colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/new?type=income' },
  { icon: 'swap_horiz', label: 'Transf.', colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', path: '/new?type=transfer' },
  { icon: 'event_repeat', label: 'Fijo', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/recurring/new' },
  { icon: 'credit_score', label: 'MSI', colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', path: '/installments/new' },
  { icon: 'handshake', label: 'Préstamo', colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', path: '/loans/new' },
];

const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

// --- Sub-components ---

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className="flex flex-col items-center justify-center flex-1 h-full py-1 group select-none touch-manipulation active:scale-95 transition-transform"
  >
    <div className={`
       rounded-xl p-1 mb-0.5 transition-colors duration-200
       ${isActive ? 'text-app-primary' : 'text-app-muted group-hover:text-app-text'}
    `}>
      <span className={`material-symbols-outlined text-[26px] ${isActive ? 'filled-icon' : ''}`}
        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}>
        {icon}
      </span>
    </div>

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
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div
      className={`size-14 rounded-2xl flex items-center justify-center shadow-sm border border-transparent hover:border-black/5 dark:hover:border-white/10 active:scale-95 transition-all duration-200 ${action.colorClass}`}
    >
      <span className="material-symbols-outlined text-2xl">{action.icon}</span>
    </div>
    <span className="text-[11px] font-medium text-app-text tracking-tight">{action.label}</span>
  </button>
);


// --- Main Component ---

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  // Logic: Only render on mobile/tablet (hidden lg) and allowed pages
  const shouldShow = MAIN_NAV_PAGES.includes(location.pathname);
  if (!shouldShow) return null;

  const handleQuickAction = (path: string) => {
    // Small delay to allow ripple/active state to show before navigation
    setTimeout(() => {
      setIsMenuOpen(false);
      navigate(path);
    }, 50);
  };

  return (
    <>
      {/* 
         DIMMED BACKDROP 
         Solo visible en Mobile para evitar clics accidentales fuera 
      */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] animate-fade-in touch-none"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* 
         QUICK ACTIONS SHEET (Floating) 
      */}
      <div
        className={`lg:hidden fixed left-4 right-4 z-50 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) ${isMenuOpen
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
          }`}
        style={{
          bottom: 'calc(70px + env(safe-area-inset-bottom) + 20px)'
        }}
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-5 rounded-[28px] border border-black/5 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex justify-between items-center mb-5 px-1">
            <span className="text-xs font-bold text-app-muted uppercase tracking-wider">Nueva Transacción</span>
            <button onClick={() => setIsMenuOpen(false)} className="size-6 rounded-full bg-app-subtle flex items-center justify-center text-app-muted">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-y-4 gap-x-2 place-items-center">
            {QUICK_ACTIONS.map(action => (
              <QuickActionButton
                key={action.label}
                action={action}
                onClick={() => handleQuickAction(action.path)}
              />
            ))}
          </div>
        </div>

        {/* Triángulo indicador (opcional, estilo popover) */}
        <div className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-white/95 dark:bg-zinc-900/95 rotate-45 border-b border-r border-black/5 dark:border-white/10 rounded-br transition-all duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}></div>
      </div>


      {/* 
         MAIN NAVIGATION BAR 
         Class lg:hidden -> Desaparece automáticamente en pantallas grandes
      */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-app-border pb-safe">
        <div className="h-[60px] relative flex items-center justify-around px-2 w-full max-w-md mx-auto">

          <NavItem
            to="/"
            icon="space_dashboard"
            label="Inicio"
            isActive={location.pathname === '/'}
          />

          <NavItem
            to="/history"
            icon="receipt_long"
            label="Historial"
            isActive={location.pathname === '/history'}
          />

          {/* CENTRAL FAB CONTAINER */}
          <div className="relative -top-5 w-14 shrink-0 flex justify-center z-10">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`
                    size-14 rounded-full flex items-center justify-center
                    shadow-[0_8px_20px_-4px_rgba(37,99,235,0.5)] dark:shadow-[0_8px_20px_-4px_rgba(37,99,235,0.3)]
                    border-[3px] border-white dark:border-zinc-950
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    active:scale-90
                    ${isMenuOpen ? 'bg-app-text text-app-bg rotate-45' : 'bg-app-primary text-white'}
                 `}
            >
              <span className="material-symbols-outlined text-[32px] font-medium leading-none">add</span>
            </button>
          </div>

          <NavItem
            to="/accounts"
            icon="account_balance"
            label="Cuentas"
            isActive={location.pathname.startsWith('/accounts')}
          />

          <NavItem
            to="/more"
            icon="apps"
            label="Más"
            isActive={location.pathname === '/more'}
          />

        </div>
      </nav>
    </>
  );
};

export default BottomNav;