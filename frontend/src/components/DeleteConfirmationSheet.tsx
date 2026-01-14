import React, { useEffect, useState } from 'react';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';

/* ==================================================================================
   TYPES
   ================================================================================== */
export type WarningLevel = 'critical' | 'warning' | 'normal';

export interface ImpactDetail {
  account?: string;
  balanceChange?: number;
}

export interface DeleteConfirmOptions {
  revertBalance: boolean;
}

interface DeleteConfirmationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options?: DeleteConfirmOptions) => void;
  itemName: string;

  // UX Configuration
  warningLevel?: WarningLevel;
  warningMessage?: string;
  warningDetails?: string[];
  requireConfirmation?: boolean; // Forces user to type "ELIMINAR"
  impactPreview?: ImpactDetail;

  // Data Logic Options
  isDeleting?: boolean;
  showRevertOption?: boolean;
  revertOptionLabel?: string;
  defaultRevertState?: boolean;
}

/* ==================================================================================
   STYLES HELPER
   ================================================================================== */
const getStyles = (level: WarningLevel) => {
  switch (level) {
    case 'critical': return {
      overlayIcon: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
      icon: 'dangerous',
      confirmBtn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white',
      banner: 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-900/10 dark:border-rose-900/50 dark:text-rose-200'
    };
    case 'warning': return {
      overlayIcon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      icon: 'warning',
      confirmBtn: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white', // Still red button for delete actions
      banner: 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/10 dark:border-amber-900/50 dark:text-amber-200'
    };
    default: return {
      overlayIcon: 'bg-app-subtle text-app-muted',
      icon: 'delete',
      confirmBtn: 'bg-app-primary hover:opacity-90 text-white shadow-app-primary/20',
      banner: 'bg-app-subtle border-app-border text-app-text'
    };
  }
};

/* ==================================================================================
   COMPONENT
   ================================================================================== */
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
  showRevertOption = false,
  revertOptionLabel = "Revertir impacto en saldos",
  defaultRevertState = true,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [acknowledge, setAcknowledge] = useState(false);
  const [revertBalance, setRevertBalance] = useState(defaultRevertState);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setAcknowledge(false);
      setRevertBalance(defaultRevertState);
    }
  }, [isOpen, defaultRevertState]);

  const styles = getStyles(warningLevel);
  const canSubmit = requireConfirmation ? (confirmationText === 'ELIMINAR' && acknowledge) : true;

  const handleConfirm = () => onConfirm({ revertBalance });
  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <SwipeableBottomSheet isOpen={isOpen} onClose={handleClose}>
      <div className="pb-safe-offset-4">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 mb-4 ${styles.overlayIcon}`}>
            <span className="material-symbols-outlined text-[36px]">{styles.icon}</span>
          </div>
          <h3 className="text-xl font-bold text-app-text leading-tight px-4">
            {warningLevel === 'critical' ? 'Acción Irreversible' : 'Confirmar Eliminación'}
          </h3>
          <p className="text-sm text-app-muted mt-2 leading-relaxed max-w-[80%] mx-auto">
            Vas a eliminar permanentemente: <br />
            <span className="font-semibold text-app-text text-base">"{itemName}"</span>
          </p>
        </div>

        {/* Body */}
        <div className="space-y-5 px-1">

          {/* 1. Dynamic Warning Banner */}
          {warningMessage && (
            <div className={`p-4 rounded-2xl border flex gap-3 ${styles.banner}`}>
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">info</span>
              <div className="text-xs">
                <p className="font-bold mb-1">{warningMessage}</p>
                {warningDetails.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 opacity-90">
                    {warningDetails.map((detail, idx) => <li key={idx}>{detail}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 2. Revert Toggle Option */}
          {showRevertOption && (
            <label className="flex gap-3 p-3 rounded-2xl border border-app-border bg-app-subtle/50 hover:bg-app-subtle hover:border-app-border-strong cursor-pointer transition-all group active:scale-[0.99]">
              <div className="relative flex items-center pt-1">
                <input
                  type="checkbox"
                  checked={revertBalance}
                  onChange={e => setRevertBalance(e.target.checked)}
                  className="peer size-5 accent-app-primary rounded cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <span className="block text-sm font-bold text-app-text group-hover:text-app-primary transition-colors">
                  {revertOptionLabel}
                </span>
                <span className="block text-xs text-app-muted mt-0.5 leading-snug">
                  {revertBalance ? "El dinero regresará a la cuenta original." : "Solo se borra el historial. El saldo no cambia."}
                </span>
              </div>
            </label>
          )}

          {/* 3. Impact Preview */}
          {impactPreview && impactPreview.balanceChange !== undefined && (
            <div className="bg-app-subtle/30 border border-app-border rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-app-muted font-bold uppercase tracking-wider">Impacto Estimado</span>
              <span className={`font-mono font-bold ${revertBalance ? (impactPreview.balanceChange > 0 ? 'text-emerald-500' : 'text-rose-500') : 'text-app-muted line-through opacity-50'}`}>
                {impactPreview.balanceChange > 0 ? '+' : ''}${Math.abs(impactPreview.balanceChange).toFixed(2)}
              </span>
            </div>
          )}

          {/* 4. Critical Gate (Type "ELIMINAR") */}
          {requireConfirmation && (
            <div className="space-y-4 pt-4 border-t border-app-border/50">
              <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl">
                <label className="flex gap-3 items-start select-none cursor-pointer">
                  <input type="checkbox" checked={acknowledge} onChange={e => setAcknowledge(e.target.checked)} className="mt-1 size-4 accent-rose-500 shrink-0" />
                  <span className="text-xs text-rose-800 dark:text-rose-200 font-medium leading-tight">Entiendo que esta acción no se puede deshacer y asumo la responsabilidad.</span>
                </label>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-rose-500 mb-2 block tracking-wider">
                  Escribe "ELIMINAR" para confirmar
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={e => setConfirmationText(e.target.value.toUpperCase())}
                  placeholder="ELIMINAR"
                  className="w-full bg-app-surface border-2 border-app-border focus:border-rose-500 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all placeholder:text-app-muted/30 text-rose-600 dark:text-rose-400 text-center tracking-widest"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-app-border/50 grid grid-cols-2 gap-3 pb-6 md:pb-8">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="h-12 rounded-xl bg-app-subtle text-app-muted font-bold text-sm hover:bg-app-border/50 hover:text-app-text transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canSubmit || isDeleting}
            className={`
              h-12 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
              ${(!canSubmit || isDeleting) ? 'opacity-50 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : styles.confirmBtn}
            `}
          >
            {isDeleting && <span className="material-symbols-outlined text-lg animate-spin">sync</span>}
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>

      </div>
    </SwipeableBottomSheet>
  );
};