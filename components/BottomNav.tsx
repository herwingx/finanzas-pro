import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const NavItem = ({ to, icon, label, isActive }: { to: string, icon: string, label: string, isActive: boolean }) => (
  <Link to={to} className={`flex flex-col items-center justify-center gap-1 w-1/4 transition-colors ${isActive ? 'text-app-accent' : 'text-app-muted'}`}>
    <span className="material-symbols-outlined text-2xl">{icon}</span>
    <span className="text-[10px] font-bold">{label}</span>
  </Link>
);

export const BottomNav = () => {
  const location = useLocation();

  // Don't show nav on 'new transaction' page to maximize space/focus
  if (location.pathname === '/new') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-app-card/95 backdrop-blur-md border-t border-app-border safe-area-pb">
      <div className="flex h-20 items-center justify-around px-2 pb-2">
        <NavItem to="/" icon="dashboard" label="Panel" isActive={location.pathname === '/'} />
        <NavItem to="/reports" icon="bar_chart" label="Reportes" isActive={location.pathname === '/reports'} />
        <NavItem to="/budgets" icon="account_balance_wallet" label="Presupuestos" isActive={location.pathname === '/budgets'} />
        <NavItem to="/categories" icon="category" label="Categorías" isActive={location.pathname === '/categories'} />
      </div>
    </div>
  );
};
