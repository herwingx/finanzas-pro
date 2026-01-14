import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInvestments, useDeleteInvestment } from '../hooks/useApi';
import { Investment } from '../types';
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { toastSuccess, toastError } from '../utils/toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { useGlobalSheets } from '../context/GlobalSheetContext';

// ... (InvestmentTypeLabel definition and COLORS can stay if needed for chart/list, but InvestmentTypeLabel is also in Form so maybe duplicated but ok for now) ...
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

enum InvestmentTypeLabel {
  STOCK = 'Acciones',
  CRYPTO = 'Cripto',
  ETF = 'ETF',
  REAL_ESTATE = 'Bienes Raíces',
  BOND = 'Bonos',
  OTHER = 'Otro'
}

const InvestmentsPage: React.FC = () => {
  const { data: investments, isLoading } = useInvestments();
  const deleteInvestmentMutation = useDeleteInvestment();
  const { openInvestmentSheet } = useGlobalSheets();

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openInvestmentSheet();
    }
  }, [searchParams, openInvestmentSheet]);

  const openNew = () => {
    openInvestmentSheet();
  };

  const openEdit = (inv: Investment) => {
    openInvestmentSheet(inv);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteInvestmentMutation.mutateAsync(deleteId);
      toastSuccess('Inversión eliminada');
      setDeleteId(null);
    }
  };

  // Calculations ... (keep existing)
  const totalValue = investments?.reduce((sum, inv) => sum + ((inv.currentPrice || inv.avgBuyPrice) * inv.quantity), 0) || 0;
  const totalCost = investments?.reduce((sum, inv) => sum + (inv.avgBuyPrice * inv.quantity), 0) || 0;
  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  // Chart Data ... (keep existing)
  const chartData = investments?.reduce((acc, inv) => {
    const existing = acc.find(item => item.name === InvestmentTypeLabel[inv.type]);
    const value = (inv.currentPrice || inv.avgBuyPrice) * inv.quantity;
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: InvestmentTypeLabel[inv.type], value });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
      <PageHeader
        title="Inversiones"
        showBackButton={true}
        rightAction={
          <button onClick={openNew} className="text-app-primary">
            <span className="material-symbols-outlined text-3xl">add_circle</span>
          </button>
        }
      />

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">

        {/* Portfolio Summary Card (Glassmorphism) */}
        <div className="relative overflow-hidden rounded-3xl p-6 bg-linear-to-br from-slate-800 to-slate-900 border border-slate-700 text-white shadow-xl">
          {/* ... keep existing summary card content ... */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-9xl">show_chart</span>
          </div>

          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">Valor Total</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            ${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </h2>

          <div className="flex gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Costo Base</p>
              <p className="font-semibold text-slate-200">${totalCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Ganancia/Pérdida</p>
              <p className={`font - bold flex items - center gap - 1 ${totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'} `}>
                {totalGain >= 0 ? '+' : ''}{totalGain.toLocaleString()}
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                  {totalGainPercent.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 shadow-sm h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `$${value.toLocaleString()} `}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Investment List */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-app-text px-1">Mis Activos</h3>

          {isLoading ? (
            <div className="p-8 text-center text-app-muted">Cargando portafolio...</div>
          ) : investments?.length === 0 ? (
            <div className="text-center py-12 bg-app-surface border-2 border-dashed border-app-border rounded-3xl">
              <span className="material-symbols-outlined text-4xl text-app-muted mb-2">show_chart</span>
              <p className="text-app-muted text-sm">No tienes inversiones registradas.</p>
              <button onClick={openNew} className="mt-4 text-app-primary font-bold text-sm hover:underline">Comenzar a invertir</button>
            </div>
          ) : (
            investments?.map((inv) => {
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
                    className="bento-card p-4 md:p-5 flex justify-between items-center hover:border-app-border-strong transition-all active:scale-[0.99] cursor-pointer bg-app-surface"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`size-11 rounded-xl flex items-center justify-center ${isProfitable ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {inv.type === 'CRYPTO' ? 'currency_bitcoin' : inv.type === 'REAL_ESTATE' ? 'home_work' : 'trending_up'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-app-text text-sm">{inv.name}</h4>
                        <p className="text-xs text-app-muted font-medium">{inv.quantity} {inv.ticker || 'unidades'}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-app-text text-base">
                        ${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-bold ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfitable ? '+' : ''}{gain.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })
          )}
        </div>
      </main>

      {/* Editor Sheet REMOVED - Managed Globally */}

      <DeleteConfirmationSheet
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        itemName="esta inversión"
        isDeleting={deleteInvestmentMutation.isPending}
      />
    </div>
  );
};

export default InvestmentsPage;
