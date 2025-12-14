import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useDeleteRecurringTransaction, useAccounts } from '../hooks/useApi';
import { SwipeableItem } from '../components/SwipeableItem';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonTransactionList } from '../components/Skeleton';

const Recurring: React.FC = () => {
    // --- Routing ---
    const navigate = useNavigate();

    // --- Data Queries ---
    const { data: recurring, isLoading } = useRecurringTransactions();
    const { data: categories } = useCategories();
    const { data: accounts } = useAccounts();
    const deleteMutation = useDeleteRecurringTransaction();

    // --- Local State ---
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Helpers ---
    const getCategory = (id: string) => categories?.find(c => c.id === id);
    const getAccount = (id: string) => accounts?.find(a => a.id === id);

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            'daily': 'Diario', 'weekly': 'Semanal', 'biweekly': 'Quincenal',
            'monthly': 'Mensual', 'yearly': 'Anual'
        };
        return labels[freq?.toLowerCase()] || freq;
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteMutation.mutateAsync(deletingId);
            toastSuccess('Suscripción eliminada');
            setDeletingId(null);
        } catch (error: any) {
            toastError(error.message || "Error al eliminar");
        }
    };

    // La edición redirige al usuario a la página completa de "New/Edit Recurring" para reusar lógica
    const handleEdit = (id: string) => {
        // Implementaremos lógica de edición pasando props por URL o Context, 
        // pero por ahora redirigimos asumiendo que `NewRecurringPage` soportará modo edición en futuro refactor 
        // (Para este MVP Clean, lo dejaremos como borrar y crear nuevo es más seguro o añadir soporte en el futuro).
        // Como placeholder de UX correcta:
        navigate(`/recurring/edit/${id}`); // Necesitarías configurar esta ruta si quisieras full edit
    };

    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title="Gastos Fijos" showBackButton={true} />

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

                {/* Section Header with Add Button */}
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Suscripciones</h2>
                    <button
                        onClick={() => navigate('/recurring/new')}
                        className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span className="hidden sm:inline">Nuevo</span>
                    </button>
                </div>

                {/* Intro Card */}
                <div className="bento-card p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 border-indigo-100 dark:border-indigo-900">
                    <div className="flex gap-4">
                        <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined">update</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-app-text">Control de Suscripciones</h3>
                            <p className="text-xs text-app-muted mt-1 leading-relaxed">
                                Tus gastos fijos se generarán automáticamente en la fecha correspondiente.
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? <SkeletonTransactionList count={4} /> : (
                    <div className="space-y-4">
                        {recurring?.length === 0 ? (
                            <div className="py-12 flex flex-col items-center text-center opacity-50 border-2 border-dashed border-app-border rounded-3xl">
                                <span className="material-symbols-outlined text-4xl mb-3 text-app-muted">event_busy</span>
                                <p className="text-sm font-medium">Sin recurrentes</p>
                                <button
                                    onClick={() => navigate('/recurring/new')}
                                    className="mt-4 btn btn-secondary text-xs px-4 py-2"
                                >
                                    Crear Primero
                                </button>
                            </div>
                        ) : (
                            recurring?.map(tx => {
                                const category = getCategory(tx.categoryId);
                                const account = getAccount(tx.accountId);
                                const nextDue = new Date(tx.nextDueDate);
                                const isOverdue = nextDue < new Date();

                                return (
                                    <SwipeableItem
                                        key={tx.id}
                                        onSwipeLeft={() => setDeletingId(tx.id)}
                                        leftAction={{ icon: 'delete', color: '#ef4444', label: 'Borrar' }}
                                        // TODO: Add onSwipeRight for edit when supported
                                        className="mb-3"
                                    >
                                        <div className={`
                                            bg-app-surface border p-4 rounded-2xl flex items-center gap-4 cursor-default
                                            ${isOverdue ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30' : 'border-app-border'}
                                        `}>
                                            <div
                                                className="size-12 rounded-2xl flex items-center justify-center shrink-0 border border-transparent"
                                                style={{
                                                    backgroundColor: `${category?.color || '#999'}20`,
                                                    color: category?.color || '#999',
                                                    borderColor: isOverdue ? '#f43f5e' : 'transparent'
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[24px]">
                                                    {isOverdue ? 'warning' : category?.icon || 'refresh'}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-app-text truncate">{tx.description}</h4>

                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-app-muted font-medium">
                                                    <span className="capitalize">{getFrequencyLabel(tx.frequency)}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[100px]">{account?.name}</span>
                                                </div>

                                                {isOverdue && (
                                                    <p className="text-[10px] text-rose-500 font-bold mt-1.5">VENCIDO: {nextDue.toLocaleDateString()}</p>
                                                )}
                                                {!isOverdue && (
                                                    <p className="text-[10px] text-app-muted/80 mt-1">Próximo: {nextDue.toLocaleDateString()}</p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className={`font-bold text-[15px] ${tx.type === 'income' ? 'text-emerald-500' : 'text-app-text'}`}>
                                                    ${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                        </div>
                                    </SwipeableItem>
                                )
                            })
                        )}
                    </div>
                )}

                {/* New Floating Action (Mobile only visual anchor) */}
                <div className="h-16" />
            </div>

            {deletingId && (
                <DeleteConfirmationSheet
                    isOpen={!!deletingId}
                    onClose={() => setDeletingId(null)}
                    onConfirm={handleDelete}
                    itemName="esta suscripción"
                    warningMessage="Detener pago recurrente"
                    warningDetails={['Esto no borrará el historial pasado, solo los cobros futuros.']}
                    isDeleting={deleteMutation.isPending}
                />
            )}
        </div>
    );
};

export default Recurring;