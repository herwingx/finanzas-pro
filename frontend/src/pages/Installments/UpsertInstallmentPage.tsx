import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { useInstallmentPurchases, useUpdateInstallmentPurchase, useDeleteInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toast } from 'sonner';
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
    const [categoryId, setCategoryId] = useState(''); // To store original category for re-creation

    const updatePurchaseMutation = useUpdateInstallmentPurchase();
    const deletePurchaseMutation = useDeleteInstallmentPurchase();

    useEffect(() => {
        if (isEditMode && existingPurchase) {
            setDescription(existingPurchase.description);
            setTotalAmount(String(existingPurchase.totalAmount));
            setInstallments(String(existingPurchase.installments));
            setPurchaseDate(new Date(existingPurchase.purchaseDate));
            setAccountId(existingPurchase.accountId);
            // Find the categoryId from one of the generated transactions, or use a default if possible.
            if (existingPurchase.generatedTransactions && existingPurchase.generatedTransactions.length > 0) {
                setCategoryId(existingPurchase.generatedTransactions[0].categoryId);
            }
        }
    }, [isEditMode, existingPurchase]);

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
            toast.error('Faltan campos requeridos.');
            return;
        }
        if (parseFloat(totalAmount) <= 0 || parseInt(installments, 10) <= 0) {
            toast.error('El monto total y el número de meses deben ser mayores a cero.');
            return;
        }

        const purchaseData = {
            description,
            totalAmount: parseFloat(totalAmount),
            installments: parseInt(installments, 10),
            purchaseDate: purchaseDate.toISOString(),
            accountId,
            categoryId, // Passed to backend for initial transaction creation
        };

        try {
            await updatePurchaseMutation.mutateAsync({ id: id!, purchase: purchaseData });
            toast.success('Compra a MSI actualizada con éxito!');
            navigate('/installments');
        } catch (error: any) {
            toast.error(`Error al actualizar la compra a MSI: ${error.message || 'Desconocido'}`);
            console.error(error);
        }
    };

    const handleDelete = async () => {
        if (!id) return;

        toast.custom((t) => (
            <div className="bg-app-card border border-app-border rounded-xl p-4 flex flex-col gap-3 shadow-lg max-w-sm w-full">
                <p className="text-app-text font-bold text-sm">¿Estás seguro de eliminar esta compra a MSI?</p>
                <p className="text-app-muted text-xs">Esta acción eliminará la compra, revertirá la deuda en tu tarjeta y eliminará todas las transacciones de mensualidad generadas.</p>
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
                                await deletePurchaseMutation.mutateAsync(id);
                                toast.success('Compra a MSI eliminada con éxito.');
                                navigate('/installments');
                            } catch (error: any) {
                                toast.error(`Error al eliminar la compra a MSI: ${error.message || 'Desconocido'}`);
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
            id: 'delete-installment-confirm',
        });
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

            <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-6">
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
                            <option value="">Cargando tarjetas...</option>
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
                            <option value="">Cargando categorías...</option>
                        ) : availableCategories.length > 0 ? (
                            availableCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))
                        ) : (
                            <option value="">No hay categorías de gasto disponibles</option>
                        )}
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full bg-app-primary text-white font-bold p-3 rounded-xl shadow-md hover:bg-app-primary/90 transition-colors"
                    disabled={updatePurchaseMutation.isPending}
                >
                    {updatePurchaseMutation.isPending ? 'Guardando...' : 'Actualizar Compra a MSI'}
                </button>

                {isEditMode && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full bg-app-danger text-white font-bold p-3 rounded-xl shadow-md hover:bg-app-danger/90 transition-colors mt-3"
                        disabled={deletePurchaseMutation.isPending}
                    >
                        {deletePurchaseMutation.isPending ? 'Eliminando...' : 'Eliminar Compra a MSI'}
                    </button>
                )}
            </form>
        </div>
    );
};

export default UpsertInstallmentPage;
