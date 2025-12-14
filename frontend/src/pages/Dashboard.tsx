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

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Buenos días', emoji: '☀️' };
    if (hour >= 12 && hour < 19) return { text: 'Buenas tardes', emoji: '🌤️' };
    return { text: 'Buenas noches', emoji: '🌙' };
  }, []);

  // Current date formatted
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }, []);

  const formatCurrency = useMemo(() => (value: number) => {
    const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
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

  // Calculate current month income and expenses
  const { totalIncome, totalExpenses } = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0 };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthTransactions = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

    const totalIncome = monthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = monthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { totalIncome, totalExpenses };
  }, [transactions]);

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
    <div className="bg-app-bg text-app-text font-sans pb-20">
      {/* Ambient Background Glow - Enhanced */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-gradient-to-b from-app-primary/15 to-transparent rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[40%] bg-app-secondary/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <div className="h-16 flex items-center px-4 sticky top-0 bg-app-bg/80 backdrop-blur-xl z-20 border-b border-app-border/30">
        <Link to="/profile" className="size-12 rounded-2xl bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-app-primary/30 overflow-hidden shrink-0 transition-transform hover:scale-105 active:scale-95">
          {profile?.avatar ? <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" /> : <span className="text-lg">{userInitials}</span>}
        </Link>
        <div className="flex-1 px-3 min-w-0">
          <p className="text-xs text-app-muted capitalize">{currentDate}</p>
          <h1 className="text-base font-bold tracking-tight truncate text-app-text flex items-center gap-1.5">
            <span>{greeting.emoji}</span>
            <span>{greeting.text}, {profile?.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toastInfo('Sin notificaciones nuevas')} className="p-2 rounded-xl hover:bg-app-elevated transition-colors text-app-muted hover:text-app-text relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-app-danger rounded-full border-2 border-app-bg"></span>
          </button>
        </div>
      </div>

      {/* Main Balance Hero Card */}
      <div className="px-4 mt-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-app-primary via-app-primary to-app-secondary p-6 shadow-2xl shadow-app-primary/30">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-4 right-4 opacity-20">
            <span className="material-symbols-outlined text-6xl text-white">account_balance_wallet</span>
          </div>

          <div className="relative z-10">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Balance Disponible</p>
            <h2 className="text-4xl font-black text-white tracking-tight mb-4">
              {formatCurrency(availableFunds)}
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm">
                <span className="material-symbols-outlined text-white/70 text-sm">trending_up</span>
                <span className="text-white/80 text-xs font-bold">Patrimonio: {formatCurrency(netWorth)}</span>
              </div>
              <Link to="/accounts" className="flex items-center gap-1 text-white/70 hover:text-white text-xs font-bold transition-colors">
                <span>Ver cuentas</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="px-4 mt-4 flex gap-3">
        <div className="flex-1 bg-app-card border border-app-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-lg bg-app-income-bg">
              <span className="material-symbols-outlined text-app-income text-xs">arrow_upward</span>
            </div>
            <p className="text-[9px] text-app-muted font-bold uppercase">Ingresos</p>
          </div>
          <p className="text-lg font-bold text-app-income">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="flex-1 bg-app-card border border-app-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-lg bg-app-expense-bg">
              <span className="material-symbols-outlined text-app-expense text-xs">arrow_downward</span>
            </div>
            <p className="text-[9px] text-app-muted font-bold uppercase">Gastos</p>
          </div>
          <p className="text-lg font-bold text-app-expense">-{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      {/* Financial Planning Widget */}
      <div className="px-4 mt-6">
        <FinancialPlanningWidget />
      </div>

      {/* Spending Trend Chart */}
      {transactions && transactions.length > 0 && (
        <div className="px-4 mt-6">
          <SpendingTrendChart transactions={transactions} />
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-app-primary/10">
              <span className="material-symbols-outlined text-app-primary text-lg">receipt_long</span>
            </div>
            <h3 className="text-sm font-bold text-app-text">Transacciones Recientes</h3>
          </div>
          <Link to="/history" className="text-app-primary text-xs font-bold hover:bg-app-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            Ver todo
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </Link>
        </div>

        <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border">
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
                  }} className="flex items-center gap-3 p-3 hover:bg-app-elevated/50 transition-colors">
                    <div className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-app-transfer-bg">
                      <span className="material-symbols-outlined text-lg text-app-transfer">swap_horiz</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-app-text truncate text-sm">Transferencia</p>
                      <span className="text-[11px] text-app-muted truncate">{sourceAccount} → {destAccount}</span>
                    </div>
                    <div className="text-right shrink-0">
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
                }} className="flex items-center gap-3 p-3 hover:bg-app-elevated/50 transition-colors">
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}15` }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: category.color }}>{category.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-app-text truncate text-sm">{tx.description}</p>
                    <div className="flex items-center gap-2">
                      {tx.installmentPurchaseId && (
                        <span className="text-[9px] font-bold text-app-msi bg-app-msi-bg px-1.5 py-0.5 rounded">
                          MSI
                        </span>
                      )}
                      <span className="text-[11px] text-app-muted">{category.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-app-income' : 'text-app-text'}`}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </p>
                  </div>
                </Link>
              )
            })}

          {(!transactions || transactions.length === 0) && (
            <div className="p-8 text-center text-app-muted">
              <span className="material-symbols-outlined text-3xl mb-2 opacity-30">receipt_long</span>
              <p className="text-sm">Sin transacciones recientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
