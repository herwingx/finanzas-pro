/**
 * Enhanced Toast Utilities for Finanzas Pro
 * Modern, consistent, and feature-rich toast notifications
 */

import { toast as sonnerToast } from 'sonner';

interface ToastAction {
  label: string;
  onClick: () => void;
}

// Shared toast styles
const toastStyles = {
  success: 'bg-app-elevated/90 backdrop-blur-xl border border-app-success/50 text-app-text shadow-lg shadow-app-success/10',
  error: 'bg-app-elevated/90 backdrop-blur-xl border border-app-danger/50 text-app-text shadow-lg shadow-app-danger/10',
  warning: 'bg-app-elevated/90 backdrop-blur-xl border border-app-warning/50 text-app-text shadow-lg shadow-app-warning/10',
  info: 'bg-app-elevated/90 backdrop-blur-xl border border-app-info/50 text-app-text shadow-lg shadow-app-info/10',
  loading: 'bg-app-elevated/90 backdrop-blur-xl border border-app-border text-app-text shadow-lg',
};

// Success Toast with optional undo action
export const toastSuccess = (message: string, action?: ToastAction) => {
  sonnerToast.success(message, {
    className: toastStyles.success,
    icon: '✅',
    action: action ? {
      label: action.label,
      onClick: action.onClick
    } : undefined,
    duration: 3000,
  });
};

// Error Toast with support info
export const toastError = (message: string, description?: string) => {
  sonnerToast.error(message, {
    className: toastStyles.error,
    icon: '❌',
    description: description || 'Si el problema persiste, intenta recargar la página',
    duration: 5000,
  });
};

// Warning Toast
export const toastWarning = (message: string, description?: string) => {
  sonnerToast.warning(message, {
    className: toastStyles.warning,
    icon: '⚠️',
    description,
    duration: 4000,
  });
};

// Info Toast
export const toastInfo = (message: string, description?: string) => {
  sonnerToast.info(message, {
    className: toastStyles.info,
    icon: 'ℹ️',
    description,
    duration: 4000,
  });
};

// Loading Toast (returns ID for updating)
export const toastLoading = (message: string) => {
  return sonnerToast.loading(message, {
    className: toastStyles.loading,
    icon: '⏳',
  });
};

// Update existing toast to success
export const toastUpdateSuccess = (id: string | number, message: string) => {
  sonnerToast.success(message, {
    id,
    className: toastStyles.success,
    icon: '✅',
    duration: 3000,
  });
};

// Update existing toast to error
export const toastUpdateError = (id: string | number, message: string) => {
  sonnerToast.error(message, {
    id,
    className: toastStyles.error,
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
    className: toastStyles.loading, // Default to loading style, success/error will override automatically by sonner type? No, sonner might need specific styles for promise states.
    // Actually sonner allows 'success' and 'error' props which can be objects with classNames.
    // Simplifying for now to use default sonner behavior with global toast styles if possible,
    // or passing a base style.
    // Let's stick to simple implementation here as sonner handles promise states well.
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
