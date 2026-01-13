import React, { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional: threshold in pixels to trigger close (default: 100) */
  closeThreshold?: number;
}

// Custom hook for responsive check
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640); // sm breakpoint
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
};

/**
 * A bottom sheet component that supports swipe-to-dismiss gesture.
 * - Swipe down on the handle or content to close in Mobile
 * - Centered Modal in Desktop
 * - Tap outside (on backdrop) to close
 * - Smooth animations
 */
export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  closeThreshold = 100
}) => {
  const isDesktop = useIsDesktop();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Lock body scroll logic (Common for both)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Reset state
  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
      setIsClosing(false);
    }
  }, [isOpen]);

  // --- TOUCH HANDLERS (Mobile Only) ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDesktop) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const touch = e.touches[0];
    const sheetRect = sheet.getBoundingClientRect();
    const handleArea = sheetRect.top + 60;
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    if (touch.clientY <= handleArea) setIsDragging(true);
    else setIsDragging(false);
  }, [isDesktop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDesktop) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;
    const isAtTop = sheet.scrollTop <= 0;
    const isPullingDown = deltaY > 0;

    if (isDragging || (isAtTop && isPullingDown)) {
      if (!isDragging) setIsDragging(true);
      const resistance = 0.6;
      setTranslateY(deltaY * resistance);
    }
  }, [isDragging, isDesktop]);

  const handleTouchEnd = useCallback(() => {
    if (isDesktop) return;
    if (!isDragging && translateY === 0) return;
    setIsDragging(false);
    if (translateY > closeThreshold) {
      setIsClosing(true);
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        onClose();
        setTranslateY(0);
        setIsClosing(false);
      }, 300);
    } else {
      setTranslateY(0);
    }
  }, [isDragging, translateY, closeThreshold, onClose, isDesktop]);

  if (!isOpen && !isClosing) return null;

  // --- DESKTOP RENDER (Modal) ---
  if (isDesktop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
        />

        {/* Modal Window */}
        <div
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-app-surface border border-app-border rounded-2xl shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button Desktop */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-app-subtle text-app-muted hover:text-app-text transition-colors z-10"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // --- MOBILE RENDER (Swipeable Sheet) ---
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: isClosing ? 0 : 1 - (translateY / 400),
          touchAction: 'none'
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        className={`
            relative w-full max-h-[92vh] overflow-y-auto
            bg-app-surface border-t border-app-border
            rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
            ${!isDragging && !isClosing ? 'transition-transform duration-300 ease-out' : ''}
            ${isClosing ? 'transition-transform duration-300 ease-in' : ''}
        `}
        style={{
          transform: `translateY(${translateY}px)`,
          animation: !isDragging && !isClosing && translateY === 0 ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          overscrollBehaviorY: 'contain',
          touchAction: 'pan-y',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Handle */}
        <div className="sticky top-0 z-10 pt-4 pb-2 bg-app-surface/95 backdrop-blur-sm cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto" />
        </div>

        {/* Content */}
        <div className="px-6 pb-safe-offset-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SwipeableBottomSheet;
