import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Category, Transaction, TransactionType } from '../types';
import { useCategories, useTransaction, useAddTransaction, useUpdateTransaction, useDeleteTransaction, useTransactions } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { DatePicker } from '../components/DatePicker';

export const NewTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as TransactionType) || 'expense';
  const editId = searchParams.get('editId');

  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: existingTransaction, isLoading: isLoadingExisting } = useTransaction(editId);
  const { data: allTransactions } = useTransactions();

  const addTransactionMutation = useAddTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (existingTransaction) {
      setType(existingTransaction.type);
      setAmount(existingTransaction.amount.toString());
      setDescription(existingTransaction.description);
      setCategoryId(existingTransaction.categoryId);
      setDate(new Date(existingTransaction.date));
    }
  }, [existingTransaction]);

  const availableCategories = useMemo(() =>
    categories?.filter(c => c.type === type) || [],
    [categories, type]
  );

  useEffect(() => {
    if (categoryId && !availableCategories.find(c => c.id === categoryId)) {
      setCategoryId('');
    }
  }, [type, categoryId, availableCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    const numAmount = parseFloat(amount);
    const finalDescription = description || (type === 'expense' ? 'Gasto' : 'Ingreso');

    const transactionData = {
      amount: numAmount,
      description: finalDescription,
      categoryId,
      date: date.toISOString(),
      type
    };

    try {
      if (editId) {
        await updateTransactionMutation.mutateAsync({ id: editId, transaction: transactionData });
        toast.success('Transacción actualizada');
      } else {
        await addTransactionMutation.mutateAsync(transactionData);
        toast.success('Transacción guardada');
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
  const placeholderText = type === 'expense' ? 'Ej: Café con amigos...' : 'Ej: Salario mensual...';

  if (isLoading) return <div className="bg-app-bg min-h-screen" />;

  return (
    <div className="flex flex-col h-screen bg-app-bg text-app-text">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <header className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-app-border">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-app-elevated">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold">{editId ? 'Editar' : 'Nueva'} Transacción</h1>
          <div className="w-10"></div>
        </header>

        <main className="flex-1 px-4 pt-6 space-y-8 overflow-y-auto pb-32">
          <div className="flex p-1 bg-app-card rounded-2xl border border-app-border">
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'income' ? 'bg-app-success text-white shadow-lg shadow-app-success/20' : 'text-app-muted'}`}>Ingreso</button>
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${type === 'expense' ? 'bg-app-danger text-white shadow-lg shadow-app-danger/20' : 'text-app-muted'}`}>Gasto</button>
          </div>

          <div className="text-center space-y-2">
            <label className="text-app-muted text-sm font-medium uppercase tracking-wider">Monto</label>
            <div className="flex items-center justify-center">
              <span className="text-3xl sm:text-4xl text-app-muted font-light pr-2">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full max-w-[200px] sm:max-w-[300px] bg-transparent text-center text-5xl sm:text-6xl font-bold text-app-text focus:outline-none placeholder-app-muted/50"
                autoFocus={!editId}
                required
              />
            </div>
          </div>

          <div className="bg-app-card rounded-2xl border border-app-border overflow-hidden divide-y divide-app-border">
            <div className="p-4">
              <label className="block text-xs text-app-muted font-bold mb-3 uppercase">Categoría</label>
              <div className="grid grid-cols-4 gap-3">
                {availableCategories.map(cat => (
                  <button type="button" key={cat.id} onClick={() => setCategoryId(cat.id)} className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 border-2 ${categoryId === cat.id ? 'border-app-primary bg-app-primary/10' : 'border-transparent hover:bg-app-elevated'}`}>
                    <div className="size-10 rounded-full flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                      <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                    </div>
                    <span className={`text-[10px] font-medium truncate w-full text-center ${categoryId === cat.id ? 'text-app-primary' : 'text-app-muted'}`}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Descripción</label>
              <div className="flex items-center gap-3 bg-app-bg p-3 rounded-xl border border-app-border focus-within:border-app-primary/50">
                <span className="material-symbols-outlined text-app-muted">edit</span>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={placeholderText} className="flex-1 bg-transparent focus:outline-none text-app-text placeholder-app-muted" />
              </div>
            </div>

            <div className="p-4">
              <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Fecha</label>
              <DatePicker date={date} onDateChange={setDate} />
            </div>
            
            {/* Recurring transactions UI removed for now. Backend implementation needed.
            <div className="p-4">
                ... UI for recurring transactions ...
            </div>
            */}
          </div>

          {editId && (
            <button type="button" onClick={handleDelete} className="w-full py-4 text-app-danger font-semibold rounded-xl hover:bg-app-danger/10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">delete</span>
              Eliminar Transacción
            </button>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/80 backdrop-blur-xl border-t border-app-border z-20 safe-area-pb">
          <button type="submit" disabled={!amount || !categoryId || addTransactionMutation.isLoading || updateTransactionMutation.isLoading} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-300 bg-gradient-to-r from-app-primary to-app-secondary text-app-text shadow-app-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:bg-app-elevated disabled:text-app-muted disabled:hover:scale-100 disabled:shadow-none">
            {addTransactionMutation.isLoading || updateTransactionMutation.isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
                <>
                    <span className="material-symbols-outlined">check</span>
                    {editId ? 'Actualizar' : 'Guardar'}
                </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
};
