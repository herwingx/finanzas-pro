import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Components
import { PageHeader } from '../components/PageHeader';

// Hooks
import { useProfile } from '../hooks/useApi';

/* ==================================================================================
   SUB-COMPONENTS
   ================================================================================== */

interface MenuItemProps {
  path: string;
  icon: string;
  title: string;
  description?: string;
  iconColor: string; // Tailwind class text-color
  iconBg: string;    // Tailwind class bg-color
}

const MenuRow: React.FC<MenuItemProps> = ({ path, icon, title, description, iconColor, iconBg }) => (
  <Link
    to={path}
    className="group relative flex items-center gap-4 p-4 hover:bg-app-subtle/50 active:bg-app-subtle transition-all duration-200"
  >
    {/* Icon Container */}
    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border border-transparent group-hover:scale-105 transition-transform ${iconBg} ${iconColor}`}>
      <span className="material-symbols-outlined text-[22px]">{icon}</span>
    </div>

    {/* Text Content */}
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[15px] font-semibold text-app-text group-hover:text-app-primary transition-colors leading-tight">
          {title}
        </span>
      </div>
      {description && (
        <p className="text-xs text-app-muted truncate font-medium">
          {description}
        </p>
      )}
    </div>

    {/* Chevron Icon */}
    <span className="material-symbols-outlined text-app-border text-xl group-hover:text-app-text group-hover:translate-x-0.5 transition-transform">
      chevron_right
    </span>
  </Link>
);


/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */

const More: React.FC = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Simulación: aquí iría tu lógica real de auth.signOut()
    toast.promise(new Promise((resolve) => setTimeout(resolve, 800)), {
      loading: 'Cerrando sesión de forma segura...',
      success: () => {
        // navigate('/login'); // Descomentar cuando tengas las rutas
        return 'Sesión finalizada';
      },
      error: 'Error al salir'
    });
  };

  /* CONFIGURACIÓN DEL MENÚ 
     Centralizada para fácil edición y mantenimiento */
  const menuConfig = [
    {
      title: 'Finanzas y Análisis',
      items: [
        { path: '/categories', icon: 'category', title: 'Categorías', description: 'Organiza tus gastos y presupuestos', iconColor: 'text-indigo-600 dark:text-indigo-400', iconBg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { path: '/reports', icon: 'monitoring', title: 'Reportes Detallados', description: 'Visualiza tus tendencias de consumo', iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/20' },
        { path: '/goals', icon: 'savings', title: 'Metas de Ahorro', description: 'Gestiona tus alcancías y objetivos', iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
      ]
    },
    {
      title: 'Productos y Deuda',
      items: [
        { path: '/recurring', icon: 'event_repeat', title: 'Recurrentes', description: 'Suscripciones y gastos fijos', iconColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
        { path: '/installments', icon: 'credit_score', title: 'Meses Sin Intereses', description: 'Control de compras a plazos', iconColor: 'text-pink-600 dark:text-pink-400', iconBg: 'bg-pink-50 dark:bg-pink-900/20' },
        { path: '/loans', icon: 'handshake', title: 'Préstamos', description: 'Control de deudas personales', iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-900/20' },
        { path: '/investments', icon: 'candlestick_chart', title: 'Inversiones', description: 'Seguimiento de portafolio', iconColor: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-50 dark:bg-teal-900/20' },
      ]
    },
    {
      title: 'Preferencias',
      items: [
        { path: '/settings', icon: 'settings', title: 'Configuración General', description: 'Tema, notificaciones y moneda', iconColor: 'text-zinc-600 dark:text-zinc-400', iconBg: 'bg-zinc-100 dark:bg-zinc-800' },
        { path: '/backup', icon: 'cloud_download', title: 'Datos y Seguridad', description: 'Copias de seguridad y exportación', iconColor: 'text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-50 dark:bg-sky-900/20' },
        { path: '/trash', icon: 'delete_sweep', title: 'Papelera', description: 'Restaurar elementos eliminados', iconColor: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-50 dark:bg-rose-900/20' },
      ]
    }
  ];

  return (
    <div className="bg-app-bg text-app-text font-sans">

      {/* HEADER (Sin back button, es root page) */}
      <PageHeader title="Menú" showBackButton={false} />

      <main className="max-w-xl mx-auto px-4 mt-2 space-y-6 animate-fade-in">

        {/* 1. HERO PROFILE CARD (Estilo Bento) */}
        <Link
          to="/profile"
          className="bento-card p-5 flex items-center gap-5 hover:border-app-border-strong cursor-pointer active:scale-[0.99] group bg-app-surface"
        >
          <div className="size-16 rounded-full overflow-hidden shadow-sm border border-app-border shrink-0">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {profile?.name?.[0] || 'U'}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-app-text tracking-tight group-hover:text-app-primary transition-colors">
              {profile?.name || 'Hola, Usuario'}
            </h2>
            <p className="text-sm text-app-muted truncate">
              {profile?.email || 'Gestiona tu cuenta'}
            </p>
          </div>

          <div className="size-8 rounded-full bg-app-subtle flex items-center justify-center text-app-muted group-hover:bg-app-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined text-lg">edit</span>
          </div>
        </Link>

        {/* 2. MENU SECTIONS */}
        <div className="space-y-6">
          {menuConfig.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-1 text-[11px] font-bold text-app-muted uppercase tracking-wider">
                {section.title}
              </h3>

              <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border shadow-sm">
                {section.items.map(item => (
                  <MenuRow key={item.path} {...item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 3. LOGOUT ZONE */}
        <div className="pt-2 pb-6">
          <button
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border border-app-border bg-app-surface text-rose-500 font-bold text-sm hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:border-rose-200 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Cerrar Sesión
          </button>

          <p className="text-center text-[10px] text-app-muted/30 font-mono mt-6 uppercase tracking-widest">
            Versión 2.5.0 (Beta)
          </p>
        </div>

      </main>
    </div>
  );
};

export default More;