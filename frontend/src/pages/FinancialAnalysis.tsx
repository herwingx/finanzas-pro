import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Hooks & Utils (Tus importaciones originales)
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { formatDateUTC } from '../utils/dateUtils';

// Components (Tus componentes existentes)
import { PageHeader } from '../components/PageHeader';
import { InfoTooltip } from '../components/InfoTooltip';
import { SkeletonFinancialAnalysis } from '../components/Skeleton';

/* ==================================================================================
   SUB-COMPONENTS (Locales para esta vista)
   ================================================================================== */

const CustomChartTooltip = ({ active, payload, label, formatCurrency }: any) => {
  if (active && payload && payload.length) {
    const { Saldo, income, expense } = payload[0].payload;
    const isPositive = Saldo >= 0;
    const hasChange = income > 0 || expense > 0;

    return (
      <div className="bg-app-surface/95 backdrop-blur-md border border-app-border rounded-xl shadow-lg p-3 min-w-[160px] z-50">
        <p className="text-[10px] text-app-muted uppercase font-bold tracking-wider mb-2">{label}</p>

        <div className="space-y-2">
          {hasChange && (
            <div className="border-b border-app-border pb-2 mb-2 space-y-1">
              {income > 0 && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-emerald-500 font-bold">Ingreso</span>
                  <span className="text-app-text font-numbers">+{formatCurrency(income)}</span>
                </div>
              )}
              {expense > 0 && (
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-rose-500 font-bold">Gasto</span>
                  <span className="text-app-text font-numbers">-{formatCurrency(expense)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${isPositive ? 'bg-app-primary' : 'bg-rose-500'}`} />
            <div>
              <p className="text-[10px] font-bold text-app-muted leading-none uppercase">Saldo Proyectado</p>
              <p className="font-bold text-app-text font-numbers text-sm leading-tight mt-1">
                {formatCurrency(Saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */

const FinancialAnalysis: React.FC = () => {
  // 1. STATE & HOOKS
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'bimestral' | 'semestral' | 'anual'>('mensual');
  const [expandedExpenses, setExpandedExpenses] = useState(false);
  const [expandedMsi, setExpandedMsi] = useState(false);

  // Load Data
  const { data: summary, isLoading } = useFinancialPeriodSummary(periodType, 'projection');

  // Chart Sizing (Manteniendo lógica robusta de resize)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    resizeObserver.observe(containerRef);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  /* ----------------------------------------------------------------------------------
     2. MEMOIZED LOGIC (Preservando tus cálculos originales)
     ---------------------------------------------------------------------------------- */

  const chartData = useMemo(() => {
    if (!summary) return [];

    // Consolidar tipos de eventos por fecha
    const dailyIncome = new Map<string, number>();
    const dailyExpense = new Map<string, number>();

    summary.expectedIncome.forEach((e: any) => {
      const key = new Date(e.dueDate).toISOString().split('T')[0];
      dailyIncome.set(key, (dailyIncome.get(key) || 0) + e.amount);
    });

    [...summary.expectedExpenses, ...summary.msiPaymentsDue].forEach((e: any) => {
      const key = new Date(e.dueDate).toISOString().split('T')[0];
      dailyExpense.set(key, (dailyExpense.get(key) || 0) + e.amount);
    });

    const allDates = Array.from(new Set([...dailyIncome.keys(), ...dailyExpense.keys()])).sort();

    const points = [];
    let currentBalance = summary.currentBalance;
    const startDate = new Date(summary.periodStart);
    const endDate = new Date(summary.periodEnd);
    const chartStyle = periodType === 'anual' ? 'chart' : 'short';

    // Punto Inicial
    points.push({
      fecha: formatDateUTC(startDate, { style: chartStyle }),
      Saldo: currentBalance,
      income: 0,
      expense: 0,
      fullDate: startDate
    });

    // Puntos de Eventos Consolidados
    allDates.forEach(dateKey => {
      const eventDate = new Date(dateKey + 'T00:00:00Z');
      if (eventDate >= startDate && eventDate <= endDate) {
        const inc = dailyIncome.get(dateKey) || 0;
        const exp = dailyExpense.get(dateKey) || 0;
        currentBalance += (inc - exp);

        points.push({
          fecha: formatDateUTC(eventDate, { style: chartStyle }),
          Saldo: currentBalance,
          income: inc,
          expense: exp,
          fullDate: eventDate
        });
      }
    });

    // Punto Final (si no hay eventos hasta el final)
    if (points.length > 0 && points[points.length - 1].fullDate < endDate) {
      points.push({
        fecha: formatDateUTC(endDate, { style: chartStyle }),
        Saldo: currentBalance,
        income: 0,
        expense: 0,
        fullDate: endDate
      });
    }

    return points;
  }, [summary, periodType]);

  const upcomingPayments = useMemo(() => {
    if (!summary) return { expenses: [], msi: [], msiEnding: [], recurringEnding: [], countExpensesGrouped: 0, countMsiGrouped: 0 };

    // Helper to group items by unique ID
    const groupBy = (items: any[], idFn: (x: any) => string, forceGroup = false) => {
      const map = new Map();
      items.forEach(i => {
        // Use uniqueId if available (from backend) to avoid duplicates, unless strictly grouping by logic (forceGroup)
        const key = (!forceGroup && i.uniqueId) ? i.uniqueId : idFn(i);
        const instNum = i.installmentNumber ?? i.currentInstallment;
        if (!map.has(key)) {
          map.set(key, {
            ...i,
            count: 1,
            totalAmount: i.amount,
            minInstallment: instNum,
            maxInstallment: instNum
          });
        } else {
          const ex = map.get(key);
          ex.count++;
          ex.totalAmount += i.amount;
          if (new Date(i.dueDate) < new Date(ex.dueDate)) ex.dueDate = i.dueDate;
          if (instNum !== undefined) {
            if (ex.minInstallment === undefined || instNum < ex.minInstallment) ex.minInstallment = instNum;
            if (ex.maxInstallment === undefined || instNum > ex.maxInstallment) ex.maxInstallment = instNum;
          }
        }
      });
      return Array.from(map.values()).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    // Force group by recurrence ID (for expenses) to totalize them over the period
    const allExpenses = groupBy(summary.expectedExpenses, x => x.recurringTransactionId || x.description, true);
    // Include regular credit card charges too, not just MSI
    const rawMsi = summary.msiPaymentsDue.filter((m: any) => !m.isLastInstallment);
    const allMsi = groupBy(rawMsi, x => x.originalId || x.id, false);

    return {
      expenses: expandedExpenses ? allExpenses : allExpenses.slice(0, 5),
      msi: expandedMsi ? allMsi : allMsi.slice(0, 5),
      countExpensesGrouped: allExpenses.length,
      countMsiGrouped: allMsi.length,
      msiEnding: summary.msiPaymentsDue.filter((m: any) => m.isLastInstallment),
      // Deduplicate recurringEnding: Keep only one entry per recurring series that is ending
      recurringEnding: (() => {
        const ending = summary.expectedExpenses.filter((e: any) => e.endDate && new Date(e.endDate) <= new Date(summary.periodEnd));
        const seen = new Set();
        return ending.filter((e: any) => {
          // Use recurringTransactionId if available, or fallback to description as a loose key
          const key = e.recurringTransactionId || e.description;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })()
    };
  }, [summary, expandedExpenses, expandedMsi]);


  // Formatos
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  const totalExpenses = summary ? summary.totalCommitments : 0;
  const totalIncome = summary ? summary.totalPeriodIncome : 0;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  if (isLoading) return <SkeletonFinancialAnalysis />;
  if (!summary) return <div className="p-10 text-center text-app-muted">Sin datos disponibles.</div>;

  const chartColor = summary.isSufficient ? 'var(--brand-primary)' : '#f43f5e';

  /* ----------------------------------------------------------------------------------
     3. RENDER
     ---------------------------------------------------------------------------------- */
  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-32 md:pb-24 animate-fade-in">
      <PageHeader title="Análisis Financiero" showBackButton />

      <div className="max-w-4xl mx-auto px-4 pt-2 space-y-6">

        {/* --- A. CONTROLS HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-app-text tracking-tight mb-0.5">Proyección de Flujo</h2>
            <p className="text-sm text-app-muted font-medium capitalize">
              {formatDateUTC(summary.periodStart, { style: 'short' })} — {formatDateUTC(summary.periodEnd, { style: 'short' })}
            </p>
          </div>

          <div className="relative inline-flex items-center bg-app-surface border border-app-border rounded-xl shadow-sm hover:border-app-primary/30 transition-colors group">
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as any)}
              className="appearance-none bg-transparent text-app-text text-sm md:text-xs font-bold pl-3 pr-8 h-10 rounded-xl outline-none cursor-pointer capitalize focus:ring-2 ring-app-primary/20 w-full md:w-auto"
            >
              <option value="quincenal" className="bg-app-surface text-app-text py-2">Quincenal</option>
              <option value="mensual" className="bg-app-surface text-app-text py-2">Mensual</option>
              <option value="bimestral" className="bg-app-surface text-app-text py-2">Bimestral</option>
              <option value="semestral" className="bg-app-surface text-app-text py-2">Semestral</option>
              <option value="anual" className="bg-app-surface text-app-text py-2">Anual</option>
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] md:text-[16px] text-app-muted group-hover:text-app-primary transition-colors">
              unfold_more
            </span>
          </div>
        </div>

        {/* --- B. CHART CARD --- */}
        <div className="bento-card bg-app-surface overflow-hidden shadow-sm h-[320px] md:h-[380px] flex flex-col p-0 border border-app-border/80">
          <div className="px-5 py-4 border-b border-app-subtle/60 flex justify-between items-start shrink-0">
            <div>
              <h3 className="text-sm font-bold text-app-text">Liquidez Proyectada</h3>
              <div className="flex items-center gap-2 mt-1">
                {summary.isSufficient
                  ? <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded-full">Suficiente</span>
                  : <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide bg-rose-500/10 px-2 py-0.5 rounded-full">Déficit</span>
                }
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-app-muted uppercase">Saldo Final</p>
              <p className={`text-2xl font-black font-numbers tracking-tight tabular-nums ${summary.isSufficient ? 'text-app-primary' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(summary.disposableIncome)}
              </p>
            </div>
          </div>

          <div className="flex-1 w-full relative outline-none" ref={setContainerRef}>
            <style>{`
              .recharts-wrapper, .recharts-surface, .recharts-cartesian-axis-tick text {
                outline: none !important;
                -webkit-tap-highlight-color: transparent;
                user-select: none;
              }
            `}</style>
            {dims.width > 0 && (
              <div className="absolute inset-0">
                <AreaChart
                  width={dims.width}
                  height={dims.height}
                  data={chartData}
                  margin={{ top: 10, right: 15, left: 15, bottom: 20 }}
                  style={{ outline: 'none' }}
                >
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="fecha"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                    minTickGap={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip
                    content={<CustomChartTooltip formatCurrency={formatCurrency} />}
                    cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Saldo"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#colorSaldo)"
                    fillOpacity={1}
                    animationDuration={1000}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      const hasActivity = payload && (payload.income > 0 || payload.expense > 0);
                      if (hasActivity && cx && cy) {
                        return (
                          <circle
                            key={`dot-${index}`}
                            cx={cx}
                            cy={cy}
                            r={3}
                            fill={chartColor}
                            stroke="white"
                            strokeWidth={1.5}
                            className="drop-shadow-sm"
                          />
                        );
                      }
                      return null;
                    }}
                    activeDot={{
                      r: 5,
                      stroke: 'white',
                      strokeWidth: 2,
                      fill: chartColor
                    }}
                  />
                </AreaChart>
              </div>
            )}
          </div>
        </div>

        {/* --- C. KPI CARDS --- */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <div className="bg-app-surface border border-app-border rounded-2xl p-3 md:p-4 text-center min-w-0">
            <div className="flex justify-center mb-1 text-emerald-500"><span className="material-symbols-outlined text-lg md:text-xl">arrow_upward</span></div>
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-app-muted truncate">Ingresos</p>
            <p className="text-xs md:text-base font-bold text-app-text font-numbers truncate">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-app-surface border border-app-border rounded-2xl p-3 md:p-4 text-center min-w-0">
            <div className="flex justify-center mb-1 text-rose-500"><span className="material-symbols-outlined text-lg md:text-xl">arrow_downward</span></div>
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-app-muted truncate">Egresos</p>
            <p className="text-xs md:text-base font-bold text-app-text font-numbers truncate">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-app-surface border border-app-border rounded-2xl p-3 md:p-4 text-center min-w-0">
            <div className={`flex justify-center mb-1 ${savingsRate >= 20 ? 'text-indigo-500' : 'text-amber-500'}`}><span className="material-symbols-outlined text-lg md:text-xl">savings</span></div>
            <div className="flex items-center justify-center gap-0.5 md:gap-1">
              <p className="text-[9px] md:text-[10px] uppercase font-bold text-app-muted truncate">Ahorro</p>
              <InfoTooltip content="(Ingresos - Egresos) / Ingresos" iconSize="10px" />
            </div>
            <p className="text-xs md:text-base font-bold text-app-text font-numbers">{savingsRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* --- D. ALERT HIGHLIGHT (Ending Commitments) --- */}
        {(upcomingPayments.msiEnding.length > 0 || upcomingPayments.recurringEnding.length > 0) && (
          <div className="relative overflow-hidden bg-linear-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20 p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="size-8 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
                <span className="material-symbols-outlined text-base">celebration</span>
              </div>
              <h3 className="font-bold text-app-text text-sm">Compromisos que finalizan</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative z-10">
              {[...upcomingPayments.msiEnding, ...upcomingPayments.recurringEnding].map((item: any, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-teal-600 text-lg">check_circle</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-app-text truncate">{item.purchaseName || item.description}</p>
                      <p className="text-[9px] uppercase font-bold text-teal-600/80">
                        {item.purchaseName ? 'MSI Terminado' : 'Gasto Finaliza'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-numbers opacity-80">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- E. LISTS BREAKDOWN --- */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Fixed Expenses List */}
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-rose-500 rounded-full" /> Gastos Fijos
              </h4>
              {upcomingPayments.countExpensesGrouped > 5 && (
                <button onClick={() => setExpandedExpenses(!expandedExpenses)} className="text-[10px] font-bold text-app-primary hover:underline">
                  {expandedExpenses ? 'Ver menos' : 'Ver todos'}
                </button>
              )}
            </div>
            <div className="bg-app-surface border border-app-border rounded-3xl divide-y divide-app-subtle overflow-hidden">
              {upcomingPayments.expenses.length === 0 && (
                <p className="p-6 text-center text-xs text-app-muted">Sin gastos fijos.</p>
              )}
              {upcomingPayments.expenses.map((e: any, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-app-subtle/50 transition-colors">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-app-text truncate">{e.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] bg-app-subtle px-1.5 py-0.5 rounded text-app-muted font-medium font-mono">
                        {formatDateUTC(e.dueDate, { day: 'numeric', month: 'short' })}
                      </span>
                      {e.count > 1 && <span className="text-[10px] text-app-primary font-bold">x{e.count}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold font-numbers">-{formatCurrency(e.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MSI & Credit Card List */}
          <div>
            <div className="flex justify-between items-center mb-2 px-1">
              <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-2">
                <span className="size-2 bg-indigo-500 rounded-full" /> Pagos de Tarjeta
              </h4>
              {upcomingPayments.countMsiGrouped > 5 && (
                <button onClick={() => setExpandedMsi(!expandedMsi)} className="text-[10px] font-bold text-app-primary hover:underline">
                  {expandedMsi ? 'Ver menos' : 'Ver todos'}
                </button>
              )}
            </div>
            <div className="bg-app-surface border border-app-border rounded-3xl divide-y divide-app-subtle overflow-hidden">
              {upcomingPayments.msi.length === 0 && (
                <p className="p-6 text-center text-xs text-app-muted">Sin pagos programados.</p>
              )}
              {upcomingPayments.msi.map((e: any, i) => {
                // Safe description handling & cleaning of card names in parens e.g. "Description (CardName)" -> "Description"
                const rawDesc = e.purchaseName || (e.description ? e.description.replace(/^Cuota \d+\/\d+ - /, '') : 'Pago de Tarjeta');
                // Remove content in parenthesis if it looks like a card name (at end of string usually)
                const desc = rawDesc.replace(/\s*\([^)]+\)$/, '').trim();

                // Determine if it is MSI or regular charge
                const isMsi = e.totalInstallments && e.totalInstallments > 1;

                const label = isMsi
                  ? (e.minInstallment !== undefined && e.maxInstallment !== undefined)
                    ? (e.minInstallment === e.maxInstallment ? `Cuota ${e.minInstallment}` : `${e.minInstallment}-${e.maxInstallment}`)
                    : 'Cuota'
                  : 'Cargo Regular';

                return (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-app-subtle/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-app-text truncate">{desc}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] bg-app-subtle px-1.5 py-0.5 rounded text-app-muted font-medium font-mono">
                          {formatDateUTC(e.dueDate, { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold`}>
                          {isMsi ? `${label} de ${e.totalInstallments}` : label}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-numbers text-indigo-600 dark:text-indigo-400">-{formatCurrency(e.totalAmount)}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* --- F. ALERTS --- */}
        <AnimatePresence>
          {summary.warnings.length > 0 && (
            <div className="mt-8 pt-4 border-t border-app-border border-dashed">
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3">Atención Requerida</h4>
              <div className="grid gap-2">
                {summary.warnings.map((w: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 p-3 rounded-xl flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-rose-600 text-lg">priority_high</span>
                    <p className="text-xs font-medium text-rose-900 dark:text-rose-100">{w}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default FinancialAnalysis;