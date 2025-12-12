import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const More: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/profile', icon: 'person', title: 'Perfil', description: 'Edita tu nombre, avatar y moneda.' },
    { path: '/categories', icon: 'category', title: 'Categorías', description: 'Administra tus categorías de gastos e ingresos.' },
    { path: '/reports', icon: 'bar_chart', title: 'Reportes', description: 'Visualiza tus gastos e ingresos.' },
    { path: '/recurring', icon: 'update', title: 'Gastos Recurrentes', description: 'Gestiona tus gastos fijos.' },
    { path: '/installments', icon: 'credit_card', title: 'Meses Sin Intereses', description: 'Administra tus compras a MSI.' },
    { path: '/trash', icon: 'delete', title: 'Papelera', description: 'Recupera transacciones eliminadas recientemente.' },
    { path: '/settings', icon: 'settings', title: 'Ajustes', description: 'Configura la apariencia y notificaciones.' },
  ];

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-app-bg/90 backdrop-blur-xl p-4 border-b border-app-border">
        <h1 className="font-bold text-lg text-center flex-1">Más Opciones</h1>
      </header>

      <div className="p-4">
        <div className="space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="group flex items-center gap-4 bg-app-card border border-app-border p-4 rounded-2xl hover:bg-app-elevated transition-colors duration-200"
            >
              <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-app-elevated border border-app-border">
                <span className="material-symbols-outlined text-2xl text-app-primary">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-app-text text-sm">{item.title}</p>
                <p className="text-xs text-app-muted">{item.description}</p>
              </div>
              <span className="material-symbols-outlined text-app-muted text-lg group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default More;