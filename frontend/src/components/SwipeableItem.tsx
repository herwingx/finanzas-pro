import React, { useRef, useState, useCallback, useEffect } from 'react';

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

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  children,
  leftAction,
  rightAction,
  onSwipeRight,
  onSwipeLeft,
  threshold = 80,
  className = '',
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isActivated, setIsActivated] = useState(false); // To prevent multiple triggers

  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Max drag distance (provides resistance/rubber-band effect)
  const MAX_DRAG = 150;

  // --- Haptics ---
  const triggerHaptic = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(10); // Tiny vibration tick (iOS style)
    }
  }, []);

  // --- Logic Helpers ---

  // Determine drag visual physics
  const calculateOffset = (diff: number) => {
    // Elastic resistance logic (logarithmic slowdown)
    const sign = Math.sign(diff);
    const absDiff = Math.abs(diff);
    // Formula simple para resistencia: se vuelve más difícil arrastrar cuanto más lejos vas
    const damped = Math.min(absDiff, MAX_DRAG) * (1 - (0.2 * (absDiff / 400)));
    return sign * damped;
  };

  const checkActivation = (currentOffset: number) => {
    const absOffset = Math.abs(currentOffset);

    // Check if we crossed threshold fresh
    if (!isActivated && absOffset > threshold) {
      triggerHaptic();
      setIsActivated(true);
    }
    // Check if we went back under threshold
    else if (isActivated && absOffset < threshold) {
      setIsActivated(false);
    }
  };

  // --- Input Handlers (Unified Mouse & Touch) ---

  const handleStart = (clientX: number) => {
    startX.current = clientX;
    setIsDragging(true);
    // Disable global scroll if needed, though touch-action: pan-y handles most
  };

  const handleMove = (clientX: number) => {
    if (startX.current === null) return;

    const diff = clientX - startX.current;

    // Logic Gate: Only allow dragging if we have an action for that direction
    if (diff > 0 && !leftAction) return;  // Trying to drag right, but no left action
    if (diff < 0 && !rightAction) return; // Trying to drag left, but no right action

    const newOffset = calculateOffset(diff);
    setOffset(newOffset);
    checkActivation(newOffset);
  };

  const handleEnd = () => {
    if (startX.current === null) return;

    // Check Trigger
    if (isActivated) {
      if (offset > 0 && onSwipeRight) {
        // Let the animation finish visually then fire callback
        setTimeout(() => onSwipeRight(), 50);
      } else if (offset < 0 && onSwipeLeft) {
        setTimeout(() => onSwipeLeft(), 50);
      }
    }

    // Reset Physics
    setIsDragging(false);
    setOffset(0);
    setIsActivated(false);
    startX.current = null;
  };

  // --- Event Listeners Wrappers ---

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);

  // Global window listeners for mouse to catch dragging outside div
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleWindowMouseUp = () => handleEnd();

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, isActivated, offset]); // Deps needed for closure scope


  // --- Derived Styles ---

  // Decide what to show in background
  const activeConfig = offset > 0 ? leftAction : rightAction;

  // Activation visual cues
  const scaleIcon = Math.min(Math.abs(offset) / threshold, 1.2);
  const opacityText = Math.min(Math.max((Math.abs(offset) - 30) / 40, 0), 1);

  // Content layer alignment (iOS uses border-radius clipping)
  // Ensure the wrapper cuts off corners

  return (
    <div className={`relative w-full overflow-hidden select-none touch-pan-y ${className}`} style={{ borderRadius: 'inherit' }}>

      {/* Background Action Layer */}
      {activeConfig && Math.abs(offset) > 10 && (
        <div
          className={`absolute inset-0 flex items-center px-6 transition-colors duration-200
             ${offset > 0 ? 'justify-start' : 'justify-end'}
          `}
          style={{
            backgroundColor: activeConfig.color,
            opacity: Math.min(Math.abs(offset) / 30, 1),
            borderRadius: 'inherit' // Matchear bordes de tarjeta
          }}
        >
          <div className="flex items-center gap-2 text-white font-bold"
            style={{
              transform: `scale(${isActivated ? 1.1 : 1})`,
              transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
            {offset < 0 && (
              // Text left of icon for Right Action
              <span style={{ opacity: opacityText }} className="text-xs tracking-wider uppercase mr-1">{activeConfig.label}</span>
            )}

            <span className="material-symbols-outlined text-2xl"
              style={{ transform: `scale(${scaleIcon})` }}>
              {activeConfig.icon}
            </span>

            {offset > 0 && (
              // Text right of icon for Left Action
              <span style={{ opacity: opacityText }} className="text-xs tracking-wider uppercase ml-1">{activeConfig.label}</span>
            )}
          </div>
        </div>
      )}

      {/* Foreground Content Layer */}
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={onMouseDown}
        // Tailwind 'transform' class conflict prevention: inline style needed for drag perf
        style={{
          transform: `translate3d(${offset}px, 0, 0)`, // Use 3d for GPU accel
          transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)', // iOS "Quart" spring
          borderRadius: 'inherit'
        }}
        className="relative bg-app-surface w-full h-full"
      >
        {children}
      </div>
    </div>
  );
};