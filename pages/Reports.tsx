import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StorageService } from '../services/storageService';
import { Transaction, Category } from '../types';
import { Link } from 'react-router-dom';

export const Reports = () => {
  const [data, setData] = useState<{name: string, value: number, color: string}[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const txs = StorageService.getTransactions().filter(t => t.type === 'expense');
    const cats = StorageService.getCategories();

    const grouped = txs.reduce((acc, tx) => {
      acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(grouped).reduce((a, b) => a + b, 0);
    setTotalSpent(total);

    const chartData = Object.keys(grouped).map(catId => {
      const cat = cats.find(c => c.id === catId);
      return {
        name: cat?.name || 'Desconocido',
        value: grouped[catId],
        color: cat?.color || '#999'
      };
    }).sort((a, b) => b.value - a.value);

    setData(chartData);
  }, []);

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-app-bg p-4">
         <Link to="/" className="text-white"><span className="material-symbols-outlined">arrow_back_ios_new</span></Link>
         <h1 className="font-bold text-lg">Reportes</h1>
         <span className="material-symbols-outlined">ios_share</span>
      </header>

      {/* Summary Chips */}
      <div className="flex gap-3 px-4 pb-2 overflow-x-auto no-scrollbar">
        <span className="px-4 py-1.5 bg-app-accent text-app-bg text-sm font-bold rounded-full whitespace-nowrap">Este Mes</span>
        <span className="px-4 py-1.5 bg-zinc-800 text-white text-sm font-medium rounded-full whitespace-nowrap">Últimos 3 Meses</span>
        <span className="px-4 py-1.5 bg-zinc-800 text-white text-sm font-medium rounded-full whitespace-nowrap">Este Año</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-4">
         <div className="bg-app-card border border-zinc-800 p-4 rounded-xl">
           <p className="text-zinc-400 text-sm font-medium">Gastos Totales</p>
           <p className="text-2xl font-bold text-red-400 mt-1">${totalSpent.toFixed(2)}</p>
         </div>
         <div className="bg-app-card border border-zinc-800 p-4 rounded-xl">
           <p className="text-zinc-400 text-sm font-medium">Promedio Día</p>
           <p className="text-2xl font-bold text-white mt-1">${(totalSpent / 30).toFixed(2)}</p>
         </div>
      </div>

      {/* Donut Chart */}
      <div className="mt-6 px-4">
        <div className="bg-app-card border border-zinc-800 rounded-xl p-6">
          <h2 className="font-bold mb-4">Gastos por Categoría</h2>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative size-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xs text-zinc-400">Total</span>
                 <span className="text-xl font-bold">${totalSpent}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
              {data.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{Math.round((item.value / totalSpent) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories List */}
      <div className="mt-6 px-4">
        <h3 className="font-bold mb-3">Categorías Principales</h3>
        <div className="space-y-3">
          {data.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-app-card p-4 rounded-xl border border-zinc-800">
               <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                    <span className="material-symbols-outlined" style={{ color: item.color }}>sell</span>
                 </div>
                 <div>
                   <p className="font-bold">{item.name}</p>
                   <p className="text-xs text-zinc-400">{Math.round((item.value / totalSpent) * 100)}% del total</p>
                 </div>
               </div>
               <p className="font-bold">${item.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
