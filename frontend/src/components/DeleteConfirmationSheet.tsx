import React, { useEffect, useState } from 'react';

export type WarningLevel = 'critical' | 'warning' | 'normal';

export interface ImpactDetail {
  account?: string;
  amount?: number;
  balanceChange?: number;
  msiPlan?: string;
  msiProgress?: { current: number; total: number };
}

interface DeleteConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  warningLevel?: WarningLevel;
  warningMessage?: string;
  warningDetails?: string[];
  impactPreview?: ImpactDetail;
  requireConfirmation?: boolean; // Requiere escribir "ELIMINAR"
  isDeleting?: boolean;
}

export const DeleteConfirmationSheet: React.FC<DeleteConfirmationSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  warningLevel = 'normal',
  warningMessage,
  warningDetails = [],
  impactPreview,
  requireConfirmation = false,
  isDeleting = false,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setAcknowledgeWarning(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          headerBg: 'bg-rose-100 dark:bg-rose-900/30',
          headerIconColor: 'text-rose-600 dark:text-rose-400',
          iconName: 'dangerous',
          bannerBg: 'bg-rose-50 dark:bg-rose-900/10',
          bannerBorder: 'border-rose-100 dark:border-rose-900/30',
          bannerText: 'text-rose-700 dark:text-rose-300'
        };
      case 'warning':
        return {
          headerBg: 'bg-amber-100 dark:bg-amber-900/30',
          headerIconColor: 'text-amber-600 dark:text-amber-400',
          iconName: 'warning',
          bannerBg: 'bg-amber-50 dark:bg-amber-900/10',
          bannerBorder: 'border-amber-100 dark:border-amber-900/30',
          bannerText: 'text-amber-700 dark:text-amber-300'
        };
      default:
        return {
          headerBg: 'bg-zinc-100 dark:bg-zinc-800',
          headerIconColor: 'text-zinc-600 dark:text-zinc-400',
          iconName: 'delete', // Default icon
          bannerBg: 'bg-app-subtle',
          bannerBorder: 'border-app-border',
          bannerText: 'text-app-text'
        };
    }
  };

  const styles = getVariantStyles();
  const canConfirm = requireConfirmation
    ? confirmationText === 'ELIMINAR' && acknowledgeWarning
    : true;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 transition-opacity animate-in fade-in duration-200"
      onClick={!isDeleting ? onClose : undefined}
    >
      <div
        className="w-full max-w-md bg-app-surface border border-app-border rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >

        {/* Header Section */}
        <div className="p-6 pb-2">
          <div className="flex gap-4">
            <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${styles.headerBg}`}>
              <span className={`material-symbols-outlined text-[28px] ${styles.headerIconColor}`}>
                {styles.iconName}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-text tracking-tight">
                {warningLevel === 'critical' ? '¿Estás absolutamente seguro?' : 'Confirmar eliminación'}
              </h2>
              <p className="text-sm text-app-muted mt-1 leading-snug">
                Estás a punto de eliminar <span className="font-semibold text-app-text">"{itemName}"</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2 space-y-4">

          {/* Dynamic Warning Banner */}
          {warningMessage && (
            <div className={`p-4 rounded-2xl border ${styles.bannerBorder} ${styles.bannerBg}`}>
              <div className="flex gap-2.5">
                <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${styles.bannerText}`}>info</span>
                <div>
                  <p className={`text-sm font-bold ${styles.bannerText}`}>{warningMessage}</p>
                  {warningDetails.length > 0 && (
                    <ul className={`mt-2 space-y-1.5 text-xs opacity-90 ${styles.bannerText}`}>
                      {warningDetails.map((d, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="opacity-50">•</span> {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Impact Summary (Mini Scorecard) */}
          {impactPreview && (
            <div className="bg-app-subtle/50 border border-app-border rounded-2xl p-4 text-sm">
              <p className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3 ml-1">Resumen del impacto</p>
              <div className="space-y-2">
                {impactPreview.account && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-app-text">Cuenta afectada</span>
                    <span className="font-medium text-app-text bg-app-surface px-2 py-0.5 rounded border border-app-border">{impactPreview.account}</span>
                  </div>
                )}
                {impactPreview.balanceChange !== undefined && (
                  <div className="flex justify-between items-center px-1">
                    <span className="text-app-text">Ajuste de saldo</span>
                    <span className={`font-bold tabular-nums ${impactPreview.balanceChange > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {impactPreview.balanceChange > 0 ? '+' : ''}${Math.abs(impactPreview.balanceChange).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Critical Protection Gates */}
          {requireConfirmation && (
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-app-subtle border border-app-border cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledgeWarning}
                  onChange={e => setAcknowledgeWarning(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-app-primary border-gray-300 rounded focus:ring-app-primary"
                />
                <span className="text-xs text-app-muted leading-tight">Entiendo que esta acción es irreversible y afectará la integridad de mis datos.</span>
              </label>

              <div>
                <label className="block text-xs font-bold text-app-text uppercase tracking-wide mb-1.5 ml-1">Escribe <span className="text-rose-500">ELIMINAR</span> para confirmar</label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={e => setConfirmationText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-app-surface border border-app-border focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 rounded-xl outline-none font-bold text-app-text placeholder-app-muted/30 transition-all"
                  placeholder="ELIMINAR"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-app-subtle/50 border-t border-app-border flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-app-text hover:bg-app-border/50 active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className={`
                 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all flex items-center gap-2
                 ${!canConfirm || isDeleting ? 'opacity-50 cursor-not-allowed bg-zinc-500' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30'}
              `}
          >
            {isDeleting && <span className="animate-spin text-lg">sync</span>}
            {isDeleting ? 'Procesando...' : 'Eliminar Permanentemente'}
          </button>
        </div>

      </div>
    </div>
  );
};