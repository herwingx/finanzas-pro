import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { useInvestments, useDeleteInvestment } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonInvestmentsPage } from '../components/Skeleton';

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
   SUB-COMPONENT: DETAIL SHEET
   ================================================================================== */
const InvestmentDetailSheet = ({
  investment,
  onClose,
  onEdit,
  onDelete
}: {
  investment: Investment;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const currentPrice = investment.currentPrice || investment.avgBuyPrice;
  const totalValue = currentPrice * investment.quantity;
  const totalCost = investment.avgBuyPrice * investment.quantity;
  const gain = totalValue - totalCost;
  const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;
  const isProfitable = gain >= 0;

  const formatCurrency = (val: number) => val.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <SwipeableBottomSheet isOpen={true} onClose={onClose}>
      <div className="pt-2 pb-6 px-4 animate-fade-in">

        {/* 1. HERO HEADER */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className={`size-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-md ${isProfitable ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
            <span className="material-symbols-outlined text-[36px]">
              {investment.type === 'CRYPTO' ? 'currency_bitcoin' : investment.type === 'REAL_ESTATE' ? 'home_work' : investment.type === 'STOCK' ? 'show_chart' : 'trending_up'}
            </span>
          </div>

          <h2 className="text-xl font-bold text-app-text px-4 leading-tight mb-1">{investment.name}</h2>
          {investment.ticker && (
            <p className="text-xs text-app-muted font-bold tracking-widest bg-app-subtle px-2 py-0.5 rounded-md uppercase">
              {investment.ticker}
            </p>
          )}
        </div>

        {/* 2. MAIN STATS */}
        <div className="bento-card bg-app-subtle p-5 mb-6 border border-app-border/60">
          <div className="flex justify-between items-end mb-4 border-b border-app-border/40 pb-4">
            <span className="text-[10px] uppercase font-bold text-app-muted tracking-widest">Valor Actual</span>
            <span className="text-3xl font-black font-numbers tracking-tight text-app-text">
              {formatCurrency(totalValue)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-app-muted block mb-0.5">Retorno Total</span>
              <p className={`text-base font-bold font-numbers ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isProfitable ? '+' : ''}{formatCurrency(gain)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-xl text-xs font-bold ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {isProfitable ? '▲' : '▼'} {gainPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 3. DETAILS GRID */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-app-surface border border-app-border p-3 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Cantidad</p>
            <p className="font-bold text-app-text">{investment.quantity} Unidades</p>
          </div>
          <div className="bg-app-surface border border-app-border p-3 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Precio Promedio</p>
            <p className="font-bold text-app-text">{formatCurrency(investment.avgBuyPrice)}</p>
          </div>
          <div className="bg-app-surface border border-app-border p-3 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Costo Total</p>
            <p className="font-bold text-app-text">{formatCurrency(totalCost)}</p>
          </div>
          <div className="bg-app-surface border border-app-border p-3 rounded-xl">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-0.5">Precio Actual</p>
            <p className="font-bold text-app-text">{formatCurrency(currentPrice)}</p>
          </div>
        </div>

        {/* 4. ACTIONS FOOTER */}
        <div className="hidden md:grid grid-cols-2 gap-3 pt-2 border-t border-app-border/50">
          <button
            onClick={() => { onClose(); onEdit(); }}
            className="h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
          <button
            onClick={() => { onClose(); onDelete(); }}
            className="h-12 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Eliminar
          </button>
        </div>

      </div>
    </SwipeableBottomSheet>
  );
};

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const InvestmentsPage: React.FC = () => {
  // Navigation & URL State
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openInvestmentSheet } = useGlobalSheets();
  const isMobile = useIsMobile();

  // Data Queries
  const { data: investments, isLoading } = useInvestments();
  const deleteInvestmentMutation = useDeleteInvestment();

  // Local UI State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

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
      <div className="p-4"><SkeletonInvestmentsPage /></div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg pb-safe md:pb-12 text-app-text font-sans">
      <PageHeader
        title="Portafolio"
        showBackButton={true}
        rightAction={
          <button onClick={openNew} className="bg-app-text text-app-bg rounded-full size-10 flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[22px]">add</span>
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
                  leftAction={{ icon: 'edit', color: 'text-white', bgColor: 'bg-indigo-500', label: 'Editar' }}
                  onSwipeRight={() => openEdit(inv)}
                  rightAction={{ icon: 'delete', color: 'text-white', bgColor: 'bg-rose-500', label: 'Borrar' }}
                  onSwipeLeft={() => setDeleteId(inv.id)}
                  className="rounded-3xl"
                  disabled={!isMobile}
                >
                  <div
                    onClick={() => setSelectedInvestment(inv)}
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

      {/* DETAIL SHEET */}
      {selectedInvestment && (
        <InvestmentDetailSheet
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
          onEdit={() => { setSelectedInvestment(null); openEdit(selectedInvestment); }}
          onDelete={() => { setSelectedInvestment(null); setDeleteId(selectedInvestment.id); }}
        />
      )}
    </div>
  );
};

export default InvestmentsPage;