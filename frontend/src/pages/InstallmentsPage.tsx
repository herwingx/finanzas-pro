import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useInstallmentPurchases, useProfile, useDeleteInstallmentPurchase } from '../hooks/useApi';
import { SkeletonTransactionList } from '../components/Skeleton';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { Link, useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';

const InstallmentsPage: React.FC = () => {
    const { data: purchases, isLoading, isError } = useInstallmentPurchases();
    const { data: profile } = useProfile();
    const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
    const navigate = useNavigate();
    const deleteMutation = useDeleteInstallmentPurchase();

    const handleDelete = (purchase: any) => {
        const isSettled = (purchase.totalAmount - purchase.paidAmount) <= 0.05;

        toast.custom((t) => (
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col gap-3 shadow-lg max-w-sm w-full font-sans">
                <div className="flex items-start gap-3">
                    <div className="size-10 rounded-full bg-app-danger/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-app-danger">warning</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-app-text font-bold text-sm mb-1">
                            {isSettled ? '⚠️ ELIMINAR PLAN LIQUIDADO' : '¿Eliminar plan MSI completo?'}
                        </p>
                        <p className="text-app-muted text-xs mb-2">"{purchase.description}"</p>
                    </div>
                </div>

                <div className="bg-app-elevated rounded-lg p-3 space-y-1">
                    <p className="text-xs font-bold text-app-danger mb-1">Se eliminarán:</p>
                    <ul className="text-xs text-app-muted space-y-0.5 ml-4 list-disc">
                        <li>El plan MSI completo</li>
                        <li>Todos los pagos registrados ({purchase.paidInstallments} pagos)</li>
                        <li>Todas las transacciones asociadas</li>
                    </ul>
                    {isSettled && (
                        <p className="text-xs text-app-danger font-medium mt-2">
                            ⚠️ Esto afectará tu historial contable
                        </p>
                    )}
                </div>

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
                                await deleteMutation.mutateAsync(purchase.id);
                                toastSuccess('Plan MSI eliminado');
                            } catch (error) {
                                toastError('Error al eliminar');
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-app-danger text-white hover:bg-app-danger/90 transition-colors"
                    >
                        Eliminar Todo
                    </button>
                </div>
            </div>
        ), { duration: Infinity });
    };

    const formatCurrency = useMemo(() => (value: number) => {
        const locales: Record<string, string> = { 'USD': 'en-US', 'EUR': 'de-DE', 'GBP': 'en-GB', 'MXN': 'es-MX' };
        return new Intl.NumberFormat(locales[profile?.currency || 'USD'] || 'es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(value);
    }, [profile?.currency]);

    const activePurchases = useMemo(() => {
        return purchases?.filter(p => p.paidAmount < p.totalAmount) || [];
    }, [purchases]);

    const settledPurchases = useMemo(() => {
        return purchases?.filter(p => p.paidAmount >= p.totalAmount) || [];
    }, [purchases]);

    const displayedPurchases = useMemo(() => {
        return activeTab === 'active' ? activePurchases : settledPurchases;
    }, [activeTab, activePurchases, settledPurchases]);

    if (isLoading) {
        return (
            <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
                <PageHeader title="Mis Meses Sin Intereses" />
                <div className="p-4 space-y-4">
                    <SkeletonTransactionList count={5} />
                </div>
            </div>
        );
    }

    if (isError) {
        return <div className="p-4 text-center text-app-danger">Error al cargar las compras a meses.</div>;
    }

    return (
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>
            <PageHeader title="Mis Meses Sin Intereses" />

            <div className="flex justify-around p-1 bg-app-card rounded-2xl border border-app-border mx-4 mb-4">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'active' ? 'bg-app-primary text-white' : 'text-app-muted'}`}
                >
                    Activos
                </button>
                <button
                    onClick={() => setActiveTab('settled')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === 'settled' ? 'bg-app-primary text-white' : 'text-app-muted'}`}
                >
                    Liquidados
                </button>
            </div>

            <div className="p-4 space-y-4">
                {displayedPurchases.length === 0 ? (
                    <div className="text-center py-20 text-app-muted">
                        <span className="material-symbols-outlined text-5xl mb-2">credit_card_off</span>
                        <p>No tienes compras a MSI {activeTab === 'active' ? 'activas' : 'liquidadas'}.</p>
                    </div>
                ) : (
                    displayedPurchases.map(purchase => {
                        const paidAmount = purchase.paidAmount;
                        const remainingAmount = purchase.totalAmount - paidAmount;
                        const progressPercentage = (paidAmount / purchase.totalAmount) * 100;

                        return (
                            <SwipeableItem
                                key={purchase.id}
                                onSwipeRight={() => navigate(`/installments/edit/${purchase.id}?mode=edit`)}
                                rightAction={{
                                    icon: 'edit',
                                    color: '#3b82f6',
                                    label: 'Editar',
                                }}
                                onSwipeLeft={() => handleDelete(purchase)}
                                leftAction={{
                                    icon: 'delete',
                                    color: '#ef4444',
                                    label: 'Eliminar',
                                }}
                                className="rounded-2xl"
                            >
                                <div
                                    onClick={() => navigate(`/installments/edit/${purchase.id}`)}
                                    className="card-modern bg-app-card border border-app-border rounded-2xl p-4 space-y-3 hover:shadow-md transition-premium block cursor-pointer"
                                >
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
                                </div>
                            </SwipeableItem>
                        );
                    })
                )}
            </div>

            {/* FAB to add new MSI */}
            <button
                onClick={() => navigate('/installments/new')}
                className="fixed bottom-24 right-4 size-14 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full shadow-xl shadow-amber-500/30 flex items-center justify-center hover:scale-105 transition-transform z-40"
            >
                <span className="material-symbols-outlined text-2xl">add</span>
            </button>
        </div>
    );
};

export default InstallmentsPage;
