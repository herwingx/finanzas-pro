import React from 'react';
import { Link } from 'react-router-dom';

const MoreListItem = ({ to, icon, label, description }: { to: string, icon: string, label: string, description: string }) => (
  <Link to={to} className="flex items-center gap-4 bg-app-card border border-app-border p-4 rounded-2xl hover:bg-app-elevated transition-colors">
    <div className="size-12 rounded-full bg-app-primary/10 flex items-center justify-center">
      <span className="material-symbols-outlined text-app-primary text-2xl">{icon}</span>
    </div>
    <div>
      <p className="font-bold text-app-text">{label}</p>
      <p className="text-sm text-app-muted">{description}</p>
    </div>
    <span className="material-symbols-outlined text-app-muted ml-auto">chevron_right</span>
  </Link>
);

export const More = () => {
  return (
    <div className="animate-fade-in bg-app-bg min-h-screen text-app-text pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
        <div className="w-8"></div> {/* Spacer */}
        <h1 className="font-bold text-lg text-center flex-1">Más Opciones</h1>
        <div className="w-8"></div> {/* Spacer */}
      </header>

      <div className="p-4 mt-4 space-y-4">
        <MoreListItem 
          to="/budgets"
          icon="account_balance_wallet"
          label="Presupuestos"
          description="Define tus límites de gasto"
        />
        <MoreListItem 
          to="/categories"
          icon="category"
          label="Categorías"
          description="Organiza tus transacciones"
        />
        <MoreListItem 
          to="/profile"
          icon="person"
          label="Perfil"
          description="Edita tu nombre y moneda"
        />
        <MoreListItem 
          to="/settings"
          icon="settings"
          label="Ajustes"
          description="Configura y resetea la app"
        />
      </div>
    </div>
  );
};