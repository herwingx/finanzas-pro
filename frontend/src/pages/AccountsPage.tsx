import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useAccounts, useProfile, useDeleteAccount, useInvestments, useLoans, useGoals } from '../hooks/useApi';

// Components
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonAccountList } from '../components/Skeleton';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';

// Utils & Types
import { toastSuccess, toastError, toast } from '../utils/toast';
import { AccountType, Account } from '../types';

/* ==================================================================================
   SUB-COMPONENT: HEADER
   ================================================================================== */

const SimpleHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
    <div className="sticky top-0 z-20 bg-app-bg/80 backdrop-blur-xl border-b border-app-border transition-all">
        <div className="pt-safe pb-3 px-4 md:px-6 flex justify-between items-center h-16 md:h-20">
            <h1 className="text-xl md:text-2xl font-bold text-app-text tracking-tight">{title}</h1>
            {action}
        </div>
    </div>
);

/* ==================================================================================
   SUB-COMPONENT: DETAIL SHEET
   ================================================================================== */
const AccountDetailSheet = ({
    account,
    onClose,
    onEdit,
    onDelete,
    formatCurrency
}: {
    account: Account | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatCurrency: (val: number) => string;
}) => {
    if (!account) return null;

    const getAccountConfig = (type: AccountType) => {
        switch (type) {
            case 'CREDIT': return { icon: 'credit_card', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', label: 'Tarjeta de Crédito' };
            case 'DEBIT': return { icon: 'account_balance', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Cuenta de Débito' };
            case 'CASH': return { icon: 'payments', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Efectivo' };
            default: return { icon: 'account_balance_wallet', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'General' };
        }
    };

    const conf = getAccountConfig(account.type);
    const isCredit = account.type === 'CREDIT';
    const usagePercent = isCredit && account.creditLimit ? (account.balance / account.creditLimit) * 100 : 0;
    const available = isCredit && account.creditLimit ? account.creditLimit - account.balance : account.balance;

    return (
        <SwipeableBottomSheet isOpen={!!account} onClose={onClose}>
            <div className="pt-2 pb-8 px-4">
                {/* Identity Block */}
                <div className="flex flex-col items-center mb-8 animate-fade-in">
                    <div className={`size-20 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm ${conf.bg} ${conf.text}`}>
                        <span className="material-symbols-outlined text-[32px]">{conf.icon}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-app-text leading-tight text-center">{account.name}</h2>
                    <span className="mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-app-subtle text-app-muted border border-app-border">
                        {conf.label}
                    </span>
                </div>

                {/* Primary Card - Balance */}
                <div className="bento-card bg-app-surface p-6 mb-4 text-center border-app-border/60 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1 opacity-70">
                        {isCredit ? 'Saldo Actual (Deuda)' : 'Saldo Actual'}
                    </p>
                    <div className={`text-4xl md:text-5xl font-black font-numbers tracking-tight tabular-nums ${isCredit ? 'text-app-text' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isCredit ? '-' : ''}{formatCurrency(account.balance)}
                    </div>

                    {isCredit && account.creditLimit && (
                        <div className="mt-5 max-w-xs mx-auto">
                            <div className="flex justify-between text-[10px] font-bold text-app-muted mb-1.5 uppercase tracking-wide">
                                <span>Límite: {formatCurrency(account.creditLimit)}</span>
                                <span className={usagePercent > 80 ? 'text-rose-500' : 'text-emerald-500'}>{usagePercent.toFixed(0)}% Uso</span>
                            </div>
                            <div className="w-full h-2.5 bg-app-subtle rounded-full overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-app-subtle/50 p-4 rounded-xl text-center border border-transparent">
                        <span className="block text-[10px] text-app-muted font-bold uppercase mb-0.5">{isCredit ? 'Crédito Disponible' : 'Disponible'}</span>
                        <span className={`block font-bold text-base ${isCredit ? 'text-emerald-600' : 'text-app-text'}`}>
                            {formatCurrency(available)}
                        </span>
                    </div>
                    <div className="bg-app-subtle/50 p-4 rounded-xl text-center border border-transparent">
                        <span className="block text-[10px] text-app-muted font-bold uppercase mb-0.5">ID Sistema</span>
                        <span className="block font-mono text-xs text-app-muted pt-1 select-all">{account.id.substring(0, 8)}...</span>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onEdit} className="h-12 rounded-xl bg-app-surface border border-app-border hover:bg-app-subtle active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-bold text-app-text">
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        Configurar
                    </button>
                    <button onClick={onDelete} className="h-12 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        </SwipeableBottomSheet>
    );
};


/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const AccountsPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const { openAccountSheet } = useGlobalSheets();
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    // Queries & Mutations
    const { data: accounts, isLoading: isLoadingAcc, isError } = useAccounts();
    const { data: investments, isLoading: isLoadingInv } = useInvestments();
    const { data: loans, isLoading: isLoadingLoans } = useLoans();
    const { data: goals, isLoading: isLoadingGoals } = useGoals();
    const { data: profile } = useProfile();
    const deleteAccountMutation = useDeleteAccount();

    // Deep Linking Handler
    useEffect(() => {
        if (searchParams.get('action') === 'new') {
            openAccountSheet();
        }
    }, [searchParams, openAccountSheet]);

    // Formatters & Calcs
    const formatCurrency = useMemo(() => (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: profile?.currency || 'USD',
            minimumFractionDigits: 0
        }).format(value);
    }, [profile?.currency]);

    // --- KPI CALCULATIONS ---
    const kpiData = useMemo(() => {
        if (!accounts && !investments && !loans && !goals) return null;

        const cash = accounts?.filter(a => ['DEBIT', 'CASH', 'SAVINGS'].includes(a.type)).reduce((s, a) => s + a.balance, 0) || 0;
        const invested = investments?.reduce((sum, inv) => sum + ((inv.currentPrice || inv.avgBuyPrice) * inv.quantity), 0) || 0;
        const lent = loans?.filter(l => l.loanType === 'lent' && ['active', 'partial'].includes(l.status)).reduce((sum, l) => sum + l.remainingAmount, 0) || 0;
        const saved = goals?.reduce((sum, g) => sum + g.currentAmount, 0) || 0;

        const debt = (accounts?.filter(a => a.type === 'CREDIT').reduce((s, a) => s + a.balance, 0) || 0) +
            (loans?.filter(l => l.loanType === 'borrowed' && ['active', 'partial'].includes(l.status)).reduce((sum, l) => sum + l.remainingAmount, 0) || 0);

        const assets = cash + invested + lent + saved;

        return { assets, debt, net: assets - debt };
    }, [accounts, investments, loans, goals]);


    // Action Handlers
    const handleDelete = (account: Account) => {
        toast.custom((t) => (
            <div className="bg-app-surface border border-app-border rounded-xl shadow-float p-5 font-sans max-w-sm w-full animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                <div className="flex gap-4">
                    <div className="size-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                    </div>
                    <div>
                        <h4 className="text-app-text font-bold text-sm">¿Eliminar esta cuenta?</h4>
                        <p className="text-xs text-app-muted mt-1 leading-relaxed">
                            Esta acción eliminará la cuenta <strong>{account.name}</strong> y sus configuraciones. El historial podría bloquear la eliminación.
                        </p>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={async () => {
                                    toast.dismiss(t);
                                    try {
                                        await deleteAccountMutation.mutateAsync(account.id);
                                        toastSuccess('Cuenta eliminada');
                                        setSelectedAccount(null);
                                    } catch (error: any) {
                                        toastError('No se pudo eliminar', 'Probablemente tiene transacciones asociadas.');
                                    }
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-colors"
                            >
                                Sí, eliminar
                            </button>
                            <button onClick={() => toast.dismiss(t)} className="px-4 py-2 rounded-lg text-xs font-bold text-app-muted bg-app-subtle hover:text-app-text transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: Infinity });
    };


    const getAccountUI = (type: AccountType) => {
        switch (type) {
            case 'CREDIT': return { icon: 'credit_card', bg: 'bg-indigo-50 dark:bg-indigo-900/10', text: 'text-indigo-600 dark:text-indigo-400', label: 'Crédito' };
            case 'DEBIT': return { icon: 'account_balance', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600 dark:text-blue-400', label: 'Débito' };
            case 'CASH': return { icon: 'payments', bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Efectivo' };
            default: return { icon: 'account_balance_wallet', bg: 'bg-zinc-50 dark:bg-zinc-800/30', text: 'text-zinc-500 dark:text-zinc-400', label: 'General' };
        }
    };


    if (isLoadingAcc || isLoadingInv || isLoadingLoans || isLoadingGoals) {
        return (
            <div className="bg-app-bg animate-pulse">
                <SimpleHeader title="Cuentas" />
                <div className="px-4 py-6">
                    <SkeletonAccountList />
                </div>
            </div>
        );
    }

    if (isError) return <div className="p-10 text-center text-rose-500">Error cargando cuentas. Intente recargar.</div>;

    return (
        <div className="bg-app-bg pb-safe">
            <SimpleHeader
                title="Cartera"
                action={
                    <button onClick={() => openAccountSheet()} className="bg-app-text text-app-bg hover:bg-app-text/90 size-8 md:w-auto md:px-3 rounded-full md:rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        <span className="hidden md:inline text-xs font-bold">Nueva</span>
                    </button>
                }
            />

            <main className="max-w-2xl mx-auto px-4 mt-6 pb-24 space-y-8 animate-fade-in">

                {/* 1. FINANCIAL SUMMARY WIDGET (KPIs) */}
                {kpiData && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 bento-card p-5 bg-gradient-to-br from-app-surface to-app-subtle dark:from-zinc-900 dark:to-black">
                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                <span className="material-symbols-outlined text-[16px]">account_balance</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest">Patrimonio Neto</span>
                            </div>
                            <div className={`text-4xl font-black tabular-nums tracking-tight ${kpiData.net >= 0 ? 'text-app-text' : 'text-rose-600'}`}>
                                {formatCurrency(kpiData.net)}
                            </div>
                        </div>

                        <div className="bento-card p-4 bg-emerald-500/5 border-emerald-500/10">
                            <p className="text-[10px] uppercase font-bold text-emerald-600/80 mb-0.5">Total Activos</p>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-numbers">{formatCurrency(kpiData.assets)}</p>
                        </div>

                        <div className="bento-card p-4 bg-rose-500/5 border-rose-500/10">
                            <p className="text-[10px] uppercase font-bold text-rose-600/80 mb-0.5">Pasivos Totales</p>
                            <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-numbers">{formatCurrency(kpiData.debt)}</p>
                        </div>
                    </div>
                )}

                {/* 2. ACCOUNTS LIST */}
                <section>
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Cuentas</h2>
                        <span className="text-[10px] font-bold bg-app-subtle px-2 py-0.5 rounded-full text-app-muted">
                            {accounts?.length || 0} Activas
                        </span>
                    </div>

                    <div className="space-y-3">
                        {accounts && accounts.length > 0 ? accounts.map(account => {
                            const ui = getAccountUI(account.type);
                            const usage = (account.type === 'CREDIT' && account.creditLimit) ? (account.balance / account.creditLimit) * 100 : 0;

                            return (
                                <SwipeableItem
                                    key={account.id}
                                    onSwipeRight={() => {
                                        setSelectedAccount(null);
                                        setTimeout(() => openAccountSheet(account), 50);
                                    }}
                                    leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                                    onSwipeLeft={() => handleDelete(account)}
                                    rightAction={{ icon: 'delete', color: '#F43F5E', label: 'Eliminar' }}
                                    className="rounded-2xl"
                                >
                                    <div
                                        onClick={() => setSelectedAccount(account)}
                                        className="bento-card p-4 md:p-5 flex gap-4 items-center group cursor-pointer hover:border-app-border-strong active:scale-[0.99]"
                                    >
                                        <div className={`size-11 md:size-12 shrink-0 rounded-xl flex items-center justify-center ${ui.bg} ${ui.text}`}>
                                            <span className="material-symbols-outlined text-[24px]">{ui.icon}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <div>
                                                    <h3 className="text-sm font-bold text-app-text truncate">{account.name}</h3>
                                                    <p className="text-[11px] font-medium text-app-muted flex items-center gap-1.5 mt-0.5">
                                                        {ui.label}
                                                        {account.type === 'CREDIT' && account.creditLimit && (
                                                            <>
                                                                <span className="size-1 rounded-full bg-app-border" />
                                                                <span className={usage > 90 ? 'text-rose-500 font-bold' : ''}>
                                                                    {usage.toFixed(0)}% Uso
                                                                </span>
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-base font-bold font-numbers ${account.type === 'CREDIT' ? 'text-app-text' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {account.type === 'CREDIT' ? '-' : ''}{formatCurrency(account.balance)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mini Progress for Credit */}
                                            {account.type === 'CREDIT' && (
                                                <div className="w-full h-1 bg-app-subtle rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${usage > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                        style={{ width: `${Math.min(usage, 100)}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </SwipeableItem>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center py-16 opacity-50 border-2 border-dashed border-app-border rounded-2xl bg-app-subtle/20">
                                <div className="size-16 rounded-full bg-app-subtle flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-3xl text-app-muted">account_balance</span>
                                </div>
                                <p className="text-sm font-bold text-app-text">Sin Cuentas</p>
                                <p className="text-xs text-app-muted max-w-[200px] text-center mt-1">
                                    Registra tus tarjetas o efectivo para ver tu balance real.
                                </p>
                                <button onClick={() => openAccountSheet()} className="mt-4 text-xs font-bold text-app-primary hover:underline">
                                    + Crear primera cuenta
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* DETAILS MODAL */}
            <AccountDetailSheet
                account={selectedAccount}
                onClose={() => setSelectedAccount(null)}
                onEdit={() => {
                    if (selectedAccount) {
                        setSelectedAccount(null);
                        openAccountSheet(selectedAccount);
                    }
                }}
                onDelete={() => {
                    if (selectedAccount) {
                        // Primero confirmamos antes de cerrar
                        handleDelete(selectedAccount);
                        // Cerrar sheet solo despues
                        setSelectedAccount(null);
                    }
                }}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};

export default AccountsPage;