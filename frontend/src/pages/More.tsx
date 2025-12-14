import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

const More: React.FC = () => {
  const sections = [
    {
      title: 'Gestión Financiera',
      items: [
        { path: '/categories', icon: 'category', title: 'Categorías', description: 'Personaliza tus gastos e ingresos', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { path: '/reports', icon: 'bar_chart', title: 'Reportes', description: 'Análisis detallado de tus finanzas', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { path: '/recurring', icon: 'update', title: 'Recurrentes', description: 'Gestiona tus gastos fijos y suscripciones', color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { path: '/installments', icon: 'credit_card', title: 'Meses Sin Intereses', description: 'Control de compras a plazos', color: 'text-amber-500', bg: 'bg-amber-500/10' },
      ]
    },
    {
      title: 'Cuenta y Configuración',
      items: [
        { path: '/profile', icon: 'person', title: 'Perfil', description: 'Datos personales y moneda', color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { path: '/settings', icon: 'settings', title: 'Ajustes', description: 'Apariencia y notificaciones', color: 'text-gray-500', bg: 'bg-gray-500/10' },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { path: '/trash', icon: 'delete', title: 'Papelera', description: 'Restaurar elementos eliminados', color: 'text-red-500', bg: 'bg-red-500/10' },
      ]
    }
  ];

  return (
    <div className="bg-app-bg text-app-text relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px]"></div>
      </div>

      <PageHeader title="Más Opciones" />

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {sections.map((section, index) => (
          <div key={index}>
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-3 px-2">{section.title}</h3>
            <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden shadow-sm divide-y divide-app-border">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="group flex items-center gap-4 p-4 hover:bg-app-elevated transition-colors duration-200"
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-app-text group-hover:text-app-primary transition-colors">{item.title}</p>
                    <p className="text-xs text-app-muted truncate">{item.description}</p>
                  </div>
                  <span className="material-symbols-outlined text-app-muted text-lg group-hover:translate-x-1 transition-transform group-hover:text-app-primary">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Version Info */}
      <div className="text-center py-4">
        <p className="text-[10px] text-app-muted/50 font-mono">Finanzas Pro v1.0.0</p>
      </div>
    </div>
  );
};

export default More;