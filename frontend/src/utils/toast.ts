/**
 * Enhanced Toast Utilities for Finanzas Pro
 * Modern, consistent, and feature-rich toast notifications
 */

import { toast as sonnerToast } from 'sonner';

interface ToastAction {
  label: string;
  onClick: () => void;
}

// Success Toast with optional undo action
export const toastSuccess = (message: string, action?: ToastAction) => {
  sonnerToast.success(message, {
    icon: '✅',
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined,
    duration: 3000,
    style: {
      background: 'var(--color-success-bg)',
      border: '1px solid var(--color-success)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Error Toast with support info
export const toastError = (message: string, description?: string) => {
  sonnerToast.error(message, {
    icon: '❌',
    description: description || 'Si el problema persiste, intenta recargar la página',
    duration: 5000,
    style: {
      background: 'var(--color-danger-bg)',
      border: '1px solid var(--color-danger)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Warning Toast
export const toastWarning = (message: string, description?: string) => {
  sonnerToast.warning(message, {
    icon: '⚠️',
    description,
    duration: 4000,
    style: {
      background: 'var(--color-warning-bg)',
      border: '1px solid var(--color-warning)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Info Toast
export const toastInfo = (message: string, description?: string) => {
  sonnerToast.info(message, {
    icon: 'ℹ️',
    description,
    duration: 4000,
    style: {
      background: 'var(--color-info-bg)',
      border: '1px solid var(--color-info)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Loading Toast (returns ID for updating)
export const toastLoading = (message: string) => {
  return sonnerToast.loading(message, {
    icon: '⏳',
    style: {
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Update existing toast to success
export const toastUpdateSuccess = (id: string | number, message: string) => {
  sonnerToast.success(message, {
    id,
    icon: '✅',
    duration: 3000,
  });
};

// Update existing toast to error
export const toastUpdateError = (id: string | number, message: string) => {
  sonnerToast.error(message, {
    id,
    icon: '❌',
    duration: 5000,
  });
};

// Promise Toast - Shows loading, then success/error automatically
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    style: {
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text-primary)',
    },
  });
};

// Dismiss toast
export const toastDismiss = (id?: string | number) => {
  sonnerToast.dismiss(id);
};

// Dismiss all toasts
export const toastDismissAll = () => {
  sonnerToast.dismiss();
};

// Custom Toast with full control
export const toastCustom = (content: (id: string | number) => React.ReactElement, options?: any) => {
  return sonnerToast.custom(content, options);
};

// Financial-specific toasts
export const toastTransactionSaved = (amount: number, onUndo?: () => void) => {
  toastSuccess(
    `Transacción guardada: $${amount.toFixed(2)}`,
    onUndo ? { label: 'Deshacer', onClick: onUndo } : undefined
  );
};

export const toastTransactionDeleted = (onUndo?: () => void) => {
  toastSuccess(
    'Transacción eliminada',
    onUndo ? { label: 'Deshacer', onClick: onUndo } : undefined
  );
};

export const toastMSIPayment = (amount: number, planName: string) => {
  toastSuccess(`Pago de $${amount.toFixed(2)} a MSI: ${planName}`);
};

export const toastInsufficientFunds = () => {
  toastError('Fondos insuficientes', 'No tienes suficiente saldo para esta operación');
};

export const toastNetworkError = () => {
  toastError('Error de conexión', 'Verifica tu conexión a internet e intenta nuevamente');
};

// Re-export the original toast for edge cases
export { sonnerToast as toast };
