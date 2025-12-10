import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions, useCategories, useProfile, useAccounts, useInstallmentPurchases } from '../hooks/useApi';
import useTheme from '../hooks/useTheme';
import { SkeletonDashboard } from '../components/Skeleton';
import { SpendingTrendChart } from '../components/Charts';
import { toastInfo } from '../utils/toast';

const Dashboard: React.FC = () => {
  const [theme] = useTheme();
  const { data: transactions, isLoading: isLoadingTransactions, isError: isErrorTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories();
  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useProfile();
  const { data: accounts, isLoading: isLoadingAccounts, isError: isErrorAccounts } = useAccounts();
  const { data: installments, isLoading: isLoadingInstallments, isError: isErrorInstallments } = useInstallmentPurchases();

  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);

  const formatCurrency = useMemo(() => (value: number) => {
    const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
  }, [profile?.currency]);

  const { netWorth, availableFunds, monthSpend, upcomingCreditPayments } = useMemo(() => {
    if (!transactions || !categories || !accounts || !installments) {
      return { netWorth: 0, availableFunds: 0, monthSpend: 0, upcomingCreditPayments: [] };
    }

    const totalAssets = accounts.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH').reduce((sum, acc) => sum + acc.balance, 0);
    const totalDebt = accounts.filter(acc => acc.type === 'CREDIT').reduce((sum, acc) => sum + acc.balance, 0);
    const netWorth = totalAssets - totalDebt;
    const availableFunds = totalAssets;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthTransactions = transactions.filter(tx => new Date(tx.date) >= startOfMonth);
    const monthSpend = currentMonthTransactions.filter(tx => tx.type === 'expense' && !tx.installmentPurchaseId).reduce((acc, tx) => acc + tx.amount, 0);

    const upcomingCreditPayments = installments
      .filter(p => p.paidInstallments < p.installments)
      .map(p => {
        const nextPaymentNumber = p.paidInstallments + 1;
        const dueDate = new Date(p.purchaseDate);
        dueDate.setMonth(dueDate.getMonth() + nextPaymentNumber);

        // Point 2: Smart Widget - Suggest minimum between monthly payment and remaining balance
        const remainingBalance = p.totalAmount - p.paidAmount;
        const suggestedAmount = Math.min(p.monthlyPayment, remainingBalance);

        return {
          id: p.id,
          accountId: p.accountId,
          accountName: p.account?.name || 'Tarjeta de Crédito',
          description: p.description,
          amountDue: parseFloat(suggestedAmount.toFixed(2)),
          dueDate: dueDate,
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return { netWorth, availableFunds, monthSpend, upcomingCreditPayments };
  }, [transactions, categories, accounts, installments]);

  const getCategoryInfo = (id: string) => {
    if (!categories) return { name: 'General', icon: 'receipt_long', color: '#999' };
    const cat = categories.find(c => c.id === id);
    return { name: cat?.name || 'General', icon: cat?.icon || 'receipt_long', color: cat?.color || '#999' };
  };

  if (isLoadingTransactions || isLoadingCategories || isLoadingProfile || isLoadingAccounts || isLoadingInstallments) {
    return <SkeletonDashboard />;
  }

  if (isErrorTransactions || isErrorCategories || isErrorProfile || isErrorAccounts || isErrorInstallments) {
    return <div className="p-8 text-center text-app-danger">Error cargando datos. Por favor recarga.</div>
  }

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
      <div className="flex items-center p-4 sticky top-0 bg-app-bg/80 backdrop-blur-xl z-20 border-b border-app-border transition-all">
        <Link to="/profile" className="size-10 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-app-primary/20 overflow-hidden shrink-0 ring-2 ring-app-bg">
          {profile?.avatar ? <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" /> : <span>{userInitials}</span>}
        </Link>
        <div className="flex-1 px-4">
          <p className="text-xs text-app-muted font-medium">Hola,</p>
          <h1 className="text-sm font-bold tracking-tight truncate">{profile?.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 mt-4">
        <div className="card-modern p-4 shadow-sm transition-premium">
          <p className="text-app-muted text-xs font-bold uppercase tracking-wider mb-1">Dinero Disponible</p>
          <h2 className="text-2xl font-bold text-app-success">{formatCurrency(availableFunds)}</h2>
        </div>

        <div className="card-modern p-4 shadow-sm transition-premium">
          <p className="text-app-muted text-xs font-bold uppercase tracking-wider mb-1">Patrimonio Neto</p>
          <h2 className="text-2xl font-bold text-app-text">{formatCurrency(netWorth)}</h2>
        </div>
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

      {upcomingCreditPayments.length > 0 && (
        <div className="px-4 mt-6">
          <div className="card-modern p-5 shadow-premium">
            <h3 className="text-sm font-bold text-app-text mb-4 flex items-center gap-2">
              <span className="text-lg">💳</span>
              Próximos Pagos a MSI
            </h3>
            <div className="space-y-3">
              {upcomingCreditPayments.map((payment, index) => (
                <Link key={index} to={`/new?type=transfer&destinationAccountId=${payment.accountId}&amount=${payment.amountDue}&description=Pago mensualidad ${encodeURIComponent(payment.description)}&installmentPurchaseId=${payment.id}`} className="interactive flex items-center justify-between p-3 bg-app-elevated rounded-xl border border-app-border transition-premium">
                  <div>
                    <p className="font-bold text-app-text text-sm">{payment.description}</p>
                    <span className="text-xs text-app-muted">Vence: {payment.dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p className="font-bold text-app-danger text-sm">{formatCurrency(payment.amountDue)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 mt-6">
        <div className="card-modern p-5 shadow-premium">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-app-muted text-[10px] font-bold uppercase tracking-wider mb-1">Gastos del Mes (no MSI)</p>
              <span className="text-2xl font-bold text-app-text">{formatCurrency(monthSpend)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-app-text">Recientes</h3>
          <Link to="/history" className="text-app-primary text-sm font-bold hover:bg-app-primary/10 px-3 py-1 rounded-lg">Ver Todo</Link>
        </div>
        <div className="space-y-3">
          {transactions && transactions.slice(0, 5).map((tx) => {
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
