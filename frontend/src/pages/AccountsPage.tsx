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

    const getAccountIcon = (type: AccountType) => {
        switch (type) {
            case 'DEBIT': return 'credit_card';
            case 'CREDIT': return 'receipt_long';
            case 'CASH': return 'payments';
            default: return 'account_balance_wallet';
        }
    };

    if (isLoading) {
        return (
            <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
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

    return (
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-app-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-app-danger/10 rounded-full blur-[100px]" />
            </div>

            <PageHeader title="Mis Cuentas" showBackButton={false} />

            {/* Summary Cards */}
            <div className="px-4 mt-6 space-y-4">
                <div className="relative group overflow-hidden rounded-2xl bg-app-elevated border border-app-border p-4 shadow-sm flex items-center justify-between hover:shadow-glow-sm hover:border-app-success/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-app-success/5 to-transparent opacity-100" />
                    <span className="text-sm font-bold text-app-text-secondary uppercase tracking-wider relative z-10">Activos Totales</span>
                    <span className="text-xl font-bold text-app-success relative z-10 drop-shadow-sm">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="relative group overflow-hidden rounded-2xl bg-app-elevated border border-app-border p-4 shadow-sm flex items-center justify-between hover:shadow-glow-sm hover:border-app-danger/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-app-danger/5 to-transparent opacity-100" />
                    <span className="text-sm font-bold text-app-text-secondary uppercase tracking-wider relative z-10">Deuda Total</span>
                    <span className="text-xl font-bold text-app-danger relative z-10 drop-shadow-sm">-{formatCurrency(totalDebt)}</span>
                </div>
                <div className="relative group overflow-hidden rounded-2xl bg-app-elevated border border-app-border p-4 shadow-sm flex items-center justify-between hover:shadow-glow-md hover:border-app-primary/30 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-app-primary/5 to-transparent opacity-100" />
                    <span className="text-sm font-bold text-app-text-secondary uppercase tracking-wider relative z-10">Patrimonio Neto</span>
                    <span className="text-xl font-bold text-app-text relative z-10">{formatCurrency(netWorth)}</span>
                </div>
            </div>

            {/* Accounts List */}
            <div className="px-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-app-text">Cuentas</h2>
                    <Link to="/accounts/new" className="btn-modern btn-primary text-white text-sm font-bold px-4 py-2 rounded-xl shadow-premium hover:bg-app-primary/90 flex items-center gap-1 transition-transform active:scale-[0.98]">
                        <span className="material-symbols-outlined text-base">add</span>
                        Nueva Cuenta
                    </Link>
                </div>

                <div className="space-y-3">
                    {accounts && accounts.length > 0 ? (
                        accounts.map(account => (
                            <SwipeableItem
                                key={account.id}
                                onSwipeRight={() => navigate(`/accounts/edit/${account.id}?mode=edit`)}
                                rightAction={{
                                    icon: 'edit',
                                    color: '#1A53FF', // Neon Blue
                                    label: 'Editar',
                                }}
                                onSwipeLeft={() => handleDelete(account)}
                                leftAction={{
                                    icon: 'delete',
                                    color: '#F50F56', // Neon Red/Pink
                                    label: 'Eliminar',
                                }}
                                className="rounded-2xl"
                            >
                                <div
                                    onClick={() => navigate(`/accounts/edit/${account.id}`)}
                                    className="card-modern group flex items-center gap-4 bg-app-card border border-app-border p-3 rounded-2xl hover:shadow-md transition-premium cursor-pointer"
                                >
                                    <div className="size-11 rounded-full flex items-center justify-center shrink-0 bg-app-primary/10">
                                        <span className="material-symbols-outlined text-xl text-app-primary">{getAccountIcon(account.type)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-app-text truncate text-sm">{account.name}</p>
                                        <span className="text-xs text-app-muted">{account.type === 'CREDIT' ? 'Tarjeta de Crédito' : account.type === 'DEBIT' ? 'Tarjeta de Débito' : 'Efectivo'}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${account.type === 'CREDIT' ? 'text-app-danger' : 'text-app-success'}`}>{formatCurrency(account.balance)}</p>
                                        {account.type === 'CREDIT' && account.creditLimit !== undefined && (
                                            <span className="text-xs text-app-muted">Límite: {formatCurrency(account.creditLimit)}</span>
                                        )}
                                    </div>
                                </div>
                            </SwipeableItem>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-app-muted bg-app-card/50 rounded-2xl border-dashed border-app-border">
                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">account_balance_wallet</span>
                            <p className="text-sm font-medium">No has creado cuentas aún.</p>
                            <Link to="/accounts/new" className="mt-2 text-app-primary text-sm font-bold hover:underline">Crea tu primera cuenta</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountsPage;
