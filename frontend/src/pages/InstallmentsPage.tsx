import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useInstallmentPurchases, useProfile, useDeleteInstallmentPurchase } from '../hooks/useApi';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { SkeletonAccountList } from '../components/Skeleton';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';

// Utils
import { toastSuccess, toastError } from '../utils/toast';
import { formatDateUTC } from '../utils/dateUtils';
import { InstallmentPurchase } from '../types';

/* ==================================================================================
   SUB-COMPONENT: DETAIL SHEET
   ================================================================================== */
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
    const { openTransactionSheet } = useGlobalSheets();

    if (!purchase) return null;

    /* Metrics Calculation */
    const total = purchase.totalAmount;
    const paid = purchase.paidAmount;
    const remaining = Math.max(0, total - paid);
    const progress = Math.min(100, (paid / total) * 100);
    const isFinished = remaining <= 0.5;

    // Projection Logic
    const nextPayNum = purchase.paidInstallments + 1;
    const nextAmount = Math.min(purchase.monthlyPayment, remaining);

    // Naive next date: purchase date + N months
    const nextDate = new Date(purchase.purchaseDate);
    nextDate.setMonth(nextDate.getMonth() + purchase.paidInstallments);

    /* Handlers */
    const handleManualPayment = () => {
        onClose(); // Close sheet first
        openTransactionSheet(null, {
            type: 'transfer', // Treat as transfer/payment
            amount: nextAmount.toFixed(2),
            description: `Abono a plan: ${purchase.description}`,
            destinationAccountId: purchase.accountId,
            installmentPurchaseId: purchase.id
        });
    };

    return (
        <SwipeableBottomSheet isOpen={true} onClose={onClose}>
            <div className="pt-2 pb-6 px-4 animate-fade-in">

                {/* 1. HERO HEADER */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className={`size-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-md ${isFinished ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                        <span className="material-symbols-outlined">{isFinished ? 'check_circle' : 'credit_card'}</span>
                    </div>

                    <h2 className="text-xl font-bold text-app-text px-4 leading-tight mb-1">{purchase.description}</h2>
                    <p className="text-xs text-app-muted font-medium bg-app-subtle px-3 py-1 rounded-full">
                        {purchase.account?.name || 'Tarjeta desconocida'}
                    </p>
                </div>

                {/* 2. PROGRESS SECTION */}
                <div className="bento-card bg-app-subtle p-5 mb-6 border border-app-border/60">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] uppercase font-bold text-app-muted tracking-widest">Estado del Plan</span>
                        <span className={`text-2xl font-black font-numbers tracking-tight ${isFinished ? 'text-emerald-500' : 'text-app-text'}`}>
                            {isFinished ? 'Completado' : formatCurrency(remaining)}
                        </span>
                    </div>

                    <div className="relative h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-[11px] font-bold text-app-muted">
                        <span>{purchase.paidInstallments} de {purchase.installments} cuotas</span>
                        <span>{progress.toFixed(0)}%</span>
                    </div>
                </div>

                {/* 3. INFO GRID */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-app-surface border border-app-border p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Total Original</p>
                        <p className="font-bold text-app-text tabular-nums">{formatCurrency(total)}</p>
                    </div>
                    <div className="bg-app-surface border border-app-border p-3 rounded-xl">
                        <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Mensualidad</p>
                        <p className="font-bold text-app-text tabular-nums">{formatCurrency(purchase.monthlyPayment)}</p>
                    </div>

                    {!isFinished && (
                        <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-app-surface border border-app-border">
                            <div>
                                <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Próximo cargo estimado</p>
                                <p className="font-bold text-indigo-500 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-sm">event</span>
                                    {formatDateUTC(nextDate, { month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <button
                                onClick={handleManualPayment}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-lg active:scale-95 transition-transform"
                            >
                                Pagar
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. ACTIONS FOOTER */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-app-border">
                    <button
                        onClick={() => { onClose(); onEdit(); }}
                        className="h-12 flex items-center justify-center gap-2 text-sm font-bold text-app-text bg-app-subtle rounded-xl hover:bg-app-border active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar
                    </button>
                    <button
                        onClick={() => { onClose(); onDelete(); }}
                        className="h-12 flex items-center justify-center gap-2 text-sm font-bold text-rose-500 bg-rose-500/10 rounded-xl hover:bg-rose-500/20 active:scale-[0.98] transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
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
const InstallmentsPage: React.FC = () => {
    // 1. Hooks
    const { data: purchases, isLoading } = useInstallmentPurchases();
    const { data: profile } = useProfile();
    const { openInstallmentSheet } = useGlobalSheets();
    const deleteMutation = useDeleteInstallmentPurchase();

    // 2. State
    const [selectedItem, setSelectedItem] = useState<InstallmentPurchase | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InstallmentPurchase | null>(null);
    const [viewMode, setViewMode] = useState<'active' | 'settled'>('active');

    // 3. Filter Logic
    const { activeList, settledList } = useMemo(() => {
        const active: InstallmentPurchase[] = [];
        const settled: InstallmentPurchase[] = [];
        purchases?.forEach(p => {
            const left = p.totalAmount - p.paidAmount;
            if (left > 0.5) active.push(p);
            else settled.push(p);
        });
        return { activeList: active, settledList: settled };
    }, [purchases]);

    const displayedList = viewMode === 'active' ? activeList : settledList;

    // 4. Formatters
    const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: profile?.currency || 'USD'
    }).format(val);

    // 5. Actions
    const handleDelete = (item: InstallmentPurchase) => {
        setSelectedItem(null); // Ensure detail is closed
        setItemToDelete(item); // Open confirmation
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteMutation.mutateAsync({ id: itemToDelete.id });
            toastSuccess('Plan eliminado');
            setItemToDelete(null);
        } catch (e) { toastError('No se pudo eliminar'); }
    };

    if (isLoading) return (
        <div className="min-h-dvh bg-app-bg">
            <PageHeader title="Mis Planes" showBackButton />
            <div className="p-4"><SkeletonAccountList /></div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-app-bg pb-safe md:pb-12 text-app-text font-sans">
            <PageHeader
                title="Compras a Plazos"
                showBackButton
                rightAction={
                    <button
                        onClick={() => openInstallmentSheet()}
                        className="bg-app-text text-app-bg size-7 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform hover:shadow-xl hover:scale-105"
                    >
                        <span className="material-symbols-outlined text-[18px] font-bold">add</span>
                    </button>
                }
            />

            <div className="max-w-3xl mx-auto px-4 pt-4 pb-20 animate-fade-in space-y-6">

                {/* 1. TABS (Segmented Control) */}
                <div className="bg-app-subtle p-1 rounded-xl flex mx-auto max-w-sm">
                    {(['active', 'settled'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === mode
                                ? 'bg-app-surface text-app-text shadow-sm'
                                : 'text-app-muted hover:text-app-text'
                                }`}
                        >
                            {mode === 'active' ? `Activos (${activeList.length})` : `Historial (${settledList.length})`}
                        </button>
                    ))}
                </div>

                {/* 2. LIST */}
                <div className="space-y-4">
                    {displayedList.length > 0 ? displayedList.map(item => {
                        const progress = (item.paidInstallments / item.installments) * 100;
                        const isFinished = progress >= 99;

                        return (
                            <SwipeableItem
                                key={item.id}
                                leftAction={{ icon: 'edit', color: 'text-white', bgColor: 'bg-indigo-500', label: 'Editar' }}
                                rightAction={{ icon: 'delete', color: 'text-white', bgColor: 'bg-rose-500', label: 'Borrar' }}
                                onSwipeRight={() => { setSelectedItem(null); openInstallmentSheet(item); }}
                                onSwipeLeft={() => handleDelete(item)}
                                className="rounded-3xl"
                            >
                                <div
                                    onClick={() => setSelectedItem(item)}
                                    className={`bento-card p-5 relative overflow-hidden group cursor-pointer transition-all hover:border-app-border-strong active:scale-[0.99] bg-app-surface`}
                                >
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`size-10 rounded-xl flex items-center justify-center border shadow-sm ${isFinished ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                                                    <span className="material-symbols-outlined text-lg">{isFinished ? 'check' : 'calendar_month'}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-sm text-app-text truncate">{item.description}</h3>
                                                    <p className="text-[10px] text-app-muted uppercase tracking-wide mt-0.5">{item.account?.name}</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-bold text-base font-numbers tabular-nums">{formatCurrency(item.monthlyPayment)}</p>
                                                <p className="text-[9px] text-app-muted font-bold opacity-60">/ mes</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold text-app-muted uppercase">
                                                <span>Progreso</span>
                                                <span>{item.paidInstallments}/{item.installments} cuotas</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-app-subtle rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-700 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </SwipeableItem>
                        );
                    }) : (
                        <div className="py-20 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-app-border rounded-3xl bg-app-subtle/10">
                            <span className="material-symbols-outlined text-4xl mb-2 text-app-muted">credit_card_off</span>
                            <p className="text-sm font-medium text-app-text">Sin planes en esta vista.</p>
                        </div>
                    )}
                </div>

                {/* 3. DETAILS MODAL */}
                {selectedItem && (
                    <MSIDetailSheet
                        purchase={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onEdit={() => { setSelectedItem(null); openInstallmentSheet(selectedItem); }}
                        onDelete={() => handleDelete(selectedItem)}
                        formatCurrency={formatCurrency}
                    />
                )}

                {/* 4. CONFIRMATION MODAL */}
                {itemToDelete && (
                    <DeleteConfirmationSheet
                        isOpen={!!itemToDelete}
                        onClose={() => setItemToDelete(null)}
                        onConfirm={() => confirmDelete()}
                        itemName={itemToDelete.description}
                        warningMessage="Eliminar plan de pagos"
                        warningDetails={["Esta acción es irreversible.", "Se dejará de considerar en el presupuesto mensual."]}
                        isDeleting={deleteMutation.isPending}
                    />
                )}

            </div>
        </div>
    );
};

export default InstallmentsPage;