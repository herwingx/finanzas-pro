import React from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useProfile } from '../hooks/useApi';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { SkeletonDashboard } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';

const CustomTooltip = ({ active, payload, formatter }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white dark:bg-zinc-900 border border-app-border rounded-xl shadow-xl p-3 min-w-[140px] animate-fade-in ring-1 ring-black/5 dark:ring-white/10 opacity-100 z-50">
                <div className="flex items-center gap-2 mb-1.5">
                    <span
                        className="size-2 rounded-full ring-2 ring-white dark:ring-black"
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="text-xs font-semibold text-app-muted uppercase tracking-wide truncate max-w-[100px]">
                        {data.name}
                    </span>
                </div>
                <p className="text-base font-black text-app-text font-numbers leading-none">
                    {formatter(data.value)}
                </p>
            </div>
        );
    }
    return null;
};

const Reports: React.FC = () => {
    // Use backend data with 'mensual' period and 'calendar' mode for consistency
    const { data: summary, isLoading } = useFinancialPeriodSummary('mensual', 'calendar');
    const { data: profile } = useProfile();

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: profile?.currency || 'MXN',
            maximumFractionDigits: 0
        }).format(val);
    };

    if (isLoading) return <SkeletonDashboard />;
    if (!summary) return <div className="p-8 text-center text-app-muted">Sin datos suficientes</div>;

    // Calculate totals from backend data
    const totalExpectedIncome = summary.totalExpectedIncome ?? 0;
    const totalReceivedIncome = summary.totalReceivedIncome ?? 0;
    const totalPeriodIncome = summary.totalPeriodIncome ?? 0;
    const totalCommitments = summary.totalCommitments ?? 0;
    const currentBalance = summary.currentBalance ?? 0;
    const disposableIncome = summary.disposableIncome ?? 0;
    const budgetAnalysis = summary.budgetAnalysis;

    // Calculate surplus (money left after all expenses)
    // Surplus = Total Income - (Needs + Wants + Savings + Unclassified)
    const totalAllocated = budgetAnalysis
        ? (budgetAnalysis.needs.projected + budgetAnalysis.wants.projected + budgetAnalysis.savings.projected)
        : 0;

    const surplus = Math.max(0, totalPeriodIncome - totalAllocated);

    // Build 50/30/20 chart data
    // WE ADD SURPLUS TO SAVINGS VISUALLY
    const totalSavingsWithSurplus = (budgetAnalysis?.savings.projected || 0) + surplus;

    const chartData = budgetAnalysis ? [
        { name: 'Necesidades', value: budgetAnalysis.needs.projected, color: '#f43f5e', ideal: 50, icon: 'home' },
        { name: 'Deseos', value: budgetAnalysis.wants.projected, color: '#a855f7', ideal: 30, icon: 'favorite' },
        { name: 'Ahorro', value: totalSavingsWithSurplus, color: '#10b981', ideal: 20, icon: 'savings' },
    ].filter(i => i.value > 0) : [];

    const hasData = chartData.length > 0;
    const budgetBase = totalPeriodIncome > 0 ? totalPeriodIncome : totalCommitments;

    // Calculate percentages for each category
    const savingPercentage = budgetBase > 0 ? (totalSavingsWithSurplus / budgetBase) * 100 : 0;
    const needsPercentage = budgetBase > 0 && budgetAnalysis ? (budgetAnalysis.needs.projected / budgetBase) * 100 : 0;
    const wantsPercentage = budgetBase > 0 && budgetAnalysis ? (budgetAnalysis.wants.projected / budgetBase) * 100 : 0;

    // Get motivational message - considers ALL categories, not just savings
    const getMotivationalMessage = () => {
        // First check for problems with needs or wants exceeding limits
        const needsExceeds = needsPercentage > 55; // 5% tolerance
        const wantsExceeds = wantsPercentage > 35; // 5% tolerance
        const savingsLow = savingPercentage < 20;

        if (needsExceeds && wantsExceeds) {
            return { text: "⚠️ Necesidades y Deseos superan los límites. Revisa tu presupuesto.", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/10" };
        }
        if (needsExceeds) {
            return { text: `Tus necesidades consumen ${needsPercentage.toFixed(0)}% (meta: 50%). Intenta optimizar gastos fijos 💡`, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/10" };
        }
        if (wantsExceeds) {
            return { text: `Deseos en ${wantsPercentage.toFixed(0)}% (meta: 30%). Revisa gastos de entretenimiento 🎯`, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/10" };
        }
        // If no issues with needs/wants, check savings
        if (savingPercentage >= 50) return { text: "¡Increíble! Estás ahorrando la mitad de tus ingresos 🚀🏆", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" };
        if (savingPercentage >= 20) return { text: "¡Excelente trabajo! Estás cumpliendo la regla 50/30/20 👏", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/10" };
        if (savingPercentage > 0 && !savingsLow) return { text: "¡Vas por buen camino! Mantén el ritmo 💪", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/10" };
        if (savingsLow) return { text: `Ahorro en ${savingPercentage.toFixed(0)}%. Intenta llegar al 20% 💪`, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/10" };
        return { text: "Cuidado, revisa tus gastos para empezar a ahorrar ⚠️", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/10" };
    };

    const motivation = getMotivationalMessage();

    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Reportes del Mes" showBackButton />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Hero Stats Card - Desglose completo */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    {/* Resultado Principal */}
                    <div className="text-center mb-5 pb-5 border-b border-app-border">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Disponible Final del Mes</p>
                            <span
                                className="material-symbols-outlined text-[14px] text-app-muted/50 cursor-help"
                                title="Balance actual + Ingresos esperados - Compromisos del mes"
                            >info</span>
                        </div>
                        <p className={`text-4xl font-black tracking-tight font-numbers ${disposableIncome >= 0 ? 'text-app-text' : 'text-rose-500'}`}>
                            {formatCurrency(disposableIncome)}
                        </p>
                    </div>

                    {/* Desglose - Improved mobile responsiveness */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                        <div className="p-2 sm:p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 mb-1">
                                <span className="material-symbols-outlined text-indigo-500 text-sm">account_balance_wallet</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-app-muted uppercase leading-tight">En Cuenta</span>
                            </div>
                            <p className="text-sm sm:text-base font-bold font-numbers text-indigo-600 dark:text-indigo-400">
                                {formatCurrency(currentBalance)}
                            </p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 mb-1">
                                <span className="material-symbols-outlined text-emerald-500 text-sm">add</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-app-muted uppercase leading-tight">Ingresos</span>
                            </div>
                            <p className="text-sm sm:text-base font-bold font-numbers text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalPeriodIncome)}
                            </p>
                            {totalReceivedIncome > 0 && totalExpectedIncome > 0 && (
                                <p className="text-[8px] sm:text-[9px] text-app-muted mt-0.5 sm:mt-1">
                                    {formatCurrency(totalReceivedIncome)} recibido
                                </p>
                            )}
                        </div>
                        <div className="p-2 sm:p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 mb-1">
                                <span className="material-symbols-outlined text-rose-500 text-sm">remove</span>
                                <span className="text-[8px] sm:text-[10px] font-bold text-app-muted uppercase leading-tight">Compromisos</span>
                            </div>
                            <p className="text-sm sm:text-base font-bold font-numbers text-rose-600 dark:text-rose-400">
                                {formatCurrency(totalCommitments)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 50/30/20 Rule Section */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <span className="material-symbols-outlined text-xl">donut_large</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-sm text-app-text">Análisis de Presupuesto</h2>
                                <p className="text-xs text-app-muted">Regla 50/30/20</p>
                            </div>
                        </div>
                        {hasData && (
                            <div className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-center leading-snug ${motivation.bg} ${motivation.color}`}>
                                {motivation.text}
                            </div>
                        )}
                    </div>

                    {hasData ? (
                        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">

                            {/* Donut Chart */}
                            <div className="h-48 w-48 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            dataKey="value"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            cornerRadius={6}
                                            animationDuration={800}
                                            animationBegin={0}
                                        >
                                            {chartData.map((e, i) => (
                                                <Cell key={i} fill={e.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={<CustomTooltip formatter={formatCurrency} />}
                                            cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Total</span>
                                    <span className="text-sm font-black text-app-text font-numbers">{formatCurrency(totalAllocated)}</span>
                                </div>
                            </div>

                            {/* Legend / Breakdown List */}
                            <div className="w-full space-y-4 flex-1">
                                {chartData.map((item, index) => {
                                    const pct = budgetBase > 0 ? (item.value / budgetBase) * 100 : 0;
                                    const diff = pct - item.ideal;

                                    return (
                                        <div
                                            key={item.name}
                                            className="animate-fade-in"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="flex items-center gap-2.5 text-sm font-semibold text-app-text">
                                                    <span
                                                        className="size-8 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                                                    </span>
                                                    {item.name}
                                                </span>
                                                <span className="text-sm font-bold font-numbers text-app-text">
                                                    {formatCurrency(item.value)}
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${Math.min(pct, 100)}%`,
                                                        backgroundColor: item.color,
                                                    }}
                                                />
                                            </div>

                                            {/* Meta comparison */}
                                            <div className="flex justify-between text-[11px] mt-1.5">
                                                <div className="flex flex-col">
                                                    <span className="text-app-muted">
                                                        {pct.toFixed(1)}% del ingreso
                                                    </span>
                                                    {item.name === 'Ahorro' && surplus > 0 && (
                                                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 italic">
                                                            + {formatCurrency(surplus)} sobrante potencial
                                                        </span>
                                                    )}
                                                </div>

                                                {item.ideal > 0 && (
                                                    <span className={`font-semibold flex items-center gap-1 ${diff > 10 ? 'text-rose-500' :
                                                        diff > 0 ? 'text-amber-600' :
                                                            'text-emerald-500'
                                                        }`}>
                                                        <span>Meta: {formatCurrency(budgetBase * (item.ideal / 100))}</span>
                                                        <span className="text-[9px] opacity-80">({item.ideal}%)</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-app-muted">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-30">analytics</span>
                            <p className="text-sm font-medium">No hay gastos para analizar este mes.</p>
                            <p className="text-xs mt-1">Registra transacciones para ver tu análisis.</p>
                        </div>
                    )}
                </div>

                {/* Warnings from backend */}
                {summary.warnings && summary.warnings.length > 0 && (
                    <div className="space-y-3">
                        {summary.warnings.map((warning: string, i: number) => (
                            <div key={i} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3 items-start">
                                <div className="size-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
                                </div>
                                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{warning}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info Card */}
                <div className="p-4 bg-app-subtle/50 rounded-2xl border border-app-border flex items-start gap-3">
                    <span className="material-symbols-outlined text-app-muted text-xl shrink-0">info</span>
                    <div className="text-xs text-app-muted leading-relaxed">
                        <strong className="text-app-text">Regla 50/30/20:</strong> Destina 50% a necesidades (renta, comida),
                        30% a deseos (entretenimiento), y 20% a ahorro.
                        <Link to="/categories" className="text-app-primary hover:underline ml-1">
                            Clasifica tus categorías →
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;