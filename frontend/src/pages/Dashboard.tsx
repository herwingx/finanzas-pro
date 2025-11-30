
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { useTransactions, useCategories, useProfile } from '../hooks/useApi';
import useTheme from '../hooks/useTheme';

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-card/80 backdrop-blur-sm p-2 rounded-lg border border-app-border shadow-lg">
        <p className="text-sm font-bold text-app-text">{`${label}: ${formatter(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

export const Dashboard = () => {
  const [theme] = useTheme();
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();


  const userInitials = useMemo(() => {
    return profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  }, [profile?.name]);
  
  const formatCurrency = useMemo(() => (value: number) => {
    const locales = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
    return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
  }, [profile?.currency]);

  const { totalBalance, monthSpend, monthChange, weeklyChartData } = useMemo(() => {
    if (!transactions) return { totalBalance: 0, monthSpend: 0, monthChange: { percent: 0, hasPrevMonthData: false }, weeklyChartData: [] };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const balance = transactions.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0);

    const currentMonthSpend = transactions.filter(tx => tx.type === 'expense' && new Date(tx.date) >= startOfMonth).reduce((acc, tx) => acc + tx.amount, 0);
    const prevMonthSpend = transactions.filter(tx => tx.type === 'expense' && new Date(tx.date) >= startOfPrevMonth && new Date(tx.date) <= endOfPrevMonth).reduce((acc, tx) => acc + tx.amount, 0);

    let change = 0;
    if (prevMonthSpend > 0) {
      change = ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100;
    }

    const weekData = [];
    const weekDayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const daySpend = transactions.filter(tx => tx.type === 'expense' && new Date(tx.date) >= dayStart && new Date(tx.date) <= dayEnd).reduce((sum, tx) => sum + tx.amount, 0);
      
      weekData.push({ name: weekDayLabels[dayStart.getDay()], val: daySpend });
    }

    return { totalBalance: balance, monthSpend: currentMonthSpend, monthChange: { percent: change, hasPrevMonthData: prevMonthSpend > 0 }, weeklyChartData: weekData };
  }, [transactions]);

  const getCategoryInfo = (id: string) => {
    if (!categories) return { name: 'General', icon: 'receipt_long', color: '#999' };
    const cat = categories.find(c => c.id === id);
    return { name: cat?.name || 'General', icon: cat?.icon || 'receipt_long', color: cat?.color || '#999' };
  };
  
  const todayIndex = new Date().getDay();
  const hasRecentSpend = weeklyChartData.some(d => d.val > 0);
  const chartBarColor = useMemo(() => theme === 'dark' ? '#a78bfa' : '#8b5cf6', [theme]);
  const chartBarActiveColor = useMemo(() => theme === 'dark' ? '#8b5cf6' : '#6d28d9', [theme]);

  if (isLoadingTransactions || isLoadingCategories || isLoadingProfile) {
    return <div>Loading...</div>
  }

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text">
      {/* Top Bar */}
      <div className="flex items-center p-4 sticky top-0 bg-app-bg/90 backdrop-blur-xl z-20 border-b border-app-border">
        <Link to="/profile" className="size-9 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-app-primary/20 overflow-hidden shrink-0">
          {profile?.avatar ? <img src={profile.avatar} alt="User Avatar" className="w-full h-full object-cover" /> : <span>{userInitials}</span>}
        </Link>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight">Panel de Control</h1>
        <Link to="/settings" className="size-9 flex items-center justify-center rounded-xl bg-app-elevated text-app-text hover:bg-app-card active:scale-95 shrink-0"><span className="material-symbols-outlined text-xl">settings</span></Link>
      </div>

      {/* Balance Card */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-app-primary to-app-secondary rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-app-primary/30 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-white/80 text-sm font-medium tracking-wide">Balance Total</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight my-2 text-white drop-shadow-sm">{formatCurrency(totalBalance)}</h2>
            <span className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">{profile?.currency}</span>
          </div>
        </div>
      </div>
      
      {/* Monthly Chart */}
      <div className="px-4 mt-8">
        <div className="bg-app-card border border-app-border rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-app-muted text-sm font-bold uppercase tracking-wider mb-1">Gastos del Mes</p>
              <span className="text-2xl font-bold text-app-text">{formatCurrency(monthSpend)}</span>
            </div>
            {monthChange.hasPrevMonthData && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${monthChange.percent >= 0 ? 'bg-app-danger/10 text-app-danger' : 'bg-app-success/10 text-app-success'}`}>
                <span>{monthChange.percent.toFixed(1)}% vs mes anterior</span>
              </div>
            )}
          </div>

          <div className="h-40 w-full">
            {hasRecentSpend ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <YAxis tickFormatter={(tick) => `${tick / 1000}k`} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip formatter={formatCurrency} />} cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                  <Bar dataKey="val" radius={[4, 4, 4, 4]}>
                    {weeklyChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartBarActiveColor} opacity={index === todayIndex ? 1 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-app-muted"><p>No hay gastos en la última semana</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-app-text">Recientes</h3>
          <Link to="/history" className="text-app-primary text-sm font-bold hover:bg-app-primary/10 px-3 py-1 rounded-lg">Ver Todo</Link>
        </div>
        <div className="space-y-3">
          {transactions && transactions.slice(0, 5).map((tx) => {
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
          {transactions && transactions.length === 0 && (
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
