import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppLogo } from './AppLogo';

export const DesktopSidebar = () => {
  // Navigation Groups
  const mainMenu = [
    { to: '/', label: 'Inicio', icon: 'grid_view' },
    { to: '/history', label: 'Historial', icon: 'list_alt' },
    { to: '/accounts', label: 'Cartera', icon: 'account_balance_wallet' },
    { to: '/reports', label: 'Reportes', icon: 'donut_large' },
    { to: '/analysis', label: 'Proyecciones', icon: 'show_chart' },
  ];

  const toolsMenu = [
    { to: '/categories', label: 'Categorías', icon: 'category' },
    { to: '/installments', label: 'Plan Pagos', icon: 'credit_score' },
    { to: '/recurring', label: 'Suscripciones', icon: 'calendar_month' },
    { to: '/loans', label: 'Deudas', icon: 'handshake' },
    { to: '/goals', label: 'Metas', icon: 'savings' },
    { to: '/investments', label: 'Inversión', icon: 'monetization_on' },
  ];

  const systemMenu = [
    { to: '/profile', label: 'Perfil', icon: 'account_circle' },
    { to: '/settings', label: 'Ajustes', icon: 'settings' },
    { to: '/trash', label: 'Papelera', icon: 'auto_delete' },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) => `
    group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 select-none
    ${isActive
      ? 'bg-app-primary text-white shadow-lg shadow-app-primary/20 scale-[1.02]'
      : 'text-app-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-app-text'
    }
  `;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[280px] flex-col bg-app-surface/90 backdrop-blur-md border-r border-app-border z-50">

      {/* 1. BRAND */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-4 bg-app-subtle p-3 rounded-2xl border border-app-border/50">
          <div className="bg-app-surface p-1.5 rounded-xl shadow-sm border border-app-border">
            <AppLogo size={28} />
          </div>
          <div>
            <span className="block text-sm font-black text-app-text tracking-tight leading-none">FINANZAS PRO</span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION */}
      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">

        {/* Main */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-app-muted/60 uppercase tracking-widest mb-2">Principal</p>
          {mainMenu.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Tools */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-app-muted/60 uppercase tracking-widest mb-2">Herramientas</p>
          {toolsMenu.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="material-symbols-outlined text-[20px] opacity-80 group-hover:opacity-100">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* System */}
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-bold text-app-muted/60 uppercase tracking-widest mb-2">Cuenta</p>
          {systemMenu.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              <span className="material-symbols-outlined text-[20px] opacity-80 group-hover:opacity-100">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </div>

      </nav>

      {/* 3. FOOTER INFO */}
      <div className="p-4 border-t border-app-border/60 bg-linear-to-t from-app-subtle/30 to-transparent">
        <div className="flex items-center justify-between px-2 text-[10px] font-bold text-app-muted">
          <span>v3.0.0 Stable</span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      </div>

    </aside>
  );
};