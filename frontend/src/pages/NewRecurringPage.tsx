import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories, useAccounts, useAddRecurringTransaction } from '../hooks/useApi';
import { FrequencyType, TransactionType } from '../types';
import { toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DatePicker } from '../components/DatePicker';
import { CategorySelector } from '../components/CategorySelector';

const NewRecurringPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const addMutation = useAddRecurringTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [alreadyPaidCurrent, setAlreadyPaidCurrent] = useState(false);

  const availableCategories = useMemo(() =>
    categories?.filter(c => c.type === type) || [],
    [categories, type]
  );

  const availableAccounts = useMemo(() =>
    accounts || [],
    [accounts]
  );

  // Set default account and category
  useEffect(() => {
    if (availableAccounts.length > 0 && !accountId) {
      setAccountId(availableAccounts[0].id);
    }
  }, [availableAccounts, accountId]);

  useEffect(() => {
    if (availableCategories.length > 0 && !categoryId) {
      setCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, categoryId]);

  // Reset category when type changes
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  const calculateNextDueDate = () => {
    const nextDate = new Date(startDate);
    if (alreadyPaidCurrent) {
      if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      else if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (frequency === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
      else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return nextDate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    if (!categoryId) {
      toast.error('Selecciona una categoría');
      return;
    }
    if (!accountId) {
      toast.error('Selecciona una cuenta');
      return;
    }

    const nextDueDate = calculateNextDueDate();

    try {
      await addMutation.mutateAsync({
        amount: numAmount,
        description: description || (type === 'expense' ? 'Gasto Recurrente' : 'Ingreso Recurrente'),
        categoryId,
        accountId,
        startDate: startDate.toISOString(),
        type,
        frequency,
        active: true,
        nextDueDate: nextDueDate.toISOString(),
      });
      toast.success(`Recurrente creado. Próximo: ${nextDueDate.toLocaleDateString('es-MX')}`);
      navigate('/recurring');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear');
    }
  };

  const isLoading = isLoadingCategories || isLoadingAccounts;

  const frequencyOptions = [
    { value: 'daily', label: 'Diario', days: '1' },
    { value: 'weekly', label: 'Semanal', days: '7' },
    { value: 'biweekly', label: 'Quincenal', days: '14' },
    { value: 'monthly', label: 'Mensual', days: '30' },
    { value: 'yearly', label: 'Anual', days: '365' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-app-bg">
        <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-app-bg text-app-text">
      <PageHeader title="Nuevo Recurrente" showBackButton />

      <form onSubmit={handleSubmit} className="flex-1 p-4 space-y-6 pb-32">
        {/* Type Toggle */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Tipo</label>
          <div className="flex p-1 bg-app-elevated rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-red-500 text-white shadow-lg' : 'text-app-muted'
                }`}
            >
              <span className="material-symbols-outlined text-lg">shopping_bag</span>
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-green-500 text-white shadow-lg' : 'text-app-muted'
                }`}
            >
              <span className="material-symbols-outlined text-lg">attach_money</span>
              Ingreso
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Monto</label>
          <div className="flex items-center bg-app-card border border-app-border rounded-xl p-4">
            <span className="text-2xl text-app-muted pr-2">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
              }}
              placeholder="0.00"
              className="flex-1 text-3xl font-bold bg-transparent focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'expense' ? 'Netflix, Spotify, Renta...' : 'Nómina, Freelance...'}
            className="w-full p-4 bg-app-card border border-app-border rounded-xl focus:outline-none focus:ring-2 focus:ring-app-primary"
          />
        </div>

        {/* Account */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Cuenta</label>
          <div className="relative">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full p-4 pr-10 bg-app-card border border-app-border rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-app-primary"
            >
              {availableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type === 'CREDIT' ? 'Crédito' : acc.type === 'DEBIT' ? 'Débito' : 'Efectivo'})
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-app-muted">
              <span className="material-symbols-outlined">expand_more</span>
            </div>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Categoría</label>
          <CategorySelector
            categories={availableCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            isLoading={isLoadingCategories}
            emptyMessage={`No hay categorías de ${type === 'expense' ? 'gasto' : 'ingreso'}`}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Frecuencia</label>
          <div className="grid grid-cols-3 gap-3">
            {frequencyOptions.slice(1, 4).map(f => (
              <button
                type="button"
                key={f.value}
                onClick={() => setFrequency(f.value as FrequencyType)}
                className={`p-4 rounded-xl text-center transition-all border-2 ${frequency === f.value
                  ? 'border-app-primary bg-app-primary/10 shadow-md'
                  : 'border-app-border bg-app-card hover:border-app-primary/50'
                  }`}
              >
                <div className="text-xl font-bold">{f.days}</div>
                <div className="text-xs text-app-muted">{f.label}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={() => setFrequency('daily')}
              className={`flex-1 p-3 rounded-xl text-center transition-all border-2 ${frequency === 'daily'
                ? 'border-app-primary bg-app-primary/10'
                : 'border-app-border bg-app-card'
                }`}
            >
              <span className="text-sm font-medium">Diario</span>
            </button>
            <button
              type="button"
              onClick={() => setFrequency('yearly')}
              className={`flex-1 p-3 rounded-xl text-center transition-all border-2 ${frequency === 'yearly'
                ? 'border-app-primary bg-app-primary/10'
                : 'border-app-border bg-app-card'
                }`}
            >
              <span className="text-sm font-medium">Anual</span>
            </button>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Primer Vencimiento</label>
          <DatePicker date={startDate} onDateChange={setStartDate} />
          <p className="text-xs text-app-muted mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">info</span>
            El sistema te recordará este {type === 'expense' ? 'gasto' : 'ingreso'} desde esta fecha.
          </p>
        </div>

        {/* Already Paid Toggle */}
        <div className="p-4 bg-app-card border border-app-border rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-app-success text-xl">check_circle</span>
              <div>
                <p className="text-sm font-medium">¿Ya pagué este periodo?</p>
                <p className="text-xs text-app-muted">El primer recordatorio será el siguiente</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={alreadyPaidCurrent}
                onChange={() => setAlreadyPaidCurrent(!alreadyPaidCurrent)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-app-elevated rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-success"></div>
            </label>
          </div>
          {alreadyPaidCurrent && (
            <div className="mt-3 p-3 bg-app-success/10 rounded-lg">
              <p className="text-sm text-app-success font-medium">
                ✓ Primer recordatorio: {calculateNextDueDate().toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/95 backdrop-blur-xl border-t border-app-border">
        <button
          type="submit"
          form="recurring-form"
          onClick={handleSubmit}
          disabled={addMutation.isPending}
          className="w-full py-4 bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold rounded-2xl shadow-lg shadow-app-primary/20 disabled:opacity-50 transition-all hover:shadow-xl active:scale-[0.98]"
        >
          {addMutation.isPending ? 'Guardando...' : 'Crear Recurrente'}
        </button>
      </footer>
    </div>
  );
};

export default NewRecurringPage;
