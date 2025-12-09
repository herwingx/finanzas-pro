import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useAccounts, useProfile } from '../hooks/useApi';
import { AccountType } from '../types';

const AccountsPage: React.FC = () => {
    const { data: accounts, isLoading, isError } = useAccounts();
    const { data: profile } = useProfile();

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
            <div className="flex items-center justify-center min-h-screen bg-app-bg">
                <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
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
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
            <PageHeader title="Mis Cuentas" showBackButton={false} />

            {/* Summary Cards */}
            <div className="px-4 mt-4 space-y-4">
                <div className="bg-app-card border border-app-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-app-text">Activos Totales:</span>
                    <span className="text-lg font-bold text-app-success">{formatCurrency(totalAssets)}</span>
                </div>
                <div className="bg-app-card border border-app-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-app-text">Deuda Total:</span>
                    <span className="text-lg font-bold text-app-danger">-{formatCurrency(totalDebt)}</span>
                </div>
                <div className="bg-app-card border border-app-border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-app-text">Patrimonio Neto:</span>
                    <span className="text-lg font-bold text-app-text">{formatCurrency(netWorth)}</span>
                </div>
            </div>

            {/* Accounts List */}
            <div className="px-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-app-text">Cuentas</h2>
                    <Link to="/accounts/new" className="bg-app-primary text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md hover:bg-app-primary/90 flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">add</span>
                        Nueva Cuenta
                    </Link>
                </div>

                <div className="space-y-3">
                    {accounts && accounts.length > 0 ? (
                        accounts.map(account => (
                            <Link to={`/accounts/edit/${account.id}`} key={account.id} className="group flex items-center gap-4 bg-app-card border border-app-border p-3 rounded-xl hover:bg-app-elevated">
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
                            </Link>
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
