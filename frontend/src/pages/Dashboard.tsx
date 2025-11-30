import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useTransactions, useCategories, useProfile } from '../hooks/useApi';
import useTheme from '../hooks/useTheme';

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-card/90 backdrop-blur-md p-3 rounded-xl border border-app-border shadow-xl">
        <p className="text-xs font-medium text-app-muted mb-1">{label}</p>
        <p className="text-lg font-bold text-app-text">{formatter(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [theme] = useTheme();
  const { data: transactions, isLoading: isLoadingTransactions, isError: isErrorTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories();
  const { data: profile, isLoading: isLoadingProfile, isError: isErrorProfile } = useProfile();


  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);

  const formatCurrency = useMemo(() => (value: number) => {
    const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
  }, [profile?.currency]);

  const { totalBalance, monthSpend, monthChange, weeklyChartData, budgetBreakdown, monthlyIncome } = useMemo(() => {
    if (!transactions || !categories) return { totalBalance: 0, monthSpend: 0, monthChange: { percent: 0, hasPrevMonthData: false }, weeklyChartData: [], budgetBreakdown: { needs: 0, wants: 0, savings: 0, total: 0 }, monthlyIncome: 0 };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalBalance = transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0);

    const currentMonthTransactions = transactions.filter(tx => new Date(tx.date) >= startOfMonth);
    const lastMonthTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startOfLastMonth && txDate <= endOfLastMonth;
    });

    const monthSpend = currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);

    const lastMonthSpend = lastMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => acc + tx.amount, 0);

    const monthChange = {
      percent: lastMonthSpend > 0 ? ((monthSpend - lastMonthSpend) / lastMonthSpend) * 100 : monthSpend > 0 ? 100 : 0,
      hasPrevMonthData: lastMonthTransactions.length > 0,
    };
    
    const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // 6-i to get days from 6 days ago to today
      const day = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const total = transactions
        .filter(tx => tx.type === 'expense' && new Date(tx.date).toDateString() === d.toDateString())
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { name: day.charAt(0).toUpperCase() + day.slice(1, 2), val: total };
    });
    
    const monthlyIncome = currentMonthTransactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);

    const budgetBreakdown = { needs: 0, wants: 0, savings: 0, total: 0 };
    currentMonthTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        const category = categories.find(c => c.id === tx.categoryId);
        if (category?.budgetType === 'need') budgetBreakdown.needs += tx.amount;
        else if (category?.budgetType === 'want') budgetBreakdown.wants += tx.amount;
        else if (category?.budgetType === 'savings') budgetBreakdown.savings += tx.amount;
      }
    });
    budgetBreakdown.total = budgetBreakdown.needs + budgetBreakdown.wants + budgetBreakdown.savings;

    return { totalBalance, monthSpend, monthChange, weeklyChartData, budgetBreakdown, monthlyIncome };
  }, [transactions, categories]);

  const getCategoryInfo = (id: string) => {
    if (!categories) return { name: 'General', icon: 'receipt_long', color: '#999' };
    const cat = categories.find(c => c.id === id);
    return { name: cat?.name || 'General', icon: cat?.icon || 'receipt_long', color: cat?.color || '#999' };
  };

  const hasRecentSpend = weeklyChartData.some(d => d.val > 0);
  const chartColor = useMemo(() => theme === 'dark' ? '#8b5cf6' : '#6d28d9', [theme]);

  if (isLoadingTransactions || isLoadingCategories || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app-bg">
        <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isErrorTransactions || isErrorCategories || isErrorProfile) {
    return <div className="p-8 text-center text-app-danger">Error cargando datos. Por favor recarga.</div>
  }

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
      {/* Top Bar */}
      <div className="flex items-center p-4 sticky top-0 bg-app-bg/80 backdrop-blur-xl z-20 border-b border-app-border transition-all">
        <Link to="/profile" className="size-10 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-app-primary/20 overflow-hidden shrink-0 ring-2 ring-app-bg">
          {profile?.avatar ? <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" /> : <span>{userInitials}</span>}
        </Link>
        <div className="flex-1 px-4">
          <p className="text-xs text-app-muted font-medium">Hola,</p>
          <h1 className="text-sm font-bold tracking-tight truncate">{profile?.name}</h1>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-br from-app-primary to-app-secondary rounded-[2rem] p-6 shadow-2xl shadow-app-primary/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-9xl text-white">account_balance_wallet</span>
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium tracking-wide mb-1">Balance Total</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">{formatCurrency(totalBalance)}</h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm text-white border border-white/10">{profile?.currency}</span>
              <span className="text-xs text-white/60 font-medium">Actualizado hoy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="px-4 mt-6">
        <div className="bg-app-card border border-app-border rounded-3xl p-5 shadow-premium">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-app-muted text-[10px] font-bold uppercase tracking-wider mb-1">Gastos de la Semana</p>
              <span className="text-2xl font-bold text-app-text">{formatCurrency(monthSpend)}</span>
            </div>
            {monthChange.hasPrevMonthData && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${monthChange.percent >= 0 ? 'bg-app-danger/10 text-app-danger' : 'bg-app-success/10 text-app-success'}`}>
                <span className="material-symbols-outlined text-sm">{monthChange.percent >= 0 ? 'trending_up' : 'trending_down'}</span>
                <span>{Math.abs(monthChange.percent).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="h-48 w-full -ml-2">
            {hasRecentSpend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    hide
                  />
                  <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke={chartColor}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorVal)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-app-muted gap-2 opacity-50">
                <span className="material-symbols-outlined text-3xl">bar_chart</span>
                <p className="text-xs font-medium">Sin actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 50/30/20 Budget Breakdown */}
      {budgetBreakdown.total > 0 && (
        <div className="px-4 mt-6">
          <div className="bg-app-card border border-app-border rounded-3xl p-5 shadow-premium">
            <h3 className="text-sm font-bold text-app-text mb-4">Resumen 50/30/20 del Mes</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-app-text">Necesidades (50%)</span>
                  <span className="text-xs font-bold">{((budgetBreakdown.needs / budgetBreakdown.total) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-app-elevated rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(budgetBreakdown.needs / budgetBreakdown.total) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-app-text">Deseos (30%)</span>
                  <span className="text-xs font-bold">{((budgetBreakdown.wants / budgetBreakdown.total) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-app-elevated rounded-full h-2.5">
                  <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${(budgetBreakdown.wants / budgetBreakdown.total) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-app-text">Ahorros (20%)</span>
                  <span className="text-xs font-bold">{((budgetBreakdown.savings / budgetBreakdown.total) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-app-elevated rounded-full h-2.5">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(budgetBreakdown.savings / budgetBreakdown.total) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-app-text">Recientes</h3>
          <Link to="/history" className={`text-app-primary text-sm font-bold hover:bg-app-primary/10 px-3 py-1 rounded-lg ${(!categories || categories.length === 0) ? 'pointer-events-none opacity-50' : ''}`}>Ver Todo</Link>
        </div>
        <div className="space-y-3">
          {(!categories || categories.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-app-muted bg-app-card/50 rounded-2xl border-dashed border-app-border">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">category</span>
              <p className="text-sm font-medium">No has creado categorías</p>
              <Link to="/settings" className="mt-2 text-app-primary text-sm font-bold hover:underline">Crea tu primera categoría</Link>
            </div>
          ) : transactions && transactions.slice(0, 5).map((tx) => {
            const category = getCategoryInfo(tx.categoryId);
            return (
              <Link key={tx.id} to={`/new?editId=${tx.id}`} className="group flex items-center gap-4 bg-app-card border border-app-border p-3 rounded-xl hover:bg-app-elevated">
                <div className="size-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${category.color}20` }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: category.color }}>{category.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-app-text truncate text-sm">{tx.description}</p>
                  <span className="text-xs text-app-muted">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-app-success' : 'text-app-text'}`}>{tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}</p>
                </div>
              </Link>
            )
          })}
          {transactions && transactions.length === 0 && categories && categories.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-app-muted bg-app-card/50 rounded-2xl border-dashed border-app-border">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <p className="text-sm font-medium">No hay transacciones aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;