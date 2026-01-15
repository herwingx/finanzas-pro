import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

// Definición de las acciones visuales
export interface SwipeActionConfig {
  icon: string;    // Nombre del icono Material Symbols
  color: string;   // Clase de texto Tailwind (ej: 'text-white')
  bgColor: string; // Clase de fondo Tailwind (ej: 'bg-red-500')
  label?: string;
}

interface SwipeableItemProps {
  children: React.ReactNode;

  // Acciones (Left = Arrastrar hacia derecha para Editar, Right = Hacia izq para Borrar)
  leftAction?: SwipeActionConfig;
  rightAction?: SwipeActionConfig;

  // Callbacks
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;

  className?: string;
  threshold?: number; // Cuánto arrastrar para activar (px)
  disabled?: boolean;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftAction,
  rightAction,
  onSwipeRight,
  onSwipeLeft,
  className = '',
  threshold = 80,
  disabled = false
}) => {
  const x = useMotionValue(0);

  // LOGICA VISUAL MEJORADA:
  // 1. Fondo de colores: Solo visible cuando se arrastra (opacity dinámica).
  //    Esto evita que se vean "bordes rojos/azules" detrás del item en reposo.
  const leftBgOpacity = useTransform(x, [0, 5], [0, 1]);
  const rightBgOpacity = useTransform(x, [-5, 0], [1, 0]);

  // 2. Iconos: Aparecen gradualmente
  const leftIconOpacity = useTransform(x, [0, threshold], [0.3, 1]);
  const rightIconOpacity = useTransform(x, [0, -threshold], [0.3, 1]);

  // 3. Escala: Feedback táctil
  const iconScale = useTransform(x, [-threshold, 0, threshold], [1.2, 0.5, 1.2]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > threshold || (offset > 50 && velocity > 200)) {
      if (leftAction && onSwipeRight) {
        if (navigator.vibrate) navigator.vibrate(10);
        onSwipeRight();
      }
    } else if (offset < -threshold || (offset < -50 && velocity < -200)) {
      if (rightAction && onSwipeLeft) {
        if (navigator.vibrate) navigator.vibrate(10);
        onSwipeLeft();
      }
    }
  };

  return (
    // "isolation-isolate": Crea contexto de apilamiento.
    // "select-none": Evita selección de texto al arrastrar.
    <div className={`relative w-full select-none isolation-isolate ${className}`}>

      {/* BACKGROUND LAYER (Acciones) - Z-index 0 (detrás) */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[inherit] pointer-events-none">

        {/* Left Action (Drag Right) */}
        {leftAction && (
          <motion.div
            className={`absolute inset-0 flex items-center justify-start pl-6 ${leftAction.bgColor}`}
            style={{ opacity: leftBgOpacity }}
          >
            <motion.div
              style={{ opacity: leftIconOpacity, scale: iconScale }}
              className={`flex flex-col items-center gap-1 font-bold ${leftAction.color}`}
            >
              <span className="material-symbols-outlined text-2xl">{leftAction.icon}</span>
            </motion.div>
          </motion.div>
        )}

        {/* Right Action (Drag Left) */}
        {rightAction && (
          <motion.div
            className={`absolute inset-0 flex items-center justify-end pr-6 ${rightAction.bgColor}`}
            style={{ opacity: rightBgOpacity }}
          >
            <motion.div
              style={{ opacity: rightIconOpacity, scale: iconScale }}
              className={`flex flex-col items-center gap-1 font-bold ${rightAction.color}`}
            >
              <span className="material-symbols-outlined text-2xl">{rightAction.icon}</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* FOREGROUND CONTENT (Card) - Z-index 10 (delante) */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        dragDirectionLock
        whileTap={{ cursor: "grabbing" }}
        // "rounded-[inherit]": Hereda el borde redondeado del padre (ej: rounded-3xl)
        // "bg-app-surface": Asegura opacidad contra el fondo.
        className="relative z-10 w-full bg-app-surface rounded-[inherit]"
        style={{ x, touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
};