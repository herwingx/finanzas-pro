import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DeleteConfirmationSheet } from '../../components/DeleteConfirmationSheet';
import { useInstallmentPurchases, useAddInstallmentPurchase, useUpdateInstallmentPurchase, useDeleteInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toastSuccess, toastError, toast } from '../../utils/toast';
import { DatePicker } from '../../components/DatePicker';
import { CategorySelector } from '../../components/CategorySelector';
import { formatDateUTC } from '../../utils/dateUtils';

const UpsertInstallmentPage: React.FC = () => {
    // --- Routing & State ---
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Modes
    const isEditMode = !!id;
    const initialMode = searchParams.get('mode');
    const [isViewingDetails, setIsViewingDetails] = useState(!!id && initialMode !== 'edit');

    // --- Data Queries ---
    const { data: allPurchases, isLoading, isError } = useInstallmentPurchases();
    const { data: accounts } = useAccounts();
    const { data: categories } = useCategories();

    // Derived State
    const existingPurchase = useMemo(() => allPurchases?.find(p => p.id === id), [allPurchases, id]);
    const creditAccounts = useMemo(() => accounts?.filter(a => a.type === 'CREDIT') || [], [accounts]);
    const expenseCategories = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);
    const isSettled = useMemo(() => existingPurchase ? (existingPurchase.totalAmount - existingPurchase.paidAmount) <= 0.05 : false, [existingPurchase]);

    // Form State
    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [installments, setInstallments] = useState('12');
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');

    // UI State
    const [showDelete, setShowDelete] = useState(false);

    // Mutations
    const addMutation = useAddInstallmentPurchase();
    const updateMutation = useUpdateInstallmentPurchase();
    const deleteMutation = useDeleteInstallmentPurchase();

    // --- Effect: Load Data ---
    useEffect(() => {
        if (isEditMode && existingPurchase) {
            setDescription(existingPurchase.description);
            setTotalAmount(String(existingPurchase.totalAmount));
            setInstallments(String(existingPurchase.installments));
            setPurchaseDate(new Date(existingPurchase.purchaseDate));
            setAccountId(existingPurchase.accountId);
            // Intenta inferir categoría
            if (existingPurchase.generatedTransactions?.length) {
                setCategoryId(existingPurchase.generatedTransactions[0].categoryId);
            }
        } else if (!isEditMode) {
            // Defaults for new purchase
            if (creditAccounts.length) setAccountId(creditAccounts[0].id);
            if (expenseCategories.length) setCategoryId(expenseCategories[0].id);
        }
    }, [isEditMode, existingPurchase, creditAccounts, expenseCategories]);


    // --- Handlers ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(totalAmount);
        const months = parseInt(installments);

        if (!description || isNaN(amount) || isNaN(months) || !accountId || !categoryId) {
            return toast.error('Completa todos los campos');
        }

        const payload = {
            description,
            totalAmount: amount,
            installments: months,
            purchaseDate: purchaseDate.toISOString(),
            accountId,
            categoryId,
        };

        try {
            if (isEditMode) {
                await updateMutation.mutateAsync({ id: id!, purchase: payload });
                toastSuccess('Plan actualizado');
                setIsViewingDetails(true); // Return to details
            } else {
                await addMutation.mutateAsync(payload);
                toastSuccess('Plan MSI creado');
                navigate('/installments', { replace: true });
            }
        } catch (e: any) { toastError(e.message); }
    };

    const confirmDelete = async () => {
        if (!id) return;
        try {
            await deleteMutation.mutateAsync(id);
            toastSuccess('Plan eliminado');
            navigate('/installments', { replace: true });
        } catch (e: any) { toastError('No se pudo eliminar', e.message); }
    };

    // --- Loading & Error ---
    if (isLoading) return <div className="min-h-dvh flex items-center justify-center text-app-muted animate-pulse">Cargando datos...</div>;
    if (isError) return <div className="p-8 text-center text-rose-500">Error al cargar la información</div>;

    // =========================================================================
    // VIEW 1: DETAILS DASHBOARD
    // =========================================================================
    if (isViewingDetails && existingPurchase) {
        const paid = existingPurchase.paidAmount;
        const total = existingPurchase.totalAmount;
        const remaining = total - paid;
        const progress = Math.min((paid / total) * 100, 100);
        const monthly = existingPurchase.monthlyPayment;

        // Next payment logic
        const txs = (existingPurchase.generatedTransactions || []).filter(tx => ['income', 'transfer'].includes(tx.type)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const nextPaymentNum = existingPurchase.paidInstallments + 1;
        const nextPaymentAmt = Math.min(monthly, remaining);

        return (
            <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
                <PageHeader
                    title="Detalle MSI"
                    showBackButton={true}
                    onBack={() => navigate('/installments')}
                    rightAction={
                        !isSettled && (
                            <button onClick={() => setIsViewingDetails(false)} className="text-sm font-medium text-app-primary">
                                Editar
                            </button>
                        )
                    }
                />

                <main className="px-4 py-4 max-w-lg mx-auto space-y-4">

                    {/* Hero Card */}
                    <div className="bento-card p-5 relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div className="size-10 rounded-xl bg-app-primary/10 flex items-center justify-center text-app-primary">
                                    <span className="material-symbols-outlined">credit_score</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isSettled ? 'bg-emerald-100 text-emerald-700' : 'bg-app-subtle text-app-muted'}`}>
                                    {isSettled ? 'Pagado' : 'Activo'}
                                </span>
                            </div>

                            <h2 className="text-lg font-bold text-app-text mb-0.5">{existingPurchase.description}</h2>
                            <p className="text-xs text-app-muted">{existingPurchase.account?.name}</p>

                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-app-muted">Total</p>
                                    <p className="text-base font-bold">${total.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-app-muted">Restante</p>
                                    <p className="text-base font-bold text-rose-600 dark:text-rose-400">${remaining.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="h-2 w-full bg-app-subtle rounded-full overflow-hidden">
                                    <div className="h-full bg-app-primary transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-app-muted font-medium">
                                    <span>{existingPurchase.paidInstallments} de {existingPurchase.installments} pagos</span>
                                    <span>{(progress).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action: Register Next Payment */}
                    {!isSettled && (
                        <button
                            onClick={() => navigate(`/new?type=transfer&destinationAccountId=${existingPurchase.accountId}&amount=${nextPaymentAmt.toFixed(2)}&description=${encodeURIComponent(`Pago MSI: ${existingPurchase.description}`)}&installmentPurchaseId=${existingPurchase.id}`)}
                            className="w-full py-4 rounded-2xl bg-app-primary text-white font-bold shadow-lg shadow-app-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Registrar Pago de ${nextPaymentAmt.toLocaleString()}
                        </button>
                    )}

                    {/* Payments List (Timeline) */}
                    <div>
                        <h3 className="text-xs font-bold text-app-muted uppercase mb-3 ml-1">Cronograma de Pagos</h3>
                        <div className="bg-app-surface border border-app-border rounded-2xl divide-y divide-app-subtle">
                            {Array.from({ length: existingPurchase.installments }).map((_, i) => {
                                const pNum = i + 1;
                                const payment = txs[i];
                                const isPaid = !!payment;
                                const isNext = pNum === nextPaymentNum && !isSettled;

                                // Forecast date
                                const fDate = new Date(existingPurchase.purchaseDate);
                                fDate.setMonth(fDate.getMonth() + pNum);

                                return (
                                    <div key={i} className={`flex items-center gap-3 p-3.5 ${isNext ? 'bg-app-primary/5' : ''}`}>
                                        <div className={`
                                            size-8 rounded-full flex items-center justify-center text-xs font-bold border
                                            ${isPaid
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : isNext
                                                    ? 'bg-app-surface text-app-primary border-app-primary'
                                                    : 'bg-app-subtle text-app-muted border-transparent'
                                            }
                                        `}>
                                            {isPaid ? <span className="material-symbols-outlined text-sm">check</span> : pNum}
                                        </div>

                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isPaid ? 'text-app-muted line-through' : 'text-app-text'}`}>
                                                Mensualidad {pNum}
                                            </p>
                                            <p className="text-[10px] text-app-muted">
                                                {isPaid ? `Pagado el ${formatDateUTC(payment.date, { style: 'dayMonth' })}` : formatDateUTC(fDate, { style: 'monthYear' })}
                                            </p>
                                        </div>

                                        <span className={`text-sm font-bold tabular-nums ${isPaid ? 'text-emerald-600 dark:text-emerald-500' : 'text-app-text'}`}>
                                            ${(payment?.amount || monthly).toLocaleString()}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Delete Danger Zone */}
                    <div className="pt-6">
                        <button
                            onClick={() => setShowDelete(true)}
                            className="w-full py-3 rounded-xl border border-app-border text-rose-500 text-sm font-medium hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                            Eliminar Plan
                        </button>
                    </div>

                </main>

                <DeleteConfirmationSheet
                    isOpen={showDelete}
                    onClose={() => setShowDelete(false)}
                    onConfirm={confirmDelete}
                    itemName={existingPurchase.description}
                    warningLevel={isSettled ? 'critical' : 'warning'}
                    warningMessage={isSettled ? 'Peligro: Plan Liquidado' : '¿Eliminar Plan?'}
                    warningDetails={isSettled ? ['Esto alterará tu historial contable permanentemente'] : ['Se eliminarán todos los registros asociados']}
                    requireConfirmation={isSettled}
                    isDeleting={deleteMutation.isPending}
                />
            </div>
        );
    }

    // =========================================================================
    // VIEW 2: EDIT/CREATE FORM
    // =========================================================================
    return (
        <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
            <PageHeader
                title={isEditMode ? 'Editar Plan' : 'Nuevo Plan MSI'}
                showBackButton={true}
            />

            <main className="px-5 pt-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Descripción de compra</label>
                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej. iPhone 15, Vuelos..."
                                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-primary outline-none transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Total ($)</label>
                                <input
                                    type="number" step="0.01" min="0" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()}
                                    value={totalAmount}
                                    onChange={e => setTotalAmount(e.target.value)}
                                    placeholder="0.00"
                                    disabled={isEditMode} // Usually total shouldn't change easily to avoid calc errors
                                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60 outline-none no-spin-button"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Plazo (Meses)</label>
                                <select
                                    value={installments}
                                    onChange={e => setInstallments(e.target.value)}
                                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm font-bold outline-none"
                                >
                                    {[3, 6, 9, 12, 18, 24, 36, 48].map(m => (
                                        <option key={m} value={m}>{m} Meses</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Group */}
                    <div className="space-y-4 pt-2">
                        <div className="p-1">
                            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Tarjeta utilizada</label>
                            <div className="grid grid-cols-1 gap-2">
                                {creditAccounts.length > 0 ? (
                                    <select
                                        value={accountId} onChange={e => setAccountId(e.target.value)}
                                        className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                                    >
                                        {creditAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                ) : <div className="text-sm text-rose-500 bg-rose-50 p-3 rounded-lg">Agrega una tarjeta de crédito primero.</div>}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-2 block">Fecha y Categoría</label>
                            <div className="flex flex-col gap-4 bg-app-surface border border-app-border rounded-2xl p-4">
                                <DatePicker date={purchaseDate} onDateChange={setPurchaseDate} />
                                <div className="h-px bg-app-subtle"></div>
                                <CategorySelector categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} isLoading={isLoading} emptyMessage="No hay categorías" />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 pb-12">
                        <button
                            type="submit"
                            disabled={addMutation.isPending || updateMutation.isPending}
                            className="w-full py-3.5 bg-app-primary hover:bg-app-primary-dark text-white font-bold rounded-2xl shadow-lg shadow-app-primary/30 transition-all active:scale-[0.98]"
                        >
                            {isEditMode ? 'Guardar Cambios' : 'Crear Plan'}
                        </button>

                        {isEditMode && (
                            <button
                                type="button"
                                onClick={() => navigate(`/installments/${id}?mode=view`)}
                                className="w-full mt-3 py-3 text-app-muted text-sm font-medium hover:text-app-text"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </main>
        </div>
    );
};

export default UpsertInstallmentPage;