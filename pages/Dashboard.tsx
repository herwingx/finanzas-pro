import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { StorageService } from '../services/storageService';
import { Transaction, Category } from '../types';

export const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthSpend, setMonthSpend] = useState(0);

  // Subscribe to storage events for real-time updates
  useEffect(() => {
    const loadData = () => {
      const txs = StorageService.getTransactions();
      const cats = StorageService.getCategories();

      // Calculate Balance
      const balance = txs.reduce((acc, tx) => {
        return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
      }, 0);

      // Calculate Month Spend (Simple Logic for demo)
      const spend = txs
        .filter(tx => tx.type === 'expense')
        .reduce((acc, tx) => acc + tx.amount, 0);

      setTransactions(txs);
      setCategories(cats);
      setTotalBalance(balance);
      setMonthSpend(spend);
    };

    loadData();

    // Listen for changes
    const unsubscribe = StorageService.subscribe('transaction', loadData);
    return () => unsubscribe();
  }, []);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'General';
  const getCategoryIcon = (id: string) => categories.find(c => c.id === id)?.icon || 'sell';
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#999';

  // Mock data for the bar chart
  const chartData = [
    { name: 'S1', val: 400 },
    { name: 'S2', val: 300 },
    { name: 'S3', val: 550 }, // Active week
    { name: 'S4', val: 200 },
  ];

  return (
    <div className="pb-28 animate-fade-in bg-app-bg min-h-screen text-white">
      {/* Top Bar */}
      <div className="flex items-center p-4 sticky top-0 bg-app-bg/90 backdrop-blur-xl z-20 border-b border-white/5">
        <div className="size-10 rounded-full bg-gradient-to-br from-app-primary to-app-secondary flex items-center justify-center text-white font-bold shadow-lg shadow-app-primary/20">
          US
        </div>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight">Panel de Control</h1>
        <button className="size-10 flex items-center justify-center rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-app-primary via-indigo-600 to-app-secondary rounded-[2rem] p-8 shadow-2xl shadow-app-primary/30 relative overflow-hidden group">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-500 pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white/80 text-sm font-medium tracking-wide">Balance Total</p>
              <button className="size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-white/90 text-xl">visibility</span>
              </button>
            </div>
            <h2 className="text-5xl font-extrabold tracking-tight mb-4 text-white drop-shadow-sm">
              ${totalBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold backdrop-blur-sm">MXN</span>
              <p className="text-white/70 text-sm font-medium">Disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 px-4 mt-8">
        <Link
          to="/new?type=expense"
          className="group flex items-center gap-4 p-4 bg-app-card border border-white/5 rounded-2xl hover:border-app-danger/30 hover:bg-app-danger/5 active:scale-[0.98] transition-all duration-300 shadow-sm"
        >
          <div className="size-12 rounded-full bg-app-danger/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-app-danger">arrow_downward</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white">Gasto</span>
            <span className="text-xs text-app-muted">Registrar salida</span>
          </div>
        </Link>

        <Link
          to="/new?type=income"
          className="group flex items-center gap-4 p-4 bg-app-card border border-white/5 rounded-2xl hover:border-app-success/30 hover:bg-app-success/5 active:scale-[0.98] transition-all duration-300 shadow-sm"
        >
          <div className="size-12 rounded-full bg-app-success/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-app-success">arrow_upward</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white">Ingreso</span>
            <span className="text-xs text-app-muted">Registrar entrada</span>
          </div>
        </Link>
      </div>

      {/* Monthly Chart */}
      <div className="px-4 mt-8">
        <div className="bg-app-card border border-white/5 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-app-muted text-sm font-bold uppercase tracking-wider mb-1">Gastos del Mes</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-white">${monthSpend.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-app-success/10 border border-app-success/20">
              <span className="text-app-success text-xs font-bold">+5.2% vs mes anterior</span>
            </div>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="val" radius={[4, 4, 4, 4]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 2 ? 'hsl(250, 84%, 54%)' : 'rgba(255,255,255,0.1)'}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 px-2 text-xs text-app-muted font-bold uppercase tracking-wider">
            <span>Sem 1</span><span>Sem 2</span><span className="text-app-primary">Sem 3</span><span>Sem 4</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4 mt-10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Recientes</h3>
          <Link to="/history" className="text-app-primary text-sm font-bold hover:text-app-primary-light transition-colors px-3 py-1 rounded-lg hover:bg-app-primary/10">
            Ver Todo
          </Link>
        </div>

        <div className="space-y-4">
          {transactions.slice(0, 5).map((tx) => (
            <Link
              key={tx.id}
              to={`/new?editId=${tx.id}`}
              className="group flex items-center gap-4 bg-app-card border border-white/5 p-4 rounded-2xl hover:border-app-primary/30 hover:bg-white/5 transition-all duration-300 active:scale-[0.99]"
            >
              <div
                className="size-12 rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${getCategoryColor(tx.categoryId)}20` }}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ color: getCategoryColor(tx.categoryId) }}
                >
                  {getCategoryIcon(tx.categoryId)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate text-base">{tx.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 text-zinc-400">
                    {getCategoryName(tx.categoryId)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(tx.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className={`font-bold text-base ${tx.type === 'income' ? 'text-app-success' : 'text-white'}`}>
                  {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}

          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-app-muted bg-app-card/50 rounded-2xl border border-dashed border-white/10">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <p className="text-sm font-medium">No hay transacciones aún</p>
              <Link to="/new" className="mt-4 text-app-primary font-bold text-sm hover:underline">
                Crear primera transacción
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};