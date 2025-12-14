import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Agregamos useLocation
import { useTransactions, useCategories, useProfile, useAccounts } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/Skeleton';
import { SpendingTrendChart } from '../components/Charts';
import { FinancialPlanningWidget } from '../components/FinancialPlanningWidget';
import { toastInfo } from '../utils/toast';

// --- Sub-components para modularidad visual ---

const DashboardHeader: React.FC<{
  name?: string;
  avatar?: string;
  greeting: string;
  emoji: string;
}> = ({ name, avatar, greeting, emoji }) => (
  <header className="flex items-center justify-between py-4 md:py-6 px-4 md:px-0 gap-3">
    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
      {/* Avatar */}
      <Link
        to="/profile"
        className="relative group size-10 md:size-12 rounded-full overflow-hidden ring-2 ring-app-border hover:ring-app-primary transition-all duration-300 shrink-0"
      >
        {avatar ? (
          <img src={avatar} alt="User" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-app-subtle flex items-center justify-center text-app-primary font-bold text-sm md:text-base">
            {name?.[0]}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg md:text-2xl font-bold text-app-text tracking-tight flex items-center gap-1.5 truncate">
          <span className="truncate">{greeting}, {name?.split(' ')[0]}</span>
          <span className="text-base md:text-xl shrink-0">{emoji}</span>
        </h1>
        <p className="text-xs md:text-sm text-app-muted font-medium truncate">Tu resumen financiero</p>
      </div>
    </div>

    {/* Botón Notificaciones - Perfectamente circular */}
    <button
      onClick={() => toastInfo('Notificaciones')}
      className="size-10 rounded-full bg-app-surface border border-app-border text-app-text hover:bg-app-subtle active:scale-95 transition-all relative shrink-0 flex items-center justify-center"
    >
      <span className="material-symbols-outlined text-[20px]">notifications</span>
      <span className="absolute top-1 right-1 size-2.5 bg-app-danger rounded-full border-2 border-app-surface"></span>
    </button>
  </header>
);

const BentoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode
}> = ({ children, className = '', title, action }) => (
  <div className={`bg-app-surface border border-app-border rounded-3xl p-5 md:p-6 shadow-subtle flex flex-col ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4 md:mb-6">
        {title && <h3 className="text-sm font-semibold text-app-muted uppercase tracking-wider">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const MainBalanceCard: React.FC<{ balance: number; netWorth: number; format: (n: number) => string }> = ({ balance, netWorth, format }) => (
  <BentoCard className="md:col-span-2 relative overflow-hidden group">
    <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
      <div>
        <div className="flex items-center gap-2 text-app-muted mb-1">
          <span className="text-sm font-medium">Balance Total Disponible</span>
          <span className="material-symbols-outlined text-[16px] cursor-help" title="Efectivo + Débito">info</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-app-text tracking-tight font-numbers mt-2">
          {format(balance)}
        </h2>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
          <span className="material-symbols-outlined text-[14px]">trending_up</span>
          +2.4% este mes
        </div>
        <span className="text-sm text-app-muted">Patrimonio: {format(netWorth)}</span>
      </div>
    </div>

    {/* Decoración sutil abstracta (Estilo Monarch) */}
    <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-app-primary opacity-[0.03] dark:opacity-[0.1] rounded-full blur-3xl pointer-events-none group-hover:bg-app-primary group-hover:opacity-[0.06] transition-all duration-500" />
  </BentoCard>
);

const QuickStat: React.FC<{
  label: string;
  amount: number;
  type: 'income' | 'expense';
  format: (n: number) => string
}> = ({ label, amount, type, format }) => {
  const isIncome = type === 'income';
  return (
    <BentoCard className="justify-center">
      <div className="flex items-start justify-between">
        <div>
          <div className={`p-2 w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isIncome ? 'bg-app-success/10 text-app-success' : 'bg-app-danger/10 text-app-danger'}`}>
            <span className="material-symbols-outlined">{isIncome ? 'arrow_downward' : 'arrow_upward'}</span>
          </div>
          <p className="text-app-muted text-xs font-bold uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 font-numbers ${isIncome ? 'text-app-text' : 'text-app-text'}`}>
            {format(amount)}
          </p>
        </div>
        <div className="h-full flex items-end opacity-20">
          <span className="material-symbols-outlined text-4xl">{isIncome ? 'show_chart' : 'waterfall_chart'}</span>
        </div>
      </div>
    </BentoCard>
  );
};

// --- Componente Principal ---

const Dashboard: React.FC = () => {
  const location = useLocation(); // Hook para saber en qué ruta estamos (para el Sidebar Desktop)

  const { data: transactions, isLoading: isLoadingTx } = useTransactions();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: accounts, isLoading: isLoadingAcc } = useAccounts();
  const { data: categories } = useCategories();

  // Configuración de Navegación del Sidebar
  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/' },
    { label: 'Historial', icon: 'receipt_long', path: '/history' },
    { label: 'Cuentas', icon: 'account_balance_wallet', path: '/accounts' },
    { label: 'Más', icon: 'grid_view', path: '/more' }, // O '/settings' si prefieres
  ];

  // Cálculos...
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? { text: 'Buenos días', emoji: '☀️' } : hour < 19 ? { text: 'Buenas tardes', emoji: '🌤️' } : { text: 'Buenas noches', emoji: '🌙' };
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(val);

  const netWorth = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((acc, a) => acc + (a.type === 'CREDIT' ? -a.balance : a.balance), 0);
  }, [accounts]);

  const availableFunds = useMemo(() => {
    if (!accounts) return 0;
    return accounts.filter(a => ['DEBIT', 'CASH'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  const monthStats = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filtrar transacciones del mes actual
    const thisMonthTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

    return {
      income: thisMonthTxs
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0),
      expense: thisMonthTxs
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0),
    };
  }, [transactions]);

  if (isLoadingTx || isLoadingProfile || isLoadingAcc) return <SkeletonDashboard />;

  return (
    <div className="min-h-screen bg-app-bg text-app-text font-sans pb-24 lg:pb-8 lg:pl-0 animate-fade-in">

      {/* 
         SIDEBAR DE ESCRITORIO (Fixed Left) 
         Este bloque reemplaza al BottomNav en pantallas grandes
      */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col border-r border-app-border bg-app-surface p-6 z-30">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="size-8 bg-app-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">spa</span>
          </div>
          <div className="text-xl font-black text-app-text tracking-tighter">FINANZAS PRO</div>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-app-primary text-white shadow-md shadow-app-primary/20'
                    : 'text-app-muted hover:text-app-text hover:bg-app-subtle'
                  }
                `}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled-icon' : ''}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer Sidebar Desktop */}
        <div className="mt-auto pt-6 border-t border-app-border">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm text-app-muted hover:text-app-danger transition-colors">
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <main className="lg:pl-72 max-w-7xl mx-auto md:px-8">

        <DashboardHeader
          name={profile?.name}
          avatar={profile?.avatar}
          greeting={greeting.text}
          emoji={greeting.emoji}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0">

          <div className="lg:col-span-2">
            <MainBalanceCard
              balance={availableFunds}
              netWorth={netWorth}
              format={formatCurrency}
            />
          </div>

          <QuickStat label="Ingresos" amount={monthStats.income} type="income" format={formatCurrency} />
          <QuickStat label="Gastos" amount={monthStats.expense} type="expense" format={formatCurrency} />

          <div className="lg:col-span-4">
            <FinancialPlanningWidget />
          </div>

          <BentoCard title="Tendencia de Gastos" className="lg:col-span-3 min-h-[300px]">
            {transactions && <SpendingTrendChart transactions={transactions} />}
          </BentoCard>

          <BentoCard title="Recientes" className="lg:col-span-1 min-h-[400px]"
            action={
              <Link to="/history" className="text-xs font-bold text-app-primary hover:underline">Ver todo</Link>
            }>
            <div className="space-y-4">
              {transactions?.slice(0, 5).map(tx => {
                const isExpense = tx.type === 'expense';
                const colorClass = isExpense ? 'text-app-text' : 'text-app-success';

                return (
                  <Link key={tx.id} to={`/new?editId=${tx.id}`} className="group flex items-center justify-between p-2 rounded-xl hover:bg-app-subtle transition-colors -mx-2">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-full flex items-center justify-center text-lg shadow-sm border border-app-border ${isExpense ? 'bg-white dark:bg-zinc-800' : 'bg-app-success/10'}`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {isExpense ? 'local_cafe' : 'monetization_on'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-app-text truncate group-hover:text-app-primary transition-colors">{tx.description}</p>
                        <p className="text-xs text-app-muted truncate">Hace 2 horas</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold font-numbers ${colorClass}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </Link>
                );
              })}

              {!transactions?.length && (
                <div className="flex flex-col items-center justify-center h-40 text-app-muted">
                  <span className="material-symbols-outlined text-4xl opacity-20 mb-2">savings</span>
                  <span className="text-sm">Sin movimientos</span>
                </div>
              )}
            </div>
          </BentoCard>

        </div>
      </main>

      {/* FAB Mobile Only (Optional if relying on BottomNav FAB) */}
      {/* 
           NOTA: Como el nuevo BottomNav YA tiene el botón "+", 
           probablemente no quieras duplicarlo aquí en vista móvil,
           así que he comentado esto o lo dejo oculto en lg 
           pero visible solo si no usas el BottomNav.
       */}
      {/* 
      <Link 
        to="/new" 
        className="lg:hidden fixed bottom-24 right-4 size-14 bg-app-text text-app-bg rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
      */}

    </div>
  );
};

export default Dashboard;