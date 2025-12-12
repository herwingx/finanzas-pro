import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

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

const FAB: React.FC = () => (
  <div className="w-1/5 flex justify-center items-start -mt-2">
    <Link
      to="/new"
      className="relative size-14 rounded-2xl bg-gradient-to-br from-app-primary via-app-primary to-app-secondary text-white flex items-center justify-center shadow-xl shadow-app-primary/40 hover:shadow-2xl hover:shadow-app-primary/50 hover:-translate-y-1 active:scale-95 transition-all duration-300 ease-out group"
    >
      {/* Animated ring */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-app-primary to-app-secondary opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />

      {/* Icon with rotation effect */}
      <span className="material-symbols-outlined text-3xl font-bold relative z-10 group-hover:rotate-90 transition-transform duration-300">
        add
      </span>

      {/* Subtle pulse animation */}
      <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-0 group-hover:opacity-30" />
    </Link>
  </div>
);

const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const HIDDEN_PATHS = ['/new', '/profile', '/settings', '/categories', '/budgets'];
  if (HIDDEN_PATHS.some(path => location.pathname.startsWith(path))) return null;

  return (
    <>
      {/* Spacer to prevent content from hiding behind navbar */}
      <div className="h-16" />

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
          <FAB />
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
