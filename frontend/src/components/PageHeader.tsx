import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/* --- TYPES --- */
interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  className?: string;
  variant?: 'simple' | 'float'; // Simple: default (top aligned), Float: detached visual (if ever needed)
}

const MAIN_PAGES = ['/', '/history', '/accounts', '/more', '/dashboard'];

/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton,
  rightAction,
  onBack,
  className = '',
  variant = 'simple'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Smart Visibility Logic
  const isMainPage = MAIN_PAGES.includes(location.pathname);
  const shouldShowBack = showBackButton ?? !isMainPage;

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className={`
      sticky top-0 z-60 w-full
      bg-app-bg/80 backdrop-blur-xl border-b border-app-border
      transition-colors duration-200
      ${className}
    `}>
      {/* 
         1. Safe Area Top Spacing
         Important for iPhones with notch/dynamic island
      */}
      <div className="pt-safe w-full bg-inherit" />

      {/* 2. Content Bar */}
      <div className="h-[56px] w-full max-w-[1400px] mx-auto px-2 flex items-center justify-between relative">

        {/* LEFT AREA: BACK BUTTON */}
        <div className="w-[48px] flex justify-center">
          {shouldShowBack && (
            <button
              onClick={handleBack}
              className="size-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 text-app-primary transition-all"
              aria-label="Atrás"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}
        </div>

        {/* CENTER AREA: TITLE */}
        <div className="absolute inset-x-12 top-0 bottom-0 flex items-center justify-center pointer-events-none">
          <h1 className="font-bold text-[17px] leading-tight text-app-text truncate opacity-100 transition-opacity">
            {title}
          </h1>
        </div>

        {/* RIGHT AREA: ACTION BUTTON */}
        <div className="w-[48px] flex justify-center items-center">
          {rightAction}
        </div>

      </div>
    </header>
  );
};