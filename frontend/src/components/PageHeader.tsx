import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  onBack?: () => void;
}

// Main pages from the bottom navigation - these should NOT show back button
const MAIN_PAGES = ['/', '/history', '/accounts', '/more'];

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton,
  rightAction,
  onBack
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-determine if we should show back button based on current route
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
    <header className="sticky top-0 z-20 h-14 px-4 flex items-center bg-app-bg/95 backdrop-blur-xl border-b border-app-border">
      <div className="flex items-center justify-between w-full max-w-lg mx-auto">
        {shouldShowBack ? (
          <button
            onClick={handleBack}
            className="size-10 rounded-xl flex items-center justify-center hover:bg-app-elevated transition-colors -ml-1"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="font-bold text-base tracking-tight text-center flex-1 mx-2 truncate">{title}</h1>

        {rightAction || <div className="w-10" />}
      </div>
    </header>
  );
};
