import React, { useState, useEffect, useMemo } from 'react';
import { useAddInstallmentPurchase, useUpdateInstallmentPurchase, useAccounts, useCategories } from '../../hooks/useApi';
import { toastSuccess, toastError, toast } from '../../utils/toast';
import { DatePicker } from '../DatePicker';
import { CategorySelector } from '../CategorySelector';

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
  // --- HOOKS ---
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const addMutation = useAddInstallmentPurchase();
  const updateMutation = useUpdateInstallmentPurchase();

  const creditAccounts = useMemo(() => accounts?.filter(a => a.type === 'CREDIT') || [], [accounts]);
  const expenseCats = useMemo(() => categories?.filter(c => c.type === 'expense') || [], [categories]);

  // --- STATE ---
  const [desc, setDesc] = useState('');
  const [total, setTotal] = useState('');
  const [installments, setInstallments] = useState('3');
  const [date, setDate] = useState<Date>(new Date());
  const [accId, setAccId] = useState('');
  const [catId, setCatId] = useState('');

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (isEditMode && existingPurchase) {
      setDesc(existingPurchase.description);
      setTotal(String(existingPurchase.totalAmount));
      setInstallments(String(existingPurchase.installments));
      setDate(new Date(existingPurchase.purchaseDate));
      setAccId(existingPurchase.accountId);
      if (existingPurchase.categoryId) setCatId(existingPurchase.categoryId);
    } else {
      // Defaults
      if (creditAccounts.length && !accId) setAccId(creditAccounts[0].id);
      if (expenseCats.length && !catId) setCatId(expenseCats[0].id);
    }
  }, [existingPurchase, isEditMode, creditAccounts, expenseCats]);

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(total);
    if (!desc || val <= 0 || !accId) return toastError('Completa la información');

    const payload = {
      description: desc,
      totalAmount: val,
      installments: parseInt(installments),
      purchaseDate: date.toISOString(),
      accountId: accId,
      categoryId: catId
    };

    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: id || existingPurchase.id, purchase: payload });
        toastSuccess('Plan actualizado');
      } else {
        await addMutation.mutateAsync(payload);
        toastSuccess('Compra a plazos creada');
      }
      onSuccess();
    } catch (e) { toastError('Error al guardar'); }
  };

  const monthlyPayment = parseFloat(total || '0') / parseInt(installments || '1');
  const title = isEditMode ? 'Editar Plan MSI' : 'Nuevo Plan MSI';

  return (
    <>
      <div className="flex justify-between items-center mb-6 pt-2">
        <button type="button" onClick={onCancel} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
        <h2 className="text-lg font-bold text-app-text">{title}</h2>
        <div className="w-12" />
      </div>

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">

          {/* 1. HERO TOTAL COMPACT */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <span className="absolute -left-4 top-2 text-xl font-light text-app-muted opacity-50">$</span>
              <input
                type="number" step="0.01"
                value={total} onChange={e => setTotal(e.target.value)}
                placeholder="0.00" autoFocus={!isEditMode}
                className="text-center text-4xl font-black bg-transparent text-app-text w-40 outline-none placeholder:text-app-muted/20 py-1 transition-colors"
              />
            </div>
            {monthlyPayment > 0 && (
              <p className="text-[10px] font-bold text-app-primary bg-app-primary/10 px-2 py-0.5 rounded mt-0.5">
                ~${monthlyPayment.toFixed(2)} / mes
              </p>
            )}
          </div>

          {/* 2. SCROLLABLE BODY */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto">

            {/* Description */}
            <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all shrink-0">
              <input
                value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="¿Qué compraste? (Ej. iPhone, Vuelos)"
                className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60"
              />
            </div>

            {/* Account & Details Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Tarjeta</label>
                <div className="relative">
                  <select
                    value={accId} onChange={e => setAccId(e.target.value)}
                    className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                  >
                    {creditAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">credit_card</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Plazo</label>
                <div className="relative">
                  <select
                    value={installments} onChange={e => setInstallments(e.target.value)}
                    className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                  >
                    {[3, 6, 9, 12, 18, 24, 36, 48].map(m => <option key={m} value={m}>{m} Meses</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">calendar_month</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Fecha de Compra</label>
              <DatePicker
                date={date}
                onDateChange={d => d && setDate(d)}
                className="bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle w-full"
              />
            </div>

            {/* Category */}
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Categoría</label>
              <CategorySelector
                categories={expenseCats}
                selectedId={catId}
                onSelect={setCatId}
                className="flex-1 min-h-0"
              />
            </div>

          </div>

          {/* 3. FOOTER */}
          <div className="pt-4 pb-10 mt-auto shrink-0 touch-none">
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="w-full py-3.5 bg-app-primary text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(addMutation.isPending || updateMutation.isPending) && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditMode ? 'Actualizar Plan' : 'Crear Plan'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};