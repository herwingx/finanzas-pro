import React, { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useInstallmentPurchases, useProfile, useDeleteInstallmentPurchase } from '../hooks/useApi';
import { toastSuccess, toastError } from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonAccountList } from '../components/Skeleton';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { InstallmentPurchase } from '../types';
import { formatDateUTC } from '../utils/dateUtils';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';

// ============== MSI DETAIL SHEET ==============
// Similar to LoanDetailSheet and RecurringDetailSheet for consistency
const MSIDetailSheet = ({
    purchase,
    onClose,
    onEdit,
    onDelete,
    formatCurrency
}: {
    purchase: InstallmentPurchase | null;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatCurrency: (val: number) => string;
}) => {
    const navigate = useNavigate();

    if (!purchase) return null;

    const paid = purchase.paidAmount;
    const total = purchase.totalAmount;
    const remaining = total - paid;
    const percentPaid = Math.min(100, Math.round((paid / total) * 100));
    const isSettled = remaining <= 0.05;

    // Next payment logic
    const nextPaymentNum = purchase.paidInstallments + 1;
    const nextPaymentAmt = Math.min(purchase.monthlyPayment, remaining);

    // Forecast next payment date
    const nextPaymentDate = new Date(purchase.purchaseDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + nextPaymentNum);

    const handleRegisterPayment = () => {
        navigate(`/new?type=transfer&destinationAccountId=${purchase.accountId}&amount=${nextPaymentAmt.toFixed(2)}&description=${encodeURIComponent(`Pago MSI: ${purchase.description}`)}&installmentPurchaseId=${purchase.id}`);
        onClose();
    };

    return (
        <SwipeableBottomSheet isOpen={!!purchase} onClose={onClose}>
            <div className="text-center mb-6">
                <div className="size-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <span className="material-symbols-outlined">credit_score</span>
                </div>
                <h2 className="text-xl font-bold text-app-text">{purchase.description}</h2>
                <p className="text-sm text-app-muted">{purchase.account?.name}</p>
            </div>

            {/* Balance Card */}
            <div className="bg-app-subtle rounded-2xl p-5 mb-4 text-center border border-app-border/50">
                <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1">Saldo Pendiente</p>
                <div className={`text-4xl font-black tabular-nums tracking-tight ${isSettled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {formatCurrency(remaining)}
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="w-full h-2 bg-app-bg rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isSettled ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percentPaid}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-app-muted font-medium mt-1.5">
                        <span>{purchase.paidInstallments} de {purchase.installments} pagos</span>
                        <span>{percentPaid}%</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-app-bg border border-app-border rounded-xl p-3">
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Total</p>
                    <p className="text-sm font-bold text-app-text tabular-nums">{formatCurrency(total)}</p>
                </div>
                <div className="bg-app-bg border border-app-border rounded-xl p-3">
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Mensualidad</p>
                    <p className="text-sm font-bold text-app-text tabular-nums">{formatCurrency(purchase.monthlyPayment)}</p>
                </div>
                <div className="bg-app-bg border border-app-border rounded-xl p-3">
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Pagado</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(paid)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${!isSettled ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-app-bg border-app-border'}`}>
                    <p className="text-[10px] text-app-muted uppercase font-bold mb-1">
                        {isSettled ? 'Estado' : 'Próximo pago'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        {isSettled ? (
                            <>
                                <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Liquidado</p>
                            </>
                        ) : (
                            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                {formatDateUTC(nextPaymentDate, { style: 'monthYear' })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isSettled
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                    {isSettled ? '✅ Liquidado' : '💳 MSI Activo'}
                </span>
            </div>

            {/* Actions */}
            {!isSettled && (
                <button
                    onClick={handleRegisterPayment}
                    className="w-full py-3.5 rounded-xl bg-app-primary text-white font-bold shadow-lg shadow-app-primary/25 hover:bg-app-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2 mb-4"
                >
                    <span className="material-symbols-outlined">payments</span>
                    Registrar Pago de {formatCurrency(nextPaymentAmt)}
                </button>
            )}

            <div className="flex gap-3">
                <button
                    onClick={onEdit}
                    className="flex-1 btn btn-secondary py-3 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                    {isSettled ? 'Ver Detalle' : 'Editar'}
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 btn bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/40 py-3 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">delete</span>
                    Eliminar
                </button>
            </div>
        </SwipeableBottomSheet>
    );
};

// ============== MAIN COMPONENT ==============
const InstallmentsPage: React.FC = () => {
    const { data: purchases, isLoading, isError } = useInstallmentPurchases();
    const { data: profile } = useProfile();
    const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
    const [itemToDelete, setItemToDelete] = useState<InstallmentPurchase | null>(null);
    const [selectedItem, setSelectedItem] = useState<InstallmentPurchase | null>(null);
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
        setSelectedItem(null);
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

    const handleEdit = (purchase: InstallmentPurchase) => {
        setSelectedItem(null);
        navigate(`/installments/edit/${purchase.id}?mode=edit`);
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
                                    className="mb-3 rounded-2xl"
                                >
                                    <div
                                        onClick={() => setSelectedItem(purchase)}
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
                                            <div className="text-right flex items-center gap-2">
                                                <div>
                                                    <p className="text-sm font-bold text-app-text tabular-nums">{formatCurrency(purchase.monthlyPayment)}</p>
                                                    <p className="text-[10px] text-app-muted font-medium">/ mes</p>
                                                </div>
                                                <span className="material-symbols-outlined text-app-muted text-sm">chevron_right</span>
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

                {/* MSI Detail Sheet */}
                {selectedItem && (
                    <MSIDetailSheet
                        purchase={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onEdit={() => handleEdit(selectedItem)}
                        onDelete={() => handleDelete(selectedItem)}
                        formatCurrency={formatCurrency}
                    />
                )}

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