import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const More: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { path: '/profile', icon: 'person', title: 'Perfil', description: 'Edita tu nombre, avatar y moneda.' },
    { path: '/categories', icon: 'category', title: 'Categorías', description: 'Administra tus categorías de gastos e ingresos.' },
    { path: '/recurring', icon: 'update', title: 'Gastos Recurrentes', description: 'Gestiona tus gastos fijos.' },
    { path: '/settings', icon: 'settings', title: 'Ajustes', description: 'Configura la apariencia y notificaciones.' },
  ];

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
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