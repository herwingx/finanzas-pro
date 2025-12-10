import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { useAddAccount, useUpdateAccount, useAccounts, useDeleteAccount, useAddTransaction, useCategories, useAddCategory } from '../../hooks/useApi';
import { AccountType } from '../../types';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../../utils/toast'; // Assuming sonner is used for toasts

const UpsertAccountPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { data: accounts } = useAccounts();
    const existingAccount = accounts?.find(acc => acc.id === id);

    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('DEBIT');
    const [balance, setBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');

    const addAccountMutation = useAddAccount();
    const updateAccountMutation = useUpdateAccount();
    const deleteAccountMutation = useDeleteAccount();
    const addTransactionMutation = useAddTransaction();
    const addCategoryMutation = useAddCategory();
    const { data: categories } = useCategories();

    // Adjustment State
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentDescription, setAdjustmentDescription] = useState('');
    const [adjustmentCategory, setAdjustmentCategory] = useState('');

    useEffect(() => {
        if (isEditMode && existingAccount) {
            setName(existingAccount.name);
            setType(existingAccount.type);
            setBalance(String(existingAccount.balance));
            setCreditLimit(existingAccount.creditLimit?.toString() || '');
            setCutoffDay(existingAccount.cutoffDay?.toString() || '');
            setPaymentDay(existingAccount.paymentDay?.toString() || '');
        } else if (!isEditMode) {
            // Reset form if not in edit mode
            setName('');
            setType('DEBIT');
            setBalance('');
            setCreditLimit('');
            setCutoffDay('');
            setPaymentDay('');
        }
    }, [isEditMode, existingAccount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const accountData = {
            name,
            type,
            balance: parseFloat(balance) || 0,
            creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
            cutoffDay: cutoffDay ? parseInt(cutoffDay, 10) : undefined,
            paymentDay: paymentDay ? parseInt(paymentDay, 10) : undefined,
        };

        // Remove undefined keys for credit-specific fields
        if (type !== 'CREDIT') {
            delete accountData.creditLimit;
            delete accountData.cutoffDay;
            delete accountData.paymentDay;
        }

        try {
            if (isEditMode) {
                await updateAccountMutation.mutateAsync({ id: id!, account: accountData });
                toastSuccess('Cuenta actualizada con éxito!');
            } else {
                await addAccountMutation.mutateAsync(accountData);
                toastSuccess('Cuenta creada con éxito!');
            }
            navigate('/accounts');
        } catch (error) {
            toast.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} la cuenta.`);
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!id) return;

        toast.custom((t) => (
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col gap-3 shadow-lg max-w-sm w-full">
                <p className="text-app-text font-bold text-sm">¿Estás seguro de eliminar esta cuenta?</p>
                <p className="text-app-muted text-xs">Por seguridad, solo podrás eliminarla si no tiene ningún historial de transacciones.</p>
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
                                await deleteAccountMutation.mutateAsync(id);
                                toastSuccess('Cuenta eliminada con éxito.');
                                navigate('/accounts');
                            } catch (error: any) {
                                if (error.message.includes('associated transactions')) {
                                    toastError('No se puede eliminar la cuenta porque tiene transacciones asociadas.');
                                } else {
                                    toastError('Error al eliminar la cuenta.');
                                }
                                console.error(error);
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-app-danger text-white hover:bg-app-danger/90 transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity, // Keep the toast open until dismissed
            id: 'delete-account-confirm',
        });
    };

    return (
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
            <PageHeader title={isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta'} showBackButton={true} />

            <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-app-muted mb-2">Nombre de la Cuenta</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-app-muted mb-2">Tipo de Cuenta</label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value as AccountType)}
                        className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                        required
                    >
                        <option value="DEBIT">Débito</option>
                        <option value="CREDIT">Crédito</option>
                        <option value="CASH">Efectivo</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="balance" className="block text-sm font-medium text-app-muted mb-2">Saldo Inicial / Deuda Actual</label>
                    <input
                        type="number"
                        id="balance"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                        required
                        disabled={isEditMode}
                    />
                    {isEditMode && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAdjustmentAmount(balance);
                                    setAdjustmentDescription('');
                                    setAdjustmentCategory('');
                                    setShowAdjustment(true);
                                }}
                                className="text-sm text-app-primary font-bold hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">tune</span>
                                Corregir Saldo (Crear Ajuste)
                            </button>
                            <p className="text-xs text-app-muted mt-1">
                                El saldo no se puede editar directamente. Usa "Corregir Saldo" para crear una transacción de ajuste automática.
                            </p>
                        </div>
                    )}
                </div>

                {type === 'CREDIT' && (
                    <>
                        <p className="text-xs text-app-muted -mb-4">
                            Opcional: Llena estos campos para ver los próximos pagos en tu dashboard.
                        </p>
                        <div>
                            <label htmlFor="creditLimit" className="block text-sm font-medium text-app-muted mb-2">Límite de Crédito</label>
                            <input
                                type="number"
                                id="creditLimit"
                                value={creditLimit}
                                onChange={(e) => setCreditLimit(e.target.value)}
                                className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                                placeholder="20000"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label htmlFor="cutoffDay" className="block text-sm font-medium text-app-muted mb-2">Día de Corte (Ej: 14)</label>
                            <input
                                type="number"
                                id="cutoffDay"
                                value={cutoffDay}
                                onChange={(e) => setCutoffDay(e.target.value)}
                                className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                                placeholder="14"
                                min="1"
                                max="31"
                            />
                        </div>
                        <div>
                            <label htmlFor="paymentDay" className="block text-sm font-medium text-app-muted mb-2">Día Límite de Pago (Ej: 4)</label>
                            <input
                                type="number"
                                id="paymentDay"
                                value={paymentDay}
                                onChange={(e) => setPaymentDay(e.target.value)}
                                className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                                placeholder="4"
                                min="1"
                                max="31"
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className="w-full bg-app-primary text-white font-bold p-3 rounded-xl shadow-md hover:bg-app-primary/90 transition-colors"
                    disabled={addAccountMutation.isPending || updateAccountMutation.isPending}
                >
                    {addAccountMutation.isPending || updateAccountMutation.isPending ? 'Guardando...' : isEditMode ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                </button>

                {isEditMode && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full bg-app-danger text-white font-bold p-3 rounded-xl shadow-md hover:bg-app-danger/90 transition-colors mt-3"
                        disabled={deleteAccountMutation.isPending}
                    >
                        {deleteAccountMutation.isPending ? 'Eliminando...' : 'Eliminar Cuenta'}
                    </button>
                )}
            </form>

            {/* Balance Adjustment Modal */}
            {showAdjustment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-app-card border border-app-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-bold text-app-text mb-2">Corregir Saldo</h3>
                        <p className="text-sm text-app-muted mb-4">
                            Ingresa el saldo real actual. El sistema creará una transacción automática por la diferencia.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-app-muted uppercase mb-1">Saldo Real Actual</label>
                            <input
                                type="number"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                className="w-full p-3 rounded-xl bg-app-bg border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-xl font-bold text-app-text"
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-app-muted uppercase mb-1">Motivo del Ajuste (Opcional)</label>
                            <input
                                type="text"
                                value={adjustmentDescription}
                                onChange={(e) => setAdjustmentDescription(e.target.value)}
                                placeholder="Ej: Olvidé registrar comida, Intereses..."
                                className="w-full p-3 rounded-xl bg-app-bg border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                            />
                        </div>

                        {/* Category Selector Removed - Auto-handled */}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAdjustment(false)}
                                className="flex-1 py-3 text-sm font-bold rounded-xl bg-app-elevated text-app-text hover:bg-app-hover transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const target = parseFloat(adjustmentAmount);
                                    if (isNaN(target)) return;

                                    const current = parseFloat(balance);
                                    const diff = target - current;

                                    if (Math.abs(diff) < 0.01) {
                                        setShowAdjustment(false);
                                        return;
                                    }

                                    try {
                                        // Create adjustment transaction
                                        // For CREDIT: Positive Balance = Debt.
                                        // If Target > Current (Debt increased) -> Expense (or Transfer Out logic).
                                        // If Target < Current (Debt decreased) -> Income (Payment).

                                        // General Logic for DEBIT/CASH:
                                        // Target > Current -> Income
                                        // Target < Current -> Expense

                                        let adjustmentType: 'income' | 'expense' = 'income';
                                        let amount = Math.abs(diff);

                                        if (type === 'CREDIT') {
                                            // Credit Logic: Balance is Debt.
                                            // Decrease in Debt (Target < Current) -> Income (Payment)
                                            // Increase in Debt (Target > Current) -> Expense
                                            adjustmentType = target < current ? 'income' : 'expense';
                                        } else {
                                            // Debit Logic: Balance is Funds.
                                            // Increase in Funds (Target > Current) -> Income
                                            // Decrease in Funds (Target < Current) -> Expense
                                            adjustmentType = target > current ? 'income' : 'expense';
                                        }

                                        // Auto-resolve Category
                                        // 1. Try to find existing "Ajuste de Saldo" or similar
                                        let targetCategoryId: string | undefined;
                                        // Use distinct names to avoid unique constraint on [name, userId] in backend
                                        const adjustmentName = adjustmentType === 'income' ? 'Ajuste de Saldo (+)' : 'Ajuste de Saldo (-)';

                                        const existingCat = categories?.find(c =>
                                            (c.name.toLowerCase() === adjustmentName.toLowerCase() || c.name.toLowerCase().includes('ajuste'))
                                            && c.type === adjustmentType
                                        );

                                        if (existingCat) {
                                            targetCategoryId = existingCat.id;
                                        } else {
                                            // 2. Create it automatically if not exists
                                            try {
                                                const newCat = await addCategoryMutation.mutateAsync({
                                                    name: adjustmentName,
                                                    type: adjustmentType,
                                                    icon: 'tune', // Generic setting/adjustment icon
                                                    color: '#64748b', // Slate-500 neutral
                                                    userId: '', // Ignored by backend usually
                                                } as any);
                                                targetCategoryId = newCat.id;
                                            } catch (err) {
                                                console.error('Failed to auto-create category', err);
                                                // Fallback to "Otros" or first available
                                                const fallback = categories?.find(c => c.type === adjustmentType);
                                                if (fallback) targetCategoryId = fallback.id;
                                            }
                                        }

                                        if (!targetCategoryId) {
                                            toastError(`No se pudo asignar una categoría para el ajuste.`);
                                            return;
                                        }

                                        const finalDescription = adjustmentDescription.trim()
                                            ? `🔧 ${adjustmentDescription.trim()}`
                                            : '🔧 Ajuste de Saldo Manual';

                                        await addTransactionMutation.mutateAsync({
                                            amount,
                                            description: finalDescription,
                                            date: new Date().toISOString(),
                                            type: adjustmentType,
                                            accountId: id!,
                                            categoryId: targetCategoryId,
                                        });

                                        toastSuccess(`Saldo ajustado a $${target.toFixed(2)}`);
                                        setShowAdjustment(false);
                                        // Navigate back to force refresh or just rely on query invalidation
                                        navigate(-1);
                                    } catch (e) {
                                        toastError('Error al crear ajuste');
                                    }
                                }}
                                className="flex-1 py-3 text-sm font-bold rounded-xl bg-app-primary text-white hover:bg-app-primary/90 transition-colors"
                            >
                                Guardar Ajuste
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpsertAccountPage;
