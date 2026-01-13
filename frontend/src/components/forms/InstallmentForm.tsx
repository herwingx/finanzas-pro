import React, { useState, useEffect, useMemo } from 'react';
import { useAddInstallmentPurchase, useUpdateInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toastSuccess, toastError, toast } from '../../utils/toast';
import { DatePicker } from '../DatePicker';
import { CategorySelector } from '../CategorySelector';
import { PageHeader } from '../PageHeader';

interface InstallmentFormProps {
  id?: string;
  isEditMode?: boolean;
  existingPurchase?: any;
  onSuccess: () => void;
  onCancel: () => void;
  isSheetMode?: boolean;
}

export const InstallmentForm: React.FC<InstallmentFormProps> = ({
  id,
  isEditMode = false,
  existingPurchase,
  onSuccess,
  onCancel,
  isSheetMode = false
}) => {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const addMutation = useAddInstallmentPurchase();
  const updateMutation = useUpdateInstallmentPurchase();

  const creditAccounts = useMemo(() => accounts?.filter(a => a.type === 'CREDIT') || [], [accounts]);
  const expenseCategories = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);

  // Form State
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installments, setInstallments] = useState('12');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Initial Load
  useEffect(() => {
    if (isEditMode && existingPurchase) {
      setDescription(existingPurchase.description);
      setTotalAmount(String(existingPurchase.totalAmount));
      setInstallments(String(existingPurchase.installments));
      setPurchaseDate(new Date(existingPurchase.purchaseDate));
      setAccountId(existingPurchase.accountId);

      if (existingPurchase.categoryId) {
        setCategoryId(existingPurchase.categoryId);
      } else if (existingPurchase.generatedTransactions?.length) {
        setCategoryId(existingPurchase.generatedTransactions[0].categoryId);
      }
    } else if (!isEditMode) {
      if (creditAccounts.length) setAccountId(creditAccounts[0].id);
      if (expenseCategories.length) setCategoryId(expenseCategories[0].id);
    }
  }, [isEditMode, existingPurchase, creditAccounts, expenseCategories]);

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
        const targetId = id || existingPurchase?.id;
        if (!targetId) {
          toastError("Error: No se pudo encontrar el ID del plan.");
          return;
        }
        await updateMutation.mutateAsync({ id: targetId, purchase: payload });
        toastSuccess('Plan actualizado');
        onSuccess();
      } else {
        await addMutation.mutateAsync(payload);
        toastSuccess('Plan MSI creado');
        onSuccess();
      }
    } catch (e: any) { toastError(e.message); }
  };

  const pageTitle = isEditMode ? 'Editar Plan' : 'Nuevo Plan MSI';

  return (
    <>
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6">
          <button type="button" onClick={onCancel} className="text-app-muted hover:text-app-text font-medium text-sm">Cancelar</button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          <div className="w-8"></div>
        </div>
      ) : (
        <PageHeader title={pageTitle} showBackButton={true} onBack={onCancel} />
      )}

      <div className={isSheetMode ? "" : "min-h-dvh bg-app-bg pb-safe text-app-text"}>
        <main className={isSheetMode ? "" : "px-5 pt-6 max-w-lg mx-auto"}>
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
                  autoFocus={!isEditMode && isSheetMode}
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
                  <CategorySelector categories={expenseCategories} selectedId={categoryId} onSelect={setCategoryId} emptyMessage="No hay categorías" />
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

              {!isSheetMode && isEditMode && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full mt-3 py-3 text-app-muted text-sm font-medium hover:text-app-text"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </>
  );
};
