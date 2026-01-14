import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';
import {
  useGoals,
  useAddGoalContribution,
  useWithdrawFromGoal,
  useDeleteGoal,
  useAccounts,
  useProfile
} from '../hooks/useApi';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonFinancialAnalysis } from '../components/Skeleton'; // Using chart skeleton as placeholder

// Types & Utils
import { toastSuccess, toastError, toast } from '../utils/toast';
import { SavingsGoal } from '../types';

/* ==================================================================================
   SUB-COMPONENT: GOAL CARD
   ================================================================================== */
const GoalCard = ({
  goal,
  onSelect,
  onEdit,
  onDelete,
  formatCurrency
}: {
  goal: SavingsGoal;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatCurrency: (val: number) => string;
}) => {
  // Calculo Seguro
  const current = goal.currentAmount ?? 0;
  const target = goal.targetAmount || 1;
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));

  // Status Logic
  const isCompleted = percentage >= 100;
  const remaining = Math.max(0, target - current);

  // Dynamic styles based on completion
  const barColor = goal.color || '#10B981';

  return (
    <SwipeableItem
      leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
      onSwipeRight={onEdit}
      rightAction={{ icon: 'delete', color: '#F43F5E', label: 'Borrar' }}
      onSwipeLeft={onDelete}
      className="mb-4 rounded-3xl"
    >
      <div
        onClick={onSelect}
        className="group bento-card p-5 relative overflow-hidden bg-app-surface border border-app-border cursor-pointer hover:border-app-primary/30 active:scale-[0.99] transition-all shadow-sm"
      >
        {/* Background Decoration (Progress based tint) */}
        <div
          className="absolute left-0 bottom-0 top-0 opacity-[0.03] transition-all duration-700"
          style={{ backgroundColor: barColor, width: `${percentage}%` }}
        />

        <div className="relative z-10 flex justify-between items-start mb-5">
          <div className="flex items-start gap-4">
            <div
              className="size-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-black/5"
              style={{ backgroundColor: `${barColor}15`, color: barColor }}
            >
              <span className="material-symbols-outlined">{goal.icon || 'savings'}</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-app-text leading-tight group-hover:text-app-primary transition-colors">
                {goal.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {isCompleted ? (
                  <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">check</span>
                    Completada
                  </span>
                ) : (
                  <p className="text-xs text-app-muted font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'Sin plazo'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="font-black text-lg text-app-text font-numbers tracking-tight">
              {formatCurrency(current)}
            </p>
            <p className="text-[10px] text-app-muted font-bold uppercase tracking-wide opacity-80">
              Meta: {formatCurrency(target)}
            </p>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="relative z-10 space-y-2">
          <div className="h-3 w-full bg-app-subtle rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${percentage}%`, backgroundColor: barColor }}
            >
              {/* Shiny effect on bar */}
              <div className="absolute top-0 left-0 bottom-0 w-full bg-linear-to-b from-white/20 to-transparent" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] font-bold">
            <span style={{ color: barColor }}>
              {percentage.toFixed(1)}% Ahorrado
            </span>
            {!isCompleted && (
              <span className="text-app-muted font-medium">Faltan {formatCurrency(remaining)}</span>
            )}
          </div>
        </div>
      </div>
    </SwipeableItem>
  );
};

/* ==================================================================================
   SUB-COMPONENT: DETAIL & TRANSACTION SHEET
   ================================================================================== */
const GoalDetailSheet = ({ goal, onClose }: { goal: SavingsGoal, onClose: () => void }) => {
  // Hooks for sheet logic
  const { data: accounts } = useAccounts();
  const contributeMutation = useAddGoalContribution();
  const withdrawMutation = useWithdrawFromGoal();
  const deleteMutation = useDeleteGoal();
  const { openGoalSheet } = useGlobalSheets();
  const { data: profile } = useProfile();

  // Local state
  const [action, setAction] = useState<'view' | 'contribute' | 'withdraw'>('view');
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');

  const liquidAccounts = useMemo(() =>
    accounts?.filter(a => ['DEBIT', 'CASH', 'SAVINGS'].includes(a.type)) || []
    , [accounts]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: profile?.currency || 'USD'
  }).format(val);

  /* Actions Handlers */
  const handleTransaction = async () => {
    if (!amount || !sourceAccountId) return;
    const val = parseFloat(amount);
    if (val <= 0) return toastError('Monto inválido');

    try {
      if (action === 'contribute') {
        await contributeMutation.mutateAsync({
          id: goal.id,
          amount: val,
          sourceAccountId,
          notes: 'Aportación manual'
        });
        toastSuccess('¡Aportación guardada! 🎉');
      } else {
        if (val > goal.currentAmount) return toastError('Fondos insuficientes en la meta');

        await withdrawMutation.mutateAsync({
          id: goal.id,
          amount: val,
          targetAccountId: sourceAccountId
        });
        toastSuccess('Retiro realizado');
      }
      onClose(); // Cerrar todo tras éxito
    } catch (error) {
      toastError('Error al procesar transacción');
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres borrar esta meta?')) return;

    try {
      await deleteMutation.mutateAsync(goal.id);
      toastSuccess('Meta eliminada');
      onClose();
    } catch (e) { toastError('No se pudo borrar'); }
  };

  /* Rendering */
  return (
    <SwipeableBottomSheet isOpen={true} onClose={onClose}>
      <div className="pt-2 pb-6 px-4">

        {/* VIEW MODE: RESUME & HISTORY */}
        {action === 'view' && (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8 relative">
              <div
                className="size-24 mx-auto rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-white/20 backdrop-blur-md"
                style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
              >
                <span className="material-symbols-outlined text-5xl drop-shadow-sm">{goal.icon || 'savings'}</span>
              </div>
              <h2 className="text-2xl font-black text-app-text tracking-tight mb-1">{goal.name}</h2>
              <p className="text-sm font-bold text-app-muted">
                {formatCurrency(goal.currentAmount)} <span className="font-normal opacity-60">de</span> {formatCurrency(goal.targetAmount)}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setAction('contribute')}
                className="h-14 bg-app-text text-app-bg rounded-2xl font-bold flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg mb-0.5">add</span>
                <span className="text-xs uppercase tracking-widest">Aportar</span>
              </button>
              <button
                onClick={() => setAction('withdraw')}
                className="h-14 bg-app-surface text-app-text border border-app-border rounded-2xl font-bold flex flex-col items-center justify-center hover:bg-app-subtle active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-lg mb-0.5">remove</span>
                <span className="text-xs uppercase tracking-widest">Retirar</span>
              </button>
            </div>

            {/* Contributions History (Mini List) */}
            <div className="mb-8">
              <h3 className="text-xs font-bold text-app-muted uppercase mb-3 pl-1">Actividad Reciente</h3>
              {goal.contributions?.length ? (
                <div className="bg-app-subtle/40 rounded-2xl p-1 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {goal.contributions.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-app-surface border border-app-border/50">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-app-text truncate max-w-[120px]">{c.notes || 'Aportación'}</p>
                          <p className="text-[10px] text-app-muted">{new Date(c.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs font-black font-numbers text-emerald-600 dark:text-emerald-400">+{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-app-muted italic bg-app-subtle rounded-2xl border border-dashed border-app-border">Sin movimientos registrados</p>
              )}
            </div>

            {/* Footer Options */}
            <div className="grid grid-cols-2 gap-3 border-t border-app-border pt-4">
              <button onClick={() => { onClose(); openGoalSheet(goal); }} className="text-xs font-bold text-app-primary py-3 hover:underline">Editar Detalles</button>
              <button onClick={handleDelete} className="text-xs font-bold text-rose-500 py-3 hover:underline">Eliminar Meta</button>
            </div>
          </div>
        )}

        {/* TRANSACTION FORM MODE */}
        {action !== 'view' && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setAction('view')} className="size-10 rounded-full bg-app-subtle flex items-center justify-center hover:bg-app-border transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </button>
              <div>
                <h2 className="text-lg font-bold text-app-text leading-none mb-1">
                  {action === 'contribute' ? 'Aportar a Meta' : 'Retirar Fondos'}
                </h2>
                <p className="text-xs text-app-muted font-medium">{goal.name}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Amount Input */}
              <div className="bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm focus-within:ring-2 focus-within:ring-app-primary/50 transition-shadow">
                <label className="text-[10px] uppercase font-bold text-app-muted tracking-wider block mb-2">Monto</label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl text-app-muted font-light">$</span>
                  <input
                    type="number"
                    autoFocus
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-3xl font-black text-app-text bg-transparent outline-none font-numbers placeholder:text-app-border"
                  />
                </div>
              </div>

              {/* Source Select */}
              <div className="bg-app-surface p-4 rounded-2xl border border-app-border shadow-sm">
                <label className="text-[10px] uppercase font-bold text-app-muted tracking-wider block mb-2">
                  {action === 'contribute' ? 'Retirar desde cuenta' : 'Depositar en cuenta'}
                </label>
                <select
                  value={sourceAccountId}
                  onChange={e => setSourceAccountId(e.target.value)}
                  className="w-full bg-app-subtle h-12 px-3 rounded-xl text-sm font-bold text-app-text outline-none focus:ring-2 focus:ring-app-primary"
                >
                  <option value="">Seleccionar Cuenta...</option>
                  {liquidAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTransaction}
                disabled={!amount || !sourceAccountId || parseFloat(amount) <= 0}
                className={`w-full h-14 rounded-2xl font-bold text-white shadow-lg active:scale-95 transition-all mt-4
                                     ${action === 'contribute' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-app-primary shadow-blue-500/20'} 
                                     disabled:opacity-50 disabled:scale-100 disabled:shadow-none
                                  `}
              >
                Confirmar {action === 'contribute' ? 'Aportación' : 'Retiro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </SwipeableBottomSheet>
  );
};

/* ==================================================================================
   MAIN COMPONENT: GOALS LIST
   ================================================================================== */
const GoalsPage: React.FC = () => {
  // Hooks
  const { data: goals, isLoading } = useGoals();
  const { data: profile } = useProfile();
  const { openGoalSheet } = useGlobalSheets();
  const deleteMutation = useDeleteGoal();
  const [searchParams] = useSearchParams();

  // Local State
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Initial Trigger
  useEffect(() => {
    if (searchParams.get('action') === 'new') openGoalSheet();
  }, [searchParams, openGoalSheet]);

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: profile?.currency || 'USD'
  }).format(val);

  const totalSaved = useMemo(() => goals?.reduce((s, g) => s + g.currentAmount, 0) || 0, [goals]);

  /* Delete Logic from Swipe */
  const handleSwipeDelete = (goal: SavingsGoal) => {
    toast.custom((t) => (
      <div className="flex flex-col gap-3 min-w-[260px] bg-app-surface border border-app-border p-4 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <span className="font-bold text-sm text-app-text">¿Borrar "{goal.name}"?</span>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t);
              await deleteMutation.mutateAsync(goal.id);
            }}
            className="flex-1 px-3 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            Sí, borrar
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 px-3 py-2 bg-app-subtle text-app-text border border-app-border rounded-xl text-xs font-bold active:scale-95 transition-transform"
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  if (isLoading) return (
    <div className="min-h-dvh bg-app-bg pb-20">
      <PageHeader title="Metas" />
      <div className="p-4"><SkeletonFinancialAnalysis /></div> {/* Fallback to existing skeleton */}
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg pb-safe md:pb-12 text-app-text font-sans">

      {/* 1. HERO HEADER */}
      <PageHeader
        title="Mis Metas"
        showBackButton
        rightAction={
          <button onClick={() => openGoalSheet()} className="text-app-primary hover:bg-app-primary/10 size-9 rounded-full flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined">add_circle</span>
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-4 pt-4 pb-20 space-y-8 animate-fade-in">

        {/* 2. TOTAL SAVINGS HERO (Wallet Card Style) */}
        <div className="relative overflow-hidden bg-linear-to-br from-teal-500 to-emerald-600 rounded-[32px] p-6 sm:p-8 text-white shadow-2xl shadow-emerald-500/30 transform transition-transform hover:scale-[1.01]">
          {/* Decorators */}
          <div className="absolute top-0 right-0 size-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Ahorrado</p>
            <h2 className="text-5xl font-black tracking-tight mb-2 drop-shadow-md">
              {formatCurrency(totalSaved)}
            </h2>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold mt-2 border border-white/10">
              <span className="material-symbols-outlined text-sm">savings</span>
              <span>{goals?.length || 0} metas activas</span>
            </div>
          </div>
        </div>

        {/* 3. GOALS GRID/LIST */}
        <div>
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Tus Alcancías</h3>
            {/* Could add filters here later */}
          </div>

          <div className="space-y-4">
            {goals && goals.length > 0 ? (
              goals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onSelect={() => setSelectedGoal(goal)}
                  onEdit={() => openGoalSheet(goal)}
                  onDelete={() => handleSwipeDelete(goal)}
                  formatCurrency={formatCurrency}
                />
              ))
            ) : (
              <div className="py-16 text-center border-2 border-dashed border-app-border rounded-3xl opacity-60 flex flex-col items-center">
                <div className="size-16 rounded-full bg-app-subtle flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-4xl text-app-muted">account_balance_wallet</span>
                </div>
                <p className="font-bold text-app-text">Sin Metas Definidas</p>
                <p className="text-xs text-app-muted mb-4 max-w-[200px]">Crea una meta para vacaciones, emergencias o compras grandes.</p>
                <button onClick={() => openGoalSheet()} className="text-app-primary text-xs font-bold uppercase tracking-wider hover:underline">
                  + Crear Primera Meta
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. DETAIL SHEET MODAL */}
        {selectedGoal && (
          <GoalDetailSheet
            goal={selectedGoal}
            onClose={() => setSelectedGoal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default GoalsPage;