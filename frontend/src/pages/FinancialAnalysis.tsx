import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

    if (points.length > 0 && points[points.length - 1].fullDate < endDate) {
      points.push({
        fecha: formatDateUTC(endDate, { style: 'short' }),
        Saldo: currentBalance,
        fullDate: endDate
      });
    }

    return points;
  }, [summary]);

  // Upcoming payments grouped
  const upcomingPayments = useMemo(() => {
    if (!summary) return { expenses: [], msi: [], income: [], msiEnding: [] };

    const expenses = summary.expectedExpenses.slice(0, 5);
    const msi = summary.msiPaymentsDue.filter((m: any) => !m.isLastInstallment).slice(0, 5);
    const msiEnding = summary.msiPaymentsDue.filter((m: any) => m.isLastInstallment);
    const income = summary.expectedIncome.slice(0, 3);

    return { expenses, msi, income, msiEnding };
  }, [summary]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);

  const formatAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-3 text-xs">
          <p className="text-app-muted font-medium mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-app-primary rounded-full"></span>
            <span className="font-bold text-app-text tabular-nums text-sm">
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const periodLabels: Record<string, string> = {
    quincenal: '15 días',
    mensual: '1 mes',
    bimestral: '2 meses',
    semestral: '6 meses',
    anual: '1 año'
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-app-bg animate-pulse">
        <PageHeader title="Análisis Financiero" showBackButton />
        <div className="px-4 py-8 grid gap-4 max-w-4xl mx-auto">
          <div className="h-20 rounded-2xl bg-gray-200 dark:bg-zinc-800"></div>
          <div className="h-64 rounded-3xl bg-gray-200 dark:bg-zinc-800"></div>
          <div className="h-32 rounded-2xl bg-gray-200 dark:bg-zinc-800"></div>
        </div>
      </div>
    );
  }

  if (!summary) return <div className="text-center p-8 text-app-muted">No hay datos disponibles</div>;

  const totalExpenses = summary.expectedExpenses.reduce((sum: number, e: any) => sum + e.amount, 0) +
    summary.msiPaymentsDue.reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalIncome = summary.expectedIncome.reduce((sum: number, e: any) => sum + e.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
      <PageHeader title="Análisis Financiero" showBackButton />

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 pt-2 pb-8">

        {/* Period Selector */}
        <div className="flex flex-col items-center gap-2">
          <div className="bg-app-subtle p-1 rounded-xl flex gap-1 w-full max-w-md overflow-x-auto no-scrollbar">
            {(['quincenal', 'mensual', 'bimestral', 'semestral', 'anual'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${periodType === p
                  ? 'bg-app-surface text-app-text shadow-sm border border-app-border'
                  : 'text-app-muted hover:text-app-text'
                  }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-app-muted">
            {formatDateUTC(summary.periodStart, { style: 'short' })} → {formatDateUTC(summary.periodEnd, { style: 'short' })}
            <span className="ml-2 text-app-primary font-medium">({periodLabels[periodType]})</span>
          </p>
        </div>

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className="size-10 mx-auto mb-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">trending_up</span>
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase">Ingresos</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className="size-10 mx-auto mb-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-xl">trending_down</span>
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase">Gastos</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className={`size-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${savingsRate >= 0 ? 'bg-indigo-100 dark:bg-indigo-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
              <span className={`material-symbols-outlined text-xl ${savingsRate >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {savingsRate >= 20 ? 'savings' : savingsRate >= 0 ? 'account_balance' : 'warning'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase">Ahorro</p>
            <p className={`text-lg font-bold tabular-nums ${savingsRate >= 20 ? 'text-indigo-600 dark:text-indigo-400' : savingsRate >= 0 ? 'text-app-text' : 'text-amber-600'}`}>
              {savingsRate.toFixed(0)}%
            </p>
          </div>

          <div className={`rounded-2xl p-4 text-center border-2 ${summary.isSufficient
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'}`}>
            <div className={`size-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${summary.isSufficient ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-rose-200 dark:bg-rose-800'}`}>
              <span className={`material-symbols-outlined text-xl ${summary.isSufficient ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {summary.isSufficient ? 'check_circle' : 'error'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-app-muted uppercase">Resultado</p>
            <p className={`text-lg font-bold tabular-nums ${summary.isSufficient ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {formatCurrency(summary.disposableIncome)}
            </p>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 pt-5 pb-3 flex justify-between items-end border-b border-app-subtle">
            <div>
              <h3 className="font-bold text-base text-app-text">Proyección de Liquidez</h3>
              <p className="text-xs text-app-muted">Evolución estimada de tu saldo durante el período</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-app-muted uppercase">Saldo Final</p>
              <p className={`text-xl font-bold tabular-nums ${chartData.length > 0 && chartData[chartData.length - 1].Saldo >= 0 ? 'text-app-primary' : 'text-app-danger'}`}>
                {chartData.length > 0 ? formatCurrency(chartData[chartData.length - 1].Saldo) : '$0'}
              </p>
            </div>
          </div>

          <div className="h-72 w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldoProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" strokeOpacity={0.5} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="var(--brand-primary)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaldoProj)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MSI Ending Soon - Highlight */}
        {upcomingPayments.msiEnding.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">celebration</span>
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">MSI que terminan en este período</h4>
            </div>
            <div className="space-y-2">
              {upcomingPayments.msiEnding.map((msi: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/40 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
                    <div>
                      <p className="text-sm font-semibold text-app-text">{msi.description}</p>
                      <p className="text-[11px] text-app-muted">{formatDateUTC(msi.dueDate, { style: 'short' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(msi.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Payments */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Fixed Expenses */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                <span className="material-symbols-outlined text-rose-500 text-lg">receipt_long</span>
                Gastos Fijos
              </h4>
              <Link to="/recurring" className="text-xs text-app-primary font-medium hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {upcomingPayments.expenses.length === 0 ? (
                <p className="text-xs text-app-muted text-center py-4">Sin gastos programados</p>
              ) : (
                upcomingPayments.expenses.map((e: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-subtle transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-app-text truncate">{e.description}</p>
                      <p className="text-[10px] text-app-muted">{formatDateUTC(e.dueDate, { style: 'short' })}</p>
                    </div>
                    <span className="text-sm font-bold text-app-text tabular-nums ml-2">-{formatCurrency(e.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MSI Payments */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-lg">credit_card</span>
                Pagos MSI
              </h4>
              <Link to="/installments" className="text-xs text-app-primary font-medium hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-2">
              {upcomingPayments.msi.length === 0 ? (
                <p className="text-xs text-app-muted text-center py-4">Sin MSI activos</p>
              ) : (
                upcomingPayments.msi.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-subtle transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-app-text truncate">{m.description}</p>
                      <p className="text-[10px] text-app-muted">
                        {m.accountName} • {formatDateUTC(m.dueDate, { style: 'short' })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums ml-2">
                      -{formatCurrency(m.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div>
          <h4 className="text-xs font-bold text-app-muted uppercase mb-3 ml-1 tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">notifications</span>
            Estado y Alertas
          </h4>
          <div className="space-y-3">
            {/* Main Status */}
            <div className={`p-4 rounded-2xl border flex gap-3 items-start ${summary.isSufficient
              ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900'
              : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900'}`}>
              <div className={`mt-0.5 p-1.5 rounded-full ${summary.isSufficient ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200'}`}>
                <span className="material-symbols-outlined text-sm block">
                  {summary.isSufficient ? 'check' : 'close'}
                </span>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${summary.isSufficient ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                  {summary.isSufficient ? 'Liquidez Saludable' : 'Déficit Proyectado'}
                </p>
                <p className="text-xs opacity-80 leading-relaxed mt-1">
                  {summary.isSufficient
                    ? `Tus ingresos cubren todos tus compromisos. Tendrás ${formatCurrency(summary.disposableIncome)} disponible.`
                    : `Faltan ${formatCurrency(Math.abs(summary.disposableIncome))} para cubrir todo. Revisa tus gastos.`}
                </p>
              </div>
            </div>

            {/* Individual Warnings */}
            {summary.warnings.map((w: string, i: number) => (
              <div key={i} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl items-start">
                <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                <p className="text-sm text-amber-800 dark:text-amber-200">{w}</p>
              </div>
            ))}

            {summary.warnings.length === 0 && (
              <div className="p-6 text-center bg-app-surface border border-app-border border-dashed rounded-2xl">
                <span className="material-symbols-outlined text-3xl text-app-muted opacity-30 mb-2">verified</span>
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