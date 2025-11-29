import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Category, Budget, Transaction } from '../types';
import { Link } from 'react-router-dom';

interface BudgetDisplay extends Budget {
  categoryName: string;
  categoryIcon: string;
  spent: number;
}

export const Budgets = () => {
  const [budgetData, setBudgetData] = useState<BudgetDisplay[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const cats = StorageService.getCategories();
    const budgets = StorageService.getBudgets();
    const txs = StorageService.getTransactions().filter(t => t.type === 'expense');

    let tBudget = 0;
    let tSpent = 0;

    const computed = budgets.map(b => {
      const cat = cats.find(c => c.id === b.categoryId);
      // Calculate spent for this category (simplified: all time. Real app would be current month)
      const spent = txs
        .filter(t => t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      
      tBudget += b.limit;
      tSpent += spent;

      return {
        ...b,
        categoryName: cat?.name || 'Unknown',
        categoryIcon: cat?.icon || 'help',
        spent
      };
    });

    setBudgetData(computed);
    setTotalBudget(tBudget);
    setTotalSpent(tSpent);
  }, []);

  const overallProgress = Math.min((totalSpent / totalBudget) * 100, 100);

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg p-4">
         <Link to="/" className="text-white"><span className="material-symbols-outlined">arrow_back_ios_new</span></Link>
         <h1 className="font-bold text-lg">Presupuestos</h1>
         <span className="material-symbols-outlined">add</span>
      </header>

      {/* Main Summary */}
      <div className="px-4 mt-2">
        <div className="bg-[#193324] border border-[#326748] rounded-xl p-6">
          <h2 className="text-xl font-bold mb-1">Resumen Mensual</h2>
          <p className="text-app-muted text-sm">Presupuestado: ${totalBudget.toLocaleString()}</p>
          
          <div className="mt-4 flex justify-between text-app-muted">
            <span>Gastado: ${totalSpent.toLocaleString()}</span>
            <span>Restante: ${(totalBudget - totalSpent).toLocaleString()}</span>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-white">Progreso General</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-app-accent transition-all duration-1000" 
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <h2 className="px-4 mt-8 mb-4 font-bold text-lg">Presupuestos por Categoría</h2>

      <div className="px-4 space-y-4">
        {budgetData.map(item => {
          const percent = Math.min((item.spent / item.limit) * 100, 100);
          const isOver = item.spent > item.limit;
          const colorClass = isOver ? 'bg-red-500' : (percent > 80 ? 'bg-orange-500' : 'bg-app-accent');
          const textColor = isOver ? 'text-red-500' : (percent > 80 ? 'text-orange-500' : 'text-white');

          return (
            <div key={item.categoryId} className="flex items-center gap-4 py-2">
              <div className="size-12 rounded-lg bg-[#234833] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">{item.categoryIcon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                   <h3 className="font-medium truncate">{item.categoryName}</h3>
                   <span className={`text-sm font-bold ${textColor}`}>{Math.round((item.spent / item.limit) * 100)}%</span>
                </div>
                <p className="text-sm text-app-muted mb-2">${item.spent} / ${item.limit}</p>
                
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colorClass} rounded-full`} 
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
              </div>
              
              <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
