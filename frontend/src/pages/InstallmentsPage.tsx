import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useInstallmentPurchases, useProfile, useDeleteInstallmentPurchase } from '../hooks/useApi';
import { toastSuccess, toastError } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonAccountList } from '../components/Skeleton';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { InstallmentPurchase } from '../types';

const InstallmentsPage: React.FC = () => {
    const { data: purchases, isLoading, isError } = useInstallmentPurchases();
    const { data: profile } = useProfile();
    const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
    const [itemToDelete, setItemToDelete] = useState<InstallmentPurchase | null>(null);
    const navigate = useNavigate();
    const deleteMutation = useDeleteInstallmentPurchase();

    // Helper: Formato de Moneda
    const formatCurrency = useMemo(() => (value: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: profile?.currency || 'USD', minimumFractionDigits: 0 }).format(value);
    }, [profile?.currency]);

    // Lógica de Tabs
    const activePurchases = useMemo(() => purchases?.filter(p => p.paidAmount < p.totalAmount) || [], [purchases]);
    const settledPurchases = useMemo(() => purchases?.filter(p => p.paidAmount >= p.totalAmount) || [], [purchases]);
    const displayedPurchases = useMemo(() => activeTab === 'active' ? activePurchases : settledPurchases, [activeTab, activePurchases, settledPurchases]);

    // Handle Delete
    const handleDelete = (purchase: InstallmentPurchase) => {
        setItemToDelete(purchase);
    };

    const confirmDelete = (options?: { revertBalance: boolean }) => {
        if (!itemToDelete) return;

        const shouldRevert = options?.revertBalance ?? false;

        deleteMutation.mutate({ id: itemToDelete.id, revert: shouldRevert }, {
            onSuccess: () => {
                toastSuccess('Plan eliminado');
                setItemToDelete(null);
            },
            onError: () => toastError('Error eliminando plan')
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
                <PageHeader title="Mis Planes MSI" showBackButton={true} />
                <div className="max-w-3xl mx-auto px-4 pt-4">
                    <SkeletonAccountList />
                </div>
            </div>
        );
    }

    if (isError) return <div className="p-8 text-center text-rose-500">Error cargando datos.</div>;

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Mis Planes MSI" showBackButton={true} />

            <div className="max-w-3xl mx-auto px-4 pt-4">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center mb-4 px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Planes Activos</h2>
                    <button
                        onClick={() => navigate('/installments/new')}
                        className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nuevo Plan</span>
                    </button>
                </div>

                {/* Modern Tabs (Segmented Control) */}
                <div className="bg-app-subtle p-1 rounded-xl flex mb-6 mx-auto max-w-xs">
                    {(['active', 'settled'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab
                                ? 'bg-app-surface text-app-text shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                : 'text-app-muted hover:text-app-text'}`}
                        >
                            {tab === 'active' ? 'Activos' : 'Liquidados'}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {displayedPurchases.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-app-muted opacity-60">
                            <span className="material-symbols-outlined text-4xl mb-3">credit_card_off</span>
                            <p className="text-sm font-medium">No hay planes {activeTab === 'active' ? 'activos' : 'liquidados'}</p>
                        </div>
                    ) : (
                        displayedPurchases.map(purchase => {
                            const remaining = purchase.totalAmount - purchase.paidAmount;
                            const percent = (purchase.paidInstallments / purchase.installments) * 100;

                            return (
                                <SwipeableItem
                                    key={purchase.id}
                                    onSwipeRight={() => navigate(`/installments/edit/${purchase.id}?mode=edit`)}
                                    leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                                    onSwipeLeft={() => handleDelete(purchase)}
                                    rightAction={{ icon: 'delete', color: '#ef4444', label: 'Eliminar' }}
                                    className="mb-3 rounded-2xl" // Margen para la tarjeta swipeable
                                >
                                    <div
                                        onClick={() => navigate(`/installments/edit/${purchase.id}`)}
                                        className="group bg-app-surface border border-app-border rounded-2xl p-4 md:p-5 hover:border-app-border/80 transition-all active:scale-[0.99] cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 size-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                                    <span className="material-symbols-outlined text-[18px]">credit_score</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-app-text group-hover:text-app-primary transition-colors">{purchase.description}</h3>
                                                    <p className="text-xs text-app-muted">{purchase.account?.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-app-text tabular-nums">{formatCurrency(purchase.monthlyPayment)}</p>
                                                <p className="text-[10px] text-app-muted font-medium">/ mes</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar & Stats */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] text-app-muted font-medium uppercase tracking-wide">
                                                <span>{purchase.paidInstallments} de {purchase.installments} cuotas</span>
                                                <span>Restante: {formatCurrency(remaining)}</span>
                                            </div>

                                            <div className="h-1.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                                    style={{
                                                        width: `${percent}%`,
                                                        backgroundColor: activeTab === 'active' ? 'var(--brand-primary)' : 'var(--text-muted)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SwipeableItem>
                            );
                        })
                    )}
                </div>

                {/* Spacer for safe bottom */}
                <div className="h-16" />

                {/* Delete Confirmation Sheet */}
                {itemToDelete && (
                    <DeleteConfirmationSheet
                        isOpen={!!itemToDelete}
                        onClose={() => setItemToDelete(null)}
                        onConfirm={confirmDelete}
                        itemName={itemToDelete.description}
                        warningLevel={itemToDelete.paidAmount < itemToDelete.totalAmount ? 'warning' : 'normal'}
                        warningMessage={itemToDelete.paidAmount < itemToDelete.totalAmount ? 'Plan Activo' : undefined}
                        warningDetails={[
                            "Se eliminará el plan de tus proyecciones.",
                            "La deuda pendiente se cancelará de la tarjeta."
                        ]}
                        showRevertOption={itemToDelete.paidAmount > 0}
                        revertOptionLabel="Reembolsar pagos realizados (Devolver dinero a mi cuenta)"
                        defaultRevertState={false}
                        isDeleting={deleteMutation.isPending}
                    />
                )}
            </div>
        </div>
    );
};

export default InstallmentsPage;