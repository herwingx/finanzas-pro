import React from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';

interface SwipeableSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  triggerHaptic?: () => void;
}

import { createPortal } from 'react-dom';

export const SwipeableSheet: React.FC<SwipeableSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  triggerHaptic
}) => {
  const controls = useDragControls();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If dragged down enough (velocity or distance), close it
    if (info.offset.y > 100 || info.velocity.y > 500) {
      if (triggerHaptic) triggerHaptic();
      onClose();
    }
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* --- MOBILE: Swipeable Sheet --- */}
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 lg:hidden pointer-events-auto bg-black/40 backdrop-blur-sm"
            style={{ zIndex: 9998 }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0 }} // Allow dragging down freely (unbounded bottom)
            dragElastic={{ top: 0.1 }}   // Resistance when dragging up
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-app-surface border-t border-app-border rounded-t-[32px] overflow-hidden lg:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-h-[90dvh] flex flex-col pointer-events-auto"
            style={{ zIndex: 9999 }}
          >
            {/* Handle & Header Wrapper - Draggable Area */}
            <div
              className="shrink-0 touch-none cursor-grab active:cursor-grabbing bg-app-surface"
              onPointerDown={(e) => controls.start(e)}
            >
              {/* Handle Bar */}
              <div className="w-full flex justify-center py-4">
                <div className="w-12 h-1.5 bg-app-border rounded-full" />
              </div>

              {/* Header */}
              {title && (
                <div className="px-6 pb-2">
                  <h3 className="text-lg font-bold text-app-text">{title}</h3>
                </div>
              )}
            </div>

            {/* Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-6 pb-safe">
              {children}
            </div>
          </motion.div>

          {/* --- DESKTOP: Centered Modal --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hidden lg:flex fixed inset-0 items-center justify-center p-4"
            style={{ zIndex: 9998 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto bg-app-surface border border-app-border rounded-2xl shadow-2xl p-6"
              style={{ zIndex: 9999 }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-app-subtle text-app-muted hover:text-app-text transition-colors z-10"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              {title && <h3 className="text-xl font-bold text-app-text mb-4">{title}</h3>}
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
