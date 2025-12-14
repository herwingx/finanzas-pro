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
      <div className="flex items-center justify-center min-min-h-full bg-app-bg">
        <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-min-h-full bg-app-bg text-app-text">
      <PageHeader title="Nuevo Recurrente" showBackButton />

      <main className="flex-1 px-5 py-6 w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Tipo de Transacción</label>
            <div className="flex p-1.5 bg-app-elevated rounded-xl mt-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-app-bg text-red-500 shadow-sm border border-app-border' : 'text-app-muted hover:text-app-text'
                  }`}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>shopping_bag</span>
                Gasto
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-app-bg text-green-500 shadow-sm border border-app-border' : 'text-app-muted hover:text-app-text'
                  }`}
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>attach_money</span>
                Ingreso
              </button>
            </div>
          </div>

          {/* Amount - centered */}
          <div className="text-center pb-4 border-b border-app-border/30">
            <label className="text-xs text-app-muted uppercase font-bold">Monto</label>
            <div className="flex items-center justify-center mt-2">
              <span className="text-2xl text-app-muted font-medium">$</span>
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
                className="text-3xl font-bold bg-transparent text-center w-32 focus:outline-none text-app-text placeholder-app-muted/30"
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? 'Netflix, Spotify, Renta...' : 'Nómina, Freelance...'}
              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
            />
          </div>

          {/* Account */}
          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Cuenta de Cargo</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl mt-2 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
            >
              {availableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-app-muted uppercase font-bold">Categoría</label>
            <div className="mt-2">
              <CategorySelector
                categories={availableCategories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                isLoading={isLoadingCategories}
                emptyMessage={`No hay categorías de ${type === 'expense' ? 'gasto' : 'ingreso'}`}
              />
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs text-app-muted font-bold mb-2 uppercase tracking-wider">Frecuencia de Cobro</label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {frequencyOptions.filter(f => ['weekly', 'biweekly', 'monthly'].includes(f.value)).map(f => (
                <button
                  type="button"
                  key={f.value}
                  onClick={() => setFrequency(f.value as FrequencyType)}
                  className={`p-3 rounded-xl text-center transition-all border-2 relative overflow-hidden ${frequency === f.value
                    ? 'border-app-primary bg-app-primary/10 text-app-primary'
                    : 'border-app-border bg-app-elevated hover:border-app-muted'
                    }`}
                >
                  <div className="text-lg font-black">{f.days}</div>
                  <div className="text-[10px] font-bold uppercase opacity-80">{f.label}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`flex-1 p-3 rounded-xl text-center transition-all border-2 ${frequency === 'daily'
                  ? 'border-app-primary bg-app-primary/10 text-app-primary'
                  : 'border-app-border bg-app-elevated'
                  }`}
              >
                <span className="text-xs font-bold uppercase">Diario</span>
              </button>
              <button
                type="button"
                onClick={() => setFrequency('yearly')}
                className={`flex-1 p-3 rounded-xl text-center transition-all border-2 ${frequency === 'yearly'
                  ? 'border-app-primary bg-app-primary/10 text-app-primary'
                  : 'border-app-border bg-app-elevated'
                  }`}
              >
                <span className="text-xs font-bold uppercase">Anual</span>
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs text-app-muted font-bold mb-2 uppercase tracking-wider">Primer Vencimiento</label>
            <div className="bg-app-elevated/50 p-2 rounded-2xl border border-app-border">
              <DatePicker date={startDate} onDateChange={setStartDate} />
            </div>
          </div>

          {/* Already Paid Toggle */}
          <div className="p-4 bg-app-elevated/50 border border-app-border rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center ${alreadyPaidCurrent ? 'bg-app-success/20 text-app-success' : 'bg-app-muted/20 text-app-muted'}`}>
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </div>
                <div>
                  <label htmlFor="paid-toggle" className="text-sm font-bold cursor-pointer">¿Ya pagué este periodo?</label>
                  <p className="text-xs text-app-muted">Se programará para el siguiente</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="paid-toggle"
                  type="checkbox"
                  checked={alreadyPaidCurrent}
                  onChange={() => setAlreadyPaidCurrent(!alreadyPaidCurrent)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-app-elevated border border-app-border rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-success peer-checked:border-transparent"></div>
              </label>
            </div>

            <div className={`grid transition-all duration-300 ${alreadyPaidCurrent ? 'grid-rows-[1fr] mt-3 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="p-3 bg-app-success/10 border border-app-success/20 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-app-success text-sm">event</span>
                  <p className="text-xs text-app-success font-bold">
                    Próximo cobro: {calculateNextDueDate().toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold text-lg rounded-2xl shadow-lg shadow-app-primary/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 mt-6"
          >
            {addMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Crear Recurrente'}
          </button>
        </form>

        {/* Safe area spacer */}
        <div className="h-10" />
      </main>
    </div>
  );
};

export default NewRecurringPage;
