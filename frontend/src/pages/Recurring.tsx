import React, { useState } from 'react';
import { SwipeableItem } from '../components/SwipeableItem';
import { useNavigate } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useUpdateRecurringTransaction, useDeleteRecurringTransaction } from '../hooks/useApi';
import { RecurringTransaction, Category } from '../types';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';

const EditRecurringModal: React.FC<any> = ({ transaction, categories, onSave, onCancel, isSaving }) => {
    const [formState, setFormState] = useState(transaction);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-app-card rounded-2xl p-6 w-full max-w-sm">
                <h3 className="font-bold text-lg mb-4">Editar Recurrente</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Simplified Form Fields */}
                    <div>
                        <label className="text-xs font-bold text-app-muted uppercase">Descripción</label>
                        <input type="text" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} className="w-full p-2 bg-app-elevated rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-app-muted uppercase">Monto</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*\.?[0-9]*"
                            value={formState.amount}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                    setFormState({ ...formState, amount: val === '' ? 0 : parseFloat(val) });
                                }
                            }}
                            className="w-full p-2 bg-app-elevated rounded-lg mt-1"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onCancel} className="btn-modern btn-ghost px-4 py-2 rounded-lg font-semibold">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="btn-modern btn-primary px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Recurring: React.FC = () => {
    const navigate = useNavigate();
    const { data: recurring, isLoading: isLoadingRecurring } = useRecurringTransactions();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const updateMutation = useUpdateRecurringTransaction();
    const deleteMutation = useDeleteRecurringTransaction();

    const [editingTx, setEditingTx] = useState<RecurringTransaction | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSave = async (updatedTx: RecurringTransaction) => {
        try {
            await updateMutation.mutateAsync({ id: updatedTx.id, transaction: updatedTx });
            toast.success("Actualizado con éxito");
            setEditingTx(null);
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("Transacción recurrente eliminada");
            setDeletingId(null);
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const getCategory = (id: string) => categories?.find(c => c.id === id);

    return (
        <div className="pb-24 bg-app-bg min-h-screen text-app-text relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>
            <PageHeader title="Gastos Recurrentes" />

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {isLoadingRecurring || isLoadingCategories ? <SkeletonTransactionList count={5} /> :
                    recurring?.map(tx => {
                        const category = getCategory(tx.categoryId);
                        return (
                            <SwipeableItem
                                key={tx.id}
                                onSwipeRight={() => setEditingTx(tx)}
                                rightAction={{
                                    icon: 'edit',
                                    color: '#3b82f6',
                                    label: 'Editar',
                                }}
                                onSwipeLeft={() => setDeletingId(tx.id)}
                                leftAction={{
                                    icon: 'delete',
                                    color: '#ef4444',
                                    label: 'Eliminar',
                                }}
                                className="rounded-2xl"
                            >
                                <div className="card-modern bg-app-card p-4 rounded-2xl border border-app-border flex items-center gap-4 transition-premium hover:shadow-md">
                                    <div className="size-10 rounded-full flex items-center justify-center p-2" style={{ backgroundColor: `${category?.color}20`, color: category?.color }}><span className="material-symbols-outlined">{category?.icon}</span></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{tx.description}</p>
                                        <p className="text-xs text-app-muted">{category?.name}</p>
                                    </div>
                                    <p className="font-bold">${tx.amount.toFixed(2)}</p>
                                </div>
                            </SwipeableItem>
                        )
                    })
                }
            </div>

            {editingTx && <EditRecurringModal transaction={editingTx} categories={categories} onSave={handleSave} onCancel={() => setEditingTx(null)} isSaving={updateMutation.isPending} />}

            {deletingId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-2">¿Eliminar transacción recurrente?</h3>
                        <p className="text-sm text-app-muted mb-6">
                            Esto eliminará la plantilla recurrente y no se generarán más transacciones automáticas.
                            Las transacciones ya creadas no se eliminarán.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="btn-modern btn-ghost px-4 py-2 rounded-lg font-semibold hover:bg-app-elevated"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                disabled={deleteMutation.isPending}
                                className="btn-modern bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg font-semibold disabled:opacity-50 shadow-md"
                            >
                                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recurring;
