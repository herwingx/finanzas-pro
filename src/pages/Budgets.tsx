import React, { useMemo } from 'react';
import { StorageService } from '../services/storageService';
import { Link } from 'react-router-dom';
import { useStorage } from '../hooks/useStorage';
import { Budget } from '../types';

export const Budgets = () => {
  const allCategories = useStorage(StorageService.getCategories, 'category');
  const budgets = useStorage(StorageService.getBudgets, 'budget');
  const transactions = useStorage(StorageService.getTransactions, 'transaction');

  const expenseCategories = useMemo(() => 
    allCategories.filter(c => c.type === 'expense'),
    [allCategories]
  );

  const handleBudgetChange = (categoryId: string, limit: number) => {
    if (isNaN(limit) || limit < 0) return;
    const budget: Budget = { categoryId, limit };
    StorageService.saveBudget(budget);
  };

  const budgetMap = useMemo(() => 
    new Map(budgets.map(b => [b.categoryId, b.limit])), 
    [budgets]
  );

  const spentMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type === 'expense') {
        const currentSpent = map.get(tx.categoryId) || 0;
        map.set(tx.categoryId, currentSpent + tx.amount);
      }
    }
    return map;
  }, [transactions]);

  const totalBudget = useMemo(() => 
    budgets.reduce((sum, b) => sum + b.limit, 0),
    [budgets]
  );

  const totalSpent = useMemo(() => 
    Array.from(spentMap.values()).reduce((sum, spent) => sum + spent, 0),
    [spentMap]
  );

  const overallProgress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-app-text">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg/90 backdrop-blur p-4 border-b border-app-border">
         <Link to="/more" className="text-app-text"><span className="material-symbols-outlined">arrow_back_ios_new</span></Link>
         <h1 className="font-bold text-lg">Presupuestos</h1>
         <div className="w-8" />
      </header>

      <div className="p-4 mt-4 space-y-8">
        {/* Main Summary */}
        <div className="bg-app-card border border-app-border rounded-2xl p-6">
          <p className="text-app-muted text-sm font-bold uppercase tracking-wider mb-1">Resumen Mensual</p>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-app-text">{totalSpent.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
            <span className="text-app-muted">de {totalBudget.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </div>
          
          <div className="h-2.5 w-full bg-app-bg rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-app-primary to-app-secondary transition-all duration-500" 
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm mt-2 text-app-muted">
            <span>Gastado</span>
            <span>Restante: {(totalBudget - totalSpent).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
          </div>
        </div>

        {/* Budgets by Category */}
        <div>
          <h2 className="px-4 mt-8 mb-4 font-bold text-lg">Presupuestos por Categoría</h2>
          <div className="space-y-4">
            {expenseCategories.map(cat => {
              const limit = budgetMap.get(cat.id) || 0;
              const spent = spentMap.get(cat.id) || 0;
              const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const isOver = spent > limit && limit > 0;

              return (
                <div key={cat.id} className="bg-app-card border border-app-border rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="size-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <span className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{cat.name}</h3>
                      <p className={`text-sm ${isOver ? 'text-app-danger' : 'text-app-muted'}`}>
                        {spent.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} de {limit.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                      </p>
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-app-muted">$</span>
                        <input
                          type="number"
                          placeholder="0"
                          defaultValue={limit > 0 ? limit : ''}
                          onBlur={(e) => handleBudgetChange(cat.id, parseFloat(e.target.value) || 0)}
                          className="bg-app-bg w-full rounded-lg py-2 pl-6 pr-2 text-right font-bold border border-app-border focus:outline-none focus:ring-2 focus:ring-app-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-app-bg rounded-full overflow-hidden mt-3">
                    <div 
                      className={`h-full ${isOver ? 'bg-app-danger' : 'bg-app-primary'} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};