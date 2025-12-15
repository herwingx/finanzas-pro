import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';
import { PageHeader } from '../components/PageHeader';
import { useAccounts, useProfile, useDeleteAccount } from '../hooks/useApi';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { AccountType } from '../types';

// Skeleton muy simple (Inline por simplicidad si no se exporta)
const SkeletonAccounts = () => (
    <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
    </div>
);

const AccountsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: accounts, isLoading, isError } = useAccounts();
    const { data: profile } = useProfile();
    const deleteAccountMutation = useDeleteAccount();

    const handleDelete = (account: any) => {
        toast.custom((t) => (
            <div className="bg-app-surface border border-app-border rounded-xl shadow-lg p-4 font-sans max-w-sm w-full animate-fade-in">
                <div className="flex gap-4">
                    <div className="size-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">warning</span>
                    </div>
                    <div>
                        <p className="text-app-text font-bold text-sm">¿Eliminar "{account.name}"?</p>
                        <p className="text-xs text-app-muted mt-1 leading-snug">
                            Si tiene movimientos históricos, no podrás eliminarla por integridad contable.
                        </p>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-app-muted bg-app-subtle hover:text-app-text transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    toast.dismiss(t);
                                    try {
                                        await deleteAccountMutation.mutateAsync(account.id);
                                        toastSuccess('Cuenta eliminada correctamente');
                                    } catch (error: any) {
                                        // Mejor manejo de error para usuario
                                        if (error.message.includes('associated') || error.message.includes('foreign key')) {
                                            toastError('Imposible eliminar', 'Tiene transacciones registradas.');
                                        } else {
                                            toastError('Error al eliminar');
                                        }
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                            >
                                Confirmar Eliminación
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const formatCurrency = useMemo(() => (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: profile?.currency || 'USD',
            minimumFractionDigits: 0
        }).format(value);
    }, [profile?.currency]);

    // Resumen KPIs
    const totalAssets = useMemo(() => accounts?.filter(a => ['DEBIT', 'CASH', 'SAVINGS'].includes(a.type)).reduce((s, a) => s + a.balance, 0) || 0, [accounts]);
    const totalDebt = useMemo(() => accounts?.filter(a => a.type === 'CREDIT').reduce((s, a) => s + a.balance, 0) || 0, [accounts]);
    const netWorth = totalAssets - totalDebt;

    // Helpers UI
    const getAccountConfig = (type: AccountType) => {
        switch (type) {
            case 'CREDIT': return { icon: 'credit_card', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', label: 'Crédito' };
            case 'DEBIT': return { icon: 'account_balance', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Débito' };
            case 'CASH': return { icon: 'payments', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', label: 'Efectivo' };
            default: return { icon: 'account_balance_wallet', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'General' };
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh bg-app-bg animate-pulse">
                <PageHeader title="Mis Cuentas" showBackButton={false} />
                <div className="px-4 py-6">
                    <SkeletonAccounts />
                </div>
            </div>
        );
    }

    if (isError) return <div className="p-10 text-center text-app-muted">Error cargando cuentas</div>;

    return (
        <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
            <PageHeader title="Mis Cuentas" showBackButton={false} />

            <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 lg:pb-8">

                {/* Scorecards */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-app-surface p-3 rounded-2xl border border-app-border text-center shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Activos</p>
                        <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{formatCurrency(totalAssets)}</p>
                    </div>
                    <div className="bg-app-surface p-3 rounded-2xl border border-app-border text-center shadow-sm">
                        <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Deuda</p>
                        <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">-{formatCurrency(totalDebt)}</p>
                    </div>
                    <div className="bg-app-surface p-3 rounded-2xl border border-app-border text-center shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${netWorth >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <p className="text-[10px] uppercase font-bold text-app-muted tracking-wider">Patrimonio</p>
                        <p className={`text-base font-bold mt-1 tabular-nums ${netWorth >= 0 ? 'text-app-text' : 'text-rose-600'}`}>{formatCurrency(netWorth)}</p>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Cuentas</h2>
                    {/* Add Account Link Styled as Icon Button for Mobile, Button for Desktop */}
                    <Link to="/accounts/new" className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold">
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nueva Cuenta</span>
                    </Link>
                </div>

                {/* Accounts Grid/List */}
                <div className="space-y-3">
                    {accounts && accounts.length > 0 ? (
                        accounts.map(account => {
                            const conf = getAccountConfig(account.type);
                            const usagePercent = account.type === 'CREDIT' && account.creditLimit
                                ? (account.balance / account.creditLimit) * 100
                                : 0;

                            const isOverLimit = usagePercent > 90;

                            return (
                                <SwipeableItem
                                    key={account.id}
                                    onSwipeRight={() => navigate(`/accounts/edit/${account.id}?mode=edit`)}
                                    leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                                    onSwipeLeft={() => handleDelete(account)}
                                    rightAction={{ icon: 'delete', color: '#EF4444', label: 'Eliminar' }}
                                    className="mb-3"
                                >
                                    <div
                                        onClick={() => navigate(`/accounts/edit/${account.id}`)}
                                        className="bg-app-surface border border-app-border rounded-2xl p-4 md:p-5 flex gap-4 items-center hover:border-app-border/80 cursor-pointer transition-all active:scale-[0.99] shadow-sm hover:shadow-md"
                                    >
                                        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${conf.bg} ${conf.text}`}>
                                            <span className="material-symbols-outlined text-2xl">{conf.icon}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-app-text text-[15px] truncate pr-2 leading-tight">{account.name}</h3>
                                                    <p className="text-xs text-app-muted">{conf.label}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold tabular-nums text-[15px] ${account.type === 'CREDIT' ? 'text-rose-600 dark:text-rose-400' : 'text-app-text'}`}>
                                                        {account.type === 'CREDIT' ? '-' : ''}{formatCurrency(account.balance)}
                                                    </p>
                                                    {account.type === 'CREDIT' && (
                                                        <p className="text-[10px] text-app-muted mt-0.5 font-medium">Límite: {formatCurrency(account.creditLimit || 0)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Credit Card Progress Bar */}
                                            {account.type === 'CREDIT' && account.creditLimit && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className={`text-[10px] font-bold ${isOverLimit ? 'text-rose-500' : 'text-app-muted'}`}>
                                                            {usagePercent.toFixed(0)}% Utilizado
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${isOverLimit ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </SwipeableItem>
                            );
                        })
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50 border border-dashed border-app-border rounded-2xl bg-app-subtle/30">
                            <span className="material-symbols-outlined text-4xl mb-3 text-app-muted">savings</span>
                            <p className="text-sm font-bold text-app-text">Sin Cuentas Registradas</p>
                            <p className="text-xs text-app-muted mb-4 max-w-[200px]">Añade tu cuenta bancaria o efectivo para comenzar.</p>
                            <Link to="/accounts/new" className="btn btn-primary text-xs px-4 py-2 h-auto min-h-0 rounded-lg shadow-lg">Agregar Cuenta</Link>
                        </div>
                    )}
                </div>

                {/* FAB Mobile Only if bottomNav not used, otherwise rely on that */}
            </div>
        </div>
    );
};

export default AccountsPage;