import React, { useMemo, useState } from 'react';
import { Routes, Route, useLocation, Link, NavLink, useNavigate } from 'react-router-dom';

// Pages
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import NewTransaction from '../pages/NewTransaction';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Reports from '../pages/Reports';
import More from '../pages/More';
import Recurring from '../pages/Recurring';
import NewRecurringPage from '../pages/NewRecurringPage';
import Categories from '../pages/Categories';
import UpsertCategoryPage from '../pages/UpsertCategoryPage';
import AccountsPage from '../pages/AccountsPage';
import UpsertAccountPage from '../pages/Accounts/UpsertAccountPage';
import InstallmentsPage from '../pages/InstallmentsPage';
import UpsertInstallmentPage from '../pages/Installments/UpsertInstallmentPage';
import TrashPage from '../pages/TrashPage';
import FinancialAnalysis from '../pages/FinancialAnalysis';
import LoansPage from '../pages/LoansPage';
import LoanFormPage from '../pages/LoanFormPage';

// Components
import BottomNav from '../components/BottomNav';
import { AppLogo } from '../components/AppLogo';
import { DesktopFAB } from '../components/DesktopFAB';
import { MobileFAB } from '../components/MobileFAB';

// Pages that show the mobile bottom nav
const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

// --- Desktop Sidebar Component ---
// Este componente vive aquí para proveer navegación consistente en escritorio
const DesktopSidebar = () => {
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
        <div className="bg-gradient-to-br from-app-elevated to-app-card border border-app-border p-3 rounded-xl flex items-center gap-3">
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


const MainApp: React.FC = () => {
  const location = useLocation();
  const isMainNavPage = MAIN_NAV_PAGES.includes(location.pathname);

  return (
    <div className="flex min-h-dvh bg-app-bg text-app-text font-sans selection:bg-app-primary selection:text-white">

      {/* 1. Global Sidebar (Desktop Only) */}
      <DesktopSidebar />
      <DesktopFAB />

      {/* 2. Main Content Wrapper */}
      <main
        className={`
          flex-1 transition-all duration-300 relative w-full
          lg:pl-72 
          ${/* En Desktop el padding bottom se controla normal */ ""}
          ${/* En Móvil añadimos extra padding si el Nav está visible */ isMainNavPage ? 'pb-28' : 'pb-safe'}
        `}
      >
        {/* Contenedor centralizado para max-width en desktop pantallas grandes */}
        <div className="w-full max-w-[1200px] mx-auto animate-fade-in h-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/analysis" element={<FinancialAnalysis />} />
            <Route path="/new" element={<NewTransaction />} />

            {/* Rutas Secundarias */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/more" element={<More />} />

            {/* Gestión de Datos */}
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/recurring/new" element={<NewRecurringPage />} />
            <Route path="/recurring/edit/:id" element={<NewRecurringPage />} />

            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/new" element={<UpsertCategoryPage />} />
            <Route path="/categories/edit/:id" element={<UpsertCategoryPage />} />

            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/new" element={<UpsertAccountPage />} />
            <Route path="/accounts/edit/:id" element={<UpsertAccountPage />} />

            <Route path="/installments" element={<InstallmentsPage />} />
            <Route path="/installments/new" element={<UpsertInstallmentPage />} />
            <Route path="/installments/edit/:id" element={<UpsertInstallmentPage />} />

            <Route path="/loans" element={<LoansPage />} />
            <Route path="/loans/new" element={<LoanFormPage />} />
            <Route path="/loans/:id" element={<LoanFormPage />} />

            <Route path="/trash" element={<TrashPage />} />
          </Routes>
        </div>
      </main>

      {/* 3. Mobile Bottom Nav (El componente ya maneja lg:hidden internamente) */}
      {isMainNavPage && <BottomNav />}

      {/* 4. Mobile FAB for secondary pages (when BottomNav is not visible) */}
      <MobileFAB />

    </div>
  );
};

export default MainApp;