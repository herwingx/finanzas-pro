import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DeleteConfirmationSheet } from '../../components/DeleteConfirmationSheet';
import { useInstallmentPurchases, useUpdateInstallmentPurchase, useDeleteInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../../utils/toast';
import { DatePicker } from '../../components/DatePicker';

const UpsertInstallmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = !!id;
    const mode = searchParams.get('mode');
    const [isViewingDetails, setIsViewingDetails] = useState(!!id && mode !== 'edit');

    const { data: allPurchases, isLoading: isLoadingPurchases, isError } = useInstallmentPurchases();
    const { data: accounts, isLoading: isLoadingAccounts, isError: isErrorAccounts } = useAccounts();
    const { data: categories, isLoading: isLoadingCategories, isError: isErrorCategories } = useCategories();

    const existingPurchase = useMemo(() => allPurchases?.find(p => p.id === id), [allPurchases, id]);

    const [description, setDescription] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [installments, setInstallments] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const updatePurchaseMutation = useUpdateInstallmentPurchase();
    const deletePurchaseMutation = useDeleteInstallmentPurchase();

    useEffect(() => {
        if (isEditMode && existingPurchase) {
            setDescription(existingPurchase.description);
            setTotalAmount(String(existingPurchase.totalAmount));
            setInstallments(String(existingPurchase.installments));
            setPurchaseDate(new Date(existingPurchase.purchaseDate));
            setAccountId(existingPurchase.accountId);
            if (existingPurchase.generatedTransactions && existingPurchase.generatedTransactions.length > 0) {
                setCategoryId(existingPurchase.generatedTransactions[0].categoryId);
            }
        }
    }, [isEditMode, existingPurchase]);

    const isSettled = useMemo(() => {
        if (!existingPurchase) return false;
        return (existingPurchase.totalAmount - existingPurchase.paidAmount) <= 0.05;
    }, [existingPurchase]);

    const availableCreditAccounts = useMemo(() => accounts?.filter(acc => acc.type === 'CREDIT') || [], [accounts]);

    useEffect(() => {
        if (availableCreditAccounts.length > 0 && !accountId) {
            setAccountId(availableCreditAccounts[0].id);
        }
    }, [availableCreditAccounts, accountId]);

    const availableCategories = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);

    useEffect(() => {
        if (availableCategories.length > 0 && !categoryId) {
            setCategoryId(availableCategories[0].id);
        }
    }, [availableCategories, categoryId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!description || !totalAmount || !installments || !accountId || !categoryId) {
            toastError('Faltan campos requeridos.');
            return;
        }
        if (parseFloat(totalAmount) <= 0 || parseInt(installments, 10) <= 0) {
            toastError('El monto total y el número de meses deben ser mayores a cero.');
            return;
        }

        const purchaseData = {
            description,
            totalAmount: parseFloat(totalAmount),
            installments: parseInt(installments, 10),
            purchaseDate: purchaseDate.toISOString(),
            accountId,
            categoryId,
        };

        try {
            await updatePurchaseMutation.mutateAsync({ id: id!, purchase: purchaseData });
            toastSuccess('Compra a MSI actualizada con éxito!');
            navigate('/installments');
        } catch (error: any) {
            toast.error(`Error al actualizar la compra a MSI: ${error.message || 'Desconocido'}`);
            console.error(error);
        }
    };

    const handleDelete = () => {
        setShowDeleteConfirmation(true);
    };

    const confirmDelete = async () => {
        if (!id) return;

        try {
            await deletePurchaseMutation.mutateAsync(id);
            toastSuccess('Compra a MSI eliminada con éxito.');
            navigate('/installments');
        } catch (error: any) {
            toast.error(`Error al eliminar la compra a MSI: ${error.message || 'Desconocido'}`);
            console.error(error);
        } finally {
            setShowDeleteConfirmation(false);
        }
    };

    if (isLoadingPurchases || isLoadingAccounts || isLoadingCategories) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-app-bg">
                <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError || isErrorAccounts || isErrorCategories) {
        return <div className="p-8 text-center text-app-danger">Error cargando datos. Por favor recarga.</div>;
    }

    // Details View Mode
    if (isViewingDetails && existingPurchase) {
        const paidAmount = existingPurchase.paidAmount;
        const remainingAmount = existingPurchase.totalAmount - paidAmount;
        const progressPercentage = (paidAmount / existingPurchase.totalAmount) * 100;
        const isSettledView = (existingPurchase.totalAmount - existingPurchase.paidAmount) <= 0.05;

        // Get all payment transactions for this installment
        const paymentTransactions = (existingPurchase.generatedTransactions || [])
            .filter(tx => tx.type === 'income' || tx.type === 'transfer')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Calculate next payment info
        const nextPaymentNumber = existingPurchase.paidInstallments + 1;
        const suggestedAmount = Math.min(existingPurchase.monthlyPayment, remainingAmount);

        return (
            <div className="flex flex-col h-screen bg-app-bg text-app-text">
                <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
                    <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-lg font-bold">Plan MSI</h1>
                    <div className="w-10"></div>
                </header>

                <main className="flex-1 px-4 pt-4 pb-32 space-y-4 overflow-y-auto">
                    {/* Summary Card */}
                    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm animate-fade-in">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="size-14 rounded-full flex items-center justify-center shadow-inner bg-blue-100 dark:bg-blue-900/30 shrink-0">
                                <span className="material-symbols-outlined text-2xl text-blue-600 dark:text-blue-400">
                                    credit_card
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-app-muted uppercase font-bold tracking-wider mb-1">
                                    {isSettledView ? '✓ LIQUIDADO' : 'ACTIVO'}
                                </p>
                                <h2 className="text-xl font-bold text-app-text truncate">{existingPurchase.description}</h2>
                                <p className="text-xs text-app-muted mt-0.5">{existingPurchase.account?.name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-app-elevated rounded-xl p-3">
                                <p className="text-xs text-app-muted mb-1">Monto Total</p>
                                <p className="text-lg font-bold text-app-text">${existingPurchase.totalAmount.toFixed(2)}</p>
                            </div>
                            <div className="bg-app-elevated rounded-xl p-3">
                                <p className="text-xs text-app-muted mb-1">Mensualidad</p>
                                <p className="text-lg font-bold text-blue-600">${existingPurchase.monthlyPayment.toFixed(2)}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs text-app-muted mb-1.5">
                                <span>Pagado: ${paidAmount.toFixed(2)}</span>
                                <span>Restante: ${remainingAmount.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-app-elevated rounded-full h-2.5">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-xs text-app-muted mt-1.5 font-medium">
                                {existingPurchase.paidInstallments} de {existingPurchase.installments} pagos realizados
                            </p>
                        </div>
                    </div>

                    {/* Register Payment Button */}
                    {!isSettledView && remainingAmount > 0.01 && (
                        <button
                            onClick={() => navigate(`/new?type=transfer&destinationAccountId=${existingPurchase.accountId}&amount=${suggestedAmount.toFixed(2)}&description=Pago mensualidad ${encodeURIComponent(existingPurchase.description)}&installmentPurchaseId=${existingPurchase.id}`)}
                            className="w-full bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold py-4 rounded-2xl shadow-lg shadow-app-primary/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Registrar Pago (${suggestedAmount.toFixed(2)})
                        </button>
                    )}

                    {/* Payment Timeline */}
                    <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-app-text mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            Timeline de Pagos
                        </h3>

                        <div className="space-y-3">
                            {Array.from({ length: existingPurchase.installments }).map((_, index) => {
                                const paymentNumber = index + 1;
                                const payment = paymentTransactions[index];
                                const isPaid = !!payment;
                                const isCurrent = paymentNumber === nextPaymentNumber && !isSettledView;

                                // Calculate expected date
                                const expectedDate = new Date(existingPurchase.purchaseDate);
                                expectedDate.setMonth(expectedDate.getMonth() + paymentNumber);

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                            : isPaid
                                                ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                                                : 'bg-app-elevated border border-app-border'
                                            }`}
                                    >
                                        <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${isPaid
                                            ? 'bg-green-500 text-white'
                                            : isCurrent
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-app-muted/20 text-app-muted'
                                            }`}>
                                            {isPaid ? (
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            ) : (
                                                <span className="font-bold text-sm">{paymentNumber}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold ${isPaid ? 'text-green-700 dark:text-green-400' : isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-app-muted'}`}>
                                                {isPaid ? `✓ Pago ${paymentNumber} realizado` : isCurrent ? `→ Próximo pago` : `Pago ${paymentNumber} pendiente`}
                                            </p>
                                            <p className="text-xs text-app-muted">
                                                {isPaid
                                                    ? new Date(payment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : `Vence: ${expectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                                                }
                                            </p>
                                        </div>

                                        <p className={`font-bold text-sm ${isPaid ? 'text-green-700 dark:text-green-400' : 'text-app-muted'}`}>
                                            ${payment ? payment.amount.toFixed(2) : existingPurchase.monthlyPayment.toFixed(2)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment History */}
                    {paymentTransactions.length > 0 && (
                        <div className="bg-app-card border border-app-border rounded-2xl p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-app-text mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">history</span>
                                Historial de Pagos ({paymentTransactions.length})
                            </h3>

                            <div className="space-y-2">
                                {paymentTransactions.map((payment, index) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between p-3 bg-app-elevated rounded-xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm text-green-600 dark:text-green-400">check_circle</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-app-text">Pago #{index + 1}</p>
                                                <p className="text-xs text-app-muted">
                                                    {new Date(payment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm text-green-600 dark:text-green-400">
                                            ${payment.amount.toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settled Notice */}
                    {isSettledView && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-300 flex gap-3 items-start">
                            <span className="material-symbols-outlined shrink-0">celebration</span>
                            <p>
                                <strong>¡Plan completado!</strong><br />
                                Este plan está totalmente liquidado y forma parte de tu historial financiero.
                            </p>
                        </div>
                    )}
                </main>

                <footer className="p-4 bg-app-bg border-t border-app-border space-y-2">
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (isSettledView) {
                                    toastInfo('Los planes liquidados no se pueden editar');
                                    return;
                                }
                                setIsViewingDetails(false);
                            }}
                            className={`flex-1 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${isSettledView
                                ? 'bg-app-elevated text-app-muted cursor-not-allowed'
                                : 'bg-app-primary text-white hover:bg-app-primary/90 shadow-lg shadow-app-primary/20'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">{isSettledView ? 'lock' : 'edit'}</span>
                            {isSettledView ? 'Bloqueado' : 'Editar Plan'}
                        </button>
                    </div>

                    <button
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="btn-modern btn-danger-outline w-full py-3 rounded-2xl flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Eliminar Plan Completo
                    </button>
                </footer>
            </div>
        );
    }

    return (
        <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text font-sans">
            <PageHeader title={isEditMode ? 'Editar Compra a MSI' : 'Nueva Compra a MSI'} showBackButton={true} />

            {isSettled && (
                <div className="mx-4 mt-4 p-4 bg-app-elevated border border-app-border rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined text-app-success">check_circle</span>
                    <p className="text-sm text-app-text">Esta compra está totalmente liquidada y forma parte de tu historial. No se puede editar ni eliminar.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-6">
                <fieldset disabled={isSettled} className="space-y-6">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-app-muted mb-2">Descripción</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="totalAmount" className="block text-sm font-medium text-app-muted mb-2">Monto Total</label>
                        <input
                            type="number"
                            id="totalAmount"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                            placeholder="0.00"
                            step="0.01"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="installments" className="block text-sm font-medium text-app-muted mb-2">Número de Mensualidades</label>
                        <input
                            type="number"
                            id="installments"
                            value={installments}
                            onChange={(e) => setInstallments(e.target.value)}
                            className="w-full p-3 rounded-xl bg-app-card border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary text-app-text"
                            placeholder="12"
                            min="1"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="accountId" className="block text-sm font-medium text-app-muted mb-2">Tarjeta de Crédito</label>
                        <select
                            id="accountId"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full p-3 bg-app-card rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
                            required
                        >
                            {isLoadingAccounts ? (
                                <option value="" disabled>Cargando tarjetas...</option>
                            ) : availableCreditAccounts.length > 0 ? (
                                availableCreditAccounts.map(account => (
                                    <option key={account.id} value={account.id}>{account.name}</option>
                                ))
                            ) : (
                                <option value="">No hay tarjetas de crédito disponibles</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="purchaseDate" className="block text-sm font-medium text-app-muted mb-2">Fecha de Compra</label>
                        <DatePicker date={purchaseDate} onDateChange={setPurchaseDate} />
                    </div>

                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-app-muted mb-2">Categoría de Gasto (para mensualidades)</label>
                        <select
                            id="categoryId"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full p-3 bg-app-card rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
                            required
                        >
                            {isLoadingCategories ? (
                                <option value="" disabled>Cargando categorías...</option>
                            ) : availableCategories.length > 0 ? (
                                availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))
                            ) : (
                                <option value="">No hay categorías de gasto disponibles</option>
                            )}
                        </select>
                    </div>

                </fieldset>

                {!isSettled && (
                    <button
                        type="submit"
                        className="btn-modern btn-primary w-full text-white font-bold p-3 rounded-xl shadow-premium hover:bg-app-primary/90 transition-all active:scale-[0.98]"
                        disabled={updatePurchaseMutation.isPending}
                    >
                        {updatePurchaseMutation.isPending ? 'Guardando...' : 'Actualizar Compra a MSI'}
                    </button>
                )}

                {isEditMode && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="btn-modern btn-danger w-full p-3 rounded-xl mt-3"
                        disabled={deletePurchaseMutation.isPending}
                    >
                        {deletePurchaseMutation.isPending ? 'Eliminando...' : 'Eliminar Compra a MSI'}
                    </button>
                )}
            </form>

            {/* Delete Confirmation Sheet */}
            <DeleteConfirmationSheet
                isOpen={showDeleteConfirmation}
                onClose={() => setShowDeleteConfirmation(false)}
                onConfirm={confirmDelete}
                itemName={existingPurchase?.description || ''}
                warningLevel={isSettled ? 'critical' : 'warning'}
                warningMessage={
                    isSettled
                        ? 'PELIGRO: INTEGRIDAD HISTÓRICA'
                        : '¿Estás seguro de eliminar esta compra a MSI?'
                }
                warningDetails={
                    isSettled
                        ? [
                            'Estás a punto de borrar un plan totalmente pagado.',
                            'Esto revertirá TODOS los pagos históricos.',
                            'Tus saldos actuales dejarán de coincidir con la realidad de tu banco.',
                            'Solo haz esto si TODA la operación fue un error.',
                        ]
                        : [
                            'Esta acción eliminará la compra.',
                            'Revertirá la deuda en tu tarjeta.',
                            'Eliminará todas las transacciones de mensualidad generadas.',
                        ]
                }
                requireConfirmation={isSettled}
                isDeleting={deletePurchaseMutation.isPending}
            />
        </div>
    );
};

export default UpsertInstallmentPage;
