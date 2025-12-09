import React, { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useInstallmentPurchases, useProfile } from '../hooks/useApi';
import { Link } from 'react-router-dom';

const InstallmentsPage: React.FC = () => {
    const { data: purchases, isLoading, isError } = useInstallmentPurchases();
    const { data: profile } = useProfile();

    const formatCurrency = useMemo(() => (value: number) => {
        const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
        return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
    }, [profile?.currency]);

    const activePurchases = useMemo(() => {
        return purchases?.filter(p => p.paidAmount < p.totalAmount) || [];
    }, [purchases]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div></div>;
    }

    if (isError) {
        return <div className="p-4 text-center text-app-danger">Error al cargar las compras a meses.</div>;
    }

    return (
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
            <PageHeader title="Mis Meses Sin Intereses" />

            <div className="p-4 space-y-4">
                {activePurchases.length === 0 ? (
                    <div className="text-center py-20 text-app-muted">
                        <span className="material-symbols-outlined text-5xl mb-2">credit_card_off</span>
                        <p>No tienes compras a MSI activas.</p>
                    </div>
                ) : (
                    activePurchases.map(purchase => {
                        const paidAmount = purchase.paidAmount;
                        const remainingAmount = purchase.totalAmount - paidAmount;
                        const progressPercentage = (paidAmount / purchase.totalAmount) * 100;

                        return (
                            <Link to={`/installments/edit/${purchase.id}`} key={purchase.id} className="group bg-app-card border border-app-border rounded-2xl p-4 space-y-3 hover:bg-app-elevated transition-colors block">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-app-text">{purchase.description}</p>
                                        <p className="text-xs text-app-muted">{purchase.account?.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-app-text">{formatCurrency(purchase.monthlyPayment)}</p>
                                        <p className="text-xs text-app-muted">mensual</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-app-muted mb-1">
                                        <span>Pagado: {formatCurrency(paidAmount)}</span>
                                        <span>Restante: {formatCurrency(remainingAmount)}</span>
                                    </div>
                                    <div className="w-full bg-app-elevated rounded-full h-2.5">
                                        <div className="bg-app-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                                    </div>
                                    <div className="text-center text-xs text-app-muted mt-1">
                                        {purchase.paidInstallments} de {purchase.installments} mensualidades pagadas
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default InstallmentsPage;
