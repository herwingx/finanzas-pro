import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const FinancialAnalysis: React.FC = () => {
  const navigate = useNavigate();
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
      date: startDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      balance: currentBalance,
      fullDate: startDate,
    });

    // Iterate days or events? Events approach is better for sparklines, but daily is better for consistency.
    // Let's iterate events and push points.

    events.forEach(event => {
      currentBalance += event.amount;
      points.push({
        date: event.date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        balance: currentBalance,
        fullDate: event.date
      });
    });

    // Add final point if last event is before end date
    if (points[points.length - 1].fullDate < endDate) {
      points.push({
        date: endDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        balance: currentBalance,
        fullDate: endDate
      });
    }

    return points;

  }, [summary]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  if (isLoading) return <div className="p-8 text-center">Cargando análisis...</div>;
  if (!summary) return <div className="p-8 text-center">No hay datos disponibles</div>;

  const netWorth = summary.netWorth ?? (summary.currentBalance - (summary.currentDebt || 0) - (summary.currentMSIDebt || 0));

  return (
    <div className="p-4 space-y-6 pb-24 bg-app-bg text-app-text">
      {/* Consistent App Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-hover transition-colors">
          <span className="material-symbols-outlined text-app-text">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-app-text">Proyección Financiera</h1>
      </div>

      {/* Period Selector */}
      <div className="bg-app-elevated p-1 rounded-xl flex border border-app-border">
        {(['quincenal', 'mensual'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriodType(p)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${periodType === p
              ? 'bg-app-card text-app-primary shadow-sm ring-1 ring-app-border'
              : 'text-app-muted hover:text-app-text'
              }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Projection Chart */}
      <div className="bg-app-card p-4 rounded-2xl shadow-sm border border-app-border">
        {/* ... Chart Content ... */}
        <h3 className="text-xs font-bold text-app-muted mb-4 uppercase tracking-wider">Flujo de Caja Proyectado</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={10} textAnchor="middle" className="text-[10px] fill-app-muted font-medium">
                      {payload.value}
                    </text>
                  </g>
                )}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                itemStyle={{ color: 'var(--color-text)' }}
                formatter={(value: number) => [formatCurrency(value), 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Stats Footer */}
        <div className="mt-4 flex justify-between items-end border-t border-app-border pt-3">
          <div>
            <p className="text-xs text-app-muted">Balance Inicial</p>
            <p className="font-bold text-app-text">{formatCurrency(summary.currentBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-app-muted">Proyección Final</p>
            <p className={`text-xl font-bold ${summary.disposableIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.disposableIncome)}
            </p>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-2xl border ${summary.isSufficient ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <span className="material-symbols-outlined text-3xl mb-2" style={{ color: summary.isSufficient ? '#22c55e' : '#ef4444' }}>
            {summary.isSufficient ? 'check_circle' : 'warning'}
          </span>
          <p className="text-xs font-bold uppercase opacity-80 text-app-text">Estado</p>
          <p className={`font-bold ${summary.isSufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {summary.isSufficient ? 'Saludable' : 'Déficit'}
          </p>
        </div>

        <div className="p-4 rounded-2xl border bg-app-card border-app-border">
          <span className="material-symbols-outlined text-3xl mb-2 text-app-primary opacity-80">
            account_balance
          </span>
          <p className="text-xs font-bold uppercase opacity-60 text-app-muted">Patrimonio Neto</p>
          <p className="font-bold text-app-text">
            {formatCurrency(netWorth)}
          </p>
        </div>
      </div>

      {/* Insights Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-app-text">Consejos y Alertas</h3>
        {summary.warnings.length > 0 ? (
          summary.warnings.map((w: string, i: number) => (
            <div key={i} className="flex gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
              <span className="material-symbols-outlined text-amber-500 flex-shrink-0">priority_high</span>
              <p className="text-sm text-amber-700 dark:text-amber-200">{w}</p>
            </div>
          ))
        ) : (
          <div className="flex gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
            <span className="material-symbols-outlined text-blue-500 flex-shrink-0">thumb_up</span>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              ¡Todo se ve excelente! Sigue manteniendo tus gastos bajo control.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialAnalysis;
