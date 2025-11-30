import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const NavItem = ({ to, icon, label, isActive }: { to: string, icon: string, label: string, isActive: boolean }) => (
  <Link to={to} className={`flex flex-col items-center justify-center gap-1 w-1/5 transition-colors ${isActive ? 'text-app-primary' : 'text-app-muted hover:text-app-text'}`}>
    <span className="material-symbols-outlined text-2xl">{icon}</span>
    <span className="text-[11px] font-bold">{label}</span>
  </Link>
);

const BottomNav = () => {
  const location = useLocation();

  const HIDDEN_PATHS = ['/new', '/profile', '/settings', '/categories', '/budgets'];
  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-app-card/80 backdrop-blur-xl border-t border-app-border safe-area-pb">
      <div className="flex h-20 items-center justify-around">
        <NavItem to="/" icon="dashboard" label="Panel" isActive={location.pathname === '/'} />
        <NavItem to="/history" icon="history" label="Historial" isActive={location.pathname === '/history'} />
        
        <div className="w-1/5 flex justify-center">
          <Link 
            to="/new" 
            className="-mt-8 size-16 rounded-full bg-gradient-to-br from-app-primary to-app-secondary text-white flex items-center justify-center shadow-lg shadow-app-primary/30 hover:scale-105 active:scale-95 transition-transform duration-300"
          >
            <span className="material-symbols-outlined text-4xl">add</span>
          </Link>
        </div>
        
        <NavItem to="/reports" icon="bar_chart" label="Reportes" isActive={location.pathname === '/reports'} />
        <NavItem to="/more" icon="more_horiz" label="Más" isActive={location.pathname === '/more'} />
      </div>
    </div>
  );
};

export default BottomNav;
