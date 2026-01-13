import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateUTC } from '../utils/dateUtils';
import { InfoTooltip } from '../components/InfoTooltip';
import { SkeletonFinancialAnalysis } from '../components/Skeleton';

const FinancialAnalysis: React.FC = () => {
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'bimestral' | 'semestral' | 'anual'>('mensual');
  // Use 'projection' mode for analysis - shows future projections from today
  const { data: summary, isLoading } = useFinancialPeriodSummary(periodType, 'projection');

  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerNode) return;
    const update = () => {
      if (containerNode) {
        const { offsetWidth, offsetHeight } = containerNode;
        // Only update if dimensions effectively changed to avoid measuring loops? 
        // React state update bail-out handles strict equality, but objects are new.
        // We will trust React.
        if (offsetWidth > 0 && offsetHeight > 0) {
          setDims(d => (d.width === offsetWidth && d.height === offsetHeight ? d : { width: offsetWidth, height: offsetHeight }));
        }
      }
    };

    // Initial + Delay for layout to settle
    update();
    const t = setTimeout(update, 100);

    const obs = new ResizeObserver(update);
    obs.observe(containerNode);

    return () => {
      obs.disconnect();
      clearTimeout(t);
    };
  }, [containerNode]);

  const chartData = useMemo(() => {
    // ... (rest of memo, omitted for brevity, logic remains same)
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
    points.push({ fecha: formatDateUTC(startDate, { style: 'short' }), Saldo: currentBalance, fullDate: startDate });
    events.forEach(event => { currentBalance += event.amount; points.push({ fecha: formatDateUTC(event.date, { style: 'short' }), Saldo: currentBalance, fullDate: event.date }); });
    if (points.length > 0 && points[points.length - 1].fullDate < endDate) { points.push({ fecha: formatDateUTC(endDate, { style: 'short' }), Saldo: currentBalance, fullDate: endDate }); }
    return points;
  }, [summary]);

  // State for expanded sections
  const [expandedExpenses, setExpandedExpenses] = useState(false);
  const [expandedMsi, setExpandedMsi] = useState(false);

  // Upcoming payments grouped
  const upcomingPayments = useMemo(() => {
    if (!summary) return { expenses: [], msi: [], income: [], msiEnding: [], recurringEnding: [], totalExpenses: 0, totalMsi: 0, hasMoreExpenses: false, hasMoreMsi: false };

    // --- Grouping Logic for Recurring Expenses ---
    const expensesGroupedMap = new Map<string, any>();
    summary.expectedExpenses.forEach((exp: any) => {
      const key = exp.id; // Recurring transaction ID
      if (!expensesGroupedMap.has(key)) {
        expensesGroupedMap.set(key, { ...exp, count: 1, totalAmount: exp.amount });
      } else {
        const existing = expensesGroupedMap.get(key);
        existing.count += 1;
        existing.totalAmount += exp.amount;
        if (new Date(exp.dueDate) < new Date(existing.dueDate)) existing.dueDate = exp.dueDate;
      }
    });
    const allGroupedExpenses = Array.from(expensesGroupedMap.values()).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // --- Grouping Logic for MSI ---
    const msiGroupedMap = new Map<string, any>();
    const allMsiRaw = summary.msiPaymentsDue.filter((m: any) => !m.isLastInstallment);

    allMsiRaw.forEach((msi: any) => {
      const key = msi.originalId || msi.id; // Purchase identifier
      if (!msiGroupedMap.has(key)) {
        msiGroupedMap.set(key, {
          ...msi,
          count: 1,
          totalAmount: msi.amount,
          minInstallment: msi.installmentNumber,
          maxInstallment: msi.installmentNumber
        });
      } else {
        const existing = msiGroupedMap.get(key);
        existing.count += 1;
        existing.totalAmount += msi.amount;
        existing.minInstallment = Math.min(existing.minInstallment || msi.installmentNumber, msi.installmentNumber);
        existing.maxInstallment = Math.max(existing.maxInstallment || msi.installmentNumber, msi.installmentNumber);
        if (new Date(msi.dueDate) < new Date(existing.dueDate)) existing.dueDate = msi.dueDate;
      }
    });
    const allGroupedMsi = Array.from(msiGroupedMap.values()).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const COLLAPSED_LIMIT = 5;
    const EXPANDED_LIMIT = 15;

    const expenses = expandedExpenses ? allGroupedExpenses.slice(0, EXPANDED_LIMIT) : allGroupedExpenses.slice(0, COLLAPSED_LIMIT);
    const msi = expandedMsi ? allGroupedMsi.slice(0, EXPANDED_LIMIT) : allGroupedMsi.slice(0, COLLAPSED_LIMIT);

    const msiEnding = summary.msiPaymentsDue.filter((m: any) => m.isLastInstallment);

    const periodEnd = new Date(summary.periodEnd);
    const recurringWithEndDate = summary.expectedExpenses.filter((e: any) => {
      if (!e.hasEndDate || !e.endDate) return false;
      const endDate = new Date(e.endDate);
      return endDate <= periodEnd;
    });

    const recurringById = new Map<string, any>();
    for (const expense of recurringWithEndDate) {
      const existingEntry = recurringById.get(expense.id);
      if (!existingEntry || new Date(expense.dueDate) > new Date(existingEntry.dueDate)) {
        recurringById.set(expense.id, expense);
      }
    }
    const recurringEnding = Array.from(recurringById.values());

    return {
      expenses,
      msi,
      income: summary.expectedIncome.slice(0, 3),
      msiEnding,
      recurringEnding,
      totalExpensesRaw: summary.expectedExpenses.length,
      totalMsiRaw: allMsiRaw.length,
      countExpensesGrouped: allGroupedExpenses.length,
      countMsiGrouped: allGroupedMsi.length,
      hasMoreExpenses: allGroupedExpenses.length > EXPANDED_LIMIT,
      hasMoreMsi: allGroupedMsi.length > EXPANDED_LIMIT
    };
  }, [summary, expandedExpenses, expandedMsi]);

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
    semanal: 'Próximos 7 días',
    quincenal: 'Próximos 15 días',
    mensual: 'Próximo mes',
    bimestral: 'Próximos 2 meses',
    semestral: 'Próximos 6 meses',
    anual: 'Próximo año'
  };

  if (isLoading) return <SkeletonFinancialAnalysis />;

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-app-text">Proyección Financiera</h3>
            <p className="text-xs text-app-muted">
              {formatDateUTC(summary.displayStart || summary.periodStart, { style: 'short' })} → {formatDateUTC(summary.displayEnd || summary.periodEnd, { style: 'short' })}
            </p>
          </div>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as typeof periodType)}
            className="appearance-none bg-app-subtle text-app-text text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer outline-none focus:ring-2 focus:ring-app-primary/20 focus:border-app-primary border border-transparent hover:border-app-border transition-colors"
          >
            <option value="quincenal">Quincena</option>
            <option value="mensual">Mes</option>
            <option value="bimestral">Bimestre</option>
            <option value="semestral">Semestre</option>
            <option value="anual">Año</option>
          </select>
        </div>

        {/* Hero Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className="size-10 mx-auto mb-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl">trending_up</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-[10px] font-bold text-app-muted uppercase">Ingresos Esperados</p>
              <InfoTooltip content="Ingresos recurrentes proyectados para el período seleccionado" iconSize="12px" />
            </div>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalIncome)}</p>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className="size-10 mx-auto mb-2 rounded-xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-xl">trending_down</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-[10px] font-bold text-app-muted uppercase">Egresos Proyectados</p>
              <InfoTooltip content="Compromisos + Pagos TDC proyectados para el período" iconSize="12px" />
            </div>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">{formatCurrency(totalExpenses)}</p>
          </div>

          <div className="bg-app-surface border border-app-border rounded-2xl p-4 text-center">
            <div className={`size-10 mx-auto mb-2 rounded-xl flex items-center justify-center ${savingsRate >= 0 ? 'bg-indigo-100 dark:bg-indigo-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
              <span className={`material-symbols-outlined text-xl ${savingsRate >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {savingsRate >= 20 ? 'savings' : savingsRate >= 0 ? 'account_balance' : 'warning'}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-[10px] font-bold text-app-muted uppercase">Tasa Ahorro</p>
              <InfoTooltip content="Porcentaje de ingresos que te queda después de egresos: (Ingresos - Egresos) / Ingresos" iconSize="12px" />
            </div>
            <p className={`text-base font-bold tabular-nums ${savingsRate >= 20 ? 'text-indigo-600 dark:text-indigo-400' : savingsRate >= 0 ? 'text-app-text' : 'text-amber-600'}`}>
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
            <div className="flex items-center justify-center gap-1">
              <p className="text-[10px] font-bold text-app-muted uppercase">Saldo Final</p>
              <InfoTooltip content="Proyección de tu balance al final del período después de todos los movimientos" iconSize="12px" />
            </div>
            <p className={`text-base font-bold tabular-nums ${summary.isSufficient ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
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

          <div ref={setContainerNode} className="h-72 w-full p-2 relative">
            {dims.width > 0 && dims.height > 0 && (
              <AreaChart width={dims.width} height={dims.height} data={chartData} margin={{ top: 10, right: 30, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSaldoProj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.3} />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6b7280', strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="Saldo"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSaldoProj)"
                  animationDuration={800}
                />
              </AreaChart>
            )}
            {!dims.width && <div className="w-full h-full flex items-center justify-center text-app-muted">Cargando gráfico...</div>}
          </div>
        </div>

        {/* Commitments Ending Soon - Highlight Section */}
        {(upcomingPayments.msiEnding.length > 0 || upcomingPayments.recurringEnding.length > 0) && (
          <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">celebration</span>
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Compromisos que terminan en este período</h4>
            </div>
            <div className="space-y-2">
              {/* MSI Ending */}
              {upcomingPayments.msiEnding.map((msi: any, i: number) => (
                <div key={`msi-${i}`} className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/40 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-indigo-500 dark:text-indigo-400 text-base">credit_card</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-app-text">{msi.purchaseName || msi.description}</p>
                      <p className="text-[11px] text-app-muted">MSI • Última cuota • {formatDateUTC(msi.dueDate, { style: 'short' })}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(msi.amount)}
                  </span>
                </div>
              ))}
              {/* Recurring Ending */}
              {upcomingPayments.recurringEnding.map((rec: any, i: number) => (
                <div key={`rec-${i}`} className="flex items-center justify-between bg-white/60 dark:bg-zinc-900/40 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${rec.category?.color || '#64748b'}20` }}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={{ color: rec.category?.color || '#64748b' }}
                      >
                        {rec.category?.icon || 'event_repeat'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-app-text">{rec.description}</p>
                      <p className="text-[11px] text-app-muted">
                        Termina: {formatDateUTC(rec.endDate, { style: 'short' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(rec.amount)}
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
                Compromisos Pendientes
                {upcomingPayments.countExpensesGrouped > 0 && (
                  <span className="text-[10px] text-app-muted font-normal">({upcomingPayments.countExpensesGrouped})</span>
                )}
              </h4>
              {upcomingPayments.countExpensesGrouped > 5 && (
                <button
                  onClick={() => setExpandedExpenses(!expandedExpenses)}
                  className="text-xs text-app-primary font-medium hover:underline flex items-center gap-1"
                >
                  {expandedExpenses ? 'Mostrar menos' : 'Ver todos'}
                  <span className={`material-symbols-outlined text-sm transition-transform ${expandedExpenses ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              )}
            </div>
            <div className={`space-y-2 ${expandedExpenses ? 'max-h-80 overflow-y-auto pr-1' : ''}`}>
              {upcomingPayments.expenses.length === 0 ? (
                <p className="text-xs text-app-muted text-center py-4">Sin gastos programados</p>
              ) : (
                <>
                  {upcomingPayments.expenses.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-subtle transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-app-text truncate">{e.description}</p>
                          {e.count > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-app-subtle text-app-primary rounded-lg font-bold">x{e.count}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-app-muted">
                          {e.count > 1
                            ? `${e.count} pagos de ${formatCurrency(e.amount)} • Próximo: `
                            : ''}
                          {formatDateUTC(e.dueDate, { style: 'short' })}
                          {e.hasEndDate && ' • Temporal'}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-app-text tabular-nums ml-2">-{formatCurrency(e.totalAmount)}</span>
                    </div>
                  ))}
                  {/* Show link to full page if there are more items */}
                  {expandedExpenses && upcomingPayments.hasMoreExpenses && (
                    <Link
                      to="/recurring"
                      className="flex items-center justify-center gap-1 p-2 text-xs text-app-primary font-medium hover:bg-app-subtle rounded-lg transition-colors"
                    >
                      <span>Ver los {upcomingPayments.countExpensesGrouped} registros</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* MSI Payments */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-app-text flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-lg">credit_card</span>
                Pagos MSI
                {upcomingPayments.countMsiGrouped > 0 && (
                  <span className="text-[10px] text-app-muted font-normal">({upcomingPayments.countMsiGrouped})</span>
                )}
              </h4>
              {upcomingPayments.countMsiGrouped > 5 && (
                <button
                  onClick={() => setExpandedMsi(!expandedMsi)}
                  className="text-xs text-app-primary font-medium hover:underline flex items-center gap-1"
                >
                  {expandedMsi ? 'Mostrar menos' : 'Ver todos'}
                  <span className={`material-symbols-outlined text-sm transition-transform ${expandedMsi ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              )}
            </div>
            <div className={`space-y-2 ${expandedMsi ? 'max-h-80 overflow-y-auto pr-1' : ''}`}>
              {upcomingPayments.msi.length === 0 ? (
                <p className="text-xs text-app-muted text-center py-4">Sin MSI activos</p>
              ) : (
                <>
                  {upcomingPayments.msi.map((m: any, i: number) => {
                    const range = m.minInstallment === m.maxInstallment
                      ? `Cuota ${m.minInstallment}`
                      : `Cuotas ${m.minInstallment}-${m.maxInstallment}`;

                    return (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-app-subtle transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-app-text truncate">
                            {m.purchaseName || m.description?.replace(/^Cuota \d+\/\d+ - /, '')}
                          </p>
                          <p className="text-[10px] text-app-muted">
                            {m.accountName} • {m.count > 1 ? `${m.count} pagos de ${formatCurrency(m.amount)} • ` : ''}{range} de {m.totalInstallments}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums ml-2">
                          -{formatCurrency(m.totalAmount)}
                        </span>
                      </div>
                    )
                  })}
                  {/* Show link to full page if there are more items */}
                  {expandedMsi && upcomingPayments.hasMoreMsi && (
                    <Link
                      to="/installments"
                      className="flex items-center justify-center gap-1 p-2 text-xs text-app-primary font-medium hover:bg-app-subtle rounded-lg transition-colors"
                    >
                      <span>Ver los {upcomingPayments.countMsiGrouped} consumos MSI</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Alerts & Warnings */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-app-muted uppercase ml-1 tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">notifications_active</span>
            Estado y Alertas de Salud
          </h4>

          <div className="space-y-3">
            {/* Main Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden p-5 rounded-3xl border-2 transition-all duration-500 ${summary.isSufficient
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 shadow-[0_8px_30px_rgb(16,185,129,0.1)]'
                  : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 shadow-[0_8px_30px_rgb(244,63,94,0.1)]'
                }`}
            >
              {/* Decorative accent background */}
              <div className={`absolute -right-10 -top-10 size-40 blur-3xl rounded-full opacity-20 ${summary.isSufficient ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />

              <div className="relative flex gap-4 items-center">
                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${summary.isSufficient
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'bg-rose-500 text-white shadow-rose-500/20'
                  }`}>
                  <span className="material-symbols-outlined text-3xl">
                    {summary.isSufficient ? 'verified' : 'error'}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className={`text-lg font-black tracking-tight ${summary.isSufficient ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'
                    }`}>
                    {summary.isSufficient ? 'LIQUIDEZ SALUDABLE' : 'DÉFICIT PROYECTADO'}
                  </h3>
                  <p className="text-sm opacity-90 font-medium leading-relaxed mt-1">
                    {summary.isSufficient
                      ? `Tus ingresos cubren todos tus compromisos. Tendrás `
                      : `Faltan `}
                    <span className="font-bold underline decoration-2 underline-offset-2">
                      {formatCurrency(Math.abs(summary.disposableIncome))}
                    </span>
                    {summary.isSufficient ? ' disponible.' : ' para cubrir todo. Revisa tus gastos.'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Individual Warnings */}
            <AnimatePresence>
              {summary.warnings.map((w: string, i: number) => (
                <motion.div
                  key={`warning-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="group relative flex gap-3 p-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-app-border rounded-2xl items-center hover:border-amber-500/50 transition-colors shadow-sm"
                >
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" />
                  <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">priority_high</span>
                  </div>
                  <p className="text-sm text-app-text font-medium">{w}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {summary.warnings.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center bg-app-surface/40 backdrop-blur-sm border border-app-border border-dashed rounded-3xl"
              >
                <div className="size-16 mx-auto mb-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
                </div>
                <h5 className="text-app-text font-bold">Sin alertas críticas</h5>
                <p className="text-xs text-app-muted mt-1 px-10">Tu planificación financiera está en orden para este período.</p>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinancialAnalysis;