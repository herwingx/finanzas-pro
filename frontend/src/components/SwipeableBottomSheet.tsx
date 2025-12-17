import React, { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeableBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional: threshold in pixels to trigger close (default: 100) */
  closeThreshold?: number;
}

/**
 * A bottom sheet component that supports swipe-to-dismiss gesture.
 * - Swipe down on the handle or content to close
 * - Tap outside (on backdrop) to close
 * - Smooth animations with spring physics
 */
export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  closeThreshold = 100
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position and lock body
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTranslateY(0);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow dragging from top area (handle) or when at scroll top
    const sheet = sheetRef.current;
    if (!sheet) return;

    const touch = e.touches[0];
    const touchY = touch.clientY;
    const sheetRect = sheet.getBoundingClientRect();
    const handleArea = sheetRect.top + 60; // First 60px is the handle area

    // Allow drag if touching handle area OR if content is scrolled to top
    if (touchY <= handleArea || sheet.scrollTop === 0) {
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
      setIsDragging(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward movement (positive deltaY)
    if (deltaY > 0) {
      // Add resistance as you drag further
      const resistance = 0.6;
      setTranslateY(deltaY * resistance);
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // If dragged past threshold, close the sheet
    if (translateY > closeThreshold) {
      setIsClosing(true);
      // Animate out
      setTranslateY(window.innerHeight);
      setTimeout(() => {
        onClose();
        setTranslateY(0);
        setIsClosing(false);
      }, 300);
    } else {
      // Snap back
      setTranslateY(0);
    }
  }, [isDragging, translateY, closeThreshold, onClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: isClosing ? 0 : 1 - (translateY / 400),
          touchAction: 'none' // Prevent any touch gestures on backdrop
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`
                    relative w-full max-w-md max-h-[90vh] overflow-y-auto
                    bg-app-surface border-t sm:border border-app-border
                    rounded-t-3xl sm:rounded-3xl shadow-2xl
                    ${!isDragging && !isClosing ? 'transition-transform duration-300 ease-out' : ''}
                    ${isClosing ? 'transition-transform duration-300 ease-in' : ''}
                `}
        style={{
          transform: `translateY(${translateY}px)`,
          animation: !isDragging && !isClosing && translateY === 0 ? 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
          overscrollBehaviorY: 'contain', // Prevent pull-to-refresh
          touchAction: 'pan-y', // Allow vertical scroll, prevent other gestures
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Handle */}
        <div className="sticky top-0 z-10 pt-3 pb-2 bg-app-surface sm:hidden cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-app-border rounded-full mx-auto opacity-60" />
        </div>

        {/* Content - extra bottom padding for BottomNav on mobile */}
        <div className="p-6 pt-2 sm:pt-6 pb-24 sm:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SwipeableBottomSheet;
