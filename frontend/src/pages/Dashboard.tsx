import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  <header className="flex items-center justify-between py-4 md:py-6 px-4 md:px-6 lg:px-8 gap-3">
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
  const { data: transactions, isLoading: isLoadingTx } = useTransactions();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const { data: accounts, isLoading: isLoadingAcc } = useAccounts();
  const { data: categories } = useCategories();

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
    <div className="w-full">
      {/* Header del Dashboard */}
      <DashboardHeader
        name={profile?.name}
        avatar={profile?.avatar}
        greeting={greeting.text}
        emoji={greeting.emoji}
      />

      {/* Grid principal con layout responsive */}
      <div className="px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">

          {/* Balance Card - Ocupa 2 columnas en tablet+ */}
          <div className="md:col-span-2">
            <MainBalanceCard
              balance={availableFunds}
              netWorth={netWorth}
              format={formatCurrency}
            />
          </div>

          {/* Stats Cards - Lado a lado */}
          <QuickStat label="Ingresos del Mes" amount={monthStats.income} type="income" format={formatCurrency} />
          <QuickStat label="Gastos del Mes" amount={monthStats.expense} type="expense" format={formatCurrency} />

          {/* Financial Planning Widget - Ancho completo */}
          <div className="md:col-span-2 xl:col-span-4">
            <FinancialPlanningWidget />
          </div>

          {/* Trend Chart - 3 columnas en xl */}
          <BentoCard title="Tendencia de Gastos" className="md:col-span-2 xl:col-span-3 min-h-[280px] lg:min-h-[320px]">
            {transactions && <SpendingTrendChart transactions={transactions} />}
          </BentoCard>

          {/* Recent Transactions - 1 columna en xl */}
          <BentoCard
            title="Últimos Movimientos"
            className="md:col-span-2 xl:col-span-1"
            action={
              <Link to="/history" className="text-xs font-bold text-app-primary hover:underline flex items-center gap-1">
                Ver todo
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            }
          >
            <div className="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              {transactions?.slice(0, 6).map(tx => {
                const isExpense = tx.type === 'expense';
                const isTransfer = tx.type === 'transfer';
                const cat = categories?.find(c => c.id === tx.categoryId);
                const colorClass = isExpense ? 'text-app-text' : isTransfer ? 'text-blue-500' : 'text-app-success';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="size-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{
                          backgroundColor: cat?.color ? `${cat.color}15` : 'var(--bg-subtle)',
                          color: cat?.color || 'var(--text-muted)'
                        }}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isTransfer ? 'swap_horiz' : cat?.icon || 'payments'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-app-text truncate group-hover:text-app-primary transition-colors">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-app-muted truncate">
                          {cat?.name || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold font-numbers shrink-0 ml-2 ${colorClass}`}>
                      {isExpense ? '-' : isTransfer ? '' : '+'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}

              {!transactions?.length && (
                <div className="flex flex-col items-center justify-center h-24 text-app-muted">
                  <span className="material-symbols-outlined text-2xl opacity-20 mb-1">savings</span>
                  <span className="text-xs">Sin movimientos</span>
                </div>
              )}
            </div>
          </BentoCard>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;