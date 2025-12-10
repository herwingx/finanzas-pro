import React, { useEffect } from 'react';

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
  requireConfirmation?: boolean; // For critical actions, require typing "ELIMINAR"
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
  const [confirmationText, setConfirmationText] = React.useState('');
  const [acknowledgeWarning, setAcknowledgeWarning] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
      setAcknowledgeWarning(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getWarningColorClasses = () => {
    switch (warningLevel) {
      case 'critical':
        return {
          border: 'border-red-500',
          bg: 'bg-red-500/10',
          text: 'text-red-600 dark:text-red-400',
          icon: '🚨',
        };
      case 'warning':
        return {
          border: 'border-yellow-500/20',
          bg: 'bg-yellow-500/10',
          text: 'text-yellow-600 dark:text-yellow-400',
          icon: '⚠️',
        };
      default:
        return {
          border: 'border-app-border',
          bg: 'bg-app-elevated',
          text: 'text-app-text',
          icon: '❓',
        };
    }
  };

  const colors = getWarningColorClasses();
  const canConfirm = requireConfirmation
    ? confirmationText === 'ELIMINAR' && acknowledgeWarning
    : true;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-app-card rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4 w-full sm:max-w-lg shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${colors.bg}`}>
            <span className="text-2xl">{colors.icon}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-app-text mb-1">
              {warningLevel === 'critical' ? '¡ADVERTENCIA CRÍTICA!' : '¿Confirmar Eliminación?'}
            </h2>
            <p className="text-sm text-app-muted">
              {warningLevel === 'critical'
                ? 'Esta acción afectará la integridad de tus datos históricos'
                : `¿Estás seguro de eliminar "${itemName}"?`}
            </p>
          </div>
        </div>

        {/* Warning Message */}
        {warningMessage && (
          <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} mb-4`}>
            <p className={`font-semibold mb-2 ${colors.text}`}>{warningMessage}</p>
            {warningDetails.length > 0 && (
              <ul className="space-y-1 text-sm opacity-90">
                {warningDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Impact Preview */}
        {impactPreview && (
          <div className="bg-app-elevated border border-app-border rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-app-text mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">analytics</span>
              Impacto de la Eliminación
            </p>
            <div className="space-y-2 text-sm">
              {impactPreview.account && (
                <div className="flex justify-between">
                  <span className="text-app-muted">Cuenta:</span>
                  <span className="font-semibold text-app-text">{impactPreview.account}</span>
                </div>
              )}
              {impactPreview.balanceChange !== undefined && (
                <div className="flex justify-between">
                  <span className="text-app-muted">Cambio de saldo:</span>
                  <span
                    className={`font-semibold ${impactPreview.balanceChange > 0 ? 'text-app-success' : 'text-app-danger'
                      }`}
                  >
                    {impactPreview.balanceChange > 0 ? '+' : ''}${Math.abs(impactPreview.balanceChange).toFixed(2)}
                  </span>
                </div>
              )}
              {impactPreview.msiPlan && (
                <>
                  <div className="flex justify-between">
                    <span className="text-app-muted">Plan MSI:</span>
                    <span className="font-semibold text-app-text">{impactPreview.msiPlan}</span>
                  </div>
                  {impactPreview.msiProgress && (
                    <div className="flex justify-between">
                      <span className="text-app-muted">Progreso:</span>
                      <span className="font-semibold text-app-text">
                        {impactPreview.msiProgress.current}/{impactPreview.msiProgress.total} →{' '}
                        {impactPreview.msiProgress.current - 1}/{impactPreview.msiProgress.total}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Critical Confirmation */}
        {requireConfirmation && (
          <div className="space-y-3 mb-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgeWarning}
                onChange={(e) => setAcknowledgeWarning(e.target.checked)}
                className="mt-1 size-4 rounded accent-app-primary"
              />
              <span className="text-sm text-app-text">
                Entiendo que esto revertirá TODO el historial de pagos y des ajustará mis saldos.
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-app-text mb-2">
                Para confirmar, escribe: <span className="font-bold text-app-danger">ELIMINAR</span>
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl bg-app-elevated border border-app-border focus:outline-none focus:ring-2 focus:ring-app-danger text-app-text"
                placeholder="Escribe 'ELIMINAR'"
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl font-semibold bg-app-elevated text-app-text hover:bg-app-hover transition-colors"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${canConfirm && !isDeleting
              ? 'bg-app-danger text-white hover:bg-app-danger/90 shadow-lg'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Eliminando...
              </span>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};
