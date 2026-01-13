import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal, useAddGoalContribution, useWithdrawFromGoal, useAccounts, useProfile } from '../hooks/useApi';
import { toastSuccess, toastError } from '../utils/toast';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { SavingsGoal } from '../types';
import { useGlobalSheets } from '../context/GlobalSheetContext';

const GoalCard = ({ goal, onSelect }: { goal: SavingsGoal, onSelect: () => void }) => {
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

  return (
    <div
      onClick={onSelect}
      className="bg-app-surface border border-app-border rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full flex items-center justify-center bg-app-subtle text-app-primary" style={{ backgroundColor: `${goal.color || '#10B981'}20`, color: goal.color || '#10B981' }}>
            <span className="material-symbols-outlined">{goal.icon || 'savings'}</span>
          </div>
          <div>
            <h3 className="font-bold text-app-text text-sm">{goal.name}</h3>
            <p className="text-xs text-app-muted">
              {goal.deadline ? `Meta: ${new Date(goal.deadline).toLocaleDateString()}` : 'Sin fecha límite'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-app-text">{formatCurrency(goal.currentAmount)}</p>
          <p className="text-[10px] text-app-muted">de {formatCurrency(goal.targetAmount)}</p>
        </div>
      </div>

      <div className="w-full h-2 bg-app-subtle rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: goal.color || '#10B981'
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] items-center">
        <span className="font-bold" style={{ color: goal.color || '#10B981' }}>{progress.toFixed(1)}%</span>
        <span className="text-app-muted">{formatCurrency(goal.targetAmount - goal.currentAmount)} restantes</span>
      </div>
    </div>
  );
};

// ... imports
import { GoalForm } from '../components/forms/GoalForm';

const GoalDetailSheet = ({ goal, onClose }: { goal: SavingsGoal, onClose: () => void }) => {
  const { data: accounts } = useAccounts();
  const contributeMutation = useAddGoalContribution();
  const withdrawMutation = useWithdrawFromGoal();
  const deleteMutation = useDeleteGoal();
  const { openGoalSheet } = useGlobalSheets();

  // Actions: 'view', 'contribute', 'withdraw'
  const [action, setAction] = useState<'view' | 'contribute' | 'withdraw'>('view');
  const [amount, setAmount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');

  const liquidAccounts = accounts?.filter(a => ['DEBIT', 'CASH', 'SAVINGS'].includes(a.type)) || [];

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const handleTransaction = async () => {
    if (!amount || !sourceAccountId) return;
    try {
      if (action === 'contribute') {
        await contributeMutation.mutateAsync({
          id: goal.id,
          amount: parseFloat(amount),
          sourceAccountId,
          notes: 'Aportación manual'
        });
        toastSuccess('¡Aportación exitosa!');
      } else {
        await withdrawMutation.mutateAsync({
          id: goal.id,
          amount: parseFloat(amount),
          targetAccountId: sourceAccountId
        });
        toastSuccess('Retiro exitoso');
      }
      // Reset & Close
      setAmount('');
      setAction('view');
      onClose();
    } catch (error) {
      toastError('Error en transacción');
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Eliminar esta meta? El historial se mantendrá pero la meta desaparecerá.')) {
      await deleteMutation.mutateAsync(goal.id);
      toastSuccess('Meta eliminada');
      onClose();
    }
  };

  const handleEdit = () => {
    onClose();
    openGoalSheet(goal);
  };

  return (
    <SwipeableBottomSheet isOpen={true} onClose={onClose}>
      {action === 'view' ? (
        <>
          <div className="text-center mb-6">
            <div className="size-20 mx-auto rounded-full flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20" style={{ backgroundColor: `${goal.color}20`, color: goal.color }}>
              <span className="material-symbols-outlined text-4xl">{goal.icon}</span>
            </div>
            <h2 className="text-xl font-bold text-app-text">{goal.name}</h2>
            <div className="flex justify-center gap-2 mt-2 items-baseline">
              <span className="text-2xl font-black text-app-text tracking-tight">{formatCurrency(goal.currentAmount)}</span>
              <span className="text-sm text-app-muted font-medium">/ {formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setAction('contribute')}
              className="bg-emerald-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Aportar
            </button>
            <button
              onClick={() => setAction('withdraw')}
              className="bg-app-surface text-app-text border border-app-border py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">payments</span>
              Retirar
            </button>
          </div>

          <div className="border-t border-app-border pt-4">
            <h3 className="text-xs font-bold text-app-muted uppercase mb-3">Historial Reciente</h3>
            {goal.contributions?.length === 0 ? (
              <p className="text-center text-sm text-app-muted py-4">Sin aportaciones aún</p>
            ) : (
              <div className="space-y-3">
                {goal.contributions?.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-xs">arrow_upward</span>
                      </div>
                      <div>
                        <p className="font-medium text-app-text">{c.notes || 'Aportación'}</p>
                        <p className="text-xs text-app-muted">{new Date(c.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleEdit}
              className="flex-1 py-3 rounded-xl text-app-text border border-app-border font-bold text-sm bg-app-surface"
            >
              Editar Info
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-3 rounded-xl text-rose-500 font-bold text-sm bg-rose-50 dark:bg-rose-900/10"
            >
              Eliminar Meta
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setAction('view')} className="size-8 rounded-full bg-app-subtle flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </button>
            <h2 className="text-lg font-bold text-app-text">
              {action === 'contribute' ? 'Nueva Aportación' : 'Retirar Fondos'}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase font-bold text-app-muted mb-1 block">Monto</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-app-subtle border border-app-border rounded-xl p-3 pl-8 text-app-text outline-none focus:border-app-primary font-bold text-lg"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-app-muted mb-1 block">
                {action === 'contribute' ? 'Origen de Fondos' : 'Destino de Fondos'}
              </label>
              <select
                value={sourceAccountId}
                onChange={e => setSourceAccountId(e.target.value)}
                className="w-full bg-app-subtle border border-app-border rounded-xl p-3 text-app-text outline-none focus:border-app-primary"
              >
                <option value="">Seleccionar cuenta...</option>
                {liquidAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${formatCurrency(acc.balance)})</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleTransaction}
              disabled={!amount || !sourceAccountId}
              className={`w-full py-3 rounded-xl font-bold mt-4 text-white disabled:opacity-50 disabled:cursor-not-allowed ${action === 'contribute' ? 'bg-emerald-500' : 'bg-app-primary'}`}
            >
              Confirmar {action === 'contribute' ? 'Aportación' : 'Retiro'}
            </button>
          </div>
        </>
      )}
    </SwipeableBottomSheet>
  );
};

const GoalsPage = () => {
  const { data: goals, isLoading } = useGoals();
  const { data: profile } = useProfile();
  const { openGoalSheet } = useGlobalSheets();
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openGoalSheet();
    }
  }, [searchParams, openGoalSheet]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: profile?.currency || 'USD' }).format(val);

  const totalSaved = goals?.reduce((sum, g) => sum + g.currentAmount, 0) || 0;

  if (isLoading) return <div className="p-8 text-center">Cargando metas...</div>;

  return (
    <div className="min-h-dvh bg-app-bg pb-24">
      <PageHeader title="Metas de Ahorro" showBackButton={true} />

      <div className="max-w-3xl mx-auto px-4 pt-4">
        {/* Summary Card */}
        <div className="bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20 mb-6">
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Ahorro Total</p>
          <h2 className="text-3xl font-black tracking-tight">{formatCurrency(totalSaved)}</h2>
          <p className="text-emerald-100 text-sm mt-1 opacity-80">{goals?.length || 0} metas activas</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-app-text">Mis Metas</h3>
          <button
            onClick={() => openGoalSheet()}
            className="text-app-primary text-xs font-bold flex items-center gap-1 hover:bg-app-primary/10 px-2 py-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Nueva Meta
          </button>
        </div>

        <div className="space-y-3">
          {goals?.map(goal => (
            <GoalCard key={goal.id} goal={goal} onSelect={() => setSelectedGoal(goal)} />
          ))}
          {(!goals || goals.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-app-border rounded-xl">
              <span className="material-symbols-outlined text-4xl text-app-muted mb-2">savings</span>
              <p className="text-app-muted text-sm">No tienes metas de ahorro.</p>
              <button onClick={() => openGoalSheet()} className="text-app-primary font-bold text-sm mt-2">Crear primera meta</button>
            </div>
          )}
        </div>
      </div>

      {selectedGoal && <GoalDetailSheet goal={selectedGoal} onClose={() => setSelectedGoal(null)} />}
    </div>
  );
};

export default GoalsPage;
