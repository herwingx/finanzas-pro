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
    className="relative flex flex-col items-center justify-center gap-1 w-1/5 py-2 group"
  >
    {/* Active indicator - modern pill shape at top */}
    <div
      className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ease-out ${isActive
        ? 'w-10 bg-gradient-to-r from-app-primary to-app-secondary opacity-100'
        : 'w-0 bg-app-primary opacity-0'
        }`}
    />

    {/* Icon container with scale animation */}
    <div className={`relative transition-all duration-300 ease-out ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
      }`}>
      <span
        className={`material-symbols-outlined text-2xl transition-all duration-300 ${isActive
          ? 'text-app-primary font-bold'
          : 'text-app-muted group-hover:text-app-text'
          }`}
        style={{ fontVariationSettings: isActive ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 400' }}
      >
        {icon}
      </span>

      {/* Glow effect for active item */}
      {isActive && (
        <div className="absolute inset-0 bg-app-primary/20 blur-xl rounded-full -z-10 animate-pulse" />
      )}
    </div>

    {/* Label with fade animation */}
    <span
      className={`text-[10px] font-semibold transition-all duration-300 ${isActive
        ? 'text-app-primary opacity-100'
        : 'text-app-muted opacity-70 group-hover:opacity-100 group-hover:text-app-text'
        }`}
    >
      {label}
    </span>
  </Link>
);

interface QuickActionProps {
  icon: string;
  label: string;
  color: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 w-20 group"
  >
    <div
      className="size-14 rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110 group-active:scale-95"
      style={{ backgroundColor: color }}
    >
      <span className="material-symbols-outlined text-2xl text-white">{icon}</span>
    </div>
    <span className="text-[11px] font-medium text-app-text text-center">{label}</span>
  </button>
);

const FAB: React.FC<{ onClick: () => void; isOpen: boolean }> = ({ onClick, isOpen }) => (
  <div className="w-1/5 flex justify-center items-start -mt-2">
    <button
      onClick={onClick}
      className="relative size-14 rounded-2xl bg-gradient-to-br from-app-primary via-app-primary to-app-secondary text-white flex items-center justify-center shadow-xl shadow-app-primary/40 hover:shadow-2xl hover:shadow-app-primary/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out group"
    >
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-app-primary to-app-secondary opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />

      {/* Icon with rotation effect */}
      <span
        className={`material-symbols-outlined text-3xl font-bold relative z-10 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
      >
        add
      </span>
    </button>
  </div>
);

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Show navbar when scrolling up or at the top
          if (currentScrollY < lastScrollY || currentScrollY < 10) {
            setIsVisible(true);
          }
          // Hide navbar when scrolling down (but only after scrolling past 50px)
          else if (currentScrollY > 50 && currentScrollY > lastScrollY) {
            setIsVisible(false);
            setIsMenuOpen(false);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Close menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const HIDDEN_PATHS = ['/new', '/profile', '/settings', '/categories', '/budgets'];
  if (HIDDEN_PATHS.some(path => location.pathname.startsWith(path))) return null;

  const quickActions = [
    { icon: 'shopping_bag', label: 'Gasto', color: '#ef4444', path: '/new?type=expense' },
    { icon: 'attach_money', label: 'Ingreso', color: '#22c55e', path: '/new?type=income' },
    { icon: 'sync_alt', label: 'Transferir', color: '#3b82f6', path: '/new?type=transfer' },
    { icon: 'repeat', label: 'Recurrente', color: '#8b5cf6', path: '/recurring/new' },
    { icon: 'credit_card', label: 'MSI', color: '#f59e0b', path: '/installments/new' },
  ];

  const handleQuickAction = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Spacer to prevent content from hiding behind navbar */}
      <div className="h-16" />

      {/* Quick Actions Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Quick Actions Menu */}
      <div className={`fixed bottom-20 left-0 right-0 z-50 transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}>
        <div className="mx-4 p-4 bg-app-card rounded-2xl border border-app-border shadow-2xl">
          <p className="text-xs font-bold text-app-muted uppercase mb-4 text-center">Acción Rápida</p>
          <div className="flex justify-around">
            {quickActions.map(action => (
              <QuickAction
                key={action.label}
                icon={action.icon}
                label={action.label}
                color={action.color}
                onClick={() => handleQuickAction(action.path)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          willChange: 'transform, opacity'
        }}
      >
        {/* Solid backdrop with blur */}
        <div className="absolute inset-0 bg-app-card backdrop-blur-xl border-t border-app-border" />

        {/* Navigation content */}
        <div className="relative flex h-16 items-center justify-around px-2">
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
          <FAB onClick={() => setIsMenuOpen(!isMenuOpen)} isOpen={isMenuOpen} />
          <NavItem
            to="/accounts"
            icon="account_balance_wallet"
            label="Cuentas"
            isActive={location.pathname.startsWith('/accounts')}
          />
          <NavItem
            to="/more"
            icon="more_horiz"
            label="Más"
            isActive={location.pathname === '/more'}
          />
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
