import React, { useRef, useState, useEffect } from 'react';

interface SwipeableItemProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: string;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: string;
    color: string;
    label: string;
  };
  children: React.ReactNode;
  threshold?: number; // Pixels to trigger action
  className?: string;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  children,
  threshold = 80,
  className = '',
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const distance = currentTouch - touchStart;

    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDistance = Math.max(Math.min(distance, maxSwipe), -maxSwipe);

    setTouchEnd(currentTouch);
    setOffset(limitedDistance);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      resetPosition();
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && Math.abs(offset) > threshold && onSwipeLeft) {
      setTimeout(() => {
        onSwipeLeft();
        resetPosition();
      }, 200);
    } else if (isRightSwipe && Math.abs(offset) > threshold && onSwipeRight) {
      setTimeout(() => {
        onSwipeRight();
        resetPosition();
      }, 200);
    } else {
      resetPosition();
    }
  };

  const resetPosition = () => {
    setOffset(0);
    setIsSwiping(false);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Auto-reset when swipe is complete
  useEffect(() => {
    if (!isSwiping && offset !== 0) {
      const timer = setTimeout(resetPosition, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSwiping, offset]);

  const showLeftAction = offset < -threshold / 2 && rightAction;
  const showRightAction = offset > threshold / 2 && leftAction;

  return (
    <div className={`relative overflow-hidden w-full touch-pan-y ${className}`}>
      {/* Left action (revealed by swiping right) - Background Layer */}
      {rightAction && offset > 0 && (
        <div
          className={`absolute inset-0 flex items-center justify-start px-4 ${className}`}
          style={{ backgroundColor: rightAction.color }}
        >
          <span className="material-symbols-outlined text-white text-xl">{rightAction.icon}</span>
          <span className="text-white font-semibold ml-2 text-sm">{rightAction.label}</span>
        </div>
      )}

      {/* Right action (revealed by swiping left) - Background Layer */}
      {leftAction && offset < 0 && (
        <div
          className={`absolute inset-0 flex items-center justify-end px-4 ${className}`}
          style={{ backgroundColor: leftAction.color }}
        >
          <span className="text-white font-semibold mr-2 text-sm">{leftAction.label}</span>
          <span className="material-symbols-outlined text-white text-xl">{leftAction.icon}</span>
        </div>
      )}

      {/* Main content */}
      <div
        ref={itemRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative bg-app-card ${isSwiping ? '' : 'transition-transform duration-200'} ${className}`}
        style={{
          transform: `translateX(${offset}px)`,
          borderRadius: 'inherit' // Inherit rounded corners from parent/className
        }}
      >
        {children}
      </div>
    </div>
  );
};
