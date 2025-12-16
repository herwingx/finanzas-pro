import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useProfile } from '../hooks/useApi'; // Para mostrar la tarjeta de usuario
import { toast } from 'sonner';

interface MenuItemProps {
  path: string;
  icon: string;
  title: string;
  description?: string;
  colorClass: string;
  bgClass: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ path, icon, title, description, colorClass, bgClass }) => (
  <Link
    to={path}
    className="group flex items-center gap-3.5 p-3.5 hover:bg-app-subtle transition-all duration-200 cursor-pointer relative"
  >
    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent group-hover:border-black/5 dark:group-hover:border-white/5 transition-colors ${bgClass} ${colorClass}`}>
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </div>

    <div className="flex-1 min-w-0 flex flex-col justify-center">
      <span className="text-[15px] font-semibold text-app-text leading-tight group-hover:text-app-primary transition-colors">{title}</span>
      {description && <span className="text-xs text-app-muted truncate mt-0.5">{description}</span>}
    </div>

    <span className="material-symbols-outlined text-app-border text-lg group-hover:text-app-text group-hover:translate-x-0.5 transition-all">
      chevron_right
    </span>
  </Link>
);

const More: React.FC = () => {
  const { data: profile } = useProfile();

  // Simulación de Logout (puedes conectar tu lógica real aquí)
  const handleLogout = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: 'Cerrando sesión...',
      success: 'Hasta pronto',
      error: 'Error'
    });
  };

  const sections = [
    {
      title: 'Gestión',
      items: [
        { path: '/categories', icon: 'category', title: 'Categorías', description: 'Organiza tus gastos', colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { path: '/reports', icon: 'analytics', title: 'Reportes y Análisis', description: null, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
        { path: '/recurring', icon: 'event_repeat', title: 'Recurrentes', description: 'Suscripciones y fijos', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-100 dark:bg-purple-900/30' },
        { path: '/installments', icon: 'credit_score', title: 'Meses Sin Intereses', description: null, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-100 dark:bg-indigo-900/30' },
        { path: '/loans', icon: 'handshake', title: 'Préstamos', description: 'Dinero que te deben', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-900/30' },
      ]
    },
    {
      title: 'Configuración',
      items: [
        { path: '/settings', icon: 'tune', title: 'Preferencias', description: 'Tema y apariencia', colorClass: 'text-zinc-600 dark:text-zinc-400', bgClass: 'bg-zinc-100 dark:bg-zinc-800' },
        { path: '/backup', icon: 'cloud_sync', title: 'Copias de Seguridad', description: 'Exportar datos', colorClass: 'text-sky-600 dark:text-sky-400', bgClass: 'bg-sky-100 dark:bg-sky-900/30' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { path: '/trash', icon: 'delete_sweep', title: 'Papelera', description: 'Restaurar items', colorClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-900/30' },
      ]
    }
  ];

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-24 md:pb-8">

      {/* 
         El Header no tiene botón back porque es una página "Root" de navegación
         en mobile. 
      */}
      <PageHeader title="Menú" showBackButton={false} />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-6 animate-fade-in">

        {/* Profile Card (iOS Settings Style) */}
        <Link
          to="/profile"
          className="flex items-center gap-4 p-4 bg-app-surface border border-app-border rounded-2xl shadow-sm hover:border-app-border/80 hover:shadow-md transition-all active:scale-[0.99]"
        >
          <div className="size-16 rounded-full bg-gradient-to-br from-app-primary to-indigo-600 flex items-center justify-center text-white shadow-inner shrink-0 text-xl font-bold">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span>{profile?.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-app-text tracking-tight">{profile?.name || 'Usuario'}</h2>
            <p className="text-sm text-app-muted">{profile?.email || 'Sin correo vinculado'}</p>
          </div>
          <span className="material-symbols-outlined text-app-border">chevron_right</span>
        </Link>

        {/* Menu Sections */}
        {sections.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-2.5 px-1 ml-1">{section.title}</h3>

            {/* 
                Group Container: 
                - bg-app-surface (blanco/oscuro)
                - bordes redondeados (rounded-2xl)
                - divisor interno entre ítems
            */}
            <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm divide-y divide-app-subtle">
              {section.items.map((item) => (
                <MenuItem
                  key={item.path}
                  {...item}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button Zone */}
        <div className="pt-2 pb-6">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl bg-app-surface border border-app-border text-rose-500 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 active:scale-[0.99] transition-all"
          >
            Cerrar Sesión
          </button>
          <p className="text-center text-[10px] text-app-muted/40 font-mono mt-4">
            Finanzas Pro v2.0.0 (Build 2024)
          </p>
        </div>

      </div>
    </div>
  );
};

export default More;