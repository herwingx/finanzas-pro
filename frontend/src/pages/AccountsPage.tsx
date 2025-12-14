import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';
import { PageHeader } from '../components/PageHeader';
import { useAccounts, useProfile, useDeleteAccount } from '../hooks/useApi';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { SkeletonTransactionList } from '../components/Skeleton';
import { AccountType } from '../types';

const AccountsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: accounts, isLoading, isError } = useAccounts();
    const { data: profile } = useProfile();
    const deleteAccountMutation = useDeleteAccount();

    const handleDelete = (account: any) => {
        toast.custom((t) => (
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col gap-3 shadow-lg max-w-sm w-full font-sans">
                <p className="text-app-text font-bold text-sm">¿Eliminar cuenta "{account.name}"?</p>
                <p className="text-app-muted text-xs">Por seguridad, solo podrás eliminar esta cuenta si no tiene transacciones registradas.</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-app-elevated text-app-text hover:bg-app-hover transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t);
                            try {
                                await deleteAccountMutation.mutateAsync(account.id);
                                toastSuccess('Cuenta eliminada');
                            } catch (error: any) {
                                if (error.message.includes('associated transactions') || error.message.includes('in-use')) {
                                    toastError('No se puede eliminar: Tiene transacciones asociadas.');
                                } else {
                                    toastError('Error al eliminar cuenta.');
                                }
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-app-danger text-white hover:bg-app-danger/90 transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const formatCurrency = useMemo(() => (value: number) => {
        const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
        return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
    }, [profile?.currency]);

    if (isLoading) {
        return (
            <div className="pb-28 animate-fade-in bg-app-bg text-app-text font-sans">
                <PageHeader title="Mis Cuentas" showBackButton={false} />
                <div className="px-4 mt-6">
                    <SkeletonTransactionList count={5} />
                </div>
            </div>
        );
    }

    if (isError) {
        return <div className="p-8 text-center text-app-danger">Error cargando cuentas. Por favor recarga.</div>;
    }

    // Calculate summaries for the top section
    const totalAssets = accounts
        ?.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH')
        .reduce((sum, acc) => sum + acc.balance, 0) || 0;
    const totalDebt = accounts
        ?.filter(acc => acc.type === 'CREDIT')
        .reduce((sum, acc) => sum + acc.balance, 0) || 0; // Credit balances are stored as positive debt
    const netWorth = totalAssets - totalDebt;

    const getAccountStyle = (type: AccountType) => {
        switch (type) {
            case 'CREDIT': return {
                icon: 'credit_card',
                bgClass: 'bg-app-credit-bg',
                textClass: 'text-app-credit',
                label: 'Tarjeta de Crédito'
            };
            case 'DEBIT': return {
                icon: 'account_balance',
                bgClass: 'bg-app-debit-bg',
                textClass: 'text-app-debit',
                label: 'Tarjeta de Débito'
            };
            case 'CASH': return {
                icon: 'payments',
                bgClass: 'bg-app-cash-bg',
                textClass: 'text-app-cash',
                label: 'Efectivo'
            };
            default: return {
                icon: 'account_balance_wallet',
                bgClass: 'bg-app-primary/10',
                textClass: 'text-app-primary',
                label: 'Cuenta'
            };
        }
    };

    return (
        <div className="bg-app-bg text-app-text font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-app-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-app-danger/10 rounded-full blur-[100px]" />
            </div>

            <PageHeader title="Mis Cuentas" showBackButton={false} />

            {/* Summary Cards */}
            <div className="px-4 mt-6 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-app-card border border-app-border rounded-2xl p-3 text-center">
                        <p className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Activos</p>
                        <p className="text-base font-bold text-app-success mt-1">{formatCurrency(totalAssets)}</p>
                    </div>
                    <div className="bg-app-card border border-app-border rounded-2xl p-3 text-center">
                        <p className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Deuda</p>
                        <p className="text-base font-bold text-app-danger mt-1">-{formatCurrency(totalDebt)}</p>
                    </div>
                    <div className={`bg-app-card border rounded-2xl p-3 text-center ${netWorth >= 0 ? 'border-app-success/30' : 'border-app-danger/30'}`}>
                        <p className="text-[10px] text-app-muted font-bold uppercase tracking-wide">Neto</p>
                        <p className={`text-base font-bold mt-1 ${netWorth >= 0 ? 'text-app-success' : 'text-app-danger'}`}>
                            {formatCurrency(netWorth)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Accounts List */}
            <div className="px-4 mt-6 pb-20">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-app-muted uppercase tracking-wider">Mis Cuentas</h2>
                    <Link to="/accounts/new" className="text-xs font-bold text-app-primary hover:text-app-primary/80 flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-sm">add_circle</span>
                        Nueva
                    </Link>
                </div>

                <div className="space-y-3">
                    {accounts && accounts.length > 0 ? (
                        accounts.map(account => {
                            const style = getAccountStyle(account.type);
                            const usagePercent = account.type === 'CREDIT' && account.creditLimit
                                ? (account.balance / account.creditLimit) * 100
                                : null;

                            return (
                                <SwipeableItem
                                    key={account.id}
                                    onSwipeRight={() => navigate(`/accounts/edit/${account.id}?mode=edit`)}
                                    rightAction={{
                                        icon: 'edit',
                                        color: '#1A53FF',
                                        label: 'Editar',
                                    }}
                                    onSwipeLeft={() => handleDelete(account)}
                                    leftAction={{
                                        icon: 'delete',
                                        color: '#F50F56',
                                        label: 'Eliminar',
                                    }}
                                    className="rounded-2xl"
                                >
                                    <div
                                        onClick={() => navigate(`/accounts/edit/${account.id}`)}
                                        className="group flex items-center gap-3 bg-app-card border border-app-border p-4 rounded-2xl hover:border-app-primary/30 transition-all cursor-pointer"
                                    >
                                        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${style.bgClass}`}>
                                            <span className={`material-symbols-outlined text-xl ${style.textClass}`}>{style.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-app-text truncate">{account.name}</p>
                                            <p className="text-xs text-app-muted">{style.label}</p>
                                            {usagePercent !== null && (
                                                <div className="mt-2">
                                                    <div className="h-1.5 bg-app-elevated rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-app-danger' :
                                                                usagePercent > 50 ? 'bg-amber-500' : 'bg-app-success'
                                                                }`}
                                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-app-muted mt-1">
                                                        {usagePercent.toFixed(0)}% utilizado
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-bold ${account.type === 'CREDIT' ? 'text-app-credit' : style.textClass}`}>
                                                {account.type === 'CREDIT' ? '-' : ''}{formatCurrency(account.balance)}
                                            </p>
                                            {account.type === 'CREDIT' && account.creditLimit !== undefined && (
                                                <p className="text-[10px] text-app-muted mt-0.5">
                                                    de {formatCurrency(account.creditLimit)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </SwipeableItem>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-app-muted bg-app-card/50 rounded-2xl border border-dashed border-app-border">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-30">account_balance_wallet</span>
                            <p className="text-sm font-medium">No has creado cuentas aún</p>
                            <Link to="/accounts/new" className="mt-3 px-4 py-2 bg-app-primary text-white text-sm font-bold rounded-xl hover:bg-app-primary/90 transition-colors">
                                Crear primera cuenta
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
