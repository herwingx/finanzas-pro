import React from 'react';
import { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
  isLoading = false,
  emptyMessage = 'No hay categorías disponibles',
  className = '',
}) => {
  // Loading Skeleton
  if (isLoading) {
    return (
      <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 ${className}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-4 bg-app-surface border border-transparent rounded-2xl animate-pulse">
            <div className="size-10 rounded-full bg-app-subtle" />
            <div className="h-2 w-16 bg-app-subtle rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (!categories || categories.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-3xl bg-app-subtle/20">
        <div className="size-12 mb-3 rounded-xl bg-app-subtle flex items-center justify-center text-app-muted">
          <span className="material-symbols-outlined text-2xl">category</span>
        </div>
        <p className="text-sm font-medium text-app-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 ${className}`}>
      {categories.map((cat) => {
        const isSelected = selectedId === cat.id;

        return (
          <button
            type="button" // Important so it doesn't submit forms
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              group relative flex flex-col items-center gap-2 p-3 rounded-2xl
              transition-all duration-200 outline-none
              ${isSelected
                ? 'bg-app-primary/5 ring-2 ring-inset ring-app-primary shadow-sm'
                : 'bg-app-surface border border-app-border hover:bg-app-subtle hover:border-app-border-dark active:scale-95'
              }
            `}
          >
            {/* Icon Container */}
            <div
              className={`
                size-12 rounded-xl flex items-center justify-center
                transition-transform duration-200 group-hover:scale-110
              `}
              style={{
                // Fondo con opacidad para ambos estados, se ve más nativo
                backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                color: isSelected ? '#FFFFFF' : cat.color,
                boxShadow: isSelected ? `0 4px 12px -2px ${cat.color}60` : 'none'
              }}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{
                  // Fill icon when selected for extra visual weight
                  fontVariationSettings: isSelected ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400"
                }}
              >
                {cat.icon}
              </span>
            </div>

            {/* Label */}
            <span
              className={`
                text-[11px] font-medium truncate w-full text-center leading-snug px-1
                ${isSelected ? 'text-app-primary font-bold' : 'text-app-text group-hover:text-app-text'}
              `}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategorySelector;