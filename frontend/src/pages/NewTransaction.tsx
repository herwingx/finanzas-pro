import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Transaction, TransactionType, InstallmentPurchase } from '../types';
import {
  useCategories, useTransaction, useAddTransaction, useUpdateTransaction,
  useDeleteTransaction, useAccounts,
  useAddInstallmentPurchase, useInstallmentPurchases, usePayInstallment
} from '../hooks/useApi';
import { toastSuccess, toastError, toastWarning, toastInfo, toastLoading, toastUpdateSuccess, toastUpdateError, toastCustom, toast, toastDismiss } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DatePicker } from '../components/DatePicker';
import { CategorySelector } from '../components/CategorySelector';

const NewTransaction: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add location
  const [searchParams] = useSearchParams();
  const state = location.state as any; // Read state passed from navigation

  const initialType = (state?.type || searchParams.get('type') as TransactionType) || 'expense';
  const editId = searchParams.get('editId');

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: existingTransaction, isLoading: isLoadingExisting } = useTransaction(editId);
  const { data: installmentPurchases, isLoading: isLoadingInstallments } = useInstallmentPurchases();

  const payInstallmentMutation = usePayInstallment();
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const addInstallmentMutation = useAddInstallmentPurchase();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(state?.amount?.toString() || searchParams.get('amount') || '');
  const [description, setDescription] = useState(state?.description || searchParams.get('description') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [destinationAccountId, setDestinationAccountId] = useState(state?.destinationAccountId || searchParams.get('destinationAccountId') || '');
  const [date, setDate] = useState(new Date());

  // Recurring transactions are now handled in /recurring page

  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState('');

  const [isMsiPayment, setIsMsiPayment] = useState(!!(state?.installmentPurchaseId || searchParams.get('installmentPurchaseId'))); // Check state or params
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(state?.installmentPurchaseId || searchParams.get('installmentPurchaseId') || '');

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

  // Valid transfer destination accounts - only DEBIT/CASH (credit card payments handled from widget)
  const validDestinationAccounts = useMemo(() => {
    if (!accountId) return debitCashAccounts;
    // Only show DEBIT/CASH accounts, excluding source
    return debitCashAccounts.filter(acc => acc.id !== accountId);
  }, [debitCashAccounts, accountId]);

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
  const preSelectedMsiId = state?.installmentPurchaseId || searchParams.get('installmentPurchaseId');
  const [linkMsiPayment, setLinkMsiPayment] = useState(!!preSelectedMsiId);
  const [selectedMsiForTransfer, setSelectedMsiForTransfer] = useState(preSelectedMsiId || '');

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

  // Disable MSI toggle when switching away from credit card
  useEffect(() => {
    if (isInstallment && !selectedAccountIsCredit) {
      setIsInstallment(false);
      setInstallments('');
    }
  }, [selectedAccountIsCredit, isInstallment]);

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
      // PRIORITY 3: Create new transfer (between DEBIT/CASH accounts only)
      else if (type === 'transfer') {
        if (!accountId || !destinationAccountId) {
          toastError('Selecciona ambas cuentas para la transferencia.');
          return;
        }
        if (accountId === destinationAccountId) {
          toastError('Las cuentas de origen y destino no pueden ser la misma.');
          return;
        }

        // Simple transfer between debit/cash accounts
        await addTransactionMutation.mutateAsync({
          amount: numAmount,
          description: finalDescription || 'Transferencia entre cuentas',
          date: date.toISOString(),
          type: 'transfer',
          accountId,
          destinationAccountId,
        } as Omit<Transaction, 'id'>);

        toast.success('Transferencia guardada');
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
      // PRIORITY 5: Create normal transaction (Recurring moved to /recurring page)
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

    // Block deletion of initial MSI purchase (expense type)
    if (existingTransaction?.installmentPurchaseId && existingTransaction.type === 'expense') {
      toastError('No puedes eliminar la compra inicial de MSI desde aquí. Ve a "Meses Sin Intereses" para gestionar el plan completo.');
      return;
    }

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

  const isFormDisabled = addTransactionMutation.isPending || updateTransactionMutation.isPending || addInstallmentMutation.isPending || payInstallmentMutation.isPending;
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

        <main className="flex-1 px-6 pt-8 pb-32 space-y-6 overflow-y-auto">
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
            className="btn-modern btn-danger-outline flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2"
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

  // Check if type was preselected from FAB
  const typeWasPreselected = !!(state?.type || searchParams.get('type'));

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text">
      <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
        <h1 className="text-lg font-bold">
          {editId ? 'Editar' : type === 'income' ? 'Nuevo Ingreso' : type === 'expense' ? 'Nuevo Gasto' : 'Nueva Transferencia'}
        </h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-5 py-6 w-full max-w-lg mx-auto pb-10">
        {/* Show type badge when preselected from FAB or editing */}
        {(typeWasPreselected || editId) ? (
          <div className="text-center mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl ${type === 'income' ? 'bg-green-500/10 text-green-500' :
                type === 'expense' ? 'bg-red-500/10 text-red-500' :
                  'bg-blue-500/10 text-blue-500'
              }`}>
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>
                {type === 'income' ? 'trending_up' : type === 'expense' ? 'shopping_bag' : 'swap_horiz'}
              </span>
              {type === 'income' ? 'Ingreso' : type === 'expense' ? 'Gasto' : 'Transferencia'}
            </span>
          </div>
        ) : (
          /* Show toggle only when no type was preselected */
          <div className="flex p-1 bg-app-elevated rounded-xl mb-6">
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'income' ? 'bg-app-bg text-green-500 shadow-sm' : 'text-app-muted hover:text-app-text'}`}>Ingreso</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-app-bg text-red-500 shadow-sm' : 'text-app-muted hover:text-app-text'}`}>Gasto</button>
            <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${type === 'transfer' ? 'bg-app-bg text-blue-500 shadow-sm' : 'text-app-muted hover:text-app-text'}`}>Transferencia</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Amount - centered style */}
          <div className="text-center pb-4 border-b border-app-border/30">
            <label className="text-xs text-app-muted uppercase font-bold">Monto</label>
            <div className="flex items-center justify-center mt-2">
              <span className="text-2xl text-app-muted font-medium">$</span>
              <input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" value={amount} onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
              }} placeholder="0.00" className="text-4xl font-bold bg-transparent text-center w-40 focus:outline-none text-app-text placeholder-app-muted/30" autoFocus={!editId} required />
            </div>
          </div>

          {/* Account Selector(s) */}
          {type === 'transfer' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-app-muted uppercase font-bold">Cuenta de Origen</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
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
                <label className="text-xs text-app-muted uppercase font-bold">Cuenta de Destino</label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
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
                  <p className="mt-2 text-xs text-app-muted">No hay cuentas válidas para transferir. Recuerda que para pagar TC debes usar el widget de Pagos.</p>
                )}
              </div>

              {/* Credit Card Payment Logic */}
              {!editId && isDestinationCredit && destinationAccount && (
                <div className="space-y-3 pt-2">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-full text-blue-500">
                        <span className="material-symbols-outlined text-xl">credit_card</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-app-text">Pago a Tarjeta de Crédito</p>
                        <p className="text-xs text-app-muted mt-1">
                          Deuda actual: <span className="font-bold text-blue-500">${creditDebt.toFixed(2)}</span>
                        </p>
                        {amountExceedsDebt && parseFloat(amount) > 0 && (
                          <p className="text-xs text-app-danger font-bold mt-2 flex items-center gap-1">
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
                            if (activeInstallmentsForDestination.length > 0) {
                              toast.custom((t) => (
                                <div className="bg-app-card border border-app-primary rounded-xl p-4 flex flex-col gap-3 shadow-premium max-w-md w-full">
                                  <div className="flex items-start gap-3">
                                    <span className="text-2xl">💳</span>
                                    <div>
                                      <p className="text-app-text font-bold text-sm">Liquidar Deuda Total</p>
                                      <p className="text-app-muted text-xs mt-1">
                                        Vas a pagar: <span className="font-bold text-app-primary">${creditDebt.toFixed(2)}</span>
                                      </p>
                                      {activeInstallmentsForDestination.length > 0 && (
                                        <div className="mt-2 text-left">
                                          <p className="text-xs font-bold text-app-text">Incluye {activeInstallmentsForDestination.length} plan(es) MSI:</p>
                                          <ul className="list-disc list-inside text-xs text-app-muted mt-1 space-y-0.5">
                                            {activeInstallmentsForDestination.map(msi => (
                                              <li key={msi.id}>
                                                {msi.description}: ${(msi.totalAmount - msi.paidAmount).toFixed(2)}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end mt-2">
                                    <button onClick={() => toast.dismiss(t)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-app-elevated text-app-muted hover:bg-app-hover">Cancelar</button>
                                    <button onClick={() => {
                                      toast.dismiss(t);
                                      setAmount(creditDebt.toFixed(2));
                                      if (activeInstallmentsForDestination.length > 0) {
                                        setLinkMsiPayment(true);
                                        setSelectedMsiForTransfer('__LIQUIDATE_ALL__');
                                      }
                                    }} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-app-primary text-white hover:bg-app-primary/90">Confirmar</button>
                                  </div>
                                </div>
                              ), { duration: Infinity, id: 'liquidate-confirm' });
                            } else {
                              setAmount(creditDebt.toFixed(2));
                            }
                          }}
                          className="mt-3 w-full py-2.5 px-3 bg-app-primary hover:bg-app-primary/90 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-app-primary/20 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                          Liquidar Total (${creditDebt.toFixed(2)})
                        </button>
                      </>
                    )}
                  </div>
                  {/* MSI Link Section */}
                  {activeInstallmentsForDestination.length > 0 && (
                    <div className="p-4 bg-app-elevated/30 border border-app-border rounded-2xl">
                      {/* ... logic for MSI Link checkbox/select ... */}
                      {preSelectedMsiId && selectedMsiForTransfer === preSelectedMsiId ? (
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary">
                            <span className="material-symbols-outlined">link</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold">Vinculado a Plan MSI</p>
                            <p className="text-xs text-app-muted">Automático</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-app-muted flex items-center gap-2">
                              <span className="material-symbols-outlined text-app-primary">calendar_month</span>
                              ¿Es pago de MSI?
                            </label>
                            <input
                              type="checkbox"
                              checked={linkMsiPayment}
                              onChange={(e) => {
                                setLinkMsiPayment(e.target.checked);
                                if (!e.target.checked) setSelectedMsiForTransfer('');
                              }}
                              className="accent-app-primary size-5"
                            />
                          </div>
                          {linkMsiPayment && (
                            <select
                              value={selectedMsiForTransfer}
                              onChange={e => {
                                setSelectedMsiForTransfer(e.target.value);
                                const plan = activeInstallmentsForDestination.find(p => p.id === e.target.value);
                                if (plan) {
                                  const remaining = plan.totalAmount - plan.paidAmount;
                                  setAmount(Math.min(plan.monthlyPayment, remaining).toFixed(2));
                                }
                              }}
                              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary/50"
                            >
                              <option value="">-- Selecciona Plan --</option>
                              {activeInstallmentsForDestination.map(p => (
                                <option key={p.id} value={p.id}>{p.description} (${(p.totalAmount - p.paidAmount).toFixed(2)})</option>
                              ))}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs text-app-muted uppercase font-bold">Cuenta</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                required
              >
                {isLoadingAccounts ? <option disabled>Cargando cuentas...</option> :
                  (type === 'income' ? debitCashAccounts : allAccounts).map(account => (
                    <option key={account.id} value={account.id}>{formatAccountOption(account)}</option>
                  ))
                }
              </select>
            </div>
          )}

          {/* Category Picker */}
          {isCategoryRequired && (
            <div>
              <label className="text-xs text-app-muted uppercase font-bold">Categoría</label>
              <div className="mt-2">
                <CategorySelector
                  categories={availableCategories}
                  selectedId={categoryId}
                  onSelect={setCategoryId}
                  isLoading={isLoadingCategories}
                  emptyMessage={`No hay categorías de ${type === 'income' ? 'ingreso' : 'gasto'}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Descripción (Opcional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cena, Taxi, Regalo..." className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary" />
          </div>

          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Fecha</label>
            <div className="mt-2">
              <DatePicker date={date} onDateChange={setDate} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold text-lg rounded-2xl shadow-lg shadow-app-primary/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFormDisabled}
              onClick={(e) => handleSubmit(e as any)}
            >
              {isFormDisabled ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (editId ? 'Actualizar Transacción' : 'Guardar Transacción')}
            </button>

            {editId && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-3.5 bg-app-error/10 text-app-error font-bold rounded-2xl hover:bg-app-error/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Eliminar Transacción
              </button>
            )}
          </div>
        </form>

        {/* Safe area spacer */}
        <div className="h-10"></div>
      </main>
    </div>
  );
};

export default NewTransaction;
