import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useUpdateRecurringTransaction, useDeleteRecurringTransaction } from '../hooks/useApi';
import { RecurringTransaction, Category } from '../types';
import toast from 'react-hot-toast';

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
                        <input type="text" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} className="w-full p-2 bg-app-elevated rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-app-muted uppercase">Monto</label>
                        <input type="number" value={formState.amount} onChange={e => setFormState({...formState, amount: parseFloat(e.target.value)})} className="w-full p-2 bg-app-elevated rounded-lg mt-1" />
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
    
    const [editingTx, setEditingTx] = useState<RecurringTransaction | null>(null);

    const handleSave = async (updatedTx: RecurringTransaction) => {
        try {
            await updateMutation.mutateAsync({ id: updatedTx.id, transaction: updatedTx });
            toast.success("Actualizado con éxito");
            setEditingTx(null);
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const getCategory = (id: string) => categories?.find(c => c.id === id);

    return (
        <div className="pb-24 bg-app-bg min-h-screen text-app-text">
            <header className="sticky top-0 z-20 p-4 bg-app-bg/80 backdrop-blur-xl border-b border-app-border">
                <h1 className="font-bold text-center">Gastos Recurrentes</h1>
            </header>
            
            <div className="p-4 max-w-lg mx-auto space-y-4">
                {isLoadingRecurring || isLoadingCategories ? <p>Cargando...</p> :
                    recurring?.map(tx => {
                        const category = getCategory(tx.categoryId);
                        return (
                            <div key={tx.id} className="bg-app-card p-4 rounded-2xl border border-app-border flex items-center gap-4">
                                <div className="size-10 rounded-full flex items-center justify-center" style={{backgroundColor: `${category?.color}20`, color: category?.color}}><span className="material-symbols-outlined">{category?.icon}</span></div>
                                <div className="flex-1">
                                    <p className="font-bold">{tx.description}</p>
                                    <p className="text-xs text-app-muted">{category?.name}</p>
                                </div>
                                <p className="font-bold">${tx.amount.toFixed(2)}</p>
                                <button onClick={() => setEditingTx(tx)} className="p-2 rounded-md hover:bg-app-elevated"><span className="material-symbols-outlined text-base">edit</span></button>
                            </div>
                        )
                    })
                }
            </div>

            {editingTx && <EditRecurringModal transaction={editingTx} categories={categories} onSave={handleSave} onCancel={() => setEditingTx(null)} isSaving={updateMutation.isLoading} />}
        </div>
    );
};

export default Recurring;
