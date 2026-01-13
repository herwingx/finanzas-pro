import React, { useState, useEffect } from "react";
import { useAddCategory, useUpdateCategory } from "../../hooks/useApi";
import { TransactionType, Category } from "../../types";
import { toastSuccess, toastError } from "../../utils/toast";
import { ToggleButtonGroup, Button } from "../Button";
import { IconSelector } from "../IconSelector";
import { VALID_ICONS } from "../../utils/icons";

// Presets
type BudgetType = "need" | "want" | "savings";

const DEFAULT_CATEGORY_STATE = {
  name: "",
  icon: "category",
  color: "#6B5FFF",
  type: "expense" as TransactionType,
  budgetType: undefined as BudgetType | undefined,
};

const COLORS = [
  "#FF6B6B",
  "#FFD166",
  "#06D6A0",
  "#118AB2",
  "#073B4C",
  "#6B5FFF",
  "#FF9F1C",
  "#FF477E",
  "#34D399",
  "#60A5FA",
];

interface CategoryFormProps {
  existingCategory?: Category | null;
  onClose: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ existingCategory, onClose }) => {
  const isEditMode = !!existingCategory;

  // Data
  const addMutation = useAddCategory();
  const updateMutation = useUpdateCategory();

  // Form State
  const [formState, setFormState] = useState(DEFAULT_CATEGORY_STATE);

  // Load existing category data
  useEffect(() => {
    if (existingCategory) {
      setFormState({
        name: existingCategory.name,
        icon: existingCategory.icon,
        color: existingCategory.color || "#6B5FFF",
        type: existingCategory.type,
        budgetType: existingCategory.budgetType,
      });
    } else {
      setFormState(DEFAULT_CATEGORY_STATE);
    }
  }, [existingCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.name.trim()) {
      toastError("El nombre es requerido");
      return;
    }

    try {
      if (isEditMode && existingCategory) {
        await updateMutation.mutateAsync({ id: existingCategory.id, category: formState });
        toastSuccess("Categoría actualizada");
      } else {
        await addMutation.mutateAsync(formState);
        toastSuccess("Categoría creada");
      }
      onClose();
    } catch (e: any) {
      toastError(e.message);
    }
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;
  const pageTitle = isEditMode ? "Editar Categoría" : "Nueva Categoría";

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pl-5 pr-5 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="text-app-muted hover:text-app-text font-medium text-sm"
        >
          Cancelar
        </button>
        <h2 className="text-lg font-bold text-app-text text-center">{pageTitle}</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-safe">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Card */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 flex items-center gap-4">
            <div
              className="size-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all"
              style={{ backgroundColor: formState.color, color: "white" }}
            >
              <span className="material-symbols-outlined text-3xl">
                {formState.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-app-text truncate">
                {formState.name || "Nombre de categoría"}
              </p>
              <p className="text-xs text-app-muted">
                {formState.type === "expense" ? "Gasto" : "Ingreso"}
                {formState.budgetType &&
                  ` • ${formState.budgetType === "need"
                    ? "Necesidad"
                    : formState.budgetType === "want"
                      ? "Deseo"
                      : "Ahorro"
                  }`}
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="text-[10px] font-bold text-app-muted uppercase mb-1.5 block pl-1">
              Nombre
            </label>
            <input
              type="text"
              placeholder="Ej: Restaurantes"
              value={formState.name}
              onChange={(e) =>
                setFormState({ ...formState, name: e.target.value })
              }
              required
              autoFocus={!isEditMode}
              className="w-full px-4 py-3 rounded-xl bg-app-surface border border-app-border text-sm font-medium focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary outline-none transition-all text-app-text"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="text-[10px] font-bold text-app-muted uppercase mb-1.5 block pl-1">
              Tipo de transacción
            </label>
            <ToggleButtonGroup
              options={[
                { value: "expense", label: "Gastos" },
                { value: "income", label: "Ingresos" },
              ]}
              value={formState.type}
              onChange={(val) =>
                setFormState({ ...formState, type: val as TransactionType })
              }
            />
          </div>

          {/* Colors Grid */}
          <div>
            <label className="text-[10px] font-bold text-app-muted uppercase mb-2 block pl-1">
              Color
            </label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setFormState({ ...formState, color })}
                  className={`size-10 rounded-full transition-all duration-200 ${formState.color === color
                    ? "ring-2 ring-offset-2 ring-offset-app-bg ring-app-text scale-110"
                    : "hover:scale-110 active:scale-95"
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={formState.color}
                  onChange={(e) =>
                    setFormState({ ...formState, color: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="size-10 rounded-full border-2 border-dashed border-app-muted/50 flex items-center justify-center hover:border-app-muted hover:bg-app-subtle transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-app-muted">
                    add
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[10px] font-bold text-app-muted uppercase mb-2 block pl-1">
              Icono
            </label>
            <IconSelector
              icons={[...VALID_ICONS]}
              selectedIcon={formState.icon}
              onSelect={(icon) => setFormState({ ...formState, icon })}
              selectedColor={formState.color}
            />
          </div>

          {/* Budget 50/30/20 (Expenses Only) */}
          {formState.type === "expense" && (
            <div>
              <label className="text-[10px] font-bold text-app-muted uppercase mb-2 block pl-1">
                Regla 50/30/20 (Opcional)
              </label>
              <div className="flex gap-2">
                {([
                  { id: "need" as BudgetType, label: "Necesidad", desc: "50%" },
                  { id: "want" as BudgetType, label: "Deseo", desc: "30%" },
                  { id: "savings" as BudgetType, label: "Ahorro", desc: "20%" },
                ] as const).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setFormState({
                        ...formState,
                        budgetType:
                          formState.budgetType === b.id ? undefined : b.id,
                      })
                    }
                    className={`flex-1 py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${formState.budgetType === b.id
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300"
                      : "bg-app-subtle border-transparent text-app-muted hover:border-app-border"
                      }`}
                  >
                    <span className="block">{b.label}</span>
                    <span className="block text-[10px] opacity-60">
                      {b.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 pb-20 sm:pb-4">
            <Button
              type="submit"
              isLoading={isSaving}
              fullWidth
              variant="primary"
            >
              {isEditMode ? "Guardar Cambios" : "Crear Categoría"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
