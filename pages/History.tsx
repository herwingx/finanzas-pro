import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { Transaction, Category } from '../types';

export const History = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setTransactions(StorageService.getTransactions());
    setCategories(StorageService.getCategories());
  }, []);

  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'sell';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#999';

  // Group transactions by date
  const grouped = transactions.reduce((groups, tx) => {
    const date = new Date(tx.date).toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="pb-28 bg-app-bg min-h-screen">
      {/* Header */}
      <div className="sticky top-0 flex items-center p-4 bg-app-bg/95 backdrop-blur z-20 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="text-white mr-4">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold flex-1">Historial</h1>
      </div>

      <div className="px-4 py-2 space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-app-muted opacity-60">
            <span className="material-symbols-outlined text-6xl mb-4">receipt_long</span>
            <p>No hay transacciones registradas</p>
          </div>
        ) : (
          Object.keys(grouped).map(date => (
            <div key={date} className="animate-fade-in">
              <h3 className="text-app-muted text-sm font-bold mb-3 sticky top-16 bg-app-bg py-2 z-10">{date}</h3>
              <div className="space-y-3">
                {grouped[date].map(tx => (
                  <div 
                    key={tx.id} 
                    onClick={() => navigate(`/new?editId=${tx.id}`)}
                    className="flex items-center gap-4 bg-app-card p-3 rounded-xl border border-transparent active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div 
                      className="size-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${getCategoryColor(tx.categoryId)}20` }}
                    >
                      <span className="material-symbols-outlined" style={{ color: getCategoryColor(tx.categoryId) }}>
                        {getCategoryIcon(tx.categoryId)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-white">{tx.description}</p>
                      <p className="text-xs text-app-muted">
                        {categories.find(c => c.id === tx.categoryId)?.name}
                      </p>
                    </div>
                    <p className={`font-bold ${tx.type === 'income' ? 'text-app-accent' : 'text-white'}`}>
                      {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};