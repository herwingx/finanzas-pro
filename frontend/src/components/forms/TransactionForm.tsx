import React, { useState, useEffect, useMemo } from 'react';
import { toastSuccess, toastError, toast } from '../../utils/toast';

// Types & Hooks
import { TransactionType, Transaction, TransactionFormInitialData } from '../../types';
import {
  useCategories,
  useAddTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useAccounts,
  useInstallmentPurchases,
  usePayInstallment
} from '../../hooks/useApi';

// Components
import { PageHeader } from '../PageHeader';
import { DatePicker } from '../DatePicker';
import { CategorySelector } from '../CategorySelector';
import { ToggleGroup } from '../Button'; // Uses the generic one

interface TransactionFormProps {
  existingTransaction?: Transaction | null;
  initialData?: TransactionFormInitialData | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  existingTransaction,
  initialData,
  onClose,
  isSheetMode = false,
}) => {
  const isEditing = !!existingTransaction;
  const initialType = (initialData?.type as TransactionType) || 'expense';

  /* 1. DATA HOOKS */
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const { data: installments } = useInstallmentPurchases();

  /* 2. MUTATIONS */
  const addTx = useAddTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const payMsi = usePayInstallment();

  /* 3. STATE */
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState(initialData?.accountId || '');
  const [destAccountId, setDestAccountId] = useState(initialData?.destinationAccountId || '');
  const [date, setDate] = useState(new Date());

  // Logic: Pre-selected MSI (e.g. from Widget/Alert)
  const [msiLinkId, setMsiLinkId] = useState<string>(initialData?.installmentPurchaseId || '');
  const [isMsiPay, setIsMsiPay] = useState(!!initialData?.installmentPurchaseId);

  /* 4. MEMOIZED DATA HELPERS */
  const allAccounts = useMemo(() => accounts || [], [accounts]);
  const liquidAccounts = useMemo(() => allAccounts.filter(a => ['DEBIT', 'CASH'].includes(a.type)), [allAccounts]);

  // Account used for Destination (if Transfer)
  const destAccountInfo = useMemo(() => allAccounts.find(a => a.id === destAccountId), [allAccounts, destAccountId]);

  // Relevant Installments if Paying Credit Card
  const creditCardMSI = useMemo(() => {
    if (!destAccountId || !installments) return [];
    // Only show active plans
    return installments.filter(p => p.accountId === destAccountId && (p.totalAmount - p.paidAmount) > 0.5);
  }, [destAccountId, installments]);


  /* 5. EFFECTS */
  // Hydrate form on Edit
  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId || '');
      setAccountId(existingTransaction.accountId || '');
      setDestAccountId(existingTransaction.destinationAccountId || '');
      setDate(new Date(existingTransaction.date));
      if (existingTransaction.installmentPurchaseId) {
        setIsMsiPay(true);
        setMsiLinkId(existingTransaction.installmentPurchaseId);
      }
    }
  }, [existingTransaction]);

  // Default Account Selection
  useEffect(() => {
    if (!accountId && allAccounts.length > 0) {
      if (type === 'expense' && liquidAccounts.length > 0) setAccountId(liquidAccounts[0].id);
      else setAccountId(allAccounts[0].id);
    }
  }, [type, accountId, allAccounts, liquidAccounts]);

  // Update Type if prop changes (external control)
  useEffect(() => {
    if (!isEditing && initialData?.type) setType(initialData.type);
  }, [initialData, isEditing]);


  /* 6. HANDLERS */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!amount || val <= 0) return toastError('Ingresa un monto válido.');

    // Common Payload
    const txData: any = {
      amount: val,
      description: description || (type === 'transfer' ? 'Transferencia' : 'Nuevo Movimiento'),
      date: date.toISOString(),
      accountId,
    };

    try {
      // --- A. EDIT MODE ---
      if (isEditing && existingTransaction) {
        txData.type = type;
        if (type !== 'transfer') txData.categoryId = categoryId;
        if (type === 'transfer' && destAccountId) txData.destinationAccountId = destAccountId;

        await updateTx.mutateAsync({ id: existingTransaction.id, transaction: txData });
        toastSuccess('Movimiento actualizado');
      }
      // --- B. TRANSFER & MSI PAYMENTS ---
      else if (type === 'transfer') {
        if (!destAccountId || destAccountId === accountId) return toastError('Cuenta destino inválida.');

        // MSI Linking Logic
        if (destAccountInfo?.type === 'CREDIT' && isMsiPay && msiLinkId) {
          await payMsi.mutateAsync({
            id: msiLinkId,
            payment: { ...txData }
          });
          toastSuccess('Cuota MSI pagada');
          onClose();
          return;
        }

        await addTx.mutateAsync({ ...txData, type: 'transfer', destinationAccountId: destAccountId });
        toastSuccess('Transferencia enviada');
      }
      // --- C. INCOME / EXPENSE ---
      else {
        if (!categoryId) return toastError('Elige una categoría.');
        await addTx.mutateAsync({ ...txData, type, categoryId });
        toastSuccess('Movimiento guardado');
      }

      onClose();
    } catch (e: any) { toastError(e.message || 'Error guardando'); }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Eliminar transacción?')) {
      await deleteTx.mutateAsync(existingTransaction!.id);
      onClose();
      toastSuccess('Eliminado');
    }
  };

  const pageTitle = isEditing ? 'Editar Detalles' : (type === 'expense' ? 'Nuevo Gasto' : type === 'income' ? 'Nuevo Ingreso' : 'Transferir');
  const showTypeToggle = !isEditing && !initialData?.type;

  return (
    <>
      {/* 1. HEADER LOGIC (Conditional Sheet vs Page) */}
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          <div className="w-12" />
        </div>
      ) : (
        <PageHeader
          title={pageTitle}
          showBackButton
          onBack={onClose}
          rightAction={isEditing && <button onClick={handleDelete} className="text-rose-500"><span className="material-symbols-outlined">delete</span></button>}
        />
      )}

      {/* 2. FORM BODY */}
      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>

        {/* A. TYPE TOGGLE */}
        {showTypeToggle && (
          <div className="flex justify-center mb-4">
            <ToggleGroup
              value={type}
              onChange={(v) => setType(v as TransactionType)}
              options={[
                { value: 'expense', label: 'Gasto' },
                { value: 'income', label: 'Ingreso' },
                { value: 'transfer', label: 'Transf.' },
              ]}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">

          {/* B. AMOUNT INPUT (COMPACT) */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <span className="absolute -left-4 top-2 text-xl text-app-muted font-light opacity-50">$</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus={!isEditing}
                className="w-40 bg-transparent text-center text-4xl font-black text-app-text outline-none placeholder:text-app-muted/20 caret-app-primary no-spin-button transition-colors py-1"
              />
            </div>
          </div>

          {/* C. DESCRIPTION */}
          {/* C. DESCRIPTION */}
          <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Concepto (ej. Comida)"
              className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60"
            />
          </div>

          {/* D. ACCOUNTS SELECTION */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">
                Cuenta {type === 'transfer' ? 'Origen' : ''}
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-9 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                >
                  {allAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-app-muted pointer-events-none text-[20px]">account_balance_wallet</span>
              </div>
            </div>

            {type === 'transfer' && (
              <div className="p-3 bg-app-subtle/50 rounded-xl border border-app-border/60">
                <label className="text-[10px] font-bold text-app-text mb-1 block uppercase tracking-wide opacity-70">Destino</label>
                <div className="relative mb-2">
                  <select
                    value={destAccountId}
                    onChange={(e) => setDestAccountId(e.target.value)}
                    className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                  >
                    <option value="">Seleccionar...</option>
                    {allAccounts.filter(a => a.id !== accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 text-app-muted pointer-events-none text-[20px]">expand_more</span>
                </div>

                {/* MSI Payment Linkage */}
                {destAccountInfo?.type === 'CREDIT' && creditCardMSI.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-app-border">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={isMsiPay} onChange={e => setIsMsiPay(e.target.checked)} className="rounded text-app-primary focus:ring-app-primary" />
                      <span className="text-xs font-bold">Abonar a un Plan Específico</span>
                    </label>

                    {isMsiPay && (
                      <select
                        value={msiLinkId}
                        onChange={(e) => {
                          const pid = e.target.value;
                          setMsiLinkId(pid);
                          const p = creditCardMSI.find(i => i.id === pid);
                          if (p) setAmount(Math.min(p.monthlyPayment, p.totalAmount - p.paidAmount).toString());
                        }}
                        className="w-full bg-white dark:bg-zinc-900 border border-app-border h-10 rounded-lg text-xs px-2 outline-none"
                      >
                        <option value="">-- Elige la compra --</option>
                        {creditCardMSI.map(p => (
                          <option key={p.id} value={p.id}>{p.description} (${p.monthlyPayment}/mes)</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* E. CATEGORY GRID (Except transfers) */}
          {type !== 'transfer' && (
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Categoría</label>
              <CategorySelector
                categories={categories?.filter(c => c.type === type) || []}
                selectedId={categoryId}
                onSelect={setCategoryId}
                className="flex-1 min-h-0"
              />
            </div>
          )}

          {/* F. DATE PICKER */}
          <div>
            <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Fecha</label>
            <DatePicker
              date={date}
              onDateChange={(d) => d && setDate(d)}
              className="bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle"
            />
          </div>

          {/* SUBMIT */}
          <div className="pt-4 pb-10 mt-auto shrink-0 touch-none">
            <button
              type="submit"
              disabled={addTx.isPending || updateTx.isPending}
              className="w-full py-3.5 bg-app-primary text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {(addTx.isPending || updateTx.isPending) && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Confirmar'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};