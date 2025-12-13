import React, { useState, useEffect } from 'react';
import { SwipeableItem } from '../components/SwipeableItem';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecurringTransactions, useCategories, useUpdateRecurringTransaction, useDeleteRecurringTransaction, useAddRecurringTransaction, useAccounts } from '../hooks/useApi';
import { RecurringTransaction, Category, FrequencyType, TransactionType } from '../types';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';

// Modal for editing existing recurring transaction
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

// Modal for creating new recurring transaction
const NewRecurringModal: React.FC<{
    categories: Category[];
    accounts: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
    isSaving: boolean;
}> = ({ categories, accounts, onSave, onCancel, isSaving }) => {
    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [frequency, setFrequency] = useState<FrequencyType>('monthly');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [alreadyPaidCurrent, setAlreadyPaidCurrent] = useState(false);

    const availableCategories = categories.filter(c => c.type === type);

    const calculateNextDueDate = () => {
        const nextDate = new Date(startDate);
        if (alreadyPaidCurrent) {
            if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            else if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (frequency === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
            else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        return nextDate;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        if (!categoryId) {
            toast.error('Selecciona una categoría');
            return;
        }
        if (!accountId) {
            toast.error('Selecciona una cuenta');
            return;
        }

        const nextDueDate = calculateNextDueDate();

        onSave({
            amount: parseFloat(amount),
            description: description || 'Gasto Recurrente',
            categoryId,
            accountId,
            startDate: startDate.toISOString(),
            type,
            frequency,
            active: true,
            nextDueDate: nextDueDate.toISOString(),
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center">
            <div className="bg-app-card rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-app-card border-b border-app-border p-4 flex items-center justify-between">
                    <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-app-elevated">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <h2 className="font-bold text-lg">Nuevo Gasto Recurrente</h2>
                    <div className="w-10"></div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                    {/* Type Toggle */}
                    <div className="flex p-1 bg-app-elevated rounded-xl">
                        <button
                            type="button"
                            onClick={() => { setType('expense'); setCategoryId(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-red-500 text-white' : 'text-app-muted'}`}
                        >
                            Gasto
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('income'); setCategoryId(''); }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-green-500 text-white' : 'text-app-muted'}`}
                        >
                            Ingreso
                        </button>
                    </div>

                    {/* Amount */}
                    <div className="text-center">
                        <label className="text-xs text-app-muted uppercase font-bold">Monto</label>
                        <div className="flex items-center justify-center mt-2">
                            <span className="text-2xl text-app-muted pr-1">$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*\.?[0-9]*"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
                                }}
                                placeholder="0.00"
                                className="text-4xl font-bold bg-transparent text-center max-w-[200px] focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Descripción</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Netflix, Spotify, Renta..."
                            className="w-full p-3 bg-app-elevated rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary"
                        />
                    </div>

                    {/* Account */}
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Cuenta</label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full p-3 bg-app-elevated rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary"
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Categoría</label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {availableCategories.map(cat => (
                                <button
                                    type="button"
                                    key={cat.id}
                                    onClick={() => setCategoryId(cat.id)}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all border-2 ${categoryId === cat.id ? 'border-app-primary bg-app-primary/10' : 'border-transparent hover:bg-app-elevated'
                                        }`}
                                >
                                    <div
                                        className="size-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                    >
                                        <span className="material-symbols-outlined">{cat.icon}</span>
                                    </div>
                                    <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Frecuencia</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {[
                                { value: 'weekly', label: 'Semanal', icon: '7' },
                                { value: 'biweekly', label: 'Quincenal', icon: '14' },
                                { value: 'monthly', label: 'Mensual', icon: '30' },
                            ].map(f => (
                                <button
                                    type="button"
                                    key={f.value}
                                    onClick={() => setFrequency(f.value as FrequencyType)}
                                    className={`p-3 rounded-xl text-center transition-all border-2 ${frequency === f.value
                                        ? 'border-app-primary bg-app-primary/10'
                                        : 'border-app-border hover:border-app-primary/50'
                                        }`}
                                >
                                    <div className="text-lg font-bold">{f.icon}</div>
                                    <div className="text-xs text-app-muted">{f.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Primer Vencimiento</label>
                        <input
                            type="date"
                            value={startDate.toISOString().split('T')[0]}
                            onChange={(e) => setStartDate(new Date(e.target.value + 'T12:00:00'))}
                            className="w-full p-3 bg-app-elevated rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary"
                        />
                    </div>

                    {/* Already Paid Toggle */}
                    <div className="p-4 bg-app-elevated rounded-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-app-success">check_circle</span>
                                <div>
                                    <p className="text-sm font-medium">¿Ya pagué este periodo?</p>
                                    <p className="text-xs text-app-muted">Empieza desde el siguiente</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={alreadyPaidCurrent}
                                    onChange={() => setAlreadyPaidCurrent(!alreadyPaidCurrent)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-app-bg rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-success"></div>
                            </label>
                        </div>
                        {alreadyPaidCurrent && (
                            <p className="text-xs text-app-success mt-2 font-medium">
                                ✓ Primer recordatorio: {calculateNextDueDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-4 bg-app-primary text-white font-bold rounded-xl shadow-lg shadow-app-primary/20 disabled:opacity-50 transition-all hover:bg-app-primary/90"
                    >
                        {isSaving ? 'Guardando...' : 'Crear Gasto Recurrente'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Recurring: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: recurring, isLoading: isLoadingRecurring } = useRecurringTransactions();
    const { data: categories, isLoading: isLoadingCategories } = useCategories();
    const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
    const updateMutation = useUpdateRecurringTransaction();
    const deleteMutation = useDeleteRecurringTransaction();
    const addMutation = useAddRecurringTransaction();

    const [editingTx, setEditingTx] = useState<RecurringTransaction | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);

    // Auto-open modal if ?new=true is in URL
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            setShowNewModal(true);
            // Remove the param from URL to avoid reopening on refresh
            searchParams.delete('new');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const handleSave = async (updatedTx: RecurringTransaction) => {
        try {
            await updateMutation.mutateAsync({ id: updatedTx.id, transaction: updatedTx });
            toast.success("Actualizado con éxito");
            setEditingTx(null);
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const handleCreate = async (newTx: any) => {
        try {
            await addMutation.mutateAsync(newTx);
            const nextDate = new Date(newTx.nextDueDate);
            toast.success(`Recurrente creado. Próximo: ${nextDate.toLocaleDateString('es-MX')}`);
            setShowNewModal(false);
        } catch (error: any) {
            toast.error(error.message || "Error al crear");
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
    const getAccount = (id: string) => accounts?.find(a => a.id === id);

    const getFrequencyLabel = (freq: string) => {
        const labels: Record<string, string> = {
            'daily': 'Diario',
            'weekly': 'Semanal',
            'biweekly': 'Quincenal',
            'monthly': 'Mensual',
            'yearly': 'Anual',
            'DAILY': 'Diario',
            'WEEKLY': 'Semanal',
            'BIWEEKLY': 'Quincenal',
            'MONTHLY': 'Mensual',
            'YEARLY': 'Anual',
        };
        return labels[freq] || freq;
    };

    const isLoading = isLoadingRecurring || isLoadingCategories || isLoadingAccounts;

    return (
        <div className="pb-24 bg-app-bg min-h-screen text-app-text relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px]"></div>
            </div>

            <PageHeader title="Gastos Recurrentes" />

            <div className="p-4 max-w-lg mx-auto space-y-4">
                {/* Info Card */}
                <div className="bg-gradient-to-r from-app-primary/10 to-app-secondary/10 border border-app-primary/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-app-primary text-2xl">repeat</span>
                        <div>
                            <p className="font-bold text-app-text">Tus compromisos fijos</p>
                            <p className="text-xs text-app-muted mt-1">
                                Aquí configuras gastos que se repiten: Netflix, Spotify, renta, servicios, etc.
                                El sistema te recordará cuando sea hora de pagar.
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? <SkeletonTransactionList count={5} /> :
                    recurring?.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-6xl text-app-muted/30">event_repeat</span>
                            <p className="text-app-muted mt-4">No tienes gastos recurrentes</p>
                            <p className="text-xs text-app-muted mt-1">Agrega tus suscripciones y pagos fijos</p>
                        </div>
                    ) :
                        recurring?.map(tx => {
                            const category = getCategory(tx.categoryId);
                            const account = getAccount(tx.accountId);
                            const nextDue = new Date(tx.nextDueDate);
                            const isOverdue = nextDue < new Date();

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
                                    <div className={`card-modern bg-app-card p-4 rounded-2xl border transition-premium hover:shadow-md ${isOverdue ? 'border-red-500/30 bg-red-500/5' : 'border-app-border'
                                        }`}>
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="size-12 rounded-full flex items-center justify-center"
                                                style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                                            >
                                                <span className="material-symbols-outlined">{category?.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold truncate">{tx.description}</p>
                                                    {isOverdue && (
                                                        <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                                                            VENCIDO
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-app-muted">{getFrequencyLabel(tx.frequency)}</span>
                                                    <span className="text-xs text-app-muted">•</span>
                                                    <span className="text-xs text-app-muted">{account?.name}</span>
                                                </div>
                                                <p className={`text-xs mt-1 ${isOverdue ? 'text-red-400' : 'text-app-muted'}`}>
                                                    Próximo: {nextDue.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                            <p className={`font-bold text-lg ${tx.type === 'income' ? 'text-green-500' : ''}`}>
                                                ${tx.amount.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </SwipeableItem>
                            )
                        })
                }
            </div>

            {/* FAB to add new */}
            <button
                onClick={() => navigate('/recurring/new')}
                className="fixed bottom-24 right-4 size-14 bg-app-primary text-white rounded-full shadow-xl shadow-app-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
            >
                <span className="material-symbols-outlined text-2xl">add</span>
            </button>

            {/* Modals */}
            {showNewModal && categories && accounts && (
                <NewRecurringModal
                    categories={categories}
                    accounts={accounts}
                    onSave={handleCreate}
                    onCancel={() => setShowNewModal(false)}
                    isSaving={addMutation.isPending}
                />
            )}

            {editingTx && <EditRecurringModal transaction={editingTx} categories={categories} onSave={handleSave} onCancel={() => setEditingTx(null)} isSaving={updateMutation.isPending} />}

            {deletingId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-app-card rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-2">¿Eliminar transacción recurrente?</h3>
                        <p className="text-sm text-app-muted mb-6">
                            Esto eliminará la plantilla recurrente y no se generarán más recordatorios.
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
