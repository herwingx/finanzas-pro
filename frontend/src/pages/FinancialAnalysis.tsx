import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateUTC } from '../utils/dateUtils';

const FinancialAnalysis: React.FC = () => {
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'bimestral' | 'semestral' | 'anual'>('mensual');
  const { data: summary, isLoading } = useFinancialPeriodSummary(periodType);

  const chartData = useMemo(() => {
    if (!summary) return [];

    let events = [
      ...summary.expectedExpenses.map((e: any) => ({ date: new Date(e.dueDate), amount: -e.amount, type: 'expense', name: e.description })),
      ...summary.expectedIncome.map((e: any) => ({ date: new Date(e.dueDate), amount: e.amount, type: 'income', name: e.description })),
      ...summary.msiPaymentsDue.map((e: any) => ({ date: new Date(e.dueDate), amount: -e.amount, type: 'msi', name: e.description }))
    ];

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    const points = [];
    let currentBalance = summary.currentBalance;
    const startDate = new Date(summary.periodStart);
    const endDate = new Date(summary.periodEnd);

    points.push({
      fecha: formatDateUTC(startDate, { style: 'short' }),
      Saldo: currentBalance,
      fullDate: startDate,
    });

    events.forEach(event => {
      currentBalance += event.amount;
      points.push({
        fecha: formatDateUTC(event.date, { style: 'short' }),
        Saldo: currentBalance,
        fullDate: event.date
      });
    });

    // Proyectar hasta el final del periodo si no hay más eventos
    if (points.length > 0 && points[points.length - 1].fullDate < endDate) {
      points.push({
        fecha: formatDateUTC(endDate, { style: 'short' }),
        Saldo: currentBalance,
        fullDate: endDate
      });
    }

    return points;
  }, [summary]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const formatAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
  };

  // Custom Tooltip Minimalista (Estilo Linear)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-app-surface border border-app-border rounded-lg shadow-lg p-2.5 text-xs">
          <p className="text-app-muted font-medium mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-app-primary rounded-full"></span>
            <span className="font-bold text-app-text tabular-nums text-sm">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-app-bg animate-pulse">
        <PageHeader title="Análisis Financiero" />
        <div className="px-4 py-8 grid gap-4">
          <div className="h-48 rounded-3xl bg-gray-200 dark:bg-zinc-800"></div>
          <div className="h-32 rounded-3xl bg-gray-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  if (!summary) return <div className="text-center p-8 text-app-muted">No hay datos disponibles</div>;

  const totalExpenses = summary.expectedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0) +
    summary.msiPaymentsDue.reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalIncome = summary.expectedIncome.reduce((sum: number, e: any) => sum + e.amount, 0);

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
      <PageHeader title="Análisis Financiero" />

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 pt-2">

        {/* Top Controls: Period Selector */}
        <div className="flex justify-center mb-6">
          <div className="bg-app-subtle p-1 rounded-xl flex gap-1 w-full max-w-sm">
            {(['quincenal', 'mensual', 'bimestral', 'semestral', 'anual'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${periodType === p
                  ? 'bg-app-surface text-app-text shadow-sm border border-app-border'
                  : 'text-app-muted hover:text-app-text'
                  }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Flow Overview (Income vs Expenses) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bento-card p-4 flex flex-col items-center text-center justify-center border-emerald-100 dark:border-emerald-900/30">
            <span className="material-symbols-outlined text-emerald-500 mb-1">trending_up</span>
            <p className="text-[10px] font-bold text-app-muted uppercase">Ingresos Esperados</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bento-card p-4 flex flex-col items-center text-center justify-center border-rose-100 dark:border-rose-900/30">
            <span className="material-symbols-outlined text-rose-500 mb-1">trending_down</span>
            <p className="text-[10px] font-bold text-app-muted uppercase">Gastos + Deuda</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">-{formatCurrency(totalExpenses)}</p>
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bento-card p-0 overflow-hidden bg-app-surface border border-app-border shadow-sm">
          <div className="px-5 pt-5 pb-2 flex justify-between items-end border-b border-app-subtle">
            <div>
              <h3 className="font-bold text-sm text-app-text">Proyección de Liquidez</h3>
              <p className="text-xs text-app-muted">Evolución estimada de tu saldo</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-app-muted uppercase">Final</p>
              <p className={`text-lg font-bold tabular-nums ${summary.disposableIncome >= 0 ? 'text-app-primary' : 'text-app-danger'}`}>
                {formatCurrency(summary.disposableIncome)}
              </p>
            </div>
          </div>

          <div className="h-64 w-full mt-2 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldoProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.15} />
                    <stop offset="90%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" strokeOpacity={0.6} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '3 3' }} />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="var(--brand-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSaldoProj)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Warnings (List Style) */}
        <div>
          <h4 className="text-xs font-bold text-app-muted uppercase mb-3 ml-1 tracking-wide">Estado y Alertas</h4>
          <div className="space-y-3">

            {/* Main Status */}
            <div className={`p-4 rounded-2xl border flex gap-3 items-start ${summary.isSufficient ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900'}`}>
              <div className={`mt-0.5 p-1 rounded-full ${summary.isSufficient ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                <span className="material-symbols-outlined text-sm block">
                  {summary.isSufficient ? 'check' : 'close'}
                </span>
              </div>
              <div>
                <p className={`text-sm font-bold ${summary.isSufficient ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                  {summary.isSufficient ? 'Liquidez Saludable' : 'Déficit Proyectado'}
                </p>
                <p className="text-xs opacity-80 leading-relaxed mt-1">
                  {summary.isSufficient
                    ? 'Tus ingresos cubren todos tus compromisos del período.'
                    : `Faltan ${formatCurrency(Math.abs(summary.disposableIncome))} para cubrir todo. Revisa tus gastos.`}
                </p>
              </div>
            </div>

            {/* Individual Warnings */}
            {summary.warnings.map((w: string, i: number) => (
              <div key={i} className="flex gap-3 p-4 bg-app-surface border border-app-border rounded-2xl items-start shadow-sm">
                <span className="material-symbols-outlined text-amber-500 mt-0.5">priority_high</span>
                <p className="text-sm text-app-text">{w}</p>
              </div>
            ))}

            {summary.warnings.length === 0 && (
              <div className="p-6 text-center bg-app-surface border border-app-border border-dashed rounded-2xl">
                <p className="text-sm text-app-muted">No hay alertas críticas para este período.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialAnalysis;