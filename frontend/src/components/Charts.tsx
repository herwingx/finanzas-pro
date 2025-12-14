import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Transaction, Category } from '../types';

// Modern Tooltip Component - Spanish
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-elevated border border-app-border rounded-xl p-3 shadow-lg">
        <p className="text-xs text-app-muted font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Spending Trend Chart (Line) - Improved Spanish Version
interface SpendingTrendProps {
  transactions: Transaction[];
}

export const SpendingTrendChart: React.FC<SpendingTrendProps> = ({ transactions }) => {
  const { data, totals } = useMemo(() => {
    // Group by month with Spanish month names
    const monthlyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[sortKey]) {
        acc[sortKey] = { mes: monthKey.charAt(0).toUpperCase() + monthKey.slice(1), Ingresos: 0, Gastos: 0 };
      }

      if (tx.type === 'income') {
        acc[sortKey].Ingresos += tx.amount;
      } else if (tx.type === 'expense') {
        acc[sortKey].Gastos += tx.amount;
      }

      return acc;
    }, {} as Record<string, { mes: string; Ingresos: number; Gastos: number }>);

    const chartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value);

    const totals = chartData.reduce(
      (acc, item) => ({
        ingresos: acc.ingresos + item.Ingresos,
        gastos: acc.gastos + item.Gastos,
      }),
      { ingresos: 0, gastos: 0 }
    );

    return { data: chartData, totals };
  }, [transactions]);

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (data.length === 0) {
    return (
      <div className="bg-app-card border border-app-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-app-primary">trending_up</span>
          <h3 className="font-bold text-app-text">Tendencia de Gastos</h3>
        </div>
        <div className="flex items-center justify-center h-40 text-app-muted">
          <p className="text-sm">Sin datos suficientes para mostrar tendencias</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-app-primary/10">
            <span className="material-symbols-outlined text-app-primary text-lg">trending_up</span>
          </div>
          <div>
            <h3 className="font-bold text-app-text text-sm">Tendencia de Gastos</h3>
            <p className="text-[10px] text-app-muted">Últimos {data.length} meses</p>
          </div>
        </div>
      </div>

      {/* Summary Pills */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-app-income-bg rounded-xl px-3 py-2">
          <p className="text-[10px] text-app-income font-bold uppercase tracking-wide">Ingresos</p>
          <p className="text-sm font-bold text-app-text">{formatCurrency(totals.ingresos)}</p>
        </div>
        <div className="flex-1 bg-app-expense-bg rounded-xl px-3 py-2">
          <p className="text-[10px] text-app-expense font-bold uppercase tracking-wide">Gastos</p>
          <p className="text-sm font-bold text-app-text">{formatCurrency(totals.gastos)}</p>
        </div>
        <div className={`flex-1 rounded-xl px-3 py-2 ${totals.ingresos >= totals.gastos ? 'bg-app-income-bg' : 'bg-app-expense-bg'}`}>
          <p className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Balance</p>
          <p className={`text-sm font-bold ${totals.ingresos >= totals.gastos ? 'text-app-income' : 'text-app-expense'}`}>
            {totals.ingresos >= totals.gastos ? '+' : ''}{formatCurrency(totals.ingresos - totals.gastos)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-expense)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-expense)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="mes"
            stroke="var(--color-text-tertiary)"
            style={{ fontSize: '10px' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--color-text-tertiary)"
            style={{ fontSize: '9px' }}
            tickLine={false}
            axisLine={false}
            width={45}
            tickFormatter={(value) => {
              if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
              return `$${value.toFixed(0)}`;
            }}
          />
          <Tooltip content={<ModernTooltip />} />
          <Area
            type="monotone"
            dataKey="Ingresos"
            stroke="var(--color-income)"
            fill="url(#colorIngresos)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="Gastos"
            stroke="var(--color-expense)"
            fill="url(#colorGastos)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-app-income"></div>
          <span className="text-[10px] font-medium text-app-muted">Ingresos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-app-expense"></div>
          <span className="text-[10px] font-medium text-app-muted">Gastos</span>
        </div>
      </div>
    </div>
  );
};

// Category Distribution Chart (Donut)
interface CategoryDistributionProps {
  transactions: Transaction[];
  categories: Category[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionProps> = ({
  transactions,
  categories
}) => {
  const data = useMemo(() => {
    const categoryTotals = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        const categoryId = tx.categoryId || 'unknown';
        acc[categoryId] = (acc[categoryId] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || 'Sin categoría',
          value: amount,
          color: category?.color || '#999',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [transactions, categories]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ModernTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Monthly Comparison Chart (Bar) - Spanish
interface MonthlyComparisonProps {
  transactions: Transaction[];
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const monthlyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const monthKey = date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[sortKey]) {
        acc[sortKey] = { mes: monthKey.charAt(0).toUpperCase() + monthKey.slice(1), Ingresos: 0, Gastos: 0 };
      }

      if (tx.type === 'income') {
        acc[sortKey].Ingresos += tx.amount;
      } else if (tx.type === 'expense') {
        acc[sortKey].Gastos += tx.amount;
      }

      return acc;
    }, {} as Record<string, { mes: string; Ingresos: number; Gastos: number }>);

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value);
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="mes"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.7rem' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.7rem' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<ModernTooltip />} />
        <Bar dataKey="Ingresos" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Gastos" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Balance Over Time Chart (Area) - Spanish
interface BalanceOverTimeProps {
  transactions: Transaction[];
}

export const BalanceOverTimeChart: React.FC<BalanceOverTimeProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    const balanceData = sortedTransactions.map(tx => {
      if (tx.type === 'income') {
        runningBalance += tx.amount;
      } else if (tx.type === 'expense') {
        runningBalance -= tx.amount;
      }

      return {
        fecha: new Date(tx.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }).replace('.', ''),
        Saldo: runningBalance,
      };
    });

    return balanceData.slice(-30); // Last 30 transactions
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="fecha"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.65rem' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.65rem' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<ModernTooltip />} />
        <Area
          type="monotone"
          dataKey="Saldo"
          stroke="var(--color-primary)"
          fill="url(#colorSaldo)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
