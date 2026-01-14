import React from 'react';
import { Category } from '../types';
import { getValidIcon } from '../utils/icons';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
  isLoading = false,
  className = '',
}) => {

  /* SKELETON STATE */
  if (isLoading) {
    return (
      <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse flex flex-col items-center gap-2 p-3">
            <div className="size-14 rounded-2xl bg-app-subtle" />
            <div className="h-2.5 w-12 bg-app-subtle rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  /* EMPTY STATE */
  if (!categories || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-app-subtle/30 rounded-2xl border border-dashed border-app-border text-center">
        <span className="material-symbols-outlined text-app-muted text-3xl mb-2 opacity-50">category_search</span>
        <p className="text-xs text-app-muted font-medium">Sin categorías disponibles</p>
      </div>
    );
  }

  /* MAIN GRID */
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-safe-offset-2 ${className}`}>
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`
              relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-200 outline-none select-none
              ${isSelected ? 'bg-app-primary/5 -translate-y-1' : 'hover:bg-app-subtle/50 active:scale-95'}
            `}
          >
            {/* Icon Box */}
            <div
              className={`
                size-14 rounded-2xl flex items-center justify-center text-[26px] shadow-sm transition-all
                ${isSelected ? 'shadow-md scale-105' : 'border border-black/5 dark:border-white/5'}
              `}
              style={{
                backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                color: isSelected ? '#FFFFFF' : cat.color,
                boxShadow: isSelected ? `0 8px 16px -4px ${cat.color}60` : undefined
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{getValidIcon(cat.icon)}</span>
            </div>

            {/* Label */}
            <span className={`
                text-[10px] text-center w-full truncate font-medium transition-colors
                ${isSelected ? 'text-app-text font-bold' : 'text-app-muted'}
            `}>
              {cat.name}
            </span>

            {/* Selection Checkmark Badge (Optional Polish) */}
            {isSelected && (
              <div className="absolute top-2 right-2 size-4 bg-app-surface rounded-full flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[12px]" style={{ color: cat.color }}>check</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategorySelector;