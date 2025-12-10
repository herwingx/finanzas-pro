import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Transaction, TransactionType, FrequencyType, InstallmentPurchase } from '../types';
import {
  useCategories, useTransaction, useAddTransaction, useUpdateTransaction,
  useDeleteTransaction, useAddRecurringTransaction, useAccounts,
  useAddInstallmentPurchase, useInstallmentPurchases, usePayInstallment
} from '../hooks/useApi';
import { toastSuccess, toastError, toastWarning, toastInfo, toastLoading, toastUpdateSuccess, toastUpdateError, toastCustom, toast, toastDismiss } from '../utils/toast';
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

  const mode = searchParams.get('mode'); // 'edit' or undefined (view)
  const [isViewingDetails, setIsViewingDetails] = useState(!!editId && mode !== 'edit');

  const debitCashAccounts = useMemo(() => accounts?.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH') || [], [accounts]);
  const creditAccounts = useMemo(() => accounts?.filter(acc => acc.type === 'CREDIT') || [], [accounts]);
  // Credit accounts with debt (valid transfer destinations)
  const creditAccountsWithDebt = useMemo(() => accounts?.filter(acc => acc.type === 'CREDIT' && acc.balance > 0) || [], [accounts]);
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

  // Valid transfer destination accounts (excludes the source account + shows only credit with debt)
  const validDestinationAccounts = useMemo(() => {
    if (!accountId) return allAccounts;
    // For destination: show all except source, but filter credit cards to only those with debt
    return allAccounts.filter(acc => {
      if (acc.id === accountId) return false; // Can't transfer to same account
      if (acc.type === 'CREDIT' && acc.balance <= 0) return false; // Don't show credit cards without debt
      return true;
    });
  }, [allAccounts, accountId]);

  const isDestinationCredit = destinationAccount?.type === 'CREDIT';
  const creditDebt = destinationAccount?.balance || 0;
  const amountExceedsDebt = isDestinationCredit && parseFloat(amount || '0') > creditDebt;

  const activeInstallmentsForAccount = useMemo(() => {
    if (!accountId || !installmentPurchases) return [];
    return installmentPurchases.filter(p => p.accountId === accountId && p.paidAmount < p.totalAmount);
  }, [accountId, installmentPurchases]);

  // Active MSI plans for DESTINATION credit card (for transfer payment linking)
  const activeInstallmentsForDestination = useMemo(() => {
    if (!destinationAccountId || !installmentPurchases || !isDestinationCredit) return [];
    return installmentPurchases.filter(p => p.accountId === destinationAccountId && p.paidAmount < p.totalAmount);
  }, [destinationAccountId, installmentPurchases, isDestinationCredit]);

  const selectedAccountIsCredit = useMemo(() => {
    const account = allAccounts.find(a => a.id === accountId);
    return account?.type === 'CREDIT';
  }, [accountId, allAccounts]);

  // State for MSI payment linking in transfers
  const [linkMsiPayment, setLinkMsiPayment] = useState(false);
  const [selectedMsiForTransfer, setSelectedMsiForTransfer] = useState('');

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
      if (type === 'transfer' || type === 'income') {
        // For transfers and income: prefer DEBIT/CASH accounts
        const debits = allAccounts.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH');
        if (debits.length > 0) setAccountId(debits[0].id);
        else setAccountId(allAccounts[0].id);
      } else {
        // For expenses: any account is fine
        setAccountId(allAccounts[0].id);
      }
    }

    if (isInstallment && creditAccounts.length > 0 && !creditAccounts.find(acc => acc.id === accountId)) {
      setAccountId(creditAccounts[0].id);
    }
  }, [allAccounts, accountId, type, isInstallment, creditAccounts]);

  useEffect(() => {
    if (type === 'transfer' && validDestinationAccounts.length > 0 && !destinationAccountId) {
      // Auto-select first valid destination (preferably a credit card with debt)
      const creditWithDebt = validDestinationAccounts.find(acc => acc.type === 'CREDIT');
      setDestinationAccountId(creditWithDebt?.id || validDestinationAccounts[0].id);
    }
  }, [validDestinationAccounts, accountId, destinationAccountId, type]);

  // Switch away from credit accounts when changing to income type
  useEffect(() => {
    if (type === 'income' && accountId) {
      const currentAccount = allAccounts.find(acc => acc.id === accountId);
      if (currentAccount && currentAccount.type === 'CREDIT') {
        // Current account is credit, switch to first DEBIT/CASH account
        const debits = allAccounts.filter(acc => acc.type === 'DEBIT' || acc.type === 'CASH');
        if (debits.length > 0) {
          setAccountId(debits[0].id);
        }
      }
    }
  }, [type, accountId, allAccounts]);

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
      toastError('El monto debe ser mayor a cero.');
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
            toastError('Selecciona la cuenta de destino para la transferencia.');
            return;
          }
          transactionData.destinationAccountId = destinationAccountId;
        }

        // Preserve MSI link if editing MSI payment
        if (existingTransaction?.installmentPurchaseId) {
          transactionData.installmentPurchaseId = existingTransaction.installmentPurchaseId;
        }

        await updateTransactionMutation.mutateAsync({ id: editId, transaction: transactionData });
        toastSuccess('Transacción actualizada');
      }
      // PRIORITY 2: Create new MSI payment (if not editing)
      else if (isMsiPayment && selectedInstallmentId) {
        if (!accountId) {
          toastError('Selecciona la cuenta de origen del pago.');
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
        toastSuccess('Pago a MSI guardado');
      }
      // PRIORITY 3: Create new transfer
      else if (type === 'transfer') {
        if (!accountId || !destinationAccountId) {
          toastError('Selecciona ambas cuentas para la transferencia.');
          return;
        }
        if (accountId === destinationAccountId) {
          toastError('Las cuentas de origen y destino no pueden ser la misma.');
          return;
        }

        // Check if this transfer should be linked to an MSI payment
        const installmentPurchaseId = searchParams.get('installmentPurchaseId') ||
          (linkMsiPayment && selectedMsiForTransfer && selectedMsiForTransfer !== '__LIQUIDATE_ALL__' ? selectedMsiForTransfer : undefined);

        // Special case: Liquidate ALL MSI plans
        if (linkMsiPayment && selectedMsiForTransfer === '__LIQUIDATE_ALL__' && activeInstallmentsForDestination.length > 0) {
          // Calculate total MSI debt
          const totalMSIDebt = activeInstallmentsForDestination.reduce((sum, msi) =>
            sum + (msi.totalAmount - msi.paidAmount), 0
          );

          // Distribute payment proportionally
          let remainingAmount = numAmount;
          const toastId = toastLoading('Distribuyendo pago entre planes MSI...');

          try {
            for (let i = 0; i < activeInstallmentsForDestination.length; i++) {
              const msi = activeInstallmentsForDestination[i];
              const msiDebt = msi.totalAmount - msi.paidAmount;

              // Calculate proportional allocation
              let allocation;
              if (i === activeInstallmentsForDestination.length - 1) {
                // Last one gets all remaining to avoid rounding errors
                allocation = remainingAmount;
              } else {
                allocation = (msiDebt / totalMSIDebt) * numAmount;
              }

              // Cap at MSI debt
              allocation = Math.min(allocation, msiDebt);

              // Pay this MSI plan
              if (allocation > 0) {
                await payInstallmentMutation.mutateAsync({
                  id: msi.id,
                  payment: {
                    amount: allocation,
                    description: `Liquidación - ${msi.description}`,
                    date: date.toISOString(),
                    accountId: accountId,
                  }
                });
              }

              remainingAmount -= allocation;
            }

            toastUpdateSuccess(toastId, 'Deuda liquidada y planes MSI actualizados');
          } catch (error: any) {
            toastUpdateError(toastId, error.message || 'Error al distribuir pago');
            throw error;
          }
        } else {
          // Regular transfer (with or without single MSI link)
          await addTransactionMutation.mutateAsync({
            amount: numAmount,
            description: finalDescription || (isDestinationCredit ? 'Pago a Tarjeta de Crédito' : 'Transferencia'),
            date: date.toISOString(),
            type: 'transfer',
            accountId,
            destinationAccountId,
            installmentPurchaseId: installmentPurchaseId || undefined,
          } as Omit<Transaction, 'id'>);

          const successMsg = installmentPurchaseId ? 'Pago a MSI guardado' :
            isDestinationCredit ? 'Pago a tarjeta guardado' : 'Transferencia guardada';
          toast.success(successMsg);
        }
      }
      // PRIORITY 4: Create new MSI purchase
      else if (isInstallment) {
        if (!accountId) {
          toastError('Selecciona una tarjeta de crédito para la compra a MSI.');
          return;
        }
        if (!installments || parseInt(installments, 10) <= 0) {
          toastError('El número de meses debe ser mayor a cero.');
          return;
        }
        if (!categoryId) {
          toastError('Selecciona una categoría para las mensualidades de MSI.');
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
        toastSuccess('Compra a MSI guardada');
      }
      // PRIORITY 5: Create recurring transaction
      else if (isRecurring) {
        if (!categoryId) {
          toastError('Selecciona una categoría para la transacción recurrente.');
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
        toastSuccess('Transacción recurrente guardada');
      }
      // PRIORITY 6: Create normal transaction
      else {
        if (!categoryId) {
          toastError('Selecciona una categoría para la transacción.');
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
        toastSuccess('Transacción guardada');
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
      toastSuccess('Transacción eliminada');
      navigate(-1);
    } catch (error) {
      toastError('Error al eliminar la transacción.');
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

  // 1. Loading State to prevent Flicker
  if (editId && isLoadingExisting) {
    return (
      <div className="flex flex-col h-screen bg-app-bg">
        <header className="p-4 bg-app-bg border-b border-app-border">
          <div className="h-6 w-32 bg-app-elevated animate-pulse rounded"></div>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
        </div>
      </div>
    );
  }

  // 2. Details View (Read Only)
  if (isViewingDetails && existingTransaction) {
    const isAdjustment = existingTransaction.description.includes('🔧') || existingTransaction.description.toLowerCase().includes('ajuste');
    // Check if it's an initial MSI purchase (Expense type with installmentId)
    const isInitialMsi = existingTransaction.installmentPurchaseId && existingTransaction.type === 'expense';

    const categoryName = existingTransaction.category?.name || (existingTransaction.description) || 'Sin Categoría';
    const accountName = existingTransaction.account?.name || 'Cuenta Eliminada';
    const destAccountName = existingTransaction.destinationAccount?.name;

    return (
      <div className="flex flex-col h-screen bg-app-bg text-app-text">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold">Detalle de Transacción</h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 px-6 pt-8 space-y-6 overflow-y-auto">
          {/* Main Card */}
          <div className="bg-app-card border border-app-border rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4 animate-fade-in">
            <div className={`size-16 rounded-full flex items-center justify-center text-3xl shadow-inner ${isAdjustment ? 'bg-slate-100 text-slate-500' :
                existingTransaction.type === 'expense' ? 'bg-red-100 text-red-500' :
                  existingTransaction.type === 'income' ? 'bg-green-100 text-green-500' : 'bg-blue-100 text-blue-500'
              }`}>
              <span className="material-symbols-outlined text-3xl">
                {isAdjustment ? 'tune' : existingTransaction.category?.icon || 'receipt'}
              </span>
            </div>

            <div className="text-center">
              <p className="text-sm text-app-muted uppercase font-bold tracking-wider">{categoryName}</p>
              <h2 className={`text-4xl font-black mt-2 ${existingTransaction.type === 'expense' ? 'text-app-text' :
                  existingTransaction.type === 'income' ? 'text-green-500' : 'text-blue-500'
                }`}>
                {existingTransaction.type === 'expense' ? '-' : '+'}${existingTransaction.amount.toFixed(2)}
              </h2>
              <p className="text-app-text mt-2 font-medium">{existingTransaction.description}</p>
            </div>

            <div className="w-full h-px bg-app-border my-2"></div>

            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-app-muted">Fecha</span>
                <span className="font-medium text-app-text">
                  {new Date(existingTransaction.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-app-muted">Cuenta</span>
                <span className="font-medium text-app-text">{accountName}</span>
              </div>
              {destAccountName && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-app-muted">Destino</span>
                  <span className="font-medium text-app-text">{destAccountName}</span>
                </div>
              )}

              {/* Information Banners */}
              {isAdjustment && (
                <div className="mt-4 p-3 bg-app-elevated rounded-xl border border-app-border text-xs text-app-muted flex gap-2 items-start">
                  <span className="material-symbols-outlined text-sm shrink-0">info</span>
                  <p>Este es un ajuste de sistema. No se puede editar el monto, pero puedes eliminarlo.</p>
                </div>
              )}
              {isInitialMsi && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-300 flex gap-2 items-start">
                  <span className="material-symbols-outlined text-sm shrink-0">credit_card</span>
                  <p>Esta es una compra a Meses Sin Intereses. Gestionala desde la sección MSI.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="p-4 bg-app-bg border-t border-app-border flex gap-3">
          <button
            onClick={handleDelete}
            className="flex-1 py-3.5 rounded-2xl font-bold bg-app-danger/10 text-app-danger hover:bg-app-danger/20 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Eliminar
          </button>

          <button
            onClick={() => {
              if (isAdjustment) {
                toastInfo("Los ajustes manuales no son editables. Elimínalo si es incorrecto.");
                return;
              }
              if (isInitialMsi) {
                toastInfo("Ve a la sección 'Meses Sin Intereses' para gestionar esta compra.");
                // Optional: navigate('/installments')
                return;
              }
              setIsViewingDetails(false);
            }}
            className={`flex-[2] py-3.5 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-app-primary/20 ${isAdjustment || isInitialMsi ? 'bg-slate-400 cursor-not-allowed opacity-50' : 'bg-app-primary hover:bg-app-primary/90'
              }`}
          >
            <span className="material-symbols-outlined text-sm">{isAdjustment || isInitialMsi ? 'lock' : 'edit'}</span>
            {isAdjustment ? 'No Editable' : isInitialMsi ? 'Ver en MSI' : 'Editar'}
          </button>
        </footer>
      </div>
    );
  }

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
                <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'transfer' ? 'bg-app-secondary text-white shadow-md' : 'text-app-muted'}`}>Transferencia</button>
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
                    {isLoadingAccounts ? <option value="" disabled>Cargando cuentas...</option> :
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
                    {isLoadingAccounts ? <option value="" disabled>Cargando cuentas...</option> :
                      validDestinationAccounts.length > 0 ? (
                        validDestinationAccounts.map(account => (
                          <option key={account.id} value={account.id}>{formatAccountOption(account)}</option>
                        ))
                      ) : (
                        <option value="" disabled>No hay cuentas de destino disponibles</option>
                      )
                    }
                  </select>
                  {validDestinationAccounts.length === 0 && (
                    <p className="mt-2 text-xs text-app-muted">No hay cuentas válidas para transferir. Las tarjetas de crédito sin deuda no se muestran.</p>
                  )}
                </div>

                {/* Credit Card Payment Section with MSI Linking */}
                {isDestinationCredit && destinationAccount && (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-xl">credit_card</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-app-text">Pago a Tarjeta de Crédito</p>
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
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              // Check if there are active MSI plans
                              if (activeInstallmentsForDestination.length > 0) {
                                // Show confirmation toast for liquidating with MSI
                                toast.custom((t) => (
                                  <div className="bg-white dark:bg-gray-800 border border-blue-500/50 rounded-xl p-4 flex flex-col gap-3 shadow-xl max-w-md w-full">
                                    <div className="flex items-start gap-3">
                                      <span className="text-2xl">💳</span>
                                      <div>
                                        <p className="text-app-text font-bold text-sm">Liquidar Deuda Total</p>
                                        <p className="text-app-muted text-xs mt-1">
                                          Vas a pagar: <span className="font-bold text-blue-500">${creditDebt.toFixed(2)}</span>
                                        </p>
                                        {activeInstallmentsForDestination.length > 0 && (
                                          <div className="mt-2">
                                            <p className="text-xs font-bold text-app-text">Esto incluye {activeInstallmentsForDestination.length} plan(es) MSI:</p>
                                            <ul className="list-disc list-inside text-xs text-app-muted mt-1 space-y-0.5">
                                              {activeInstallmentsForDestination.map(msi => (
                                                <li key={msi.id}>
                                                  {msi.description}: ${(msi.totalAmount - msi.paidAmount).toFixed(2)} ({msi.installments - msi.paidInstallments} mens. restantes)
                                                </li>
                                              ))}
                                            </ul>
                                            <p className="text-xs text-app-muted mt-2 italic">
                                              ✅ Todos los planes MSI se marcarán como completamente pagados.
                                            </p>
                                          </div>
                                        )}
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
                                        onClick={() => {
                                          toast.dismiss(t);
                                          setAmount(creditDebt.toFixed(2));
                                          // Set all MSI plans to be paid
                                          if (activeInstallmentsForDestination.length > 0) {
                                            setLinkMsiPayment(true);
                                            setSelectedMsiForTransfer('__LIQUIDATE_ALL__'); // Special flag
                                          }
                                        }}
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                      >
                                        Confirmar y Liquidar
                                      </button>
                                    </div>
                                  </div>
                                ), { duration: Infinity, id: 'liquidate-confirm' });
                              } else {
                                // No MSI, just set the amount
                                setAmount(creditDebt.toFixed(2));
                              }
                            }}
                            className="mt-3 w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            Liquidar Total (${creditDebt.toFixed(2)})
                          </button>
                          {activeInstallmentsForDestination.length > 0 && (
                            <p className="text-xs text-app-muted mt-2 text-center">
                              Incluye {activeInstallmentsForDestination.length} plan(es) MSI activo(s)
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* MSI Payment Linking */}
                    {activeInstallmentsForDestination.length > 0 && (
                      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-500">calendar_month</span>
                            <label className="text-sm font-bold text-app-text">¿Es pago de MSI?</label>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={linkMsiPayment}
                              onChange={(e) => {
                                setLinkMsiPayment(e.target.checked);
                                if (!e.target.checked) setSelectedMsiForTransfer('');
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                          </label>
                        </div>
                        {linkMsiPayment && (
                          <div>
                            <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Selecciona el plan MSI</label>
                            <select
                              value={selectedMsiForTransfer}
                              onChange={e => {
                                setSelectedMsiForTransfer(e.target.value);
                                // Auto-fill suggested amount
                                const plan = activeInstallmentsForDestination.find(p => p.id === e.target.value);
                                if (plan) {
                                  const remaining = plan.totalAmount - plan.paidAmount;
                                  const suggested = Math.min(plan.monthlyPayment, remaining);
                                  setAmount(suggested.toFixed(2));
                                }
                              }}
                              className="w-full p-3 bg-app-bg rounded-xl border border-app-border"
                              required={linkMsiPayment}
                            >
                              <option value="">-- Elige una opción --</option>
                              {activeInstallmentsForDestination.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.description} - ${(p.totalAmount - p.paidAmount).toFixed(2)} restantes
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-app-muted mt-2 flex items-start gap-1">
                              <span className="material-symbols-outlined text-sm">info</span>
                              <span>Vincular este pago actualizará el progreso del plan MSI automáticamente.</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                <label htmlFor="account" className="block text-xs text-app-muted font-bold mb-3 uppercase">Cuenta</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full p-3 bg-app-bg rounded-xl border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
                  required
                >
                  {isLoadingAccounts ? <option disabled>Cargando cuentas...</option> :
                    // For INCOME: Only show DEBIT/CASH accounts (can't deposit income directly to credit cards)
                    // For EXPENSE: Show all accounts
                    (type === 'income' ? debitCashAccounts : allAccounts).map(account => (
                      <option key={account.id} value={account.id}>{formatAccountOption(account)}</option>
                    ))
                  }
                </select>
                {type === 'income' && creditAccounts.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-app-muted flex items-start gap-2">
                      <span className="material-symbols-outlined text-blue-500 text-sm">info</span>
                      <span>Para pagar tarjetas de crédito, usa <strong>Transferencia</strong> en lugar de Ingreso.</span>
                    </p>
                  </div>
                )}
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
                      {isLoadingInstallments ? <option disabled>Cargando compras...</option> :
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

          {editId && <div className="p-4"><button type="button" onClick={handleDelete} className="btn-modern w-full py-3 bg-app-danger/10 text-app-danger font-bold text-base hover:bg-app-danger hover:text-white transition-all shadow-none hover:shadow-lg">Eliminar Transacción</button></div>}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/80 backdrop-blur-xl border-t border-app-border">
          <button type="submit" disabled={isFormDisabled} className="btn-modern w-full h-14 text-lg font-bold btn-primary shadow-premium transition-transform active:scale-[0.98]">
            Guardar Transacción
          </button>
        </footer>
      </form>
    </div>
  );
};

export default NewTransaction;
