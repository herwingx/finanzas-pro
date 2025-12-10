import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Transaction, TransactionType, FrequencyType, InstallmentPurchase } from '../types';
import {
  useCategories, useTransaction, useAddTransaction, useUpdateTransaction,
  useDeleteTransaction, useAddRecurringTransaction, useAccounts,
  useAddInstallmentPurchase, useInstallmentPurchases, usePayInstallment
} from '../hooks/useApi';
import { toast } from 'sonner';
import { DatePicker } from '../components/DatePicker';

const NewTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as TransactionType) || 'expense';
  const editId = searchParams.get('editId');

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: existingTransaction, isLoading: isLoadingExisting } = useTransaction(editId);
  const { data: installmentPurchases, isLoading: isLoadingInstallments } = useInstallmentPurchases();

  const payInstallmentMutation = usePayInstallment();
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const addRecurringMutation = useAddRecurringTransaction();
  const addInstallmentMutation = useAddInstallmentPurchase();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [description, setDescription] = useState(searchParams.get('description') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [destinationAccountId, setDestinationAccountId] = useState(searchParams.get('destinationAccountId') || '');
  const [date, setDate] = useState(new Date());

  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');

  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('');

  const [isMsiPayment, setIsMsiPayment] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(searchParams.get('installmentPurchaseId') || '');

  const debitCashAccounts = useMemo(() => accounts?.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH') || [], [accounts]);
  const creditAccounts = useMemo(() => accounts?.filter(acc => acc.type === 'CREDIT') || [], [accounts]);
  const allAccounts = useMemo(() => accounts || [], [accounts]);

  // Helper: Format account display with balance info
  const formatAccountOption = (account: any) => {
    const typeLabel = account.type === 'CREDIT' ? 'Crédito' : account.type === 'DEBIT' ? 'Débito' : 'Efectivo';
    const balance = account.balance ?? 0; // Handle null/undefined
    const balanceLabel = account.type === 'CREDIT'
      ? `$${balance.toFixed(2)} deuda`
      : `$${balance.toFixed(2)} disponible`;
    return `${account.name} (${typeLabel}) - ${balanceLabel}`;
  };

  // Get destination account info for transfer warnings
  const destinationAccount = useMemo(() =>
    allAccounts.find(acc => acc.id === destinationAccountId),
    [allAccounts, destinationAccountId]
  );

  const isDestinationCredit = destinationAccount?.type === 'CREDIT';
  const creditDebt = destinationAccount?.balance || 0;
  const amountExceedsDebt = isDestinationCredit && parseFloat(amount || '0') > creditDebt;

  const activeInstallmentsForAccount = useMemo(() => {
    if (!accountId || !installmentPurchases) return [];
    return installmentPurchases.filter(p => p.accountId === accountId && p.paidAmount < p.totalAmount);
  }, [accountId, installmentPurchases]);

  const selectedAccountIsCredit = useMemo(() => {
    const account = allAccounts.find(a => a.id === accountId);
    return account?.type === 'CREDIT';
  }, [accountId, allAccounts]);

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId || '');
      setAccountId(existingTransaction.accountId || '');
      setDestinationAccountId(existingTransaction.destinationAccountId || '');
      setDate(new Date(existingTransaction.date));

      if (existingTransaction.installmentPurchaseId && (existingTransaction.type === 'income' || existingTransaction.type === 'transfer')) {
        setIsMsiPayment(true);
        setSelectedInstallmentId(existingTransaction.installmentPurchaseId);
      }
    }
  }, [existingTransaction]);

  useEffect(() => {
    if (allAccounts.length > 0 && !accountId) {
      if (type === 'transfer') {
        const debits = allAccounts.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH');
        if (debits.length > 0) setAccountId(debits[0].id);
        else setAccountId(allAccounts[0].id);
      } else {
        setAccountId(allAccounts[0].id);
      }
    }

    if (isInstallment && creditAccounts.length > 0 && !creditAccounts.find(acc => acc.id === accountId)) {
      setAccountId(creditAccounts[0].id);
    }
  }, [allAccounts, accountId, type, isInstallment, creditAccounts]);

  useEffect(() => {
    if (type === 'transfer' && allAccounts.length > 0 && !destinationAccountId) {
      const otherAccounts = allAccounts.filter(acc => acc.id !== accountId);
      if (otherAccounts.length > 0) setDestinationAccountId(otherAccounts[0].id);
    }
  }, [allAccounts, accountId, destinationAccountId, type]);

  const availableCategories = useMemo(() => categories?.filter(c => c.type === type) || [], [categories, type]);

  useEffect(() => {
    if (type !== 'transfer' && availableCategories.length > 0 && !availableCategories.find(c => c.id === categoryId)) {
      setCategoryId(availableCategories[0].id);
    } else if (type !== 'transfer' && availableCategories.length === 0) {
      setCategoryId('');
    }
  }, [type, availableCategories, categoryId]);

  useEffect(() => {
    if (isMsiPayment) {
      if (selectedInstallmentId) {
        const purchase = activeInstallmentsForAccount.find(p => p.id === selectedInstallmentId);
        if (purchase) {
          const remainingAmount = purchase.totalAmount - purchase.paidAmount;
          const suggestedAmount = Math.min(purchase.monthlyPayment, remainingAmount);
          setAmount(suggestedAmount.toFixed(2));
        }
      } else {
        // Clear amount if MSI mode is on but no plan is selected
        setAmount('');
      }
    }
  }, [isMsiPayment, selectedInstallmentId, activeInstallmentsForAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('El monto debe ser mayor a cero.');
      return;
    }

    const numAmount = parseFloat(amount);
    const finalDescription = description || (availableCategories.find(c => c.id === categoryId)?.name || 'Transacción');

    try {
      // PRIORITY 1: Handle edits FIRST to prevent duplicate creation
      if (editId) {
        // Editing existing transaction - always use PUT endpoint
        const transactionData: any = {
          amount: numAmount,
          description: finalDescription,
          date: date.toISOString(),
          type,
          accountId,
        };

        // Include category for non-transfers
        if (type !== 'transfer' && categoryId) {
          transactionData.categoryId = categoryId;
        }

        // Include destination for transfers
        if (type === 'transfer') {
          if (!destinationAccountId) {
            toast.error('Selecciona la cuenta de destino para la transferencia.');
            return;
          }
          transactionData.destinationAccountId = destinationAccountId;
        }

        // Preserve MSI link if editing MSI payment
        if (existingTransaction?.installmentPurchaseId) {
          transactionData.installmentPurchaseId = existingTransaction.installmentPurchaseId;
        }

        await updateTransactionMutation.mutateAsync({ id: editId, transaction: transactionData });
        toast.success('Transacción actualizada');
      }
      // PRIORITY 2: Create new MSI payment (if not editing)
      else if (isMsiPayment && selectedInstallmentId) {
        if (!accountId) {
          toast.error('Selecciona la cuenta de origen del pago.');
          return;
        }
        await payInstallmentMutation.mutateAsync({
          id: selectedInstallmentId,
          payment: {
            amount: numAmount,
            description: finalDescription || 'Abono a MSI',
            date: date.toISOString(),
            accountId: accountId,
          }
        });
        toast.success('Pago a MSI guardado');
      }
      // PRIORITY 3: Create new transfer
      else if (type === 'transfer') {
        if (!accountId || !destinationAccountId) {
          toast.error('Selecciona ambas cuentas para la transferencia.');
          return;
        }
        if (accountId === destinationAccountId) {
          toast.error('Las cuentas de origen y destino no pueden ser la misma.');
          return;
        }

        const installmentPurchaseId = searchParams.get('installmentPurchaseId');

        await addTransactionMutation.mutateAsync({
          amount: numAmount,
          description: finalDescription || `Transferencia`,
          date: date.toISOString(),
          type: 'transfer',
          accountId,
          destinationAccountId,
          installmentPurchaseId: installmentPurchaseId || undefined,
        } as Omit<Transaction, 'id'>);
        toast.success('Transferencia guardada');
      }
      // PRIORITY 4: Create new MSI purchase
      else if (isInstallment) {
        if (!accountId) {
          toast.error('Selecciona una tarjeta de crédito para la compra a MSI.');
          return;
        }
        if (!installments || parseInt(installments, 10) <= 0) {
          toast.error('El número de meses debe ser mayor a cero.');
          return;
        }
        if (!categoryId) {
          toast.error('Selecciona una categoría para las mensualidades de MSI.');
          return;
        }
        await addInstallmentMutation.mutateAsync({
          description: finalDescription || 'Compra a MSI',
          totalAmount: numAmount,
          installments: parseInt(installments, 10),
          purchaseDate: date.toISOString(),
          accountId,
          categoryId,
        });
        toast.success('Compra a MSI guardada');
      }
      // PRIORITY 5: Create recurring transaction
      else if (isRecurring) {
        if (!categoryId) {
          toast.error('Selecciona una categoría para la transacción recurrente.');
          return;
        }
        await addRecurringMutation.mutateAsync({
          amount: numAmount,
          description: finalDescription || 'Gasto Recurrente',
          categoryId,
          accountId,
          startDate: date.toISOString(),
          type,
          frequency,
          active: true,
          nextDueDate: date.toISOString(),
        });
        toast.success('Transacción recurrente guardada');
      }
      // PRIORITY 6: Create normal transaction
      else {
        if (!categoryId) {
          toast.error('Selecciona una categoría para la transacción.');
          return;
        }
        await addTransactionMutation.mutateAsync({
          amount: numAmount,
          description: finalDescription,
          categoryId,
          accountId,
          date: date.toISOString(),
          type,
        } as Omit<Transaction, 'id'>);
        toast.success('Transacción guardada');
      }
      navigate(-1);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar.');
      console.error(error);
    }
  };

  const executeDelete = async () => {
    try {
      await deleteTransactionMutation.mutateAsync(editId!);
      toast.success('Transacción eliminada');
      navigate(-1);
    } catch (error) {
      toast.error('Error al eliminar la transacción.');
    }
  };

  const handleDelete = async () => {
    if (!editId) return;

    // Safety check for MSI payments with Sonner Toast
    if (existingTransaction?.installmentPurchaseId && (existingTransaction.type === 'income' || existingTransaction.type === 'transfer')) {
      toast.custom((t) => (
        <div className="bg-white dark:bg-gray-800 border border-yellow-500/50 rounded-xl p-4 flex flex-col gap-3 shadow-xl max-w-sm w-full">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-app-text font-bold text-sm">Advertencia de Integridad</p>
              <p className="text-app-muted text-xs mt-1">
                Estás eliminando un pago de <b>Meses Sin Intereses</b>.
              </p>
              <ul className="list-disc list-inside text-xs text-app-muted mt-1 opacity-80">
                <li>El dinero regresará a tu cuenta.</li>
                <li>Aumentará la deuda en tu tarjeta.</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { toast.dismiss(t); executeDelete(); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Eliminar Pago
            </button>
          </div>
        </div>
      ), { duration: Infinity, id: 'msi-delete-confirm' });
      return;
    }

    executeDelete();
  };

  const isFormDisabled = addTransactionMutation.isPending || updateTransactionMutation.isPending || addRecurringMutation.isPending || addInstallmentMutation.isPending || payInstallmentMutation.isPending;
  const isCategoryRequired = type !== 'transfer' && !isMsiPayment;

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
          <h1 className="text-lg font-bold">{editId ? 'Editar' : 'Nueva'} Transacción</h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 px-4 pt-6 space-y-8 overflow-y-auto pb-32">
          {searchParams.get('type') === 'transfer' && searchParams.get('destinationAccountId') ? (
            <div className="text-center font-bold text-app-primary py-2 uppercase tracking-wider text-xs bg-app-primary/10 rounded-xl mb-4 border border-app-primary/20">
              Pago a Tarjeta
            </div>
          ) : (
            !editId ? (
              <div className="flex p-1 bg-app-card rounded-2xl border border-app-border">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'income' ? 'bg-app-success text-white' : 'text-app-muted'}`}>Ingreso</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-app-danger text-white' : 'text-app-muted'}`}>Gasto</button>
                <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'transfer' ? 'bg-blue-500 text-white' : 'text-app-muted'}`}>Transferencia</button>
              </div>
            ) : (
              <div className="text-center">
                <span className={`px-4 py-2 text-sm font-bold rounded-xl ${type === 'income' ? 'bg-app-success/10 text-app-success' :
                  type === 'expense' ? 'bg-app-danger/10 text-app-danger' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                  {type === 'income' ? 'Ingreso' : type === 'expense' ? 'Gasto' : 'Transferencia'}
                </span>
              </div>
            )
          )}

          <div className="text-center space-y-2">
            <label className="text-app-muted text-sm">Monto</label>
            <div className="flex items-center justify-center">
              <span className="text-3xl text-app-muted font-light pr-2">$</span>
              <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={amount} onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
              }} placeholder="0.00" className="w-full max-w-[200px] bg-transparent text-center text-5xl font-bold placeholder-app-muted/30 focus:outline-none" autoFocus={!editId} required />
            </div>
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden divide-y divide-app-border">
            {/* Account Selector(s) */}
            {type === 'transfer' ? (
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="fromAccount" className="block text-xs text-app-muted font-bold mb-3 uppercase">Cuenta de Origen</label>
                  <select
                    id="fromAccount"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full p-3 bg-app-bg rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
                    required
                  >
                    {isLoadingAccounts ? <option value="">Cargando...</option> :
                      debitCashAccounts.map(account => (
                        <option key={account.id} value={account.id}>{formatAccountOption(account)}</option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label htmlFor="toAccount" className="block text-xs text-app-muted font-bold mb-3 uppercase">Cuenta de Destino</label>
                  <select
                    id="toAccount"
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full p-3 bg-app-bg rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
                    required
                  >
                    {isLoadingAccounts ? <option value="">Cargando...</option> :
                      allAccounts.filter(acc => acc.id !== accountId).map(account => (
                        <option key={account.id} value={account.id}>{formatAccountOption(account)}</option>
                      ))
                    }
                  </select>
                </div>

                {/* Credit Card Debt Warning & Quick Actions */}
                {isDestinationCredit && destinationAccount && (
                  <div className="mx-4 mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-500 text-xl">credit_card</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-app-text">Abono a Tarjeta de Crédito</p>
                        <p className="text-xs text-app-muted mt-1">
                          Deuda actual: <span className="font-bold text-blue-500">${creditDebt.toFixed(2)}</span>
                        </p>
                        {amountExceedsDebt && parseFloat(amount) > 0 && (
                          <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">error</span>
                            No puedes abonar más de la deuda actual
                          </p>
                        )}
                      </div>
                    </div>
                    {creditDebt > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(creditDebt.toFixed(2))}
                        className="mt-3 w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Liquidar Total (${creditDebt.toFixed(2)})
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <label htmlFor="account" className="block text-xs text-app-muted font-bold mb-3 uppercase">Cuenta</label>
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="w-full p-3 bg-app-bg rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary" required>
                  {isLoadingAccounts ? <option>Cargando...</option> :
                    allAccounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name} ({account.type})</option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* Category Picker (Hidden for transfers) */}
            {isCategoryRequired && (
              <div className="p-4">
                <label className="block text-xs text-app-muted font-bold mb-3 uppercase">Categoría</label>
                <div className="grid grid-cols-4 gap-3">
                  {availableCategories.map(cat => (
                    <button type="button" key={cat.id} onClick={() => setCategoryId(cat.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2 ${categoryId === cat.id ? 'border-app-primary bg-app-primary/10' : 'border-transparent hover:bg-app-elevated'}`}>
                      <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}><span className="material-symbols-outlined text-xl">{cat.icon}</span></div>
                      <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                  {availableCategories.length === 0 && (
                    <div className="col-span-4 text-center py-4 text-app-muted text-sm">
                      No hay categorías de {type === 'income' ? 'ingreso' : 'gasto'}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MSI Payment Toggle & Fields (Only for income on credit accounts, not edit mode) */}
            {!editId && type === 'income' && selectedAccountIsCredit && (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">¿Es un abono a Meses Sin Intereses?</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isMsiPayment} onChange={() => setIsMsiPayment(!isMsiPayment)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                  </label>
                </div>
                {isMsiPayment && (
                  <div className="mt-4">
                    <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Selecciona la compra a pagar</label>
                    <select value={selectedInstallmentId} onChange={e => setSelectedInstallmentId(e.target.value)} className="w-full p-3 bg-app-bg rounded-xl border border-app-border" required>
                      <option value="">-- Elige una opción --</option>
                      {isLoadingInstallments ? <option>Cargando...</option> :
                        activeInstallmentsForAccount.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.description} (${(p.totalAmount - p.paidAmount).toFixed(2)} restantes)
                          </option>
                        ))
                      }
                    </select>
                    {activeInstallmentsForAccount.length === 0 && !isLoadingInstallments && (
                      <p className="text-xs text-app-muted mt-2">No hay compras a MSI activas para esta cuenta.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MSI Toggle & Fields (Only for expense, not edit mode) */}
            {!editId && type === 'expense' && !isMsiPayment && (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">¿Compra a Meses Sin Intereses?</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isInstallment} onChange={() => setIsInstallment(!isInstallment)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                  </label>
                </div>
                {isInstallment && (
                  <div className="mt-4">
                    <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Número de Meses</label>
                    <input type="number" value={installments} onChange={e => setInstallments(e.target.value)} className="w-full p-3 bg-app-bg rounded-xl border border-app-border" placeholder="Ej: 12" required />
                  </div>
                )}
              </div>
            )}

            {/* Recurring Toggle & Frequency (Only for income/expense, not edit mode, not MSI) */}
            {!editId && !isInstallment && type !== 'transfer' && (
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Hacer recurrente</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isRecurring} onChange={() => setIsRecurring(!isRecurring)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                  </label>
                </div>
                {isRecurring && (
                  <div className="mt-4">
                    <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Frecuencia</label>
                    <select value={frequency} onChange={e => setFrequency(e.target.value as FrequencyType)} className="w-full p-3 bg-app-bg rounded-xl border border-app-border">
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                      <option value="biweekly">Quincenal</option>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="p-4"><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (Opcional)" className="w-full bg-transparent focus:outline-none" /></div>
            <div className="p-4"><DatePicker date={date} onDateChange={setDate} /></div>
          </div>

          {editId && <div className="p-4"><button type="button" onClick={handleDelete} className="w-full py-3 bg-app-danger/10 text-app-danger font-bold rounded-xl">Eliminar</button></div>}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/80 backdrop-blur-xl border-t border-app-border">
          <button type="submit" disabled={isFormDisabled} className="w-full h-14 rounded-2xl text-lg font-bold bg-app-primary text-white disabled:bg-app-elevated disabled:text-app-muted transition-all">
            Guardar
          </button>
        </footer>
      </form>
    </div>
  );
};

export default NewTransaction;
