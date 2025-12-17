import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

// Interfaces refinadas para claridad
export interface SwipeActionConfig {
  icon: string;    // Material Symbol string
  color: string;   // CSS color value (hex or var)
  label: string;
}

interface SwipeableItemProps {
  children: React.ReactNode;

  // Acciones (Left = Inicio/Start, Right = Final/End)
  leftAction?: SwipeActionConfig;   // Se revela al hacer swipe a la DERECHA ->
  rightAction?: SwipeActionConfig;  // Se revela al hacer swipe a la IZQUIERDA <-

  // Callbacks
  onSwipeRight?: () => void; // Triggered by leftAction
  onSwipeLeft?: () => void;  // Triggered by rightAction

  // Settings
  threshold?: number;   // Pixels to drag before activation (default 80)
  className?: string;   // Wrapper class
}

// Constante para determinar la dirección del gesto
const DIRECTION_LOCK_THRESHOLD = 10; // Píxeles antes de decidir si es scroll o swipe

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftAction,
  rightAction,
  onSwipeRight,
  onSwipeLeft,
  threshold = 80,
  className = '',
}) => {
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  // Refs para el tracking de gestos
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const gestureDirection = useRef<'horizontal' | 'vertical' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Max drag distance (provides resistance/rubber-band effect)
  const MAX_DRAG = 150;

  // --- Haptics ---
  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  }, []);

  // --- Logic Helpers ---
  const calculateOffset = (diff: number) => {
    const sign = Math.sign(diff);
    const absDiff = Math.abs(diff);
    const damped = Math.min(absDiff, MAX_DRAG) * (1 - (0.2 * (absDiff / 400)));
    return sign * damped;
  };

  const checkActivation = (currentOffset: number) => {
    const absOffset = Math.abs(currentOffset);

    if (!isActivated && absOffset > threshold) {
      triggerHaptic();
      setIsActivated(true);
    } else if (isActivated && absOffset < threshold) {
      setIsActivated(false);
    }
  };

  // --- Touch Handlers con Gesture Disambiguation ---
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    gestureDirection.current = null; // Reset direction lock
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Si aún no hemos determinado la dirección del gesto
    if (gestureDirection.current === null) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Esperamos a tener suficiente movimiento para decidir
      if (absDeltaX > DIRECTION_LOCK_THRESHOLD || absDeltaY > DIRECTION_LOCK_THRESHOLD) {
        if (absDeltaY > absDeltaX) {
          // El usuario está haciendo scroll vertical
          gestureDirection.current = 'vertical';
          // Cancelamos cualquier offset que pudiéramos haber empezado
          setOffset(0);
          setIsDragging(false);
          return;
        } else {
          // El usuario está haciendo swipe horizontal
          gestureDirection.current = 'horizontal';
        }
      } else {
        // Aún no hay suficiente movimiento, no hacemos nada todavía
        return;
      }
    }

    // Si estamos en modo scroll vertical, ignoramos
    if (gestureDirection.current === 'vertical') {
      return;
    }

    // Estamos en modo swipe horizontal
    // Logic Gate: Only allow dragging if we have an action for that direction
    if (deltaX > 0 && !leftAction) return;
    if (deltaX < 0 && !rightAction) return;

    const newOffset = calculateOffset(deltaX);
    setOffset(newOffset);
    checkActivation(newOffset);
  };

  const handleTouchEnd = () => {
    if (startX.current === null) return;

    // Solo activamos si estábamos en modo horizontal y cruzamos el threshold
    if (gestureDirection.current === 'horizontal' && isActivated) {
      if (offset > 0 && onSwipeRight) {
        setTimeout(() => onSwipeRight(), 50);
      } else if (offset < 0 && onSwipeLeft) {
        setTimeout(() => onSwipeLeft(), 50);
      }
    }

    // Reset todo
    setIsDragging(false);
    setOffset(0);
    setIsActivated(false);
    startX.current = null;
    startY.current = null;
    gestureDirection.current = null;
  };

  // --- Mouse Handlers (solo para desktop, pero deshabilitados para evitar conflictos) ---
  // En desktop usamos botones hover en lugar de drag
  const onMouseDown = (_e: React.MouseEvent) => {
    // No hacemos nada - en desktop usamos hover buttons
  };

  // Global window listeners for mouse to catch dragging outside div
  // Removed as per instructions to disable mouse drag on larger screens.
  // The previous implementation was also only active for isMobile, which is now handled by touch events.


  // --- Derived Styles ---
  const activeConfig = offset > 0 ? leftAction : rightAction;
  const scaleIcon = Math.min(Math.abs(offset) / threshold, 1.2);
  const opacityText = Math.min(Math.max((Math.abs(offset) - 30) / 40, 0), 1);

  return (
    <div className={`relative w-full overflow-hidden select-none group ${className}`}>

      {/* Background Action Layer - Se muestra siempre que haya offset (funciona en tablets también) */}
      {activeConfig && Math.abs(offset) > 10 && (
        <div
          className={`absolute inset-0 flex items-center px-6 transition-colors duration-200
             ${offset > 0 ? 'justify-start' : 'justify-end'}
          `}
          style={{
            backgroundColor: activeConfig.color,
            opacity: Math.min(Math.abs(offset) / 30, 1),
            borderRadius: 'inherit'
          }}
        >
          <div className="flex items-center gap-2 text-white font-bold"
            style={{
              transform: `scale(${isActivated ? 1.1 : 1})`,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
            {offset < 0 && (
              <span style={{ opacity: opacityText }} className="text-xs tracking-wider uppercase mr-1">{activeConfig.label}</span>
            )}

            <span className="material-symbols-outlined text-2xl"
              style={{ transform: `scale(${scaleIcon})` }}>
              {activeConfig.icon}
            </span>

            {offset > 0 && (
              <span style={{ opacity: opacityText }} className="text-xs tracking-wider uppercase ml-1">{activeConfig.label}</span>
            )}
          </div>
        </div>
      )}

      {/* Desktop Hover Actions Layer - Solo en pantallas grandes */}
      {!isMobile && (
        <div className="absolute inset-y-0 right-0 z-20 flex items-center gap-2 pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {leftAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwipeRight && onSwipeRight(); }}
              className="p-2 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110 active:scale-95 bg-white dark:bg-zinc-800 text-app-text-primary border border-app-border"
              title={leftAction.label}
              style={{ color: leftAction.color }}
            >
              <span className="material-symbols-outlined text-xl">{leftAction.icon}</span>
            </button>
          )}
          {rightAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onSwipeLeft && onSwipeLeft(); }}
              className="p-2 rounded-full shadow-sm hover:shadow-md transition-all hover:scale-110 active:scale-95 bg-white dark:bg-zinc-800 text-app-text-primary border border-app-border"
              title={rightAction.label}
              style={{ color: rightAction.color }}
            >
              <span className="material-symbols-outlined text-xl">{rightAction.icon}</span>
            </button>
          )}
        </div>
      )}

      {/* Foreground Content Layer */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
          borderRadius: 'inherit'
        }}
        className="relative bg-app-surface w-full h-full"
      >
        {children}
      </div>
    </div>
  );
};