import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => (
  <Link
    to={to}
    className="relative flex flex-col items-center justify-center h-full flex-1 group"
  >
    <div className={`
      relative rounded-xl p-1.5 transition-all duration-300 ease-out
      ${isActive ? '-translate-y-0.5' : 'group-hover:-translate-y-0.5'}
    `}>
      {isActive && (
        <div className="absolute inset-0 bg-app-primary/15 rounded-xl blur-sm" />
      )}
      <span
        className={`material-symbols-outlined text-2xl transition-all duration-300 ${isActive ? 'text-app-primary font-bold' : 'text-app-muted group-hover:text-app-text'
          }`}
        style={{ fontVariationSettings: isActive ? '"FILL" 1, "wght" 700' : '"FILL" 0, "wght" 400' }}
      >
        {icon}
      </span>
    </div>

    <span
      className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'text-app-primary opacity-100' : 'text-app-muted opacity-70'
        }`}
    >
      {label}
    </span>

    {/* Active indicator line */}
    {isActive && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-app-primary rounded-full" />
    )}
  </Link>
);

interface QuickActionProps {
  icon: string;
  label: string;
  bgClass: string;
  textClass: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, bgClass, textClass, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group w-full"
  >
    <div
      className={`size-12 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 group-active:scale-95 ${bgClass} ${textClass}`}
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <span className="text-[10px] font-semibold text-app-text text-center leading-tight max-w-[60px]">{label}</span>
  </button>
);

const FAB: React.FC<{ onClick: () => void; isOpen: boolean }> = ({ onClick, isOpen }) => (
  <div className="relative -top-4 flex justify-center items-center size-14">
    <button
      onClick={onClick}
      className={`
        relative size-14 rounded-full flex items-center justify-center
        bg-app-primary text-white
        shadow-lg shadow-app-primary/30
        transition-all duration-300 ease-out z-20
        ${isOpen ? 'rotate-45 bg-app-muted shadow-none' : 'hover:scale-105 hover:shadow-xl hover:shadow-app-primary/40'}
      `}
    >
      <span className="material-symbols-outlined text-3xl font-medium">add</span>
    </button>
  </div>
);

// Pages that show the bottom navigation (main tabs only)
const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Only show BottomNav on main navigation pages
  const shouldShow = MAIN_NAV_PAGES.includes(location.pathname);

  if (!shouldShow) return null;

  const quickActions = [
    { icon: 'shopping_bag', label: 'Gasto', bgClass: 'bg-app-expense-bg', textClass: 'text-app-expense', path: '/new?type=expense' },
    { icon: 'attach_money', label: 'Ingreso', bgClass: 'bg-app-income-bg', textClass: 'text-app-income', path: '/new?type=income' },
    { icon: 'sync_alt', label: 'Transfer', bgClass: 'bg-app-transfer-bg', textClass: 'text-app-transfer', path: '/new?type=transfer' },
    { icon: 'update', label: 'Recurrente', bgClass: 'bg-app-recurring-bg', textClass: 'text-app-recurring', path: '/recurring/new' },
    { icon: 'credit_card', label: 'MSI', bgClass: 'bg-app-msi-bg', textClass: 'text-app-msi', path: '/installments/new' },
  ];

  const handleQuickAction = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop for Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Quick Actions Menu - Positioned above FAB */}
      <div
        className={`fixed left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ease-out ${isMenuOpen
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-95 pointer-events-none'
          }`}
        style={{
          bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)'
        }}
      >
        <div className="w-full max-w-sm bg-app-card backdrop-blur-xl p-4 rounded-2xl border border-app-border shadow-2xl">
          <p className="text-[10px] font-bold text-app-muted uppercase mb-3 text-center tracking-widest">Nueva Transacción</p>
          <div className="grid grid-cols-5 gap-2">
            {quickActions.map(action => (
              <QuickAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                bgClass={action.bgClass}
                textClass={action.textClass}
                onClick={() => handleQuickAction(action.path)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav Bar - Always Fixed */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative bg-app-card border-t border-app-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)] h-[72px]">
          <div className="flex items-center justify-around h-full px-2 max-w-lg mx-auto">
            <NavItem
              to="/"
              icon="dashboard"
              label="Panel"
              isActive={location.pathname === '/'}
            />
            <NavItem
              to="/history"
              icon="history"
              label="Historial"
              isActive={location.pathname === '/history'}
            />

            <div className="w-14 shrink-0 flex justify-center">
              <FAB onClick={() => setIsMenuOpen(!isMenuOpen)} isOpen={isMenuOpen} />
            </div>

            <NavItem
              to="/accounts"
              icon="account_balance_wallet"
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
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
