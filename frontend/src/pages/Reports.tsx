import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions, useCategories, useProfile } from '../hooks/useApi';
import { SkeletonDashboard } from '../components/Skeleton';
import { PageHeader } from '../components/PageHeader';

const Reports: React.FC = () => {
    const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const { data: profile, isLoading: isLoadingProfile } = useProfile();

    const formatCurrency = useMemo(() => (value: number) => {
        const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
        return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
    }, [profile?.currency]);

    const { monthlySummary, budgetAnalysis } = useMemo(() => {
        if (!transactions || !categories) return {
            monthlySummary: { income: 0, expense: 0, total: 0 },
            budgetAnalysis: { needs: 0, wants: 0, savings: 0, unclassified: 0, total: 0, chartData: [] }
        };

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

        const income = monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const expense = monthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

        let needs = 0, wants = 0, savings = 0, unclassified = 0;
        monthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
            const category = categories.find(c => c.id === tx.categoryId);
            if (category?.budgetType === 'need') needs += tx.amount;
            else if (category?.budgetType === 'want') wants += tx.amount;
            else if (category?.budgetType === 'savings') savings += tx.amount;
            else unclassified += tx.amount;
        });

        const totalExpenses = needs + wants + savings + unclassified;
        const chartData = [
            { name: 'Necesidades', value: needs, color: '#F50F56', ideal: 50 }, // --color-danger (Neon Red)
            { name: 'Deseos', value: wants, color: '#FFD166', ideal: 30 }, // --color-warning variant (Neon Yellow/Orange)
            { name: 'Ahorros', value: savings, color: '#06D6A0', ideal: 20 }, // --color-success (Neon Mint)
            { name: 'Sin clasificar', value: unclassified, color: '#64748B', ideal: 0 }, // Slate-500
        ].filter(item => item.value > 0);

        return {
            monthlySummary: { income, expense, total: income - expense },
            budgetAnalysis: { needs, wants, savings, unclassified, total: totalExpenses, chartData }
        };
    }, [transactions, categories]);

    const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingProfile;

    return (
        <div className="bg-app-bg text-app-text font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px]"></div>
            </div>

            <PageHeader title="Informes" />

            {isLoading ? (
                <SkeletonDashboard />
            ) : (
                <div className="p-4 max-w-lg mx-auto space-y-6">
                    {/* Monthly Summary */}
                    <div className="bg-gradient-to-br from-app-primary to-app-secondary rounded-3xl p-6 shadow-2xl shadow-app-primary/30">
                        <p className="text-white/80 text-xs font-medium mb-3 uppercase tracking-wider">Resumen del Mes</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-white/60 text-xs mb-1">Ingresos</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(monthlySummary.income)}</p>
                            </div>
                            <div>
                                <p className="text-white/60 text-xs mb-1">Gastos</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(monthlySummary.expense)}</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-white/60 text-xs mb-1">Balance</p>
                            <p className={`text-3xl font-extrabold ${monthlySummary.total >= 0 ? 'text-white' : 'text-red-200'}`}>
                                {formatCurrency(monthlySummary.total)}
                            </p>
                        </div>
                    </div>

                    {/* 50/30/20 Analysis */}
                    <div className="bg-app-card border border-app-border rounded-3xl p-6 shadow-premium">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-app-primary/10 rounded-xl">
                                <span className="material-symbols-outlined text-app-primary text-xl">pie_chart</span>
                            </div>
                            <div>
                                <h2 className="text-base font-bold">Regla 50/30/20</h2>
                                <p className="text-xs text-app-muted">Distribución de tus gastos</p>
                            </div>
                        </div>

                        {budgetAnalysis.total > 0 ? (
                            <>
                                <div className="h-64 -mx-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={budgetAnalysis.chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {budgetAnalysis.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: 'var(--color-card)',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '12px',
                                                    padding: '8px 12px'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="space-y-3 mt-4">
                                    {budgetAnalysis.chartData.map((item) => {
                                        const percentage = monthlySummary.income > 0 ? (item.value / monthlySummary.income) * 100 : 0;
                                        const isIdeal = item.ideal > 0;
                                        const diff = isIdeal ? percentage - item.ideal : 0;

                                        return (
                                            <div key={item.name} className="bg-app-elevated rounded-xl p-3 border border-app-border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                        <span className="text-sm font-bold">{item.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold">{formatCurrency(item.value)}</p>
                                                        <p className="text-xs text-app-muted">{percentage.toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                                {isIdeal && (
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <div className="flex-1 bg-app-bg rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
                                                                style={{
                                                                    width: `${Math.min(percentage, 100)}%`,
                                                                    backgroundColor: item.color
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className={`font-medium ${Math.abs(diff) < 5 ? 'text-app-success' : diff > 0 ? 'text-app-danger' : 'text-app-muted'}`}>
                                                            {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {budgetAnalysis.unclassified > 0 && (
                                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                                    Tienes {formatCurrency(budgetAnalysis.unclassified)} en gastos sin clasificar.
                                                </p>
                                                <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-1">
                                                    Clasifica tus categorías en Ajustes para un análisis más preciso.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-app-muted">
                                <span className="material-symbols-outlined text-5xl mb-3 opacity-30">donut_large</span>
                                <p className="text-sm font-medium">No hay gastos este mes</p>
                                <p className="text-xs mt-1">Comienza a registrar tus transacciones</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;