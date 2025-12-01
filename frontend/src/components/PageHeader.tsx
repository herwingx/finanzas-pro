import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  rightAction
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 p-4 bg-app-bg/80 backdrop-blur-xl border-b border-app-border">
      <div className="flex items-center justify-between">
        {showBackButton ? (
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-app-elevated transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
        ) : (
          <div className="w-10" />
        )}

        <h1 className="font-bold text-lg">{title}</h1>

        {rightAction || <div className="w-10" />}
      </div>
    </header>
  );
};
