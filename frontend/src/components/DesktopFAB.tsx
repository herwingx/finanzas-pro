import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const QUICK_ACTIONS = [
  { icon: 'trending_down', label: 'Gasto', colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', path: '/new?type=expense', hideOnPaths: [] as string[] },
  { icon: 'trending_up', label: 'Ingreso', colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', path: '/new?type=income', hideOnPaths: [] as string[] },
  { icon: 'swap_horiz', label: 'Transf.', colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', path: '/new?type=transfer', hideOnPaths: [] as string[] },
  { icon: 'event_repeat', label: 'Fijo', colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', path: '/recurring/new', hideOnPaths: ['/recurring'] },
  { icon: 'credit_score', label: 'MSI', colorClass: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', path: '/installments/new', hideOnPaths: ['/installments'] },
  { icon: 'handshake', label: 'Préstamo', colorClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', path: '/loans/new', hideOnPaths: ['/loans'] },
];

export const DesktopFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Filter out redundant actions based on current path
  const filteredActions = QUICK_ACTIONS.filter(
    action => !action.hideOnPaths.some(p => location.pathname.startsWith(p))
  );

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] hidden lg:block"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="hidden lg:flex flex-col items-end fixed bottom-8 right-8 z-50">

        {/* Actions List */}
        <div className={`
          flex flex-col gap-3 mb-4 transition-all duration-300 origin-bottom
          ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90 pointer-events-none'}
        `}>
          {filteredActions.map((action, idx) => (
            <button
              key={action.label}
              onClick={() => handleAction(action.path)}
              style={{ transitionDelay: `${isOpen ? (filteredActions.length - 1 - idx) * 30 : 0}ms` }}
              className="group flex items-center justify-end gap-3"
            >
              <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 text-xs font-bold text-app-text shadow-md border border-app-border opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                {action.label}
              </span>
              <div className={`size-12 rounded-full flex items-center justify-center shadow-lg border border-transparent group-hover:scale-110 transition-all duration-200 bg-white dark:bg-zinc-800 text-app-text`}>
                <span className={`material-symbols-outlined text-[24px] ${action.colorClass.split(' ')[1]}`}>{action.icon}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            size-14 rounded-full flex items-center justify-center shadow-xl 
            transition-all duration-300 hover:scale-105 active:scale-95
            ${isOpen ? 'bg-app-text text-app-bg rotate-45' : 'bg-app-primary text-white'}
          `}
        >
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </div>
    </>
  );
};
