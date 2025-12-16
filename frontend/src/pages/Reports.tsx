import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactions, useCategories, useProfile, useRecurringTransactions, useInstallmentPurchases, useLoans } from '../hooks/useApi';
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
    // --- Data Hooks ---
    const { data: transactions, isLoading: loadingTx } = useTransactions();
    const { data: categories, isLoading: loadingCat } = useCategories();
    const { data: profile, isLoading: loadingProf } = useProfile();
    const { data: recurringTxs, isLoading: loadingRec } = useRecurringTransactions();
    const { data: installments, isLoading: loadingInst } = useInstallmentPurchases();
    const { data: loansData, isLoading: loadingLoans } = useLoans();

    // --- Helpers ---
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: profile?.currency || 'MXN',
            maximumFractionDigits: 0
        }).format(val);
    };

    // --- Calculation Logic (50/30/20 Rule + Projections) ---
    // --- Calculation Logic (50/30/20 Rule + Projections) ---
    const analysis = useMemo(() => {
        if (!transactions || !categories || !recurringTxs || !installments || !loansData) return null;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);

        // --- 1. Income Projection ---
        // Separate Regular Income (for Budget) vs Total Income (for Liquidity)

        // A. Actual Income
        const totalActualIncome = monthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);

        // Regular Actual Income = Total - New Debt (Borrowed Loans)
        // BUT include Loan Repayments (Lent Loans) as this is 'money returning to me'
        const regularActualIncome = monthTxs
            .filter(tx => tx.type === 'income')
            .filter(tx => {
                // Check if linked to Loan
                if (tx.loanId) {
                    const loan = loansData.find(l => l.id === tx.loanId);
                    // If it's a "Lent" loan, and this is income, it means they are paying me back.
                    // This IS disposable money I can use. KEEP IT.
                    if (loan && (loan as any).loanType === 'lent') return true;

                    // If it's a "Borrowed" loan, and this is income, it means I am receiving the bank's money.
                    // This is DEBT. EXCLUDE IT.
                    return false;
                }

                // If not linked to loan, check category
                const cat = categories.find(c => c.id === tx.categoryId);
                // Exclude if category is explicitly Préstamos (Manual entry assumed to be debt/borrowing if not linked)
                // If user manually enters "Cobro a Juan" without linking, it might get excluded here.
                // But safer to exclude potential debt than include it.
                return !cat || (cat.name !== 'Préstamos' && cat.name !== 'Prestamos' && cat.name !== 'Deudas');
            })
            .reduce((sum, tx) => sum + tx.amount, 0);

        // B. Recurring Income
        const monthlyRecurringIncome = recurringTxs
            .filter(rt => rt.active && rt.type === 'income')
            .reduce((sum, rt) => {
                let monthlyAmount = rt.amount;
                switch (rt.frequency) {
                    case 'daily': monthlyAmount = rt.amount * 30; break;
                    case 'weekly': monthlyAmount = rt.amount * 4; break;
                    case 'biweekly': monthlyAmount = rt.amount * 2; break;
                    case 'biweekly_15_30': monthlyAmount = rt.amount * 2; break;
                    case 'monthly': monthlyAmount = rt.amount; break;
                    case 'yearly': monthlyAmount = rt.amount / 12; break;
                }
                return sum + monthlyAmount;
            }, 0);

        // Projected Totals
        // For Liquidity: Use Total Actual (including loans) vs Recurring
        let totalProjectedIncome = Math.max(totalActualIncome, monthlyRecurringIncome);

        // For Budget (50/30/20): Use Regular Actual (excluding loans) vs Recurring
        let regularProjectedIncome = Math.max(regularActualIncome, monthlyRecurringIncome);

        // --- 2. Expense Projection (The "Projected" View) ---
        // We combine:
        // A. Active Recurring Expenses (Monthly equivalent)
        // B. Active MSI Installments (Monthly payment)
        // C. "Manual" Expenses this month (Non-recurring, Non-MSI)
        // D. Active Loans Due this Month (Balloon payments / Full settlements)

        let needs = 0, wants = 0, savings = 0, unclassified = 0;
        let loanExpenses = 0; // Just for tracking, but will be distributed to Needs/Savings
        let projectedExpenseTotal = 0;

        // Helper to classify amount by category ID and Description
        const classify = (amount: number, categoryId?: string, loanId?: string, description: string = '') => {
            projectedExpenseTotal += amount;

            // 1. Handle Linked Loans (Priority)
            if (loanId) {
                const loan = loansData.find(l => l.id === loanId);
                loanExpenses += amount;

                if (loan) {
                    // Logic:
                    // - Loans I GAVE (Lent) = I am putting money away = SAVINGS (Asset)
                    // - Loans I TOOK (Borrowed) = I am paying a debt = NEEDS (Obligation)
                    if ((loan as any).loanType === 'lent') {
                        savings += amount;
                    } else {
                        // Default to Needs for debt repayment
                        needs += amount;
                    }
                    return;
                }
            }

            // 2. Handle Manual Keyword detection for Loans (Unlock logic)
            const lowerDesc = description.toLowerCase();
            const isLoanKeyword = lowerDesc.includes('prestamo') || lowerDesc.includes('préstamo') || lowerDesc.includes('deuda') || lowerDesc.includes('credito') || lowerDesc.includes('crédito');

            if (isLoanKeyword && !categoryId) {
                // Ambiguous manual entry. Assume Paying Debt -> Needs.
                loanExpenses += amount;
                needs += amount;
                return;
            }

            if (!categoryId) {
                unclassified += amount;
                return;
            }

            const cat = categories.find(c => c.id === categoryId);
            if (!cat) {
                unclassified += amount;
                return;
            }

            // 3. Handle 'Préstamos' Category explicitly
            if (cat.name === 'Préstamos' || cat.name === 'Prestamos' || cat.name === 'Deudas') {
                loanExpenses += amount;
                // Assume generic Préstamos category is Debt Repayment -> Needs
                needs += amount;
                return;
            }

            if (cat.budgetType === 'need') needs += amount;
            else if (cat.budgetType === 'want') wants += amount;
            else if (cat.budgetType === 'savings') savings += amount;
            else unclassified += amount;
        };

        // A. Recurring Expenses
        recurringTxs.filter(rt => rt.active && rt.type === 'expense').forEach(rt => {
            let monthlyAmount = rt.amount;
            switch (rt.frequency) {
                case 'daily': monthlyAmount = rt.amount * 30; break;
                case 'weekly': monthlyAmount = rt.amount * 4; break;
                case 'biweekly': monthlyAmount = rt.amount * 2; break;
                case 'biweekly_15_30': monthlyAmount = rt.amount * 2; break;
                case 'monthly': monthlyAmount = rt.amount; break;
                case 'yearly': monthlyAmount = rt.amount / 12; break;
            }
            // Recurring usually doesn't have loanId linked directly in this model yet, passing undefined
            classify(monthlyAmount, rt.categoryId, undefined, rt.description);
        });

        // B. MSI Installments
        installments.forEach(inst => {
            const remaining = inst.installments - inst.paidInstallments;
            if (remaining > 0) {
                classify(inst.monthlyPayment, inst.categoryId, undefined, inst.description);
            }
        });

        // C. Manual Expenses
        monthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
            if (tx.recurringTransactionId) return;
            if (tx.installmentPurchaseId) return;

            classify(tx.amount, tx.categoryId, tx.loanId, tx.description);
        });

        // D. Loans Due This Month (Settlements)
        loansData.forEach(loan => {
            if (loan.status === 'paid' || loan.remainingAmount <= 0) return;
            if (!loan.expectedPayDate) return;

            const dueDate = new Date(loan.expectedPayDate);
            // Check if due date is in current month/year
            if (dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear()) {

                if ((loan as any).loanType === 'borrowed') {
                    // I owe this money, it's a debt repayment -> NEED
                    // We add it as if it were an expense to be covered
                    projectedExpenseTotal += loan.remainingAmount;
                    needs += loan.remainingAmount;
                    loanExpenses += loan.remainingAmount;
                } else if ((loan as any).loanType === 'lent') {
                    // Someone owes me this money -> INCOME/RECOVERY
                    // We add it to projected income
                    regularProjectedIncome += loan.remainingAmount;
                    totalProjectedIncome += loan.remainingAmount;
                }
            }
        });

        // --- 3. Disposable & Surplus Calculation ---
        const budgetBase = regularProjectedIncome; // Loans are now INSIDE the buckets, so we use full Net Income
        const totalOperationalExpenses = needs + wants + savings + unclassified;
        const surplus = Math.max(0, budgetBase - totalOperationalExpenses);

        // Add surplus to savings (Potential Savings)
        const totalSavings = savings + surplus;

        // Chart segments with modern colors
        const data = [
            { name: 'Necesidades', value: needs, color: '#f43f5e', ideal: 50, icon: 'home' }, // Now includes Debt Repayment
            { name: 'Deseos', value: wants, color: '#a855f7', ideal: 30, icon: 'favorite' },
            { name: 'Ahorro', value: totalSavings, color: '#10b981', ideal: 20, icon: 'savings' }, // Now includes Loans Given
            { name: 'Sin clasificar', value: unclassified, color: '#64748b', ideal: 0, icon: 'help' },
        ].filter(i => i.value > 0);

        return {
            income: totalActualIncome,
            expense: projectedExpenseTotal,
            actualExpense: monthTxs.filter(tx => tx.type === 'expense').reduce((s, t) => s + t.amount, 0),
            totalProjectedIncome, // Total (Liquidity)
            regularProjectedIncome, // Regular (Budget Base Source)
            budgetBase, // Net Disposable Income
            loanExpenses,
            balance: totalProjectedIncome - projectedExpenseTotal,
            chartData: data,
            totalAllocated: needs + wants + totalSavings + unclassified, // Should equal budgetBase (if no deficit)
            surplus, // Export surplus for UI
            hasUnclassified: unclassified > 0
        };
    }, [transactions, categories, recurringTxs, installments, loansData]);

    const isLoading = loadingTx || loadingCat || loadingProf || loadingRec || loadingInst || loadingLoans;

    if (isLoading) return <SkeletonDashboard />;
    if (!analysis) return <div className="p-8 text-center text-app-muted">Sin datos suficientes</div>;

    const hasData = analysis.chartData.length > 0;

    // Base Amount (Calculated in useMemo)
    const { budgetBase, surplus } = analysis;

    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Reportes del Mes" showBackButton />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Hero Stats Card */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-bold text-app-muted uppercase tracking-wider">Balance Estimado</p>
                                <span className="material-symbols-outlined text-[14px] text-app-muted cursor-help" title="Ingresos Recurrentes - Gastos Actuales">help</span>
                            </div>
                            <p className={`text-4xl font-black tracking-tight font-numbers ${(analysis.totalProjectedIncome - analysis.expense) >= 0 ? 'text-app-text' : 'text-rose-500'}`}>
                                {formatCurrency(analysis.totalProjectedIncome - analysis.expense)}
                            </p>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="size-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Ingresos Est.</span>
                                </div>
                                <p className="text-lg font-bold font-numbers text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(analysis.totalProjectedIncome)}
                                </p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className="size-2 rounded-full bg-rose-500"></span>
                                    <span className="text-[10px] font-bold text-app-muted uppercase">Gastos Est.</span>
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
                            <p className="text-xs text-app-muted">Regla 50/30/20 (Operativo)</p>
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
                                            content={<CustomTooltip formatter={formatCurrency} />}
                                            cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }}
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
                                                        {pct.toFixed(1)}% del disp. neto
                                                    </span>
                                                    {item.name === 'Ahorro' && surplus > 0 && (
                                                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 italic">
                                                            Inc. {formatCurrency(surplus)} sobrante
                                                        </span>
                                                    )}
                                                </div>

                                                {item.ideal > 0 && (
                                                    <span className={`font-semibold flex items-center gap-1 ${diff > 10 ? 'text-rose-500' :
                                                        diff > 0 ? 'text-green-600' :
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