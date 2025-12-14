import React from 'react';
import { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: 3 | 4 | 5;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedId,
  onSelect,
  isLoading = false,
  emptyMessage = 'No hay categorías disponibles',
  columns = 4,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 p-3 animate-pulse">
            <div className="size-12 rounded-full bg-app-elevated" />
            <div className="h-2 w-10 bg-app-elevated rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="size-16 mx-auto mb-3 rounded-full bg-app-elevated flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-app-muted">category</span>
        </div>
        <p className="text-sm text-app-muted">{emptyMessage}</p>
      </div>
    );
  }

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-3 sm:grid-cols-4',
    5: 'grid-cols-3 sm:grid-cols-5',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-2`}>
      {categories.map(cat => {
        const isSelected = selectedId === cat.id;

        return (
          <button
            type="button"
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl
              transition-all duration-200 ease-out
              ${isSelected
                ? 'bg-gradient-to-br from-app-primary/15 to-app-secondary/10 ring-2 ring-app-primary shadow-lg scale-[1.02]'
                : 'bg-app-card hover:bg-app-elevated active:scale-95'
              }
            `}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 size-5 bg-app-primary rounded-full flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-xs" style={{ fontSize: '12px' }}>check</span>
              </div>
            )}

            {/* Icon container */}
            <div
              className={`
                size-11 rounded-xl flex items-center justify-center
                transition-all duration-200
                ${isSelected ? 'shadow-md' : 'shadow-sm'}
              `}
              style={{
                backgroundColor: isSelected ? cat.color : `${cat.color}15`,
                color: isSelected ? 'white' : cat.color,
              }}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={{
                  fontVariationSettings: isSelected ? '"FILL" 1, "wght" 500' : '"FILL" 0, "wght" 400'
                }}
              >
                {cat.icon}
              </span>
            </div>

            {/* Label */}
            <span
              className={`
                text-[10px] font-semibold truncate w-full text-center leading-tight
                ${isSelected ? 'text-app-primary' : 'text-app-muted'}
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
