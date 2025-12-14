import React from 'react';

interface IconSelectorProps {
  icons: string[];
  selectedIcon: string;
  selectedColor: string;
  onSelect: (icon: string) => void;
  columns?: 6 | 7 | 8;
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  icons,
  selectedIcon,
  selectedColor,
  onSelect,
  columns = 7,
}) => {
  const gridCols = {
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-1.5 bg-app-elevated p-2 rounded-xl border border-app-border max-h-48 overflow-y-auto`}>
      {icons.map(icon => {
        const isSelected = selectedIcon === icon;

        return (
          <button
            type="button"
            key={icon}
            onClick={() => onSelect(icon)}
            className={`
              aspect-square rounded-xl flex items-center justify-center
              transition-all duration-200 ease-out
              ${isSelected
                ? 'shadow-lg scale-105 ring-2 ring-white/50'
                : 'hover:bg-app-card hover:scale-105 active:scale-95'
              }
            `}
            style={{
              backgroundColor: isSelected ? selectedColor : 'transparent',
              color: isSelected ? 'white' : undefined,
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{
                fontVariationSettings: isSelected ? '"FILL" 1, "wght" 500' : '"FILL" 0, "wght" 400'
              }}
            >
              {icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default IconSelector;
