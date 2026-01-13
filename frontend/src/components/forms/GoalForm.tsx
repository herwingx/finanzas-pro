import React, { useState } from 'react';
import { useAddGoal } from '../../hooks/useApi';
import { toastSuccess, toastError } from '../../utils/toast';

export const GoalForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const addGoalMutation = useAddGoal();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('savings');
  const [color, setColor] = useState('#10B981');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addGoalMutation.mutateAsync({
        name,
        targetAmount: parseFloat(targetAmount),
        deadline: deadline || undefined,
        icon,
        color
      });
      toastSuccess('Meta creada');
      onClose();
    } catch (error) {
      toastError('Error al crear meta');
    }
  };

  return (
    <>
      <h2 className="text-lg font-bold text-app-text mb-4 text-center">Nueva Meta de Ahorro</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase font-bold text-app-muted mb-1 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-app-subtle border border-app-border rounded-xl p-3 text-app-text outline-none focus:border-app-primary"
            placeholder="Ej. Viaje a Japón"
            required
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs uppercase font-bold text-app-muted mb-1 block">Monto Objetivo</label>
          <input
            type="number"
            value={targetAmount}
            onChange={e => setTargetAmount(e.target.value)}
            className="w-full bg-app-subtle border border-app-border rounded-xl p-3 text-app-text outline-none focus:border-app-primary"
            placeholder="0.00"
            required
          />
        </div>
        <div>
          <label className="text-xs uppercase font-bold text-app-muted mb-1 block">Fecha Límite (Opcional)</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full bg-app-subtle border border-app-border rounded-xl p-3 text-app-text outline-none focus:border-app-primary"
          />
        </div>
        <button type="submit" disabled={addGoalMutation.isPending} className="w-full btn btn-primary py-3 rounded-xl mt-4">
          {addGoalMutation.isPending ? 'Creando...' : 'Crear Meta'}
        </button>
      </form>
    </>
  );
};
