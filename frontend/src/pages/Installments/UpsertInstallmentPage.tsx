import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { DeleteConfirmationSheet } from '../../components/DeleteConfirmationSheet';
import { useInstallmentPurchases, useUpdateInstallmentPurchase, useDeleteInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../../utils/toast';
import { DatePicker } from '../../components/DatePicker';

const UpsertInstallmentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditMode = !!id;

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
                        className="btn-modern bg-app-danger/10 text-app-danger w-full font-bold p-3 rounded-xl shadow-none hover:bg-app-danger hover:text-white transition-all mt-3"
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
