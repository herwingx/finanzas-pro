import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { useAddAccount, useUpdateAccount, useAccounts, useDeleteAccount, useAddTransaction, useCategories, useAddCategory } from '../../hooks/useApi';
import { AccountType } from '../../types';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../../utils/toast'; // Assuming sonner is used for toasts

const UpsertAccountPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;
    const mode = searchParams.get('mode');
    const [isViewingDetails, setIsViewingDetails] = useState(!!id && mode !== 'edit');

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

    // Details View Mode
    if (isViewingDetails && existingAccount) {
        const getTypeLabel = (type: AccountType) => {
            switch (type) {
                case 'DEBIT': return 'Tarjeta de Débito';
                case 'CREDIT': return 'Tarjeta de Crédito';
                case 'CASH': return 'Efectivo';
                default: return type;
            }
        };

        const getTypeIcon = (type: AccountType) => {
            switch (type) {
                case 'DEBIT': return 'credit_card';
                case 'CREDIT': return 'receipt_long';
                case 'CASH': return 'payments';
                default: return 'account_balance_wallet';
            }
        };

        return (
            <div className="flex flex-col min-h-full bg-app-bg text-app-text">
                <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-lg font-bold">Detalle de Cuenta</h1>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 px-6 pt-8 pb-32 space-y-6 overflow-y-auto">
                    <div className="bg-app-card border border-app-border rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4 animate-fade-in">
                        <div className="size-16 rounded-full flex items-center justify-center text-3xl shadow-inner bg-app-primary/10">
                            <span className="material-symbols-outlined text-3xl text-app-primary">
                                {getTypeIcon(existingAccount.type)}
                            </span>
                        </div>

                        <div className="text-center w-full">
                            <p className="text-sm text-app-muted uppercase font-bold tracking-wider">{getTypeLabel(existingAccount.type)}</p>
                            <h2 className="text-3xl font-black mt-2 text-app-text">{existingAccount.name}</h2>
                            <p className={`text-4xl font-black mt-3 ${existingAccount.type === 'CREDIT' ? 'text-app-danger' : 'text-app-success'}`}>
                                ${existingAccount.balance.toFixed(2)}
                            </p>
                            <p className="text-xs text-app-muted mt-1">
                                {existingAccount.type === 'CREDIT' ? 'Deuda actual' : 'Saldo disponible'}
                            </p>
                        </div>

                        <div className="w-full h-px bg-app-border my-2"></div>

                        <div className="w-full space-y-3">
                            {existingAccount.type === 'CREDIT' && (
                                <>
                                    {existingAccount.creditLimit !== undefined && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-app-muted">Límite de Crédito</span>
                                            <span className="font-medium text-app-text">${existingAccount.creditLimit.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {existingAccount.cutoffDay && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-app-muted">Día de Corte</span>
                                            <span className="font-medium text-app-text">{existingAccount.cutoffDay}</span>
                                        </div>
                                    )}
                                    {existingAccount.paymentDay && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-app-muted">Día de Pago</span>
                                            <span className="font-medium text-app-text">{existingAccount.paymentDay}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="p-4 bg-app-bg border-t border-app-border flex gap-3">
                    <button
                        onClick={handleDelete}
                        className="btn-modern btn-danger-outline flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Eliminar
                    </button>

                    <button
                        onClick={() => setIsViewingDetails(false)}
                        className="flex-[2] py-3.5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-app-primary/20 bg-app-primary hover:bg-app-primary/90"
                    >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Editar
                    </button>
                </footer>
            </div>
        );
    }

    return (
        <div className="pb-20 bg-app-bg text-app-text font-sans flex flex-col">
            <PageHeader title={isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta'} showBackButton={true} />

            <main className="flex-1 px-5 py-6 w-full max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Nombre de la Cuenta</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                            placeholder="Ej. Nómina BBVA"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">Tipo de Cuenta</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as AccountType)}
                            className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                            required
                        >
                            <option value="DEBIT">Débito</option>
                            <option value="CREDIT">Crédito</option>
                            <option value="CASH">Efectivo</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-app-muted uppercase font-bold">
                            {type === 'CREDIT' ? 'Deuda Actual' : 'Saldo Inicial'}
                        </label>
                        <div className={`flex items-center bg-app-bg border border-app-border rounded-xl px-4 py-3 mt-2 ${isEditMode ? 'opacity-80' : 'focus-within:ring-2 focus-within:ring-app-primary/50'}`}>
                            <span className="text-2xl text-app-muted font-medium mr-2">$</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="flex-1 text-2xl font-bold bg-transparent focus:outline-none text-app-text placeholder-app-muted/30"
                                placeholder="0.00"
                                required
                                disabled={isEditMode}
                            />
                        </div>

                        {isEditMode && (
                            <div className="mt-3 bg-app-primary/10 rounded-xl p-3 border border-app-primary/20">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-app-primary mt-0.5">info</span>
                                    <div>
                                        <p className="text-xs text-app-text/80 mb-2">
                                            El saldo no se edita directamente para mantener el historial cuadrado.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAdjustmentAmount(balance);
                                                setAdjustmentDescription('');
                                                setAdjustmentCategory('');
                                                setShowAdjustment(true);
                                            }}
                                            className="text-sm font-bold text-app-primary hover:underline flex items-center gap-1"
                                        >
                                            Corregir Saldo (Crear Ajuste) →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {type === 'CREDIT' && (
                        <div className="space-y-4 pt-4 border-t border-app-border/30">
                            <p className="text-xs text-app-muted font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">settings_suggest</span>
                                Configuración de Tarjeta (Opcional)
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-app-muted uppercase font-bold">Día Corte</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={cutoffDay}
                                        onChange={(e) => setCutoffDay(e.target.value)}
                                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary font-bold text-center"
                                        placeholder="14"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-app-muted uppercase font-bold">Día Pago</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={paymentDay}
                                        onChange={(e) => setPaymentDay(e.target.value)}
                                        className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary font-bold text-center"
                                        placeholder="4"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-app-muted uppercase font-bold">Límite de Crédito</label>
                                <div className="flex items-center bg-app-bg border border-app-border rounded-xl px-4 py-3 mt-2 focus-within:ring-2 focus-within:ring-app-primary/50">
                                    <span className="text-app-muted font-medium mr-2">$</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={creditLimit}
                                        onChange={(e) => setCreditLimit(e.target.value)}
                                        className="flex-1 bg-transparent font-bold text-lg outline-none text-app-text"
                                        placeholder="20000"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col gap-3">
                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold text-lg rounded-2xl shadow-lg shadow-app-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={addAccountMutation.isPending || updateAccountMutation.isPending}
                        >
                            {addAccountMutation.isPending || updateAccountMutation.isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Guardando...
                                </span>
                            ) : isEditMode ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                        </button>

                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="w-full py-3.5 bg-app-error/10 text-app-error font-bold rounded-2xl hover:bg-app-error/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                disabled={deleteAccountMutation.isPending}
                            >
                                {deleteAccountMutation.isPending ? 'Eliminando...' : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        Eliminar Cuenta
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>

                {/* Safe area spacer */}
                <div className="h-20" />
            </main>

            {/* Balance Adjustment Modal */}
            {showAdjustment && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <div className="bg-app-card border border-app-border rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-up">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-10 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary">
                                <span className="material-symbols-outlined">tune</span>
                            </div>
                            <h3 className="text-lg font-bold text-app-text">Corregir Saldo</h3>
                        </div>

                        <p className="text-sm text-app-muted mb-6 leading-relaxed">
                            Ingresa el saldo real que ves en tu banco. El sistema creará una transacción automática por la diferencia.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-app-muted uppercase mb-2 tracking-wider">Saldo Real Actual</label>
                            <div className="flex items-center bg-app-elevated border border-app-border rounded-2xl p-4 focus-within:ring-2 focus-within:ring-app-primary/50">
                                <span className="text-xl text-app-muted font-bold mr-2">$</span>
                                <input
                                    type="number"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    className="w-full bg-transparent text-2xl font-bold text-app-text outline-none"
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-app-muted uppercase mb-2 tracking-wider">Motivo (Opcional)</label>
                            <input
                                type="text"
                                value={adjustmentDescription}
                                onChange={(e) => setAdjustmentDescription(e.target.value)}
                                placeholder="Ej: Olvidé registrar un gasto..."
                                className="w-full p-4 rounded-2xl bg-app-elevated border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary/50 text-app-text font-medium"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAdjustment(false)}
                                className="flex-1 py-3.5 text-sm font-bold rounded-2xl bg-app-elevated text-app-muted hover:text-app-text hover:bg-app-elevated/80 transition-colors"
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
                                        // Auto-adjustment logic remains same...
                                        // (Keeping existing logic for brevity as it is complex and correct)
                                        let adjustmentType: 'income' | 'expense' = 'income';
                                        let amount = Math.abs(diff);

                                        if (type === 'CREDIT') {
                                            adjustmentType = target < current ? 'income' : 'expense';
                                        } else {
                                            adjustmentType = target > current ? 'income' : 'expense';
                                        }

                                        let targetCategoryId: string | undefined;
                                        const adjustmentName = adjustmentType === 'income' ? 'Ajuste de Saldo (+)' : 'Ajuste de Saldo (-)';

                                        const existingCat = categories?.find(c =>
                                            (c.name.toLowerCase() === adjustmentName.toLowerCase() || c.name.toLowerCase().includes('ajuste'))
                                            && c.type === adjustmentType
                                        );

                                        if (existingCat) {
                                            targetCategoryId = existingCat.id;
                                        } else {
                                            try {
                                                const newCat = await addCategoryMutation.mutateAsync({
                                                    name: adjustmentName,
                                                    type: adjustmentType,
                                                    icon: 'tune',
                                                    color: '#64748b',
                                                    userId: '',
                                                } as any);
                                                targetCategoryId = newCat.id;
                                            } catch (err) {
                                                const fallback = categories?.find(c => c.type === adjustmentType);
                                                if (fallback) targetCategoryId = fallback.id;
                                            }
                                        }

                                        if (!targetCategoryId) {
                                            toastError(`No se pudo asignar una categoría.`);
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
                                        navigate(-1);
                                    } catch (e) {
                                        toastError('Error al crear ajuste');
                                    }
                                }}
                                className="flex-1 py-3.5 text-sm font-bold rounded-2xl bg-app-primary text-white hover:bg-app-primary/90 transition-colors shadow-lg shadow-app-primary/20"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpsertAccountPage;
