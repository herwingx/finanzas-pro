import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { useAddAccount, useUpdateAccount, useAccounts, useDeleteAccount } from '../../hooks/useApi';
import { AccountType } from '../../types';
import { toast } from 'sonner'; // Assuming sonner is used for toasts

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
                toast.success('Cuenta actualizada con éxito!');
            } else {
                await addAccountMutation.mutateAsync(accountData);
                toast.success('Cuenta creada con éxito!');
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
                <p className="text-app-muted text-xs">Esta acción no se puede deshacer y eliminará todas las transacciones asociadas a esta cuenta.</p>
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
                                toast.success('Cuenta eliminada con éxito.');
                                navigate('/accounts');
                            } catch (error: any) {
                                if (error.message.includes('associated transactions')) {
                                    toast.error('No se puede eliminar la cuenta porque tiene transacciones asociadas.');
                                } else {
                                    toast.error('Error al eliminar la cuenta.');
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
                        placeholder="0.00"
                        step="0.01"
                        required
                    />
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
        </div>
    );
};

export default UpsertAccountPage;
