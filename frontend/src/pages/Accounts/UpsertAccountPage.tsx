import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DeleteConfirmationSheet } from '../../components/DeleteConfirmationSheet';
import { useAddAccount, useUpdateAccount, useAccounts, useDeleteAccount, useAddTransaction, useCategories, useAddCategory } from '../../hooks/useApi';
import { AccountType } from '../../types';
import { toastSuccess, toastError, toast } from '../../utils/toast';

const UpsertAccountPage: React.FC = () => {
    // --- Routing ---
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Modes
    const isEditMode = !!id;
    const mode = searchParams.get('mode');
    const [isViewingDetails, setIsViewingDetails] = useState(!!id && mode !== 'edit');

    // --- Queries ---
    const { data: accounts } = useAccounts();
    const { data: categories } = useCategories();
    const existingAccount = useMemo(() => accounts?.find(acc => acc.id === id), [accounts, id]);

    // --- Form State ---
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>('DEBIT');
    const [balance, setBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');

    // --- UI State ---
    const [showDelete, setShowDelete] = useState(false);
    const [showAdjustment, setShowAdjustment] = useState(false);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentDescription, setAdjustmentDescription] = useState('');

    // --- Mutations ---
    const addAccountMutation = useAddAccount();
    const updateAccountMutation = useUpdateAccount();
    const deleteAccountMutation = useDeleteAccount();
    const addTransactionMutation = useAddTransaction();
    const addCategoryMutation = useAddCategory();

    // Init form
    useEffect(() => {
        if (isEditMode && existingAccount) {
            setName(existingAccount.name);
            setType(existingAccount.type);
            setBalance(String(existingAccount.balance));
            setCreditLimit(existingAccount.creditLimit?.toString() || '');
            setCutoffDay(existingAccount.cutoffDay?.toString() || '');
            setPaymentDay(existingAccount.paymentDay?.toString() || '');
        } else if (!isEditMode) {
            setName('');
            setType('DEBIT');
            setBalance('');
            setCreditLimit('');
            setCutoffDay('');
            setPaymentDay('');
        }
    }, [isEditMode, existingAccount]);

    // --- Handlers ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation basic
        if (!name) return toast.error('Ingresa un nombre para la cuenta');

        const accountData = {
            name,
            type,
            balance: parseFloat(balance) || 0,
            creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
            cutoffDay: cutoffDay ? parseInt(cutoffDay, 10) : undefined,
            paymentDay: paymentDay ? parseInt(paymentDay, 10) : undefined,
        };

        // Clean irrelevant fields
        if (type !== 'CREDIT') {
            delete accountData.creditLimit;
            delete accountData.cutoffDay;
            delete accountData.paymentDay;
        }

        try {
            if (isEditMode) {
                await updateAccountMutation.mutateAsync({ id: id!, account: accountData });
                toastSuccess('Cuenta actualizada');
            } else {
                await addAccountMutation.mutateAsync(accountData);
                toastSuccess('Cuenta creada');
            }
            navigate('/accounts');
        } catch (error: any) {
            toastError(error.message);
        }
    };

    const confirmDelete = async () => {
        if (!id) return;
        try {
            await deleteAccountMutation.mutateAsync(id);
            toastSuccess('Cuenta eliminada');
            navigate('/accounts');
        } catch (error: any) {
            if (error.message.includes('associated') || error.message.includes('foreign key')) {
                toastError('No se puede eliminar', 'La cuenta tiene historial registrado');
            } else {
                toastError(error.message);
            }
        }
    };

    const handleAdjustment = async () => {
        const target = parseFloat(adjustmentAmount);
        if (isNaN(target)) return;

        const current = parseFloat(balance);
        const diff = target - current;

        if (Math.abs(diff) < 0.01) {
            setShowAdjustment(false);
            return;
        }

        try {
            // Logic reused from your original code (simplified for clarity)
            let adjType: 'income' | 'expense';
            let adjAmount = Math.abs(diff);

            // Logic correction for CREDIT vs DEBIT
            if (type === 'CREDIT') {
                // En credito, BALANCE POSITIVO ES DEUDA.
                // Si quiero SUBIR el balance (subir deuda), es GASTO.
                // Si quiero BAJAR el balance (pagar deuda), es INGRESO.
                adjType = target > current ? 'expense' : 'income';
            } else {
                // En debito, normal.
                adjType = target > current ? 'income' : 'expense';
            }

            // Find or create Category
            let catId: string | undefined;
            const catName = adjType === 'income' ? 'Ajuste (+)' : 'Ajuste (-)';

            const existingCat = categories?.find(c => c.name.includes('Ajuste') && c.type === adjType);
            if (existingCat) {
                catId = existingCat.id;
            } else {
                // Try create one implicitly
                const newCat = await addCategoryMutation.mutateAsync({
                    name: catName, type: adjType, icon: 'tune', color: '#94a3b8', userId: ''
                } as any);
                catId = newCat.id;
            }

            await addTransactionMutation.mutateAsync({
                amount: adjAmount,
                description: `🔧 Ajuste: ${adjustmentDescription || 'Corrección manual'}`,
                date: new Date().toISOString(),
                type: adjType,
                accountId: id!,
                categoryId: catId!
            });

            toastSuccess(`Saldo ajustado a ${target}`);
            setShowAdjustment(false);
            navigate('/accounts'); // Refresh page
        } catch (e) {
            toastError('Error al crear ajuste');
        }
    };


    // ========================================================================
    // VIEW 1: DETAILS (Dashboard Style)
    // ========================================================================
    if (isViewingDetails && existingAccount) {
        const isCredit = existingAccount.type === 'CREDIT';

        return (
            <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
                <PageHeader
                    title="Detalle"
                    showBackButton={true}
                    onBack={() => navigate('/accounts')}
                    rightAction={
                        <button onClick={() => setIsViewingDetails(false)} className="text-sm font-medium text-app-primary">
                            Editar
                        </button>
                    }
                />

                <main className="px-6 py-8">
                    {/* Big Hero Card */}
                    <div className="flex flex-col items-center">
                        <div className={`size-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-lg 
                            ${isCredit ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}
                        >
                            <span className="material-symbols-outlined text-[40px]">
                                {isCredit ? 'credit_card' : 'account_balance'}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-app-text text-center mb-1">{existingAccount.name}</h1>
                        <p className="text-sm text-app-muted uppercase tracking-wider font-bold mb-6">
                            {isCredit ? 'Tarjeta de Crédito' : 'Cuenta de Efectivo/Débito'}
                        </p>

                        <div className={`
                            py-4 px-8 rounded-3xl text-center border-2 
                            ${isCredit ? 'border-rose-100 bg-rose-50/50 dark:bg-rose-900/10 dark:border-rose-900' : 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-900'}
                        `}>
                            <p className="text-xs font-bold text-app-muted uppercase mb-1">Saldo Actual</p>
                            <p className={`text-4xl font-black tabular-nums tracking-tight ${isCredit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                ${existingAccount.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    {isCredit && (
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-app-surface border border-app-border rounded-2xl text-center">
                                <p className="text-xs text-app-muted mb-1 font-medium">Límite</p>
                                <p className="text-lg font-bold text-app-text tabular-nums">${existingAccount.creditLimit?.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-app-surface border border-app-border rounded-2xl text-center">
                                <p className="text-xs text-app-muted mb-1 font-medium">Fechas</p>
                                <div className="text-sm font-bold text-app-text">
                                    <span className="text-indigo-500">Corte {existingAccount.cutoffDay}</span>
                                    <span className="mx-2 text-app-border">|</span>
                                    <span className="text-emerald-500">Pago {existingAccount.paymentDay}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-12 space-y-3">
                        <button
                            onClick={() => setIsViewingDetails(false)}
                            className="w-full py-4 rounded-2xl bg-app-primary text-white font-bold shadow-lg shadow-app-primary/20 active:scale-95 transition-transform"
                        >
                            Editar Configuración
                        </button>
                        <button
                            onClick={() => setShowDelete(true)}
                            className="w-full py-4 rounded-2xl bg-transparent border border-app-border text-rose-500 font-bold active:scale-95 transition-transform hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            Eliminar Cuenta
                        </button>
                    </div>
                </main>

                <DeleteConfirmationSheet
                    isOpen={showDelete}
                    onClose={() => setShowDelete(false)}
                    onConfirm={confirmDelete}
                    itemName={existingAccount.name}
                    isDeleting={deleteAccountMutation.isPending}
                    // For accounts, deletion is rarely catastrophic unless high history, simplified warning
                    warningMessage="¿Eliminar Cuenta?"
                    warningDetails={['Si hay transacciones asociadas, esta acción fallará por seguridad.']}
                />
            </div>
        );
    }

    // ========================================================================
    // VIEW 2: EDIT/CREATE FORM
    // ========================================================================
    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader title={isEditMode ? 'Editar Cuenta' : 'Nueva Cuenta'} showBackButton={true} />

            <main className="px-5 pt-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Primary Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Nombre</label>
                            <input
                                type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. BBVA Débito" autoFocus
                                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Tipo</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['DEBIT', 'CREDIT', 'CASH'] as AccountType[]).map(t => (
                                    <button
                                        type="button" key={t} onClick={() => setType(t)}
                                        className={`py-3 rounded-xl text-xs font-bold transition-all border 
                                        ${type === t
                                                ? 'bg-app-text text-app-bg border-app-text shadow-md'
                                                : 'bg-app-surface text-app-muted border-app-border hover:bg-app-subtle'
                                            }`}
                                    >
                                        {t === 'DEBIT' ? 'DÉBITO' : t === 'CREDIT' ? 'CRÉDITO' : 'EFECTIVO'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="pt-2">
                        <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">
                            {type === 'CREDIT' ? 'Deuda Inicial' : 'Saldo Inicial'}
                        </label>
                        <div className={`flex items-center bg-app-surface border border-app-border rounded-2xl px-4 py-4 ${isEditMode ? 'opacity-70 bg-app-subtle cursor-not-allowed' : 'focus-within:ring-2 focus-within:ring-app-primary'}`}>
                            <span className="text-xl font-bold text-app-muted mr-2">$</span>
                            <input
                                type="number" inputMode="decimal" step="0.01"
                                value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" disabled={isEditMode}
                                className="bg-transparent text-2xl font-bold text-app-text outline-none w-full placeholder-app-muted/30"
                            />
                        </div>
                        {isEditMode && (
                            <button type="button" onClick={() => { setAdjustmentAmount(balance); setShowAdjustment(true); }} className="mt-2 text-xs font-bold text-app-primary hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">build</span> Corregir saldo manual
                            </button>
                        )}
                    </div>

                    {/* Credit Specifics */}
                    {type === 'CREDIT' && (
                        <div className="space-y-4 pt-4 border-t border-app-border">
                            <p className="text-xs font-bold text-app-text">Detalles de Tarjeta</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-app-muted block mb-1">Día Corte</label>
                                    <input type="number" placeholder="14" value={cutoffDay} onChange={e => setCutoffDay(e.target.value)} className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-center font-bold" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-app-muted block mb-1">Día Pago</label>
                                    <input type="number" placeholder="4" value={paymentDay} onChange={e => setPaymentDay(e.target.value)} className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-center font-bold" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-app-muted block mb-1">Límite de Crédito</label>
                                <input type="number" placeholder="50000" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 font-bold" />
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-8 pb-12">
                        <button type="submit" disabled={addAccountMutation.isPending || updateAccountMutation.isPending}
                            className="w-full py-4 bg-app-primary hover:bg-app-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-app-primary/30 transition-all active:scale-95 disabled:opacity-50">
                            {isEditMode ? 'Guardar Cambios' : 'Crear Cuenta'}
                        </button>
                    </div>
                </form>
            </main>

            {/* Modal de Ajuste (Modal Manual, Tailwind limpio) */}
            {showAdjustment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-app-surface border border-app-border rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                        <h3 className="text-lg font-bold text-app-text mb-4">Ajuste de Saldo</h3>
                        <p className="text-sm text-app-muted mb-4">Ingresa el saldo real de tu banco. Se creará una transacción de ajuste automáticamente.</p>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold uppercase text-app-muted block mb-1">Nuevo Saldo Real</label>
                            <input
                                type="number" autoFocus value={adjustmentAmount} onChange={e => setAdjustmentAmount(e.target.value)}
                                className="w-full p-3 bg-app-bg border border-app-border rounded-xl font-bold text-xl outline-none focus:border-app-primary"
                            />
                        </div>
                        <input
                            type="text" placeholder="Motivo (opcional)" value={adjustmentDescription} onChange={e => setAdjustmentDescription(e.target.value)}
                            className="w-full p-3 mb-6 bg-app-bg border border-app-border rounded-xl text-sm outline-none"
                        />

                        <div className="flex gap-3">
                            <button onClick={() => setShowAdjustment(false)} className="flex-1 py-3 font-bold text-sm text-app-muted hover:bg-app-bg rounded-xl transition-colors">Cancelar</button>
                            <button onClick={handleAdjustment} className="flex-1 py-3 font-bold text-sm bg-app-primary text-white rounded-xl hover:bg-app-primary-dark shadow-lg shadow-app-primary/20">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpsertAccountPage;