import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Category, TransactionType } from '../types';

export const NewTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as TransactionType) || 'expense';
  const editId = searchParams.get('editId');

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setCategories(StorageService.getCategories());

    if (editId) {
      const tx = StorageService.getTransaction(editId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setDescription(tx.description);
        setCategoryId(tx.categoryId);
        setDate(new Date(tx.date).toISOString().split('T')[0]);
      }
    }
  }, [editId]);

  // Filter categories by selected type
  const availableCategories = categories.filter(c => c.type === type);

  const handleSubmit = () => {
    // Validation: Description is optional now, or we provide a default
    const finalDescription = description || (type === 'expense' ? 'Gasto sin descripción' : 'Ingreso sin descripción');

    if (!amount || !categoryId) return;

    const txData = {
      id: editId || Date.now().toString(),
      amount: parseFloat(amount),
      description: finalDescription,
      categoryId,
      date: new Date(date).toISOString(),
      type
    };

    if (editId) {
      StorageService.updateTransaction(txData);
    } else {
      StorageService.saveTransaction(txData);
    }
    navigate(-1);
  };

  const handleDelete = () => {
    if (editId && window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      StorageService.deleteTransaction(editId);
      navigate(-1);
    }
  };

  const handleAiCategorize = async () => {
    if (!description || description.length < 3) return;
    setIsAiLoading(true);
    const suggestedId = await GeminiService.suggestCategory(description, availableCategories);
    if (suggestedId) {
      setCategoryId(suggestedId);
    }
    setIsAiLoading(false);
  };

  return (
    <div className="flex flex-col h-screen bg-app-bg text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sticky top-0 bg-app-bg/95 backdrop-blur-md z-10 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{editId ? 'Editar Transacción' : 'Nueva Transacción'}</h1>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Main Form */}
      <div className="flex-1 px-4 pt-6 space-y-8 overflow-y-auto pb-32">

        {/* Type Switcher */}
        <div className="flex p-1 bg-app-card rounded-2xl border border-white/5">
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${type === 'income'
                ? 'bg-app-success text-white shadow-lg shadow-app-success/20'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Ingreso
          </button>
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${type === 'expense'
                ? 'bg-app-danger text-white shadow-lg shadow-app-danger/20'
                : 'text-zinc-400 hover:text-white'
              }`}
          >
            Gasto
          </button>
        </div>

        {/* Amount Input */}
        <div className="text-center space-y-2">
          <label className="text-app-muted text-sm font-medium uppercase tracking-wider">Monto</label>
          <div className="relative inline-block">
            <span className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 text-3xl text-zinc-500 font-light pr-2">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-center text-6xl font-bold focus:outline-none placeholder-zinc-700"
              autoFocus={!editId}
            />
          </div>
        </div>

        {/* Form Fields Container */}
        <div className="bg-app-card rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5">

          {/* Category Selection */}
          <div className="p-4">
            <label className="block text-xs text-app-muted font-bold mb-3 uppercase">Categoría</label>
            <div className="grid grid-cols-4 gap-3">
              {availableCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200 ${categoryId === cat.id
                      ? 'bg-white/10 ring-2 ring-app-primary scale-105'
                      : 'hover:bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                >
                  <div
                    className="size-10 rounded-full flex items-center justify-center text-lg shadow-sm"
                    style={{ backgroundColor: categoryId === cat.id ? cat.color : `${cat.color}20`, color: categoryId === cat.id ? '#fff' : cat.color }}
                  >
                    <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
                  </div>
                  <span className="text-[10px] font-medium truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div className="p-4">
            <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Descripción</label>
            <div className="flex items-center gap-3 bg-app-bg/50 p-3 rounded-xl border border-white/5 focus-within:border-app-primary/50 transition-colors">
              <span className="material-symbols-outlined text-zinc-500">edit</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿En qué gastaste?"
                className="flex-1 bg-transparent focus:outline-none text-white placeholder-zinc-600"
              />
              {!editId && description.length >= 3 && (
                <button
                  type="button"
                  onClick={handleAiCategorize}
                  disabled={isAiLoading}
                  className="text-app-accent hover:text-white transition-colors"
                  title="Sugerir categoría con IA"
                >
                  <span className={`material-symbols-outlined ${isAiLoading ? 'animate-spin' : ''}`}>
                    {isAiLoading ? 'autorenew' : 'auto_awesome'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Date Input */}
          <div className="p-4">
            <label className="block text-xs text-app-muted font-bold mb-2 uppercase">Fecha</label>
            <div className="flex items-center gap-3 bg-app-bg/50 p-3 rounded-xl border border-white/5">
              <span className="material-symbols-outlined text-zinc-500">calendar_today</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-transparent text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

        </div>

        {editId && (
          <button
            onClick={handleDelete}
            className="w-full py-4 text-app-danger font-semibold rounded-xl hover:bg-app-danger/10 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">delete</span>
            Eliminar Transacción
          </button>
        )}
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-app-bg/80 backdrop-blur-xl border-t border-white/5 z-20 safe-area-pb">
        <button
          onClick={handleSubmit}
          disabled={!amount || !categoryId}
          className={`
            w-full h-14 rounded-2xl text-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all duration-300
            ${!amount || !categoryId
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-app-primary to-app-secondary text-white shadow-app-primary/25 hover:scale-[1.02] active:scale-[0.98]'
            }
          `}
        >
          <span className="material-symbols-outlined">check</span>
          {editId ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};