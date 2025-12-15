import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
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
            style: 'currency',
            currency: profile?.currency || 'MXN',
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

        // Chart segments with modern colors
        const data = [
            { name: 'Necesidades', value: needs, color: '#f43f5e', ideal: 50, icon: 'home' },
            { name: 'Deseos', value: wants, color: '#a855f7', ideal: 30, icon: 'favorite' },
            { name: 'Ahorro', value: savings, color: '#10b981', ideal: 20, icon: 'savings' },
            { name: 'Sin clasificar', value: unclassified, color: '#64748b', ideal: 0, icon: 'help' },
        ].filter(i => i.value > 0);

        return {
            income,
            expense,
            balance: income - expense,
            chartData: data,
            totalAllocated: needs + wants + savings + unclassified,
            hasUnclassified: unclassified > 0
        };
    }, [transactions, categories]);

    const isLoading = loadingTx || loadingCat || loadingProf;

    if (isLoading) return <SkeletonDashboard />;
    if (!analysis) return <div className="p-8 text-center text-app-muted">Sin datos suficientes</div>;

    const hasData = analysis.chartData.length > 0;
    // Usar gastos totales como base si no hay ingresos
    const baseAmount = analysis.income > 0 ? analysis.income : analysis.expense;

    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Reportes del Mes" showBackButton />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Hero Stats Card */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-between">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-app-muted uppercase tracking-wider mb-1">Balance Neto</p>
                            <p className={`text-4xl font-black tracking-tight font-numbers ${analysis.balance >= 0 ? 'text-app-text' : 'text-rose-500'}`}>
                                {formatCurrency(analysis.balance)}
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="size-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Ingresos</span>
                                </div>
                                <p className="text-lg font-bold font-numbers text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(analysis.income)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="size-2 rounded-full bg-rose-500"></span>
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Gastos</span>
                                </div>
                                <p className="text-lg font-bold font-numbers text-rose-600 dark:text-rose-400">
                                    {formatCurrency(analysis.expense)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 50/30/20 Rule Section */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <span className="material-symbols-outlined text-xl">donut_large</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-sm text-app-text">Análisis de Presupuesto</h2>
                            <p className="text-xs text-app-muted">Regla 50/30/20</p>
                        </div>
                    </div>

                    {hasData ? (
                        <div className="flex flex-col lg:flex-row gap-8 items-center">

                            {/* Donut Chart */}
                            <div className="h-48 w-48 relative shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={analysis.chartData}
                                            dataKey="value"
                                            innerRadius={55}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            cornerRadius={6}
                                            animationDuration={800}
                                            animationBegin={0}
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
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Total</span>
                                    <span className="text-sm font-black text-app-text font-numbers">{formatCurrency(analysis.totalAllocated)}</span>
                                </div>
                            </div>

                            {/* Legend / Breakdown List */}
                            <div className="w-full space-y-4 flex-1">
                                {analysis.chartData.map((item, index) => {
                                    const pct = baseAmount > 0 ? (item.value / baseAmount) * 100 : 0;
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
                                                <span className="text-app-muted">
                                                    {pct.toFixed(1)}% del {analysis.income > 0 ? 'ingreso' : 'gasto total'}
                                                </span>
                                                {item.ideal > 0 && (
                                                    <span className={`font-semibold ${diff > 10 ? 'text-rose-500' :
                                                            diff > 0 ? 'text-amber-500' :
                                                                'text-emerald-500'
                                                        }`}>
                                                        Meta: {item.ideal}% ({diff > 0 ? '+' : ''}{diff.toFixed(0)}%)
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

                {/* Unclassified Warning */}
                {analysis.hasUnclassified && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex gap-3 items-start">
                        <div className="size-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-amber-700 dark:text-amber-400 mb-1">
                                Categorías sin configurar
                            </p>
                            <p className="text-xs text-amber-600/90 dark:text-amber-500/80 leading-relaxed mb-3">
                                Tienes gastos sin asignar a Necesidad/Deseo/Ahorro. Configura tus categorías para un análisis más preciso.
                            </p>
                            <Link
                                to="/categories"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                            >
                                Configurar categorías
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </Link>
                        </div>
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