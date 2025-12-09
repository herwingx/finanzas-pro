import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useUpdateRecurringTransaction, useDeleteRecurringTransaction } from '../hooks/useApi';
import { RecurringTransaction, Category } from '../types';
import { toast } from 'sonner';
import { PageHeader } from '../components/PageHeader';

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
                        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg font-semibold">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 rounded-lg font-semibold bg-app-primary text-white disabled:opacity-50">{isSaving ? 'Guardando...' : 'Guardar'}</button>
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
        <div className="pb-24 bg-app-bg min-h-screen text-app-text">
            <PageHeader title="Gastos Recurrentes" />

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {isLoadingRecurring || isLoadingCategories ? <p>Cargando...</p> :
                    recurring?.map(tx => {
                        const category = getCategory(tx.categoryId);
                        return (
                            <div key={tx.id} className="bg-app-card p-4 rounded-2xl border border-app-border flex items-center gap-4">
                                <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${category?.color}20`, color: category?.color }}><span className="material-symbols-outlined">{category?.icon}</span></div>
                                <div className="flex-1">
                                    <p className="font-bold">{tx.description}</p>
                                    <p className="text-xs text-app-muted">{category?.name}</p>
                                </div>
                                <p className="font-bold">${tx.amount.toFixed(2)}</p>
                                <button onClick={() => setEditingTx(tx)} className="p-2 rounded-md hover:bg-app-elevated"><span className="material-symbols-outlined text-base">edit</span></button>
                                <button onClick={() => setDeletingId(tx.id)} className="p-2 rounded-md hover:bg-app-elevated text-red-500"><span className="material-symbols-outlined text-base">delete</span></button>
                            </div>
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
                                className="px-4 py-2 rounded-lg font-semibold hover:bg-app-elevated"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
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
