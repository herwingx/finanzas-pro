import React, { useMemo } from 'react';
import { isValidIcon } from '../utils/icons';

interface IconSelectorProps {
  icons: readonly string[];
  selectedIcon: string;
  selectedColor: string;
  onSelect: (icon: string) => void;
  className?: string;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  icons,
  selectedIcon,
  selectedColor,
  onSelect,
  className = '',
}) => {
  // Asegura que el ícono actual siempre esté presente al inicio
  const displayIcons = useMemo(() => {
    if (!icons.includes(selectedIcon) && selectedIcon) return [selectedIcon, ...icons];
    return icons;
  }, [icons, selectedIcon]);

  return (
    <div className={`
        bg-app-subtle border border-app-border rounded-2xl p-2
        max-h-[220px] overflow-y-auto custom-scrollbar scroll-smooth
        ${className}
    `}>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {displayIcons.map((icon) => {
          const isSelected = selectedIcon === icon;
          // Only show 'warning' visual if the currently selected item is truly broken, not just "not in list"
          const isValid = isValidIcon(icon);

          return (
            <button
              type="button"
              key={icon}
              onClick={() => onSelect(icon)}
              className={`
                group relative aspect-square rounded-xl flex items-center justify-center
                transition-all duration-200 outline-none select-none
                ${isSelected
                  ? 'ring-2 ring-white dark:ring-black ring-offset-2 ring-offset-app-subtle shadow-md scale-100 z-10'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 opacity-70 hover:opacity-100'
                }
              `}
              style={{
                backgroundColor: isSelected ? selectedColor : undefined,
                color: isSelected ? '#fff' : 'var(--text-main)'
              }}
            >
              <span
                className="material-symbols-outlined text-[24px] transition-transform duration-300"
                style={{
                  fontVariationSettings: isSelected ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400"
                }}
              >
                {isValid ? icon : 'help'}
              </span>

              {!isValid && isSelected && (
                <span className="absolute -top-1 -right-1 size-3 bg-amber-500 rounded-full ring-2 ring-app-surface animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconSelector;