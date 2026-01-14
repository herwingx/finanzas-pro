import React, { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  content: string;
  className?: string;
  iconSize?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  className = '',
  iconSize = '14px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Auto-close on outside click (Mobile UX)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-flex items-center group" ref={containerRef}>

      {/* TRIGGER */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault(); // Prevent focus scroll jump
          setIsOpen(!isOpen);
        }}
        className={`material-symbols-outlined cursor-help text-app-muted/60 hover:text-app-primary active:scale-95 transition-all ${className}`}
        style={{ fontSize: iconSize }}
        aria-label="Info"
      >
        info
      </button>

      {/* TOOLTIP BODY */}
      {/* Show if open OR group-hover (Desktop only logic via Tailwind group-hover) */}
      <div
        className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] z-9999
            bg-app-surface/95 backdrop-blur-xl border border-app-border
            rounded-xl shadow-float p-3
            text-center
            transition-all duration-200 origin-bottom
            ${isOpen
            ? 'opacity-100 scale-100 visible'
            : 'opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible hover:transition-delay-700'
          }
        `}
      >
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[6px] size-3 bg-app-surface border-r border-b border-app-border rotate-45 transform" />

        <p className="text-[11px] leading-snug font-medium text-app-text relative z-10">
          {content}
        </p>
      </div>

    </span>
  );
};

export default InfoTooltip;