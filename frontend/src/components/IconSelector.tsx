import React from 'react';

interface IconSelectorProps {
  icons: string[];
  selectedIcon: string;
  selectedColor: string; // Esperamos un valor HEX o Var CSS
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
  return (
    <div
      className={`
        bg-app-bg border border-app-border rounded-xl p-2
        max-h-[220px] overflow-y-auto custom-scrollbar
        ${className}
      `}
    >
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {icons.map((icon) => {
          const isSelected = selectedIcon === icon;

          return (
            <button
              type="button"
              key={icon}
              onClick={() => onSelect(icon)}
              className={`
                group relative aspect-square rounded-lg flex items-center justify-center
                transition-all duration-300
                outline-none focus-visible:ring-2 focus-visible:ring-offset-1
                ${isSelected
                  ? 'shadow-md scale-100 z-10'
                  : 'hover:bg-app-elevated hover:text-app-text text-app-muted active:scale-95'
                }
              `}
              style={{
                backgroundColor: isSelected ? selectedColor : 'transparent',
                color: isSelected ? '#FFFFFF' : undefined,
                // Si está seleccionado, añadimos un anillo del mismo color para dar profundidad
                boxShadow: isSelected ? `0 4px 10px -2px ${selectedColor}80` : 'none',
              }}
              aria-label={`Seleccionar icono ${icon}`}
              aria-pressed={isSelected}
            >
              {/* Animación de Material Symbol Fill */}
              <span
                className="material-symbols-outlined text-[22px] transition-transform duration-300"
                style={{
                  fontVariationSettings: isSelected
                    ? "'FILL' 1, 'wght' 600" // Más grueso y relleno al seleccionar
                    : "'FILL' 0, 'wght' 400",
                  // Pequeño zoom al seleccionar o hacer hover en el grupo
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                {icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default IconSelector;