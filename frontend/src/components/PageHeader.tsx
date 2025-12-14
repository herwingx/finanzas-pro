import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  className?: string; // Permitir estilos extra si se requieren
}

// Pages where the main navigation is visible, so we don't need a back button by default
const MAIN_PAGES = ['/', '/history', '/accounts', '/more', '/dashboard'];

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton,
  rightAction,
  onBack,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine back button visibility
  const isMainPage = MAIN_PAGES.includes(location.pathname);
  const shouldShowBack = showBackButton !== undefined ? showBackButton : !isMainPage;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`
      sticky top-0 z-30 w-full flex flex-col 
      bg-app-bg/85 backdrop-blur-md border-b border-app-border
      transition-all duration-300
      ${className}
    `}>

      {/* 
         iOS Safe Area Spacer
         Empuja el contenido hacia abajo solo en dispositivos iOS para evitar el Notch
         (Requiere que tengas las utilidades .pt-safe en tu CSS o tailwind config)
      */}
      <div className="pt-safe" />

      <div className="h-14 px-4 w-full flex items-center justify-between">

        {/* Left Section (Back Button or Spacer) */}
        <div className="flex shrink-0 w-10 items-center justify-start">
          {shouldShowBack ? (
            <button
              onClick={handleBack}
              className="group size-10 rounded-xl flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-subtle active:scale-95 transition-all"
              aria-label="Volver atrás"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
                arrow_back_ios_new
              </span>
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Center Section (Title) */}
        <h1 className="flex-1 font-bold text-[15px] sm:text-base tracking-tight text-center text-app-text truncate px-2 select-none">
          {title}
        </h1>

        {/* Right Section (Action or Spacer) */}
        <div className="flex shrink-0 w-10 items-center justify-end">
          {rightAction ? (
            rightAction
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>
    </header>
  );
};