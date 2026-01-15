import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip } from 'recharts'; // ResponsiveContainer puede fallar dentro de flex en mobile, a veces es mejor usar divs fijos relativos

// Hooks & Context
import { useProfile } from '../hooks/useApi';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';

// Components
import { SkeletonReports } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';
import { InfoTooltip } from '../components/InfoTooltip';

/* ==================================================================================
   SUB-COMPONENT: TOOLTIP
   ================================================================================== */
const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-app-surface/90 backdrop-blur-md border border-app-border rounded-xl shadow-lg p-3 min-w-[120px] animate-fade-in z-50">
                <div className="flex items-center gap-2 mb-1">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                    <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider">{data.name}</span>
                </div>
                <p className="text-sm font-bold text-app-text font-numbers">{formatter(data.value)}</p>
            </div>
        );
    }
    return null;
};

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const Reports: React.FC = () => {
    const { data: summary, isLoading } = useFinancialPeriodSummary('mensual', 'calendar');
    const { data: profile } = useProfile();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: profile?.currency || 'MXN',
            maximumFractionDigits: 0
        }).format(val);
    };

    if (isLoading) return <SkeletonReports />;
    if (!summary) return <div className="p-10 text-center text-app-muted">Sin datos suficientes para generar reporte.</div>;

    /* --- CALCULATIONS --- */
    const {
        totalPeriodIncome = 0,
        totalCommitments = 0,
        currentBalance = 0,
        disposableIncome = 0,
        budgetAnalysis
    } = summary;
    const totalReceivedIncome = summary.totalReceivedIncome ?? 0;

    const totalAllocated = budgetAnalysis ?
        (budgetAnalysis.needs.projected + budgetAnalysis.wants.projected + budgetAnalysis.savings.projected) : 0;

    // El sobrante se considera "ahorro potencial" visualmente
    const surplus = Math.max(0, totalPeriodIncome - totalAllocated);
    const totalSavingsVis = (budgetAnalysis?.savings.projected || 0) + surplus;

    const chartData = budgetAnalysis ? [
        { name: 'Necesidades', value: budgetAnalysis.needs.projected, color: '#F43F5E', ideal: 50, icon: 'home_work', bg: 'bg-rose-500/10 text-rose-500' },
        { name: 'Deseos', value: budgetAnalysis.wants.projected, color: '#A855F7', ideal: 30, icon: 'confirmation_number', bg: 'bg-purple-500/10 text-purple-500' },
        { name: 'Ahorro', value: totalSavingsVis, color: '#10B981', ideal: 20, icon: 'savings', bg: 'bg-emerald-500/10 text-emerald-500' },
    ].filter(i => i.value > 0) : [];

    const hasData = chartData.length > 0;
    const budgetBase = totalPeriodIncome > 0 ? totalPeriodIncome : totalCommitments;

    // KPI Percentages
    const savingPct = budgetBase > 0 ? (totalSavingsWithSurplus(budgetAnalysis, surplus) / budgetBase) * 100 : 0;

    function totalSavingsWithSurplus(ba: any, s: number) { return (ba?.savings.projected || 0) + s; }

    /* --- FEEDBACK MESSAGE LOGIC --- */
    const getFeedback = () => {
        if (!hasData) return null;
        if (savingPct >= 20) return {
            text: "¡Excelente! Estás cumpliendo la meta de ahorro.",
            style: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        };
        if (savingPct > 0) return {
            text: `Ahorro al ${savingPct.toFixed(0)}%. Intenta reducir gastos hormiga.`,
            style: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        };
        return {
            text: "Presupuesto ajustado. Revisa tus gastos fijos.",
            style: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300"
        };
    };
    const feedback = getFeedback();


    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Reporte Mensual" showBackButton />

            <div className="max-w-4xl mx-auto px-4 pt-2 space-y-6 animate-fade-in pb-12">

                {/* 1. HERO KPI GRID (Bento Style) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

                    {/* Main Balance Card - Spans 2 cols on mobile */}
                    <div className="col-span-2 md:col-span-2 bento-card p-5 bg-linear-to-br from-app-surface to-app-subtle dark:to-zinc-900 flex flex-col justify-between h-[140px]">
                        <div>
                            <div className="flex items-center gap-2 opacity-70 mb-1">
                                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Disponible Real</span>
                            </div>
                            <p className={`text-4xl font-black font-numbers tracking-tight ${disposableIncome < 0 ? 'text-rose-500' : 'text-app-text'}`}>
                                {formatCurrency(disposableIncome)}
                            </p>
                        </div>
                        <div className="flex gap-4 pt-2 mt-2 border-t border-app-border/40 text-[11px] font-medium text-app-muted">
                            <span>Saldo actual: <strong>{formatCurrency(currentBalance)}</strong></span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bento-card p-4 flex flex-col justify-center gap-1 text-center bg-emerald-500/5 border-emerald-500/10">
                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Ingresos</span>
                        <span className="text-xl font-bold text-app-text font-numbers">{formatCurrency(totalPeriodIncome)}</span>
                        {totalReceivedIncome > 0 && <span className="text-[9px] text-emerald-600/70">{((totalReceivedIncome / totalPeriodIncome) * 100).toFixed(0)}% recibido</span>}
                    </div>

                    <div className="bento-card p-4 flex flex-col justify-center gap-1 text-center bg-rose-500/5 border-rose-500/10">
                        <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Compromisos</span>
                        <span className="text-xl font-bold text-app-text font-numbers">{formatCurrency(totalCommitments)}</span>
                        <span className="text-[9px] text-rose-600/70">Fijos + Var. Estimado</span>
                    </div>
                </div>

                {/* 2. 50/30/20 CHART & LIST */}
                <div className="bento-card bg-app-surface p-0 overflow-hidden">

                    {/* Header */}
                    <div className="p-5 border-b border-app-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-app-subtle flex items-center justify-center">
                                <span className="material-symbols-outlined text-xl">pie_chart</span>
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-app-text">Distribución 50/30/20</h2>
                                <p className="text-[10px] text-app-muted">Basado en tus ingresos netos</p>
                            </div>
                        </div>
                        {feedback && (
                            <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${feedback.style}`}>
                                {feedback.text}
                            </div>
                        )}
                    </div>

                    {hasData ? (
                        <div className="flex flex-col md:flex-row items-center p-6 gap-8">

                            {/* Donut Chart */}
                            <div className="relative shrink-0 size-[180px]">
                                <PieChart width={180} height={180}>
                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        cornerRadius={6}
                                        stroke="none"
                                    >
                                        {chartData.map((e, i) => (
                                            <Cell key={i} fill={e.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                                </PieChart>
                                {/* Center Total Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] text-app-muted uppercase font-bold">Total</span>
                                    <span className="text-xs font-black font-numbers">{formatCurrency(totalAllocated)}</span>
                                </div>
                            </div>

                            {/* Breakdown List */}
                            <div className="w-full flex-1 space-y-4">
                                {chartData.map((item, i) => {
                                    const pct = budgetBase > 0 ? (item.value / budgetBase) * 100 : 0;
                                    const targetMoney = budgetBase * (item.ideal / 100);

                                    return (
                                        <div key={item.name} className="flex flex-col gap-1.5 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="flex justify-between items-center text-xs">
                                                <div className="flex items-center gap-2 font-bold text-app-text">
                                                    <div className={`size-6 rounded flex items-center justify-center ${item.bg}`}>
                                                        <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                                                    </div>
                                                    {item.name} <span className="text-[10px] font-medium text-app-muted opacity-80 ml-1">({item.ideal}%)</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black font-numbers text-app-text">{formatCurrency(item.value)}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2 w-full bg-app-subtle rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full transition-all duration-700 rounded-full"
                                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }}
                                                />
                                                {/* Marker for Ideal Limit (Optional advanced viz) */}
                                                <div className="h-full w-0.5 bg-black/10 dark:bg-white/10 relative z-10" style={{ left: `${item.ideal}%`, position: 'absolute' }} />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="text-app-muted">
                                                    Actualmente <strong>{pct.toFixed(1)}%</strong>
                                                </span>
                                                <span className="text-app-muted">
                                                    Meta: {formatCurrency(targetMoney)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-app-muted">
                            <span className="material-symbols-outlined text-4xl opacity-30 mb-2">data_exploration</span>
                            <p className="text-sm font-medium">Sin gastos para analizar.</p>
                        </div>
                    )}

                </div>

                {/* 3. ALERTS SECTION */}
                {summary.warnings && summary.warnings.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h3 className="px-1 text-xs font-bold text-app-muted uppercase tracking-wider">Avisos Importantes</h3>
                        {summary.warnings.map((w: string, i: number) => (
                            <div key={i} className="bento-card p-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30">
                                <span className="material-symbols-outlined text-amber-500 mt-0.5 shrink-0">warning</span>
                                <p className="text-sm text-amber-900 dark:text-amber-100">{w}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Educational Footer */}
                <div className="p-4 bg-app-subtle/50 rounded-2xl border border-app-border flex gap-3 text-xs text-app-muted">
                    <span className="material-symbols-outlined shrink-0">info</span>
                    <p>
                        Este reporte te ayuda a balancear tus finanzas. Asigna correctamente tus <strong>categorías</strong> para mejorar la precisión del modelo 50/30/20.
                        <Link to="/categories" className="ml-1 text-app-primary hover:underline font-bold">Editar Categorías</Link>
                    </p>
                </div>

            </div>
        </div>
    );
};

export default Reports;