import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions, useCategories, useProfile, useAccounts } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/Skeleton';
import { SpendingTrendChart } from '../components/Charts';
import { toastInfo } from '../utils/toast';
import { FinancialPlanningWidget } from '../components/FinancialPlanningWidget';

const Dashboard: React.FC = () => {
  const { data: transactions, isLoading: isLoadingTransactions, isError: isErrorTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories();
  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useProfile();
  const { data: accounts, isLoading: isLoadingAccounts, isError: isErrorAccounts } = useAccounts();

  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);

  const formatCurrency = useMemo(() => (value: number) => {
    const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
  }, [profile?.currency]);

  const { netWorth, availableFunds } = useMemo(() => {
    if (!accounts) {
      return { netWorth: 0, availableFunds: 0 };
    }

    const totalAssets = accounts.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH').reduce((sum, acc) => sum + acc.balance, 0);
    const totalDebt = accounts.filter(acc => acc.type === 'CREDIT').reduce((sum, acc) => sum + acc.balance, 0);
    const netWorth = totalAssets - totalDebt;
    const availableFunds = totalAssets;

    return { netWorth, availableFunds };
  }, [accounts]);

  const getCategoryInfo = (id: string) => {
    if (!categories) return { name: 'General', icon: 'receipt_long', color: '#999' };
    const cat = categories.find(c => c.id === id);
    return { name: cat?.name || 'General', icon: cat?.icon || 'receipt_long', color: cat?.color || '#999' };
  };

  if (isLoadingTransactions || isLoadingCategories || isLoadingProfile || isLoadingAccounts) {
    return <SkeletonDashboard />;
  }

  if (isErrorTransactions || isErrorCategories || isErrorProfile || isErrorAccounts) {
    return <div className="p-8 text-center text-app-danger">Error cargando datos. Por favor recarga.</div>
  }


  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-app-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-app-secondary/10 rounded-full blur-[100px]" />
      </div>

      <div className="flex items-center p-4 sticky top-0 bg-app-bg/80 backdrop-blur-xl z-20 border-b border-app-border transition-all">
        <Link to="/profile" className="size-12 rounded-2xl bg-gradient-to-br from-app-primary via-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-app-primary/20 overflow-hidden shrink-0 ring-2 ring-app-bg transition-transform hover:scale-105 active:scale-95">
          {profile?.avatar ? <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" /> : <span className="text-lg">{userInitials}</span>}
        </Link>
        <div className="flex-1 px-4">
          <p className="text-xs text-app-muted font-bold uppercase tracking-wider mb-0.5">Bienvenido,</p>
          <h1 className="text-xl font-bold tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-r from-app-text-primary to-app-secondary">
            {profile?.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toastInfo('Sin notificaciones nuevas')} className="p-2 rounded-xl hover:bg-app-elevated transition-colors text-app-muted hover:text-app-text relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-app-danger rounded-full border border-app-bg"></span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 mt-6">
        {/* Available Funds Card - Primary Glow */}
        <div className="relative group overflow-hidden rounded-2xl bg-app-elevated border border-app-border p-5 transition-all duration-300 hover:shadow-glow-md hover:border-app-primary/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-app-primary/5 to-transparent opacity-100" />
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-app-primary/10 rounded-full blur-2xl group-hover:bg-app-primary/20 transition-colors" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-app-primary/10 text-app-primary">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              </div>
              <p className="text-app-muted text-[10px] font-bold uppercase tracking-wider">Disponible</p>
            </div>
            <h2 className="text-2xl font-bold text-app-text tracking-tight">{formatCurrency(availableFunds)}</h2>
          </div>
        </div>

        {/* Net Worth Card - Secondary Glow */}
        <div className="relative group overflow-hidden rounded-2xl bg-app-elevated border border-app-border p-5 transition-all duration-300 hover:shadow-glow-md hover:border-app-secondary/30 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-app-secondary/5 to-transparent opacity-100" />
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-app-secondary/10 rounded-full blur-2xl group-hover:bg-app-secondary/20 transition-colors" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-app-secondary/10 text-app-secondary">
                <span className="material-symbols-outlined text-sm">trending_up</span>
              </div>
              <p className="text-app-muted text-[10px] font-bold uppercase tracking-wider">Patrimonio</p>
            </div>
            <h2 className="text-2xl font-bold text-app-text tracking-tight">{formatCurrency(netWorth)}</h2>
          </div>
        </div>
      </div>

      {/* Financial Planning Widget */}
      <div className="px-4 mt-6">
        <FinancialPlanningWidget />
      </div>

      {/* Spending Trend Chart */}
      {transactions && transactions.length > 0 && (
        <div className="px-4 mt-6">
          <div className="card-modern p-5 shadow-premium transition-premium">
            <h3 className="text-sm font-bold text-app-text mb-4 flex items-center gap-2">
              <span className="text-lg">📊</span>
              Tendencia de Gastos
            </h3>
            <SpendingTrendChart transactions={transactions} />
          </div>
        </div>
      )}

      {/* Removed: "Próximos Pagos a MSI" - Now handled by FinancialPlanningWidget */}
      {/* Removed: "Gastos del Mes (no MSI)" - Now shown in FinancialPlanningWidget's summary */}

      <div className="px-4 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-app-text">Recientes</h3>
          <Link to="/history" className="text-app-primary text-sm font-bold hover:bg-app-primary/10 px-3 py-1 rounded-lg">Ver Todo</Link>
        </div>
        <div className="space-y-3">
          {transactions && transactions
            .filter(tx => {
              // Filter out MSI payment transactions (income/transfer with installmentPurchaseId)
              const isMsiPayment = tx.installmentPurchaseId && (tx.type === 'income' || tx.type === 'transfer');
              return !isMsiPayment;
            })
            .slice(0, 5)
            .map((tx) => {
              if (tx.type === 'transfer') {
                const sourceAccount = accounts?.find(a => a.id === tx.accountId)?.name;
                const destAccount = accounts?.find(a => a.id === tx.destinationAccountId)?.name;
                return (
                  <Link key={tx.id} to={`/new?editId=${tx.id}`} onClick={(e) => {
                    if (tx.installmentPurchaseId && tx.type === 'expense') {
                      e.preventDefault();
                      toastInfo('Administra esta compra desde la sección "Meses Sin Intereses"');
                    }
                  }} className="card-modern flex items-center gap-4 p-3 transition-premium hover:shadow-md">
                    <div className="size-11 rounded-full flex items-center justify-center shrink-0 bg-app-tertiary">
                      <span className="material-symbols-outlined text-xl text-app-muted">swap_horiz</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-app-text truncate text-sm">Transferencia</p>
                      <span className="text-xs text-app-muted truncate">{sourceAccount} → {destAccount}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-app-text">{formatCurrency(tx.amount)}</p>
                    </div>
                  </Link>
                )
              }
              const category = getCategoryInfo(tx.categoryId);
              return (
                <Link key={tx.id} to={`/new?editId=${tx.id}`} onClick={(e) => {
                  if (tx.installmentPurchaseId && tx.type === 'expense') {
                    e.preventDefault();
                    toastInfo('Administra esta compra desde la sección "Meses Sin Intereses"');
                  }
                }} className="card-modern flex items-center gap-4 p-3 transition-premium hover:shadow-md">
                  <div className="size-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: category.color }}>{category.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-app-text truncate text-sm">{tx.description}</p>
                    <div className="flex items-center gap-2">
                      {tx.installmentPurchaseId && (
                        <span className="text-[10px] font-bold text-app-primary bg-app-primary/10 px-1.5 py-0.5 rounded">
                          MSI
                        </span>
                      )}
                      <span className="text-xs text-app-muted">{category.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-app-success' : 'text-app-text'}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
