import React, { useState, useEffect, useMemo } from 'react';
import { useCategories, useAccounts, useAddRecurringTransaction, useUpdateRecurringTransaction } from '../../hooks/useApi';
import { FrequencyType, TransactionType, RecurringTransaction } from '../../types';
import { toastSuccess, toastError, toast } from '../../utils/toast';

// Components
import { PageHeader } from '../PageHeader';
import { DatePicker } from '../DatePicker';
import { CategorySelector } from '../CategorySelector';
import { ToggleGroup } from '../Button';
import { formatDateUTC } from '../../utils/dateUtils';

interface RecurringFormProps {
  existingTransaction?: RecurringTransaction | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const RecurringForm: React.FC<RecurringFormProps> = ({ existingTransaction, onClose, isSheetMode = false }) => {
  const isEditMode = !!existingTransaction;

  // Hooks & Mutations
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const addTx = useAddRecurringTransaction();
  const updateTx = useUpdateRecurringTransaction();

  // State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());

  // Logic Gates
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasEnd, setHasEnd] = useState(false);
  const [skipFirst, setSkipFirst] = useState(false);

  // Derived
  const filteredCats = useMemo(() => categories?.filter(c => c.type === type) || [], [categories, type]);
  const accountsList = useMemo(() => accounts || [], [accounts]);

  // Effects
  useEffect(() => { if (accountsList.length && !accountId) setAccountId(accountsList[0].id); }, [accountsList, accountId]);
  useEffect(() => {
    // Reset cat if type change unless editing initial load
    if (!isEditMode && filteredCats.length && !categoryId) setCategoryId(filteredCats[0].id);
  }, [type, isEditMode, filteredCats, categoryId]);

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(String(existingTransaction.amount));
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId);
      setAccountId(existingTransaction.accountId);
      setFrequency(existingTransaction.frequency);
      setStartDate(new Date(existingTransaction.startDate));
      if (existingTransaction.endDate) {
        setEndDate(new Date(existingTransaction.endDate));
        setHasEnd(true);
      }
    }
  }, [existingTransaction]);

  // Logic Calc
  const calcNextDate = () => {
    const next = new Date(startDate);
    if (skipFirst) {
      if (frequency === 'weekly') next.setDate(next.getDate() + 7);
      else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (frequency === 'biweekly') next.setDate(next.getDate() + 14);
      else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
      else if (frequency === 'biweekly_15_30') {
        const day = next.getDate();
        if (day <= 15) {
          // Last day of current month
          const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          next.setDate(lastDay);
        } else {
          // 15 of next month
          next.setMonth(next.getMonth() + 1);
          next.setDate(15);
        }
      }
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return toastError('Monto requerido');
    if (!categoryId) return toastError('Falta categoría');

    const nextDate = calcNextDate();
    const payload: any = {
      amount: val,
      description: description || (type === 'expense' ? 'Gasto Recurrente' : 'Ingreso Recurrente'),
      categoryId,
      accountId,
      type,
      frequency,
      startDate: startDate.toISOString(),
      nextDueDate: nextDate.toISOString(),
      active: true,
      endDate: hasEnd && endDate ? endDate.toISOString() : null
    };

    try {
      if (isEditMode && existingTransaction) {
        await updateTx.mutateAsync({ id: existingTransaction.id, transaction: payload });
        toastSuccess('Actualizado correctamente');
      } else {
        await addTx.mutateAsync(payload);
        toastSuccess('Recurrente programado');
      }
      onClose();
    } catch (err) { toastError('Error al guardar'); }
  };

  const pageTitle = isEditMode ? "Editar Fijo" : "Nuevo Fijo";

  return (
    <>
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          <div className="w-10" />
        </div>
      ) : (
        <PageHeader title={pageTitle} showBackButton onBack={onClose} />
      )}

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>

        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">

          {/* Type Switch */}
          {!isEditMode && (
            <div className="flex justify-center mb-2 shrink-0">
              <ToggleGroup
                value={type}
                onChange={(v) => setType(v as any)}
                options={[
                  { value: 'expense', label: 'Gasto' },
                  { value: 'income', label: 'Ingreso' }
                ]}
              />
            </div>
          )}

          {/* Amount Hero */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <span className="absolute -left-4 top-2 text-xl font-light text-app-muted opacity-50">$</span>
              <input
                type="number" step="0.01" inputMode="decimal"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" autoFocus={!isEditMode}
                className="text-center text-4xl font-black bg-transparent text-app-text w-40 outline-none placeholder:text-app-muted/20 py-1 transition-colors"
              />
            </div>
          </div>

          {/* Details Block - Scrollable Area */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto">

            {/* Concept */}
            <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all shrink-0">
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Concepto (ej. Netflix)"
                className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60"
              />
            </div>

            {/* Freq */}
            <div className="shrink-0">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Frecuencia</label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                  className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                >
                  <option value="weekly">Semanal</option>
                  <option value="biweekly">Catorcenal</option>
                  <option value="biweekly_15_30">Quincenal</option>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">event_repeat</span>
              </div>
            </div>

            {/* Dates & Account */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Inicia</label>
                <DatePicker
                  date={startDate}
                  onDateChange={(d) => d && setStartDate(d)}
                  className="bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Cuenta</label>
                <div className="relative">
                  <select
                    value={accountId} onChange={e => setAccountId(e.target.value)}
                    className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                  >
                    {accountsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">account_balance_wallet</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div className="flex-1 min-h-0 flex flex-col">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Categoría</label>
              <CategorySelector
                categories={filteredCats}
                selectedId={categoryId}
                onSelect={setCategoryId}
                className="flex-1 min-h-0"
              />
            </div>

          </div>

          {/* Logic Settings (Sticky Bottom Area) */}
          <div className="space-y-1 pt-2 border-t border-app-border/40 shrink-0 mt-auto">
            <p className="text-[10px] font-bold text-app-text uppercase tracking-wide opacity-50 mb-1">Opciones Avanzadas</p>

            {/* Skip First */}
            <div className="flex justify-between items-center px-1 h-8">
              <span className="text-xs text-app-text font-medium">Saltar primer cobro</span>
              <label className="relative inline-flex items-center cursor-pointer scale-75 origin-right">
                <input type="checkbox" checked={skipFirst} onChange={e => setSkipFirst(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-app-subtle peer-focus:ring-2 peer-focus:ring-app-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
              </label>
            </div>

            {/* End Date Toggle */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1 h-8">
                <span className="text-xs text-app-text font-medium">¿Tiene fecha límite?</span>
                <label className="relative inline-flex items-center cursor-pointer scale-75 origin-right">
                  <input type="checkbox" checked={hasEnd} onChange={() => {
                    setHasEnd(!hasEnd);
                    if (!hasEnd && !endDate) {
                      const d = new Date(); d.setMonth(d.getMonth() + 6); setEndDate(d);
                    }
                  }} className="sr-only peer" />
                  <div className="w-11 h-6 bg-app-subtle peer-focus:ring-2 peer-focus:ring-app-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
                </label>
              </div>

              {hasEnd && (
                <div className="px-1 animate-fade-in pt-1">
                  <DatePicker
                    date={endDate || new Date()}
                    onDateChange={d => d && setEndDate(d)}
                    className="bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="pt-4 pb-10 shrink-0 touch-none">
            <button
              type="submit"
              disabled={addTx.isPending || updateTx.isPending}
              className="w-full py-3.5 bg-app-primary text-white rounded-2xl font-bold shadow-lg shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {(addTx.isPending || updateTx.isPending) && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditMode ? 'Actualizar' : 'Programar'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};

const styles = `
  .label-sm { @apply text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block tracking-wider; }
  .input-base { @apply w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-app-primary/50 transition-all text-app-text placeholder-app-muted; }
`;