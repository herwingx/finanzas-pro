import React, { useMemo } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Transaction, Category } from '../types';

// --- Shared: Modern Tooltip (Linear Style) ---
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-surface border border-app-border rounded-lg p-2.5 shadow-lg min-w-[140px]">
        <p className="text-[10px] text-app-muted uppercase tracking-wider mb-1.5 font-bold">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="font-medium capitalize text-app-text flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}
              </span>
              <span className="font-bold tabular-nums text-app-text">
                {entry.value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// --- Spending Trend (Area) ---
interface SpendingTrendProps { transactions: Transaction[]; }

export const SpendingTrendChart: React.FC<SpendingTrendProps> = ({ transactions }) => {
  const { data, totals } = useMemo(() => {
    // Agrupar por Mes
    const monthlyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      // Sort Key: YYYY-MM
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      // Display Key: Ene
      const monthName = date.toLocaleDateString('es-MX', { month: 'short' });
      const displayKey = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', '');

      if (!acc[sortKey]) acc[sortKey] = { mes: displayKey, Ingresos: 0, Gastos: 0 };

      if (tx.type === 'income') acc[sortKey].Ingresos += tx.amount;
      else if (tx.type === 'expense') acc[sortKey].Gastos += tx.amount;

      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, val]) => val);

    // Totals para pills
    const t = chartData.reduce((acc, item) => ({
      ingresos: acc.ingresos + item.Ingresos,
      gastos: acc.gastos + item.Gastos
    }), { ingresos: 0, gastos: 0 });

    return { data: chartData, totals: t };
  }, [transactions]);

  const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-app-muted text-xs">
        <span className="material-symbols-outlined text-3xl opacity-20 mb-2">bar_chart</span>
        Sin suficientes datos
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* KPIs Compactos */}
      <div className="flex gap-4 mb-4 mt-1 overflow-x-auto pb-1 no-scrollbar">
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <div>
            <p className="text-[10px] text-app-muted uppercase">Ingresos</p>
            <p className="text-xs font-bold text-app-text">{formatMoney(totals.ingresos)}</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
          <div>
            <p className="text-[10px] text-app-muted uppercase">Gastos</p>
            <p className="text-xs font-bold text-app-text">{formatMoney(totals.gastos)}</p>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--semantic-success)" stopOpacity={0.15} />
                <stop offset="90%" stopColor="var(--semantic-success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--semantic-danger)" stopOpacity={0.15} />
                <stop offset="90%" stopColor="var(--semantic-danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" strokeOpacity={0.6} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            />
            <Tooltip content={<ModernTooltip />} cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="Ingresos"
              stroke="var(--semantic-success)"
              strokeWidth={2}
              fill="url(#gradIngresos)"
            />
            <Area
              type="monotone"
              dataKey="Gastos"
              stroke="var(--semantic-danger)"
              strokeWidth={2}
              fill="url(#gradGastos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


// --- Category Donut ---
export const CategoryDistributionChart: React.FC<{ transactions: Transaction[], categories: Category[] }> = ({ transactions, categories }) => {
  const data = useMemo(() => {
    const totals = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(totals)
      .map(([id, val]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat?.name || 'Otros',
          value: val,
          color: cat?.color || 'var(--text-muted)'
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Solo Top 5
  }, [transactions, categories]);

  if (!data.length) return <div className="h-40 flex items-center justify-center text-xs text-app-muted">Sin gastos registrados</div>;

  return (
    <div className="flex items-center h-[200px]">
      {/* Legend Custom */}
      <div className="w-1/3 flex flex-col gap-2 pr-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] text-app-muted truncate" title={item.name}>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="w-2/3 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              cornerRadius={4}
            >
              {data.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--bg-surface)" strokeWidth={2} />)}
            </Pie>
            <Tooltip content={<ModernTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


// --- Balance Area (Net Worth Evolution) ---
export const BalanceOverTimeChart: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
  const data = useMemo(() => {
    // Simplificación rápida de saldo acumulado
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    const daily: Record<string, number> = {};

    sorted.forEach(tx => {
      if (tx.type === 'income') balance += tx.amount;
      else if (tx.type === 'expense') balance -= tx.amount;

      const d = new Date(tx.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
      daily[d] = balance;
    });

    // Tomar últimos 15 puntos para que el gráfico respire
    const entries = Object.entries(daily).map(([k, v]) => ({ fecha: k, Saldo: v }));
    return entries.slice(-15);
  }, [transactions]);

  if (data.length < 2) return <div className="h-40 flex items-center justify-center text-xs text-app-muted">Se requieren más datos</div>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={5} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
        <Tooltip content={<ModernTooltip />} cursor={false} />
        <Area type="monotone" dataKey="Saldo" stroke="var(--brand-primary)" strokeWidth={2} fill="url(#gradBalance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}