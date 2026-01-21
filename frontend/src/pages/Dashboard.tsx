import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useTransactions, useCategories, useProfile, useAccounts, useInvestments, useLoans, useGoals, useNotifications } from '../hooks/useApi';
import { useDashboardStats } from '../hooks/useDashboardStats';

// Components
import { SkeletonDashboard } from '../components/Skeleton';
import { SpendingTrendChart } from '../components/Charts';
import { NotificationsSheet } from '../components/dashboard/NotificationsSheet'; // <--- IMPORTADO NUEVO
import { FinancialPlanningWidget } from '../components/FinancialPlanningWidget'; // <--- IMPORTADO NUEVO
/* =======================================
   VISUAL COMPONENTS (Bento Style)
   ======================================= */

const BentoCard: React.FC<{ children: React.ReactNode; title?: string; action?: React.ReactNode; className?: string; onClick?: () => void }> =
  ({ children, title, action, className = '', onClick }) => (
    <div onClick={onClick} className={`bento-card p-5 md:p-6 flex flex-col ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      {(title || action) && (
        <div className="flex justify-between items-center mb-4 md:mb-5">
          {title && <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 relative">{children}</div>
    </div>
  );

const StatWidget: React.FC<{ label: string; value: number; type: 'income' | 'expense'; format: (n: number) => string; className?: string }> =
  ({ label, value, type, format, className = '' }) => {
    const isIncome = type === 'income';
    return (
      <div className={`bento-card p-4 flex flex-col justify-center gap-1 hover:bg-app-subtle transition-colors group ${className}`}>
        <div className="flex items-center gap-2 text-app-muted mb-1">
          <div className={`size-6 rounded-md flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            <span className="material-symbols-outlined text-[16px]">{isIncome ? 'arrow_downward' : 'arrow_upward'}</span>
          </div>
          <span className="text-xs font-bold uppercase">{label}</span>
        </div>
        <p className="text-xl md:text-2xl font-bold font-numbers text-app-text group-hover:scale-[1.02] transition-transform origin-left">{format(value)}</p>
      </div>
    );
  };

/* =======================================
   DASHBOARD MAIN
   ======================================= */

const Dashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { openTransactionSheet } = useGlobalSheets();
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false); // ESTADO PARA EL SHEET

  React.useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') openTransactionSheet(null, { type: 'expense' });
  }, [searchParams, openTransactionSheet]);

  // Data Fetching
  const { data: transactions, isLoading: loadingTx } = useTransactions();
  const { data: accounts, isLoading: loadingAcc } = useAccounts();
  const { data: investments } = useInvestments();
  const { data: loans } = useLoans();
  const { data: goals } = useGoals();
  const { data: profile, isLoading: loadingProfile } = useProfile();
  const { data: categories } = useCategories();

  // Hook de Notificaciones para el badge rojo
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.length || 0;

  const stats = useDashboardStats(accounts, investments, loans, goals, transactions, categories, profile?.currency);

  if (loadingTx || loadingAcc || loadingProfile) return <SkeletonDashboard />;

  return (
    <div className="w-full bg-app-bg transition-colors duration-300">

      {/* === HEADER CON CAMPANA DE NOTIFICACIONES === */}
      <header className="pt-4 pb-2 px-4 md:px-8 max-w-[1400px] mx-auto flex justify-between items-center sticky top-0 z-30 bg-app-bg/80 backdrop-blur-xl md:static md:bg-transparent">
        <div className="animate-fade-in flex items-center gap-3">
          <Link to="/profile" className="size-10 rounded-full overflow-hidden border border-app-border hover:ring-2 ring-app-primary transition-all md:hidden">
            <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}`} alt="Avatar" className="w-full h-full object-cover" />
          </Link>
          <div>
            <p className="text-app-muted text-xs font-bold uppercase tracking-wide">{stats.greeting.text}</p>
            <h1 className="text-xl md:text-3xl font-bold text-app-text leading-tight">{profile?.name?.split(' ')[0]}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN NOTIFICACIONES */}
          <button
            onClick={() => setShowNotifications(true)}
            className="size-10 rounded-full bg-app-surface border border-app-border text-app-text hover:bg-app-subtle active:scale-95 transition-all relative flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px] fill-current">
              {unreadCount > 0 ? 'notifications_active' : 'notifications'}
            </span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 size-3 bg-app-danger rounded-full border-2 border-app-surface animate-pulse" />
            )}
          </button>

          <Link to="/profile" className="size-10 rounded-full overflow-hidden border border-app-border hover:ring-2 ring-app-primary transition-all hidden md:block">
            <img src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}`} alt="Avatar" className="w-full h-full object-cover" />
          </Link>
        </div>
      </header>

      {/* SHEET DE NOTIFICACIONES */}
      <NotificationsSheet
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* BENTO GRID PRINCIPAL - Cambiado a grid-cols-2 en móvil para permitir KPIs lado a lado */}
      <main className="px-4 md:px-8 py-2 max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-fade-in">

        {/* 1. Main Balance con Privacidad */}
        <div className="col-span-2 md:col-span-2 row-span-2 min-h-[180px] md:h-auto bento-card relative overflow-hidden bg-linear-to-br from-app-surface to-app-subtle dark:to-[#0A0A0A] p-5 md:p-6 flex flex-col justify-between border-0 shadow-lg">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-app-primary opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 md:mb-2 opacity-80">
              <span className="text-[10px] md:text-xs font-bold text-app-muted uppercase tracking-wide">Disponible</span>
              <button onClick={() => setPrivacyMode(!privacyMode)} className="hover:text-app-primary">
                <span className="material-symbols-outlined text-[16px] align-bottom">{privacyMode ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-app-text font-numbers tracking-tight">
              {privacyMode ? '•••••' : stats.formatCurrency(stats.availableFunds)}
            </h1>
          </div>
          <div className="relative z-10 flex items-end justify-between mt-4">
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold mb-0.5">Patrimonio Neto</p>
              <p className="text-lg font-medium font-numbers">{privacyMode ? '•••••' : stats.formatCurrency(stats.netWorth)}</p>
            </div>
          </div>
        </div>

        {/* 2. Widgets de Estadísticas - Ahora lado a lado en móvil (col-span-1 en grid de 2) */}
        <StatWidget
          label="Ingresos"
          value={stats.monthStats.income}
          type="income"
          format={stats.formatCurrency}
          className="col-span-1 md:col-span-1 lg:col-span-2"
        />
        <StatWidget
          label="Gastos"
          value={stats.monthStats.expense}
          type="expense"
          format={stats.formatCurrency}
          className="col-span-1 md:col-span-1 lg:col-span-2"
        />

        {/* Financial Planning Widget - Ancho completo en móvil */}
        <div className="col-span-2 md:col-span-2 lg:col-span-4 xl:col-span-4">
          <FinancialPlanningWidget />
        </div>
        {/* 4. Chart Grande */}
        <BentoCard title="Tendencia" className="col-span-2 md:col-span-2 lg:col-span-3 min-h-[300px]" action={<Link to="/reports" className="text-xs font-bold text-app-primary">Ver detalle</Link>}>
          <SpendingTrendChart transactions={transactions || []} />
        </BentoCard>

        {/* 5. Placeholder Presupuesto */}
        <BentoCard className="col-span-2 md:col-span-2 lg:col-span-1 min-h-[160px] md:min-h-[200px]" title="Alertas">
          {unreadCount > 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <span className="size-3 bg-app-danger rounded-full animate-ping mb-2" />
              <p className="text-sm font-bold">{unreadCount} Avisos pendientes</p>
              <button onClick={() => setShowNotifications(true)} className="text-xs text-app-primary underline mt-1">Revisar</button>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center opacity-40">
              <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
              <p className="text-xs">Todo al día</p>
            </div>
          )}
        </BentoCard>

        {/* 6. Transacciones Recientes */}
        <BentoCard title="Últimos Movimientos" className="col-span-2 md:col-span-2 lg:col-span-4" action={<Link to="/history" className="text-xs font-bold text-app-primary">Ver todos</Link>}>
          <div className="flex flex-col gap-1">
            {transactions?.slice(0, 5).map((tx, index) => {
              const cat = categories?.find(c => c.id === tx.categoryId);
              return (
                <div key={`${tx.id}-${index}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-app-subtle transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-app-subtle flex items-center justify-center text-app-muted text-sm dark:bg-white/5">
                      <span className="material-symbols-outlined text-[20px]">{cat?.icon || 'attach_money'}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-app-text">{tx.description}</p>
                      <p className="text-[10px] text-app-muted uppercase font-bold tracking-wide">{cat?.name}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold font-numbers ${tx.type === 'income' ? 'text-app-success' : 'text-app-text'}`}>
                    {tx.type === 'expense' ? '-' : '+'}{stats.formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </BentoCard>

      </main>
    </div>
  );
};

export default Dashboard;