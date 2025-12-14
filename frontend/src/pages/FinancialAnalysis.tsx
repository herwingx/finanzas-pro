import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialAnalysis: React.FC = () => {
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual'>('mensual');
  const { data: summary, isLoading } = useFinancialPeriodSummary(periodType);

  const chartData = useMemo(() => {
    if (!summary) return [];

    // Combine all events: expenses, income, msi
    let events = [
      ...summary.expectedExpenses.map((e: any) => ({ date: new Date(e.dueDate), amount: -e.amount, type: 'expense', name: e.description })),
      ...summary.expectedIncome.map((e: any) => ({ date: new Date(e.dueDate), amount: e.amount, type: 'income', name: e.description })),
      ...summary.msiPaymentsDue.map((e: any) => ({ date: new Date(e.dueDate), amount: -e.amount, type: 'msi', name: e.description }))
    ];

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Generate Daily Balance Points
    const points = [];
    let currentBalance = summary.currentBalance;
    const startDate = new Date(summary.periodStart);
    const endDate = new Date(summary.periodEnd);

    // Add initial point
    points.push({
      fecha: startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', ''),
      Saldo: currentBalance,
      fullDate: startDate,
    });

    events.forEach(event => {
      currentBalance += event.amount;
      points.push({
        fecha: event.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', ''),
        Saldo: currentBalance,
        fullDate: event.date
      });
    });

    // Add final point if last event is before end date
    if (points.length > 0 && points[points.length - 1].fullDate < endDate) {
      points.push({
        fecha: endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', ''),
        Saldo: currentBalance,
        fullDate: endDate
      });
    }

    return points;

  }, [summary]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const formatAxisValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    if (value <= -1000000) return `-$${(Math.abs(value) / 1000000).toFixed(1)}M`;
    if (value <= -1000) return `-$${(Math.abs(value) / 1000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-app-bg text-app-text">
        <PageHeader title="Análisis Financiero" />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary mx-auto mb-4"></div>
          <p className="text-app-muted">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-app-bg text-app-text">
        <PageHeader title="Análisis Financiero" />
        <div className="p-8 text-center text-app-muted">No hay datos disponibles</div>
      </div>
    );
  }

  const netWorth = summary.netWorth ?? (summary.currentBalance - (summary.currentDebt || 0) - (summary.currentMSIDebt || 0));
  const totalExpenses = summary.expectedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0) +
    summary.msiPaymentsDue.reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalIncome = summary.expectedIncome.reduce((sum: number, e: any) => sum + e.amount, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-app-card border border-app-border rounded-xl p-3 shadow-lg">
          <p className="text-xs text-app-muted font-bold mb-1">{label}</p>
          <p className="text-sm font-bold text-app-primary">
            Saldo: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-app-bg text-app-text pb-20">
      <PageHeader title="Análisis Financiero" />

      <div className="px-4 space-y-5">
        {/* Period Selector */}
        <div className="bg-app-elevated p-1 rounded-xl flex border border-app-border">
          {(['quincenal', 'mensual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriodType(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${periodType === p
                ? 'bg-app-card text-app-primary shadow-sm'
                : 'text-app-muted'
                }`}
            >
              {p === 'quincenal' ? 'Quincenal' : 'Mensual'}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-app-card border border-app-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-app-income-bg">
                <span className="material-symbols-outlined text-app-income text-sm">trending_up</span>
              </div>
              <p className="text-[10px] text-app-muted font-bold uppercase">Ingresos Esperados</p>
            </div>
            <p className="text-lg font-bold text-app-income">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-app-card border border-app-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-app-expense-bg">
                <span className="material-symbols-outlined text-app-expense text-sm">trending_down</span>
              </div>
              <p className="text-[10px] text-app-muted font-bold uppercase">Gastos Proyectados</p>
            </div>
            <p className="text-lg font-bold text-app-expense">-{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Main Projection Chart */}
        <div className="bg-app-card p-4 rounded-2xl border border-app-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-app-primary/10">
                <span className="material-symbols-outlined text-app-primary text-lg">show_chart</span>
              </div>
              <div>
                <h3 className="font-bold text-app-text text-sm">Flujo de Caja</h3>
                <p className="text-[10px] text-app-muted">Proyección del período</p>
              </div>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldoProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="fecha"
                  stroke="var(--color-text-tertiary)"
                  style={{ fontSize: '9px' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  style={{ fontSize: '9px' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSaldoProj)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Footer */}
          <div className="mt-4 flex justify-between items-end border-t border-app-border pt-3">
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold">Balance Inicial</p>
              <p className="font-bold text-app-text">{formatCurrency(summary.currentBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-app-muted uppercase font-bold">Disponible al Final</p>
              <p className={`text-xl font-bold ${summary.disposableIncome >= 0 ? 'text-app-income' : 'text-app-expense'}`}>
                {summary.disposableIncome >= 0 ? '+' : ''}{formatCurrency(summary.disposableIncome)}
              </p>
            </div>
          </div>
        </div>

        {/* Health Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-2xl border ${summary.isSufficient ? 'bg-app-income-bg border-app-income/20' : 'bg-app-expense-bg border-app-expense/20'}`}>
            <span className={`material-symbols-outlined text-2xl mb-2 ${summary.isSufficient ? 'text-app-income' : 'text-app-expense'}`}>
              {summary.isSufficient ? 'check_circle' : 'warning'}
            </span>
            <p className="text-[10px] font-bold uppercase text-app-muted">Estado</p>
            <p className={`font-bold ${summary.isSufficient ? 'text-app-income' : 'text-app-expense'}`}>
              {summary.isSufficient ? 'Saludable' : 'Déficit'}
            </p>
          </div>

          <div className="p-4 rounded-2xl border bg-app-card border-app-border">
            <span className="material-symbols-outlined text-2xl mb-2 text-app-primary">account_balance</span>
            <p className="text-[10px] font-bold uppercase text-app-muted">Patrimonio Neto</p>
            <p className={`font-bold ${netWorth >= 0 ? 'text-app-text' : 'text-app-expense'}`}>
              {formatCurrency(netWorth)}
            </p>
          </div>
        </div>

        {/* Insights Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-app-muted uppercase tracking-wider">Alertas y Consejos</h3>
          {summary.warnings.length > 0 ? (
            summary.warnings.map((w: string, i: number) => (
              <div key={i} className="flex gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <span className="material-symbols-outlined text-amber-500 shrink-0">priority_high</span>
                <p className="text-sm text-app-text">{w}</p>
              </div>
            ))
          ) : (
            <div className="flex gap-3 bg-app-income-bg p-4 rounded-xl border border-app-income/20">
              <span className="material-symbols-outlined text-app-income shrink-0">thumb_up</span>
              <p className="text-sm text-app-text">
                ¡Todo se ve excelente! Sigue manteniendo tus gastos bajo control.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysis;

