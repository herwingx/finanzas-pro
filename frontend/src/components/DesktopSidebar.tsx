import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppLogo } from './AppLogo';

export const DesktopSidebar = () => {
  const links = [
    { to: '/', label: 'Panel Principal', icon: 'space_dashboard' },
    { to: '/history', label: 'Movimientos', icon: 'receipt_long' },
    { to: '/accounts', label: 'Mis Cuentas', icon: 'account_balance' },
    { to: '/categories', label: 'Categorías', icon: 'category' },
    { to: '/analysis', label: 'Análisis', icon: 'analytics' },
    { to: '/reports', label: 'Reportes', icon: 'summarize' },
    { to: '/installments', label: 'Meses (MSI)', icon: 'credit_score' },
    { to: '/recurring', label: 'Fijos', icon: 'event_repeat' },
    { to: '/loans', label: 'Préstamos', icon: 'handshake' },

    { to: '/investments', label: 'Inversiones', icon: 'trending_up' },
    { to: '/goals', label: 'Metas', icon: 'savings' },
  ];

  const bottomLinks = [
    { to: '/trash', label: 'Papelera', icon: 'delete_sweep' },
    { to: '/settings', label: 'Configuración', icon: 'settings' },
    { to: '/profile', label: 'Perfil', icon: 'person' },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) => `
    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive
      ? 'bg-app-primary text-white shadow-md shadow-app-primary/20'
      : 'text-app-muted hover:bg-app-subtle hover:text-app-text'
    }
  `;

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col bg-app-surface border-r border-app-border z-40">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <AppLogo size={40} className="rounded-xl shadow-lg shadow-app-primary/30" />
          <span className="text-xl font-black text-app-text tracking-tighter">FINANZAS</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar mt-4">
        <div className="mb-2 px-4 py-2">
          <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest">Menú</p>
        </div>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}

        <div className="mt-6 mb-2 px-4 py-2">
          <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest">Sistema</p>
        </div>
        {bottomLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-app-border bg-app-subtle/30">
        <div className="bg-linear-to-br from-app-elevated to-app-card border border-app-border p-3 rounded-xl flex items-center gap-3">
          <div className="size-8 rounded-full bg-app-subtle flex items-center justify-center text-xs font-bold text-app-muted border border-app-border">
            PR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-app-text">Versión Pro</p>
            <p className="text-[10px] text-app-muted truncate">Cuenta Activa</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
