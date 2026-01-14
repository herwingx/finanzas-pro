import React, { useEffect, useState } from 'react';

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

  if (!isOpen) return null;

  const styles = getStyles(warningLevel);
  const canSubmit = requireConfirmation ? (confirmationText === 'ELIMINAR' && acknowledge) : true;

  const handleConfirm = () => onConfirm({ revertBalance });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-app-surface border border-app-border rounded-3xl shadow-2xl animate-scale-in overflow-hidden">

        {/* Header */}
        <div className="p-6 pb-2 flex gap-4">
          <div className={`size-14 rounded-full flex items-center justify-center shrink-0 ${styles.overlayIcon}`}>
            <span className="material-symbols-outlined text-[32px]">{styles.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-app-text leading-tight">
              {warningLevel === 'critical' ? 'Acción Irreversible' : 'Confirmar Eliminación'}
            </h3>
            <p className="text-sm text-app-muted mt-1 leading-snug">
              Vas a eliminar permanentemente: <br />
              <span className="font-semibold text-app-text">"{itemName}"</span>
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 pt-2 space-y-5">

          {/* 1. Dynamic Warning Banner */}
          {warningMessage && (
            <div className={`p-4 rounded-xl border flex gap-3 ${styles.banner}`}>
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
            <label className="flex gap-3 p-3 rounded-2xl border border-app-border bg-app-subtle hover:border-app-primary/50 cursor-pointer transition-colors group">
              <div className="relative flex items-center">
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
            <div className="space-y-3 pt-2">
              <label className="flex gap-3 items-start select-none cursor-pointer">
                <input type="checkbox" checked={acknowledge} onChange={e => setAcknowledge(e.target.checked)} className="mt-1 size-4 accent-rose-500" />
                <span className="text-xs text-app-text font-medium leading-tight">Entiendo que esta acción no se puede deshacer y asumo la responsabilidad.</span>
              </label>
              <div>
                <label className="text-[10px] uppercase font-bold text-rose-500 mb-1.5 block">
                  Escribe "ELIMINAR" para confirmar
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={e => setConfirmationText(e.target.value.toUpperCase())}
                  placeholder="ELIMINAR"
                  className="w-full bg-app-subtle border-2 border-rose-500/20 focus:border-rose-500 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all placeholder:text-app-muted/30 text-rose-600 dark:text-rose-400"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-app-subtle/50 border-t border-app-border flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-app-muted hover:text-app-text hover:bg-app-border/50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canSubmit || isDeleting}
            className={`
                        px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2
                        ${!canSubmit || isDeleting ? 'opacity-50 cursor-not-allowed bg-zinc-500 text-white' : styles.confirmBtn}
                    `}
          >
            {isDeleting && <span className="material-symbols-outlined text-lg animate-spin">sync</span>}
            {isDeleting ? 'Procesando...' : (requireConfirmation || warningLevel === 'critical' ? 'Eliminar Definitivamente' : 'Sí, eliminar')}
          </button>
        </div>

      </div>
    </div>
  );
};