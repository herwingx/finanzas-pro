import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  content: string;
  className?: string;
  iconSize?: string;
}

/**
 * InfoTooltip - Componente de tooltip informativo que funciona en móvil y desktop.
 * En desktop muestra tooltip nativo con hover.
 * En móvil muestra un popover al hacer tap.
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  className = '',
  iconSize = '14px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <span className={`relative inline-flex items-center ${isOpen ? 'z-[9999]' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`material-symbols-outlined cursor-help text-app-muted/50 hover:text-app-muted active:text-app-text transition-colors focus:outline-none ${className}`}
        style={{ fontSize: iconSize }}
        aria-label="Información"
        title={content}
      >
        info
      </button>

      {isOpen && (
        <>
          {/* Backdrop sutil en móvil */}
          <div
            className="fixed inset-0 z-[9998] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div
            ref={tooltipRef}
            className="absolute z-[9999] left-1/2 -translate-x-1/2 top-full mt-2 
              w-[200px] max-w-[calc(100vw-32px)]
              bg-white dark:bg-zinc-800 
              border border-app-border 
              rounded-xl shadow-lg
              p-3
              animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {/* Flecha */}
            <div
              className="absolute -top-[6px] left-1/2 -translate-x-1/2 
                size-3 rotate-45 
                bg-white dark:bg-zinc-800 
                border-l border-t border-app-border"
            />

            <p className="text-xs text-app-text font-medium relative z-10">
              {content}
            </p>
          </div>
        </>
      )}
    </span>
  );
};

export default InfoTooltip;
