import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useInvestments, useDeleteInvestment } from '../hooks/useApi';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonAccountList } from '../components/Skeleton';

// Utils & Types
import { toastSuccess, toastError } from '../utils/toast';
import { Investment } from '../types';

/* ==================================================================================
   CONSTANTS & HELPERS
   ================================================================================== */
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#6366F1'];

enum InvestmentTypeLabel {
  STOCK = 'Acciones',
  CRYPTO = 'Cripto',
  ETF = 'ETF',
  REAL_ESTATE = 'Inmuebles',
  BOND = 'Bonos',
  OTHER = 'Otro'
}

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const InvestmentsPage: React.FC = () => {
  // Navigation & URL State
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openInvestmentSheet } = useGlobalSheets();

  // Data Queries
  const { data: investments, isLoading } = useInvestments();
  const deleteInvestmentMutation = useDeleteInvestment();

  // Local UI State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Trigger New Item Sheet
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openInvestmentSheet();
    }
  }, [searchParams, openInvestmentSheet]);

  /* Actions Handlers */
  const openNew = () => openInvestmentSheet();
  const openEdit = (inv: Investment) => openInvestmentSheet(inv);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteInvestmentMutation.mutateAsync(deleteId);
      toastSuccess('Activo eliminado del portafolio');
      setDeleteId(null);
    }
  };

  /* Calculations (Portfolio Maths) */
  const totalValue = investments?.reduce((sum, inv) => sum + ((inv.currentPrice || inv.avgBuyPrice) * inv.quantity), 0) || 0;
  const totalCost = investments?.reduce((sum, inv) => sum + (inv.avgBuyPrice * inv.quantity), 0) || 0;
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Chart Logic
  const chartData = investments?.reduce((acc, inv) => {
    const label = InvestmentTypeLabel[inv.type] || 'Otro';
    const existing = acc.find(item => item.name === label);
    const value = (inv.currentPrice || inv.avgBuyPrice) * inv.quantity;

    if (existing) { existing.value += value; }
    else { acc.push({ name: label, value }); }
    return acc;
  }, [] as { name: string; value: number }[]) || [];


  /* Render */
  if (isLoading) return (
    <div className="min-h-dvh bg-app-bg">
      <PageHeader title="Inversiones" showBackButton />
      <div className="p-4"><SkeletonAccountList /></div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg pb-safe md:pb-12 text-app-text font-sans">
      <PageHeader
        title="Portafolio"
        showBackButton={true}
        rightAction={
          <button onClick={openNew} className="bg-app-text text-app-bg rounded-full size-9 flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        }
      />

      <main className="px-4 py-4 max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">

        {/* 1. PORTFOLIO HERO CARD */}
        <div className="relative overflow-hidden rounded-[28px] p-6 bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700/50 text-white shadow-xl shadow-slate-900/20">
          {/* Subtle Backglow */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <span className="material-symbols-outlined text-[120px]">show_chart</span>
          </div>

          <div className="relative z-10">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1.5">Valor de Mercado</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 font-numbers">
              ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-xl md:text-2xl opacity-60">.{totalValue.toFixed(2).split('.')[1]}</span>
            </h2>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Costo Base</p>
                <p className="text-base font-semibold text-slate-200 font-numbers">${totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Retorno (P/L)</p>
                <div className={`font-bold flex items-baseline gap-1.5 ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span className="text-base font-numbers">
                    {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString()}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 font-medium">
                    {totalGainPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DIVERSIFICATION CHART */}
        {/* 2. DIVERSIFICATION CHART */}
        {chartData.length > 0 && (
          <div className="bento-card p-0 bg-app-surface border border-app-border overflow-hidden shadow-sm flex flex-col items-center justify-center p-4">
            <div className="w-full border-b border-app-subtle pb-2 mb-2 self-start">
              <h3 className="text-xs font-bold text-app-muted uppercase tracking-wide">Diversificación</h3>
            </div>
            {/* Fail-safe Chart: Fixed dimensions, no auto-resize to prevent crashes */}
            <div className="relative">
              <PieChart width={280} height={280}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-surface)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', fontWeight: 500, opacity: 0.8, paddingTop: '10px' }}
                />
              </PieChart>
            </div>
          </div>
        )}

        {/* 3. ASSETS LIST */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-app-muted uppercase tracking-wider px-1">Activos Individuales</h3>

          {!investments || investments.length === 0 ? (
            <div className="text-center py-16 bg-app-subtle/30 border-2 border-dashed border-app-border rounded-[24px]">
              <span className="material-symbols-outlined text-4xl text-app-muted opacity-30 mb-2">add_chart</span>
              <p className="text-app-text font-bold text-sm">Portafolio Vacío</p>
              <button onClick={openNew} className="mt-2 text-app-primary text-xs font-bold uppercase hover:underline tracking-wide">
                + Registrar Primera Inversión
              </button>
            </div>
          ) : (
            investments.map((inv) => {
              const val = (inv.currentPrice || inv.avgBuyPrice) * inv.quantity;
              const gain = val - (inv.avgBuyPrice * inv.quantity);
              const isProfitable = gain >= 0;

              return (
                <SwipeableItem
                  key={inv.id}
                  leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                  onSwipeRight={() => openEdit(inv)}
                  rightAction={{ icon: 'delete', color: '#F43F5E', label: 'Borrar' }}
                  onSwipeLeft={() => setDeleteId(inv.id)}
                  className="rounded-3xl"
                >
                  <div
                    onClick={() => openEdit(inv)}
                    className="bento-card p-4 md:p-5 flex justify-between items-center hover:border-app-border-strong cursor-pointer active:scale-[0.99] transition-all bg-app-surface group"
                  >
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className={`size-10 md:size-11 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${isProfitable ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'} dark:bg-app-subtle dark:border-white/5`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {inv.type === 'CRYPTO' ? 'currency_bitcoin' : inv.type === 'REAL_ESTATE' ? 'home_work' : inv.type === 'STOCK' ? 'show_chart' : 'trending_up'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <h4 className="font-bold text-app-text text-sm truncate">{inv.name}</h4>
                          {inv.ticker && <span className="hidden md:inline-block text-[10px] font-bold bg-app-subtle px-1.5 rounded text-app-muted uppercase">{inv.ticker}</span>}
                        </div>
                        <p className="text-[11px] text-app-muted mt-0.5 font-medium flex items-center gap-1 truncate">
                          {inv.quantity} <span className="hidden sm:inline">unid</span>
                          <span className="size-0.5 bg-current rounded-full mx-0.5 opacity-50" />
                          <span className={isProfitable ? 'text-emerald-500' : 'text-rose-500'}>
                            {isProfitable ? '+' : ''}{totalGainPercent.toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-app-text text-sm font-numbers tracking-tight">
                        ${val.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </p>
                      <p className={`text-[10px] font-bold font-numbers mt-0.5 ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfitable ? '+' : ''}{gain.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })
          )}
        </div>
      </main>

      <DeleteConfirmationSheet
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="esta inversión"
        isDeleting={deleteInvestmentMutation.isPending}
        warningMessage="Eliminar activo"
        warningDetails={["Esta acción no se puede deshacer.", "El valor se restará de tu patrimonio."]}
      />
    </div>
  );
};

export default InvestmentsPage;