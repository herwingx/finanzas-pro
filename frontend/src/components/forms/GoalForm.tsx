import React, { useState, useEffect } from 'react';
import { useAddGoal, useUpdateGoal } from '../../hooks/useApi';
import { toastSuccess, toastError, toast } from '../../utils/toast';
import { SavingsGoal } from '../../types';

// Components
import { DatePicker } from '../DatePicker';
import { IconSelector } from '../IconSelector';
import { VALID_ICONS } from '../../utils/icons';

interface GoalFormProps {
  existingGoal?: SavingsGoal | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

// Colors Set for Goals
const GOAL_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F43F5E', '#8B5CF6', '#EC4899', '#6366F1'];

export const GoalForm: React.FC<GoalFormProps> = ({ existingGoal, onClose, isSheetMode = false }) => {
  const isEditing = !!existingGoal;
  const addMutation = useAddGoal();
  const updateMutation = useUpdateGoal();

  // State
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [icon, setIcon] = useState('savings');
  const [color, setColor] = useState('#10B981');

  // Hydrate
  useEffect(() => {
    if (existingGoal) {
      setName(existingGoal.name);
      setTarget(String(existingGoal.targetAmount));
      if (existingGoal.deadline) setDeadline(new Date(existingGoal.deadline));
      else setDeadline(undefined); // Reset deadline if goal has none
      setIcon(existingGoal.icon || 'savings');
      setColor(existingGoal.color || '#10B981');
    }
  }, [existingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(target);
    if (!name || val <= 0) return toastError('Datos inválidos');

    const payload = {
      name,
      targetAmount: val,
      // Fix: Send null instead of undefined to ensure backend clears the date
      deadline: deadline ? deadline.toISOString() : null,
      icon,
      color
    };

    try {
      if (isEditing && existingGoal) {
        // Fix: Spread payload to avoid nesting it under 'goal' property
        await updateMutation.mutateAsync({ id: existingGoal.id, ...payload });
        toastSuccess('Meta actualizada');
      } else {
        await addMutation.mutateAsync(payload);
        toastSuccess('Nueva alcancía creada');
      }
      onClose();
    } catch (e) { toastError('Error guardando'); }
  };

  const pageTitle = isEditing ? 'Editar Meta' : 'Nueva Alcancía';
  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="flex justify-between items-center mb-6 pt-2">
        <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
        <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
        <div className="w-12" />
      </div>

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col space-y-4">

          {/* 1. HERO VISUALS & AMOUNT */}
          <div className="flex flex-col items-center shrink-0">
            {/* Icon Circle */}
            <div
              className="size-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-all shadow-lg border-4 border-app-surface group cursor-pointer active:scale-95"
              style={{ backgroundColor: color, color: '#fff', boxShadow: `0 8px 20px -6px ${color}60` }}
              onClick={() => { const icons = VALID_ICONS; const idx = icons.indexOf(icon as any); const nextIdx = (idx + 1) % icons.length; setIcon(icons[nextIdx]); }}
            >
              <span className="material-symbols-outlined select-none">{icon}</span>
            </div>

            {/* Color Dots */}
            <div className="flex gap-2 mb-4 p-1.5 bg-app-subtle border border-app-border rounded-full">
              {GOAL_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-6 rounded-full transition-transform ${color === c ? 'scale-110 ring-2 ring-white dark:ring-black shadow-sm' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Target Amount Input */}
            <div className="relative">
              <span className="absolute -left-3 top-2 text-xl font-light text-app-muted opacity-50">$</span>
              <input
                type="number" step="0.01" inputMode="decimal"
                value={target} onChange={e => setTarget(e.target.value)}
                placeholder="0.00"
                className="w-40 bg-transparent text-center text-4xl font-black text-app-text outline-none placeholder:text-app-muted/20 py-1"
              />
            </div>
          </div>

          {/* 2. FORM FIELDS */}
          <div className="flex-1 overflow-y-auto space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Nombre de la Meta</label>
              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej. Viaje Japón, Coche Nuevo" autoFocus={!isEditing}
                  className="w-full bg-transparent text-sm font-bold text-app-text outline-none placeholder:text-app-muted/60"
                />
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-bold ml-1 mb-1 block uppercase tracking-wide opacity-70 ${deadline ? 'text-app-primary' : 'text-app-text'}`}>
                Fecha Límite (Opcional)
              </label>
              <div className="flex gap-2">
                <DatePicker
                  date={deadline}
                  placeholder="Sin fecha definida"
                  onDateChange={setDeadline}
                  className={`bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle flex-1 ${!deadline && 'text-app-muted font-normal'}`}
                />
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline(undefined)}
                    className="size-11 rounded-xl border border-app-border flex items-center justify-center text-app-muted hover:bg-rose-50 hover:text-rose-500 transition-colors bg-app-surface shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pb-2">
              <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Icono</label>
              <IconSelector
                icons={[...VALID_ICONS]}
                selectedIcon={icon}
                selectedColor={color}
                onSelect={setIcon}
                className="max-h-[160px]"
              />
            </div>
          </div>

          {/* 3. FOOTER */}
          <div className="pt-2 pb-10 mt-auto shrink-0 touch-none">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-app-primary text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Alcancía'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};