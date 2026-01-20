import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';

// --- Types ---
interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode; // Flexible: string or component
  noPadding?: boolean; // Para full-bleed content (gráficos, listas largas)
}

// Custom Hook para Media Query
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(min-width: 768px)').matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return isDesktop;
};

export const SwipeableBottomSheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  noPadding = false
}) => {
  const isDesktop = useIsDesktop();
  const controls = useDragControls();
  const contentRef = useRef<HTMLDivElement>(null);
  const hasHistoryEntry = useRef(false);

  // Manejar el botón/gesto de "atrás" del navegador
  useEffect(() => {
    if (isOpen) {
      // Al abrir el sheet, agregar una entrada al historial
      if (!hasHistoryEntry.current) {
        window.history.pushState({ sheetOpen: true }, '');
        hasHistoryEntry.current = true;
      }

      // Escuchar el evento popstate (cuando el usuario presiona "atrás")
      const handlePopState = (event: PopStateEvent) => {
        if (hasHistoryEntry.current) {
          hasHistoryEntry.current = false;
          onClose();
        }
      };

      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } else {
      // Al cerrar el sheet, remover la entrada del historial si existe
      if (hasHistoryEntry.current) {
        hasHistoryEntry.current = false;
        // Solo hacemos history.back() si el sheet se cerró programáticamente
        // (no por el botón atrás, que ya movió el historial)
        // Verificamos si el estado actual es el que agregamos
        if (window.history.state?.sheetOpen) {
          window.history.back();
        }
      }
    }
  }, [isOpen, onClose]);

  // Bloquear scroll del body al abrir
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const y = info.offset.y;
    const v = info.velocity.y;
    // Si se arrastra más de 150px abajo o se lanza rápido hacia abajo -> Cerrar
    if (y > 150 || v > 400) {
      onClose();
    }
  };

  // Portal Target (aseguramos que exista en document.body)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end md:place-items-center pointer-events-auto">

          {/* 1. BACKDROP (Click to close) */}
          <motion.div
            className="absolute inset-0 bg-black/60 md:bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 2. SHEET CONTAINER */}
          <motion.div
            className={`
               bg-app-surface w-full overflow-hidden flex flex-col shadow-2xl
               will-change-transform backface-hidden transform-gpu
               rounded-t-[2.5rem] border-t border-white/10 max-h-[92dvh]
               md:w-full md:max-w-xl md:h-auto md:max-h-[85vh] md:rounded-3xl md:border md:border-app-border
            `}
            initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: "100%" }}
            animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 350, mass: 0.8 }}
            // Gestures para cerrar deslizando en Móvil
            drag={!isDesktop ? "y" : false}
            dragControls={controls}
            dragListener={false} // Usar el "handle" explícito para iniciar drag
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05 }} // Poca elasticidad arriba, mucha abajo
            onDragEnd={handleDragEnd}
          >
            {/* --- HEADER / HANDLE --- */}
            {/* Área sensible al tacto para arrastrar en móvil */}
            <div
              className={`shrink-0 pt-4 pb-2 bg-app-surface z-10 touch-none relative ${!isDesktop ? 'cursor-grab active:cursor-grabbing' : ''}`}
              onPointerDown={(e) => !isDesktop && controls.start(e)}
            >
              {/* Desktop Close Button (Floating) */}
              {isDesktop && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-app-subtle text-app-text rounded-full hover:bg-app-elevated hover:scale-105 active:scale-95 transition-all duration-200 border border-app-border shadow-sm group"
                  aria-label="Cerrar"
                >
                  <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-300">close</span>
                </button>
              )}

              {/* Mobile Pill Handle */}
              <div className={`w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mb-4 ${isDesktop ? 'hidden' : 'block'}`} />

              {/* Optional Title in Sheet */}
              {title && (
                <div className={`px-6 pb-2 text-center md:text-left ${isDesktop ? 'md:pr-14' : ''}`}>
                  {typeof title === 'string' ? (
                    <h3 className="text-xl font-bold text-app-text">{title}</h3>
                  ) : (
                    title
                  )}
                </div>
              )}
            </div>

            {/* --- CONTENT (Scrollable) --- */}
            <div
              ref={contentRef}
              className={`flex-1 overflow-y-auto overscroll-contain pb-safe-offset-8 bg-app-surface ${!noPadding ? 'px-6' : ''}`}
            >
              {children}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SwipeableBottomSheet;
