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

// Modern Tooltip Component
const ModernTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-app-elevated border border-app-border rounded-xl p-3 shadow-lg">
        <p className="text-xs text-app-muted font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Spending Trend Chart (Line)
interface SpendingTrendProps {
  transactions: Transaction[];
}

export const SpendingTrendChart: React.FC<SpendingTrendProps> = ({ transactions }) => {
  const data = useMemo(() => {
    // Group by month
    const monthlyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, income: 0, expenses: 0 };
      }

      if (tx.type === 'income') {
        acc[monthKey].income += tx.amount;
      } else if (tx.type === 'expense') {
        acc[monthKey].expenses += tx.amount;
      }

      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);

    return Object.values(monthlyData).slice(-6); // Last 6 months
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142, 76%, 50%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(0, 84%, 65%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(0, 84%, 65%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip content={<ModernTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          stroke="hsl(142, 76%, 50%)"
          fill="url(#colorIncome)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="hsl(0, 84%, 65%)"
          fill="url(#colorExpense)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
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

// Monthly Comparison Chart (Bar)
interface MonthlyComparisonProps {
  transactions: Transaction[];
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const monthlyData = transactions.reduce((acc, tx) => {
      const date = new Date(tx.date);
      const month = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0 };
      }

      if (tx.type === 'income') {
        acc[month].income += tx.amount;
      } else if (tx.type === 'expense') {
        acc[month].expenses += tx.amount;
      }

      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);

    return Object.values(monthlyData).slice(-6);
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip content={<ModernTooltip />} />
        <Bar dataKey="income" fill="hsl(142, 76%, 50%)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expenses" fill="hsl(0, 84%, 65%)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Balance Over Time Chart (Area)
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
        date: new Date(tx.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        balance: runningBalance,
      };
    });

    return balanceData.slice(-30); // Last 30 transactions
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(245, 100%, 65%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(245, 100%, 65%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: '0.75rem' }}
        />
        <Tooltip content={<ModernTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="hsl(245, 100%, 65%)"
          fill="url(#colorBalance)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
