import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions, useCategories, useProfile } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';

const Reports: React.FC = () => {
    // --- Data Hooks ---
    const { data: transactions, isLoading: loadingTx } = useTransactions();
    const { data: categories, isLoading: loadingCat } = useCategories();
    const { data: profile, isLoading: loadingProf } = useProfile();

    // --- Helpers ---
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: profile?.currency || 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    // --- Calculation Logic (50/30/20 Rule) ---
    const analysis = useMemo(() => {
        if (!transactions || !categories) return null;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

        const income = monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expense = monthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

        let needs = 0, wants = 0, savings = 0, unclassified = 0;

        monthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
            const cat = categories.find(c => c.id === tx.categoryId);
            if (cat?.budgetType === 'need') needs += tx.amount;
            else if (cat?.budgetType === 'want') wants += tx.amount;
            else if (cat?.budgetType === 'savings') savings += tx.amount;
            else unclassified += tx.amount;
        });

        // Chart segments with standard SaaS colors
        const data = [
            { name: 'Necesidades', value: needs, color: '#EF4444', ideal: 50 }, // Red
            { name: 'Deseos', value: wants, color: '#A855F7', ideal: 30 },      // Purple
            { name: 'Ahorro', value: savings, color: '#10B981', ideal: 20 },     // Emerald
            { name: 'Sin clasificar', value: unclassified, color: '#94A3B8', ideal: 0 }, // Gray
        ].filter(i => i.value > 0);

        return { income, expense, balance: income - expense, chartData: data, totalAllocated: needs + wants + savings + unclassified };
    }, [transactions, categories]);

    const isLoading = loadingTx || loadingCat || loadingProf;

    if (isLoading) return <SkeletonDashboard />;
    if (!analysis) return <div className="p-8 text-center text-app-muted">Sin datos suficientes</div>;

    const hasData = analysis.chartData.length > 0;

    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Reportes del Mes" />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Hero Stats - "The Stripe Look" */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:gap-12 justify-between">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Balance Neto</p>
                        <p className={`text-4xl font-black tracking-tight ${analysis.balance >= 0 ? 'text-app-text' : 'text-rose-500'}`}>
                            {formatCurrency(analysis.balance)}
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="size-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[10px] font-bold text-app-muted uppercase">Ingresos</span>
                            </div>
                            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(analysis.income)}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="size-2 rounded-full bg-rose-500"></span>
                                <span className="text-[10px] font-bold text-app-muted uppercase">Gastos</span>
                            </div>
                            <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">
                                {formatCurrency(analysis.expense)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 50/30/20 Rule Section */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <span className="material-symbols-outlined text-xl">donut_large</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-app-text">Análisis de Presupuesto</h2>
                            <p className="text-xs text-app-muted">Regla 50/30/20</p>
                        </div>
                    </div>

                    {hasData ? (
                        <div className="flex flex-col md:flex-row gap-8 items-center">

                            {/* Donut Chart */}
                            <div className="h-48 w-48 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analysis.chartData}
                                            dataKey="value"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            cornerRadius={4}
                                        >
                                            {analysis.chartData.map((e, i) => (
                                                <Cell key={i} fill={e.color} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-surface)',
                                                borderColor: 'var(--border-default)',
                                                borderRadius: '12px',
                                                fontSize: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            itemStyle={{ color: 'var(--text-main)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-app-muted">Total</span>
                                    <span className="text-sm font-black text-app-text">{formatCurrency(analysis.totalAllocated)}</span>
                                </div>
                            </div>

                            {/* Legend / Breakdown List */}
                            <div className="w-full space-y-3 flex-1">
                                {analysis.chartData.map(item => {
                                    const pct = analysis.income > 0 ? (item.value / analysis.income) * 100 : 0;
                                    const diff = pct - item.ideal;

                                    return (
                                        <div key={item.name} className="flex flex-col gap-1.5">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="flex items-center gap-2">
                                                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    {item.name} <span className="text-app-muted">({pct.toFixed(0)}%)</span>
                                                </span>
                                                <span className="tabular-nums font-bold">{formatCurrency(item.value)}</span>
                                            </div>

                                            <div className="h-1.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color }}
                                                />
                                            </div>

                                            {item.ideal > 0 && (
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-app-muted">Meta: {item.ideal}%</span>
                                                    <span className={diff > 5 ? 'text-rose-500 font-bold' : 'text-app-muted'}>
                                                        {diff > 0 ? `+${diff.toFixed(0)}%` : diff.toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-app-muted opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-2">analytics</span>
                            <p className="text-sm">No hay gastos para analizar este mes.</p>
                        </div>
                    )}
                </div>

                {/* Unclassified Warning */}
                {analysis.chartData.some(i => i.name === 'Sin clasificar') && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                        <div className="text-xs">
                            <p className="font-bold text-amber-700 dark:text-amber-400 mb-1">Categorías sin configurar</p>
                            <p className="text-amber-600/90 dark:text-amber-500/80 leading-relaxed">
                                Tienes gastos sin asignar a Necesidad/Deseo/Ahorro.
                                Ve a "Categorías" para mejorar tu análisis.
                            </p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Reports;