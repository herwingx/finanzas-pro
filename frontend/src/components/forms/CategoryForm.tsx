import React, { useState, useEffect } from "react";
import { useAddCategory, useUpdateCategory } from "../../hooks/useApi";
import { TransactionType, Category } from "../../types";
import { toastSuccess, toastError } from "../../utils/toast";
import { IconSelector } from "../IconSelector";
import { VALID_ICONS, getValidIcon } from "../../utils/icons";
import { ToggleGroup } from "../Button";

// -- CONSTANTS --
const PRESET_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#EC4899", "#14B8A6", "#8B5CF6", "#06B6D4"];
type BudgetType = "need" | "want" | "savings";

interface FormProps {
  existingCategory?: Category | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const CategoryForm: React.FC<FormProps> = ({ existingCategory, onClose, isSheetMode = false }) => {
  const isEditing = !!existingCategory;

  // Data
  const addM = useAddCategory();
  const updateM = useUpdateCategory();

  // State
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("category");
  const [color, setColor] = useState("#3B82F6");
  const [type, setType] = useState<TransactionType>("expense");
  const [budgetType, setBudgetType] = useState<BudgetType | undefined>(undefined);

  // Load Initial Data
  useEffect(() => {
    if (existingCategory) {
      setName(existingCategory.name);
      setIcon(existingCategory.icon);
      setColor(existingCategory.color || "#3B82F6");
      setType(existingCategory.type);
      setBudgetType(existingCategory.budgetType);
    }
  }, [existingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toastError("Nombre requerido");

    try {
      const payload = { name, icon, color, type, budgetType };

      if (isEditing && existingCategory) {
        await updateM.mutateAsync({ id: existingCategory.id, category: payload });
        toastSuccess("Categoría actualizada");
      } else {
        await addM.mutateAsync(payload);
        toastSuccess("Categoría creada");
      }
      onClose();
    } catch (e: any) { toastError(e.message || "Error al guardar"); }
  };

  const isSaving = addM.isPending || updateM.isPending;

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
        <h2 className="text-lg font-bold text-app-text">{isEditing ? 'Editar' : 'Nueva'} Categoría</h2>
        <div className="w-12" />
      </div>

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">

          <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">

            {/* 1. HERO PREVIEW */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className="size-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg border border-black/5 mb-4"
                style={{ backgroundColor: color, color: 'white', boxShadow: `0 8px 24px -6px ${color}80` }}
              >
                <span className="material-symbols-outlined">{getValidIcon(icon)}</span>
              </div>

              <ToggleGroup
                value={type}
                onChange={(v) => setType(v as TransactionType)}
                options={[{ value: 'expense', label: 'Gasto' }, { value: 'income', label: 'Ingreso' }]}
              />
            </div>

            {/* 2. BASICS */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-app-text ml-1 mb-1 block opacity-70">Nombre de Categoría</label>
                <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent text-sm font-bold text-app-text outline-none placeholder:text-app-muted/60"
                    placeholder="Ej. Restaurantes, Salario..." autoFocus={!isEditing}
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-2 block uppercase opacity-70">Color</label>
                <div className="flex flex-wrap gap-3 px-1.5 py-1">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setColor(c)}
                      className={`size-8 rounded-full transition-all ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-app-bg ring-app-text shadow-md' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative size-8 rounded-full bg-app-subtle flex items-center justify-center border border-dashed border-app-border cursor-pointer hover:bg-app-border/30 transition-colors">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                    <span className="material-symbols-outlined text-xs text-app-muted">add</span>
                  </div>
                </div>
              </div>

              {/* Icon Grid */}
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-2 block uppercase opacity-70">Icono</label>
                <IconSelector
                  icons={VALID_ICONS}
                  selectedIcon={icon}
                  onSelect={setIcon}
                  selectedColor={color}
                  className="max-h-52 bg-app-subtle"
                />
              </div>
            </div>

            {/* 3. BUDGET RULES (Expenses Only) */}
            {type === 'expense' && (
              <div className="pt-4 border-t border-app-border/50">
                <label className="text-[10px] uppercase font-bold text-app-text mb-3 block text-center opacity-70 tracking-wider">Regla 50 / 30 / 20</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'need', label: 'Necesidad', desc: '50%' },
                    { id: 'want', label: 'Deseo', desc: '30%' },
                    { id: 'savings', label: 'Ahorro', desc: '20%' }
                  ].map((rule: any) => (
                    <button
                      type="button" key={rule.id}
                      onClick={() => setBudgetType(budgetType === rule.id ? undefined : rule.id)}
                      className={`
                        flex flex-col items-center py-2.5 rounded-xl text-[10px] font-bold transition-all border
                        ${budgetType === rule.id
                          ? 'bg-app-primary border-transparent text-white shadow-lg shadow-app-primary/20'
                          : 'bg-app-subtle text-app-muted border-app-border hover:border-app-muted'}
                      `}
                    >
                      <span>{rule.label}</span>
                      <span className="opacity-60 font-medium">{rule.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="pt-4 pb-10 mt-auto shrink-0 touch-none">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-app-primary text-white text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl shadow-app-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};