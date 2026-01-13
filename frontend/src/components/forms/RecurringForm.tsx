import React, { useState, useEffect, useMemo } from 'react';
import { useCategories, useAccounts, useAddRecurringTransaction, useUpdateRecurringTransaction } from '../../hooks/useApi';
import { FrequencyType, TransactionType, RecurringTransaction } from '../../types';
import { toastSuccess, toastError, toast } from '../../utils/toast';
import { PageHeader } from '../PageHeader';
import { DatePicker } from '../DatePicker';
import { CategorySelector } from '../CategorySelector';
import { ToggleButtonGroup } from '../Button';
import { formatDateUTC } from '../../utils/dateUtils';

interface RecurringFormProps {
  existingTransaction?: RecurringTransaction | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const RecurringForm: React.FC<RecurringFormProps> = ({
  existingTransaction,
  onClose,
  isSheetMode = false
}) => {
  const isEditMode = !!existingTransaction;

  // Queries
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();

  const addMutation = useAddRecurringTransaction();
  const updateMutation = useUpdateRecurringTransaction();

  // State
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [alreadyPaidCurrent, setAlreadyPaidCurrent] = useState(false);

  // Derived Data
  const availableCategories = useMemo(() => categories?.filter(c => c.type === type) || [], [categories, type]);
  const availableAccounts = useMemo(() => accounts || [], [accounts]);

  // Effects
  useEffect(() => {
    if (availableAccounts.length > 0 && !accountId) setAccountId(availableAccounts[0].id);
  }, [availableAccounts, accountId]);

  useEffect(() => {
    if (availableCategories.length > 0 && !categoryId) setCategoryId(availableCategories[0].id);
  }, [availableCategories, categoryId]);

  useEffect(() => {
    if (!isEditMode) {
      setCategoryId('');
    }
  }, [type, isEditMode]);

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
        setHasEndDate(true);
      }
    }
  }, [existingTransaction]);

  // Logic
  const calculateNextDueDate = () => {
    const nextDate = new Date(startDate);
    nextDate.setUTCHours(12, 0, 0, 0);

    if (alreadyPaidCurrent) {
      if (frequency === 'daily') {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      } else if (frequency === 'weekly') {
        nextDate.setUTCDate(nextDate.getUTCDate() + 7);
      } else if (frequency === 'biweekly') {
        nextDate.setUTCDate(nextDate.getUTCDate() + 14);
      } else if (frequency === 'biweekly_15_30') {
        const day = nextDate.getUTCDate();
        const currentMonth = nextDate.getUTCMonth();
        const currentYear = nextDate.getUTCFullYear();

        if (day <= 15) {
          const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();
          nextDate.setUTCDate(lastDayOfMonth);
        } else {
          nextDate.setUTCMonth(currentMonth + 1);
          nextDate.setUTCDate(15);
        }
      } else if (frequency === 'monthly') {
        nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
      } else if (frequency === 'yearly') {
        nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
      }
    }
    return nextDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!amount || numAmount <= 0) return toast.error('Monto inválido');
    if (!categoryId) return toast.error('Selecciona una categoría');
    if (!accountId) return toast.error('Selecciona una cuenta');

    const nextDueDate = calculateNextDueDate();

    const recurringData = {
      amount: numAmount,
      description: description || (type === 'expense' ? 'Gasto Recurrente' : 'Ingreso Recurrente'),
      categoryId,
      accountId,
      startDate: startDate.toISOString(),
      type,
      frequency,
      active: true,
      nextDueDate: nextDueDate.toISOString(),
      endDate: hasEndDate && endDate ? endDate.toISOString() : null,
    };

    try {
      if (isEditMode && existingTransaction) {
        await updateMutation.mutateAsync({ id: existingTransaction.id, transaction: recurringData });
        toastSuccess('Recurrente actualizado');
      } else {
        await addMutation.mutateAsync(recurringData);
        toastSuccess('Recurrente programado', { description: `Próximo: ${formatDateUTC(nextDueDate, { style: 'short' })}` });
      }
      onClose();
    } catch (error: any) {
      toastError(error.message);
    }
  };

  if (isLoadingCategories || isLoadingAccounts) {
    return <div className="min-h-dvh flex items-center justify-center text-app-muted animate-pulse">Cargando...</div>;
  }

  // Frequency Configuration
  const freqOptions: { value: FrequencyType; label: string; days: string }[] = [
    { value: 'weekly', label: 'Semanal', days: '7d' },
    { value: 'biweekly_15_30', label: 'Quincenal', days: '15/30' },
    { value: 'monthly', label: 'Mensual', days: '1m' },
    { value: 'yearly', label: 'Anual', days: '1a' },
  ];

  const pageTitle = isEditMode ? "Editar Fijo" : "Nuevo Fijo";

  return (
    <>
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6">
          <button type="button" onClick={onClose} className="text-app-muted hover:text-app-text font-medium text-sm">Cancelar</button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          <div className="w-8"></div>
        </div>
      ) : (
        <PageHeader title={pageTitle} showBackButton={true} onBack={onClose} />
      )}

      <div className={isSheetMode ? "" : "px-5 py-6 w-full max-w-lg mx-auto"}>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Amount Section */}
          <div className="text-center">
            <div className={`inline-flex bg-app-surface border border-app-border rounded-xl p-1 mb-4 shadow-sm `}>
              <ToggleButtonGroup
                value={type}
                onChange={(val) => setType(val as any)}
                options={[
                  { value: 'expense', label: 'Gasto' },
                  { value: 'income', label: 'Ingreso' }
                ]}
              />
            </div>

            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold text-app-muted mr-2">$</span>
              <input
                type="number" step="0.01" min="0" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus={!isEditMode && isSheetMode}
                className="bg-transparent text-4xl font-black text-app-text outline-none text-center w-40 placeholder-app-muted/20 no-spin-button"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Concepto</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'expense' ? 'Netflix, Renta...' : 'Nómina...'}
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Frecuencia</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {freqOptions.map(f => (
                  <button
                    type="button" key={f.value}
                    onClick={() => setFrequency(f.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${frequency === f.value
                      ? 'border-app-primary bg-app-primary/5 text-app-primary'
                      : 'border-app-border bg-app-surface hover:border-app-muted'
                      }`}
                  >
                    <span className="text-lg font-black leading-none mb-1">{f.days}</span>
                    <span className="text-[9px] uppercase font-bold">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Inicio / Corte</label>
                <DatePicker date={startDate} onDateChange={(d) => d && setStartDate(d)} className="bg-app-surface border-app-border" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">Cuenta Cargo</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full min-h-[46px] bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-primary outline-none appearance-none"
                >
                  {availableAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-2 block">Categoría</label>
              <CategorySelector
                categories={availableCategories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                emptyMessage="Selecciona una categoría"
              />
            </div>
          </div>

          {/* Logic Toggle */}
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-3">
                <div className="size-10 bg-app-subtle rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-app-muted">event_available</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-app-text">¿Pago de este periodo?</p>
                  <p className="text-xs text-app-muted">{alreadyPaidCurrent ? 'Ya pagado, saltar al siguiente' : 'Pendiente para esta fecha'}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={alreadyPaidCurrent} onChange={() => setAlreadyPaidCurrent(!alreadyPaidCurrent)} className="sr-only peer" />
                <div className="w-11 h-6 bg-app-subtle peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-app-primary/50 dark:peer-focus:ring-app-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-app-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-primary"></div>
              </label>
            </div>

            <div className="mt-3 pt-3 border-t border-app-subtle">
              <p className="text-xs text-app-muted flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-app-primary">next_plan</span>
                Próxima generación: <strong className="text-app-text">{formatDateUTC(calculateNextDueDate(), { style: 'full' })}</strong>
              </p>
            </div>
          </div>

          {/* End Date Toggle - Fecha Límite */}
          <div className="p-4 bg-app-surface border border-app-border rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${hasEndDate ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-app-subtle'}`}>
                  <span className={`material-symbols-outlined ${hasEndDate ? 'text-amber-600 dark:text-amber-400' : 'text-app-muted'}`}>
                    event_busy
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-app-text">¿Tiene fecha límite?</p>
                  <p className="text-xs text-app-muted">
                    {hasEndDate ? 'No se proyectará después de la fecha límite' : 'Se proyectará indefinidamente'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEndDate}
                  onChange={() => {
                    setHasEndDate(!hasEndDate);
                    if (!hasEndDate && !endDate) {
                      const defaultEnd = new Date();
                      defaultEnd.setMonth(defaultEnd.getMonth() + 3);
                      setEndDate(defaultEnd);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-app-subtle peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500/50 dark:peer-focus:ring-amber-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-app-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {hasEndDate && (
              <div className="mt-4 pt-4 border-t border-app-subtle">
                <label className="text-[10px] uppercase font-bold text-app-muted pl-1 mb-1 block">
                  Fecha de finalización
                </label>
                <DatePicker
                  date={endDate || new Date()}
                  onDateChange={(d) => d && setEndDate(d)}
                  className="bg-app-bg border-amber-200 dark:border-amber-900"
                />
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Después de esta fecha, no aparecerá en proyecciones
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 pb-4">
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="w-full py-4 bg-app-primary hover:bg-app-primary-dark text-white font-bold text-lg rounded-2xl shadow-lg shadow-app-primary/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {isEditMode
                ? (updateMutation.isPending ? 'Actualizando...' : 'Guardar Cambios')
                : (addMutation.isPending ? 'Programando...' : 'Guardar Fijo')
              }
            </button>
          </div>

        </form>
      </div>
    </>
  );
};
