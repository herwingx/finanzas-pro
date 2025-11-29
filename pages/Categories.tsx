import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Category } from '../types';
import { Link } from 'react-router-dom';

export const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    setCategories(StorageService.getCategories());
  }, []);

  const filteredCategories = categories.filter(c => c.type === view);

  return (
    <div className="pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg/90 backdrop-blur p-4">
         <Link to="/" className="text-white"><span className="material-symbols-outlined">arrow_back_ios_new</span></Link>
         <h1 className="font-bold text-lg">Categorías</h1>
         <button className="text-app-accent font-semibold text-sm">Reordenar</button>
      </header>

      {/* Tabs */}
      <div className="px-4 mt-2">
        <div className="flex bg-zinc-800 p-1 rounded-lg">
          <button 
            onClick={() => setView('expense')}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'expense' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
          >
            Gastos
          </button>
          <button 
             onClick={() => setView('income')}
             className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'income' ? 'bg-zinc-600 text-white' : 'text-zinc-400'}`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-6 space-y-2">
        {filteredCategories.map(cat => (
          <div key={cat.id} className="flex items-center gap-4 bg-app-card p-3 rounded-xl">
            <div 
              className="size-10 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: cat.color }} // Using hex directly but with opacity usually preferred
            >
              <span className="material-symbols-outlined">{cat.icon}</span>
            </div>
            <span className="flex-1 font-medium">{cat.name}</span>
            <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
          </div>
        ))}

        {/* Add New */}
        <div className="flex items-center gap-4 p-3 rounded-xl border-2 border-dashed border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors">
           <div className="size-10 rounded-full border-2 border-zinc-600 flex items-center justify-center">
             <span className="material-symbols-outlined text-zinc-500">add</span>
           </div>
           <span className="text-zinc-500 font-medium">Añadir categoría</span>
        </div>
      </div>
      
       {/* Floating Action Button */}
       <div className="fixed bottom-24 right-4">
        <button className="size-14 bg-app-accent rounded-full text-app-bg shadow-lg flex items-center justify-center shadow-app-accent/30">
          <span className="material-symbols-outlined text-4xl">add</span>
        </button>
      </div>
    </div>
  );
};
