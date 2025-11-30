import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Category, Transaction, TransactionType } from '../types';
import { useCategories, useTransaction, useAddTransaction, useUpdateTransaction, useDeleteTransaction, useAddRecurringTransaction } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { DatePicker } from '../components/DatePicker';

const NewTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as TransactionType) || 'expense';
  const editId = searchParams.get('editId');

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: existingTransaction, isLoading: isLoadingExisting } = useTransaction(editId);
  
  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const addRecurringMutation = useAddRecurringTransaction();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());
  const [budgetType, setBudgetType] = useState<'need' | 'want' | 'savings'>('need');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId);
      setDate(new Date(existingTransaction.date));
      setBudgetType(existingTransaction.budgetType || 'need');
    }
  }, [existingTransaction]);

  const availableCategories = useMemo(() => categories?.filter(c => c.type === type) || [], [categories, type]);

  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.find(c => c.id === categoryId)) {
        setCategoryId(availableCategories[0].id);
    } else if (availableCategories.length === 0) {
        setCategoryId('');
    }
  }, [type, availableCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    const numAmount = parseFloat(amount);
    const finalDescription = description || (availableCategories.find(c => c.id === categoryId)?.name || (type === 'expense' ? 'Gasto' : 'Ingreso'));

    try {
      if (isRecurring && !editId) {
        await addRecurringMutation.mutateAsync({
          amount: numAmount,
          description: finalDescription,
          categoryId,
          startDate: date.toISOString(),
          type,
          frequency,
        });
        toast.success('Transacción recurrente guardada');
      } else {
        const transactionData = {
          amount: numAmount,
          description: finalDescription,
          categoryId,
          date: date.toISOString(),
          type,
        };
        if (editId) {
          await updateTransactionMutation.mutateAsync({ id: editId, transaction: transactionData });
          toast.success('Transacción actualizada');
        } else {
          await addTransactionMutation.mutateAsync(transactionData as Omit<Transaction, 'id'>);
          toast.success('Transacción guardada');
        }
      }
      navigate(-1);
    } catch (error) {
      toast.error('Error al guardar la transacción.');
    }
  };

  const handleDelete = async () => {
    if (editId) {
      try {
        await deleteTransactionMutation.mutateAsync(editId);
        toast.success('Transacción eliminada');
        navigate(-1);
      } catch (error) {
        toast.error('Error al eliminar la transacción.');
      }
    }
  };
  
  const isLoading = isLoadingCategories || (editId ? isLoadingExisting : false);

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
            <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated"><span className="material-symbols-outlined">arrow_back_ios_new</span></button>
            <h1 className="text-lg font-bold">{editId ? 'Editar' : 'Nueva'} Transacción</h1>
            <div className="w-10"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pt-6 space-y-8 overflow-y-auto pb-32">
            {/* Type Selector */}
            <div className="flex p-1 bg-app-card rounded-2xl border border-app-border">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'income' ? 'bg-app-success text-white' : 'text-app-muted'}`}>Ingreso</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-app-danger text-white' : 'text-app-muted'}`}>Gasto</button>
            </div>

            {/* Amount Input */}
            <div className="text-center space-y-2">
                <label className="text-app-muted text-sm">Monto</label>
                <div className="flex items-center justify-center">
                    <span className="text-3xl text-app-muted font-light pr-2">$</span>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full max-w-[200px] bg-transparent text-center text-5xl font-bold" autoFocus={!editId} required />
                </div>
            </div>
            
            {/* Details Section */}
            <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden divide-y divide-app-border">
                {/* Category Picker */}
                <div className="p-4">
                    <label className="block text-xs text-app-muted font-bold mb-3 uppercase">Categoría</label>
                    <div className="grid grid-cols-4 gap-3">
                        {availableCategories.map(cat => (
                            <button type="button" key={cat.id} onClick={() => setCategoryId(cat.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all border-2 ${categoryId === cat.id ? 'border-app-primary bg-app-primary/10' : 'border-transparent hover:bg-app-elevated'}`}>
                                <div className="size-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}><span className="material-symbols-outlined text-xl">{cat.icon}</span></div>
                                <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recurring Toggle & Frequency */}
                {!editId && (
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
                                <select value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full p-3 bg-app-bg rounded-xl border border-app-border">
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

                {/* Description and Date */}
                <div className="p-4"><input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" className="w-full bg-transparent focus:outline-none" /></div>
                <div className="p-4"><DatePicker date={date} onDateChange={setDate} /></div>
            </div>

            {/* Delete Button */}
            {editId && <div className="p-4"><button type="button" onClick={handleDelete} className="w-full py-3 bg-app-danger/10 text-app-danger font-bold rounded-xl">Eliminar</button></div>}
        </main>
        
        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/80 backdrop-blur-xl border-t border-app-border">
          <button type="submit" disabled={!amount || !categoryId || addTransactionMutation.isLoading || updateTransactionMutation.isLoading || addRecurringMutation.isLoading} className="w-full h-14 rounded-2xl text-lg font-bold bg-app-primary text-white disabled:bg-app-elevated disabled:text-app-muted">
            {addTransactionMutation.isLoading || updateTransactionMutation.isLoading || addRecurringMutation.isLoading ? 'Guardando...' : (editId ? 'Actualizar' : 'Guardar')}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default NewTransaction;