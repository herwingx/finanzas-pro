import React from 'react';
import { toast as sonnerToast, ExternalToast } from 'sonner';

/**
 * 🎨 PREMIUM FINTECH TOAST SYSTEM
 * Sistema de notificaciones minimalista y contextual.
 */

// Iconos con Material Symbols para consistencia

const Icons = {
  success: <span className="material-symbols-outlined text-emerald-500 text-[20px]"> check_circle </span>,
  error: <span className="material-symbols-outlined text-rose-500 text-[20px]"> error </span>,
  warning: <span className="material-symbols-outlined text-amber-500 text-[20px]"> warning </span>,
  info: <span className="material-symbols-outlined text-blue-500 text-[20px]"> info </span>,
  loading: <span className="material-symbols-outlined text-zinc-400 text-[20px] animate-spin"> progress_activity </span>,
};

interface ToastAction {
  label: string;
  onClick: () => void;
}

// ============================================================================
// Core Functions
// ============================================================================

export const toastSuccess = (message: string, options?: { description?: string; action?: ToastAction; duration?: number }) => {
  sonnerToast.success(message, {
    icon: Icons.success,
    description: options?.description,
    duration: options?.duration || 3000,
    action: options?.action ? {
      label: options.action.label,
      onClick: options.action.onClick,
    } : undefined,
    // Las clases personalizadas se definen globalmente en el Toaster provider (App.tsx),
    // pero aquí forzamos estilos si es necesario en un 'custom toast' interno.
  });
};

export const toastError = (message: string, description: string = 'Ha ocurrido un error inesperado') => {
  sonnerToast.error(message, {
    icon: Icons.error,
    description,
    duration: 5000, // Los errores deben durar más para leerse
    action: {
      label: 'Cerrar',
      onClick: () => { },
    },
  });
};

export const toastWarning = (message: string, description?: string) => {
  sonnerToast.warning(message, {
    icon: Icons.warning,
    description,
    duration: 4000,
  });
};

export const toastInfo = (message: string, description?: string) => {
  sonnerToast.info(message, {
    icon: Icons.info,
    description,
    duration: 4000,
  });
};

export const toastLoading = (message: string) => {
  return sonnerToast.loading(message, {
    icon: Icons.loading,
  });
};

// ============================================================================
// Promise Handlers (Estados asíncronos complejos)
// ============================================================================

export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    // Iconos personalizados para cada estado de la promesa
    // (Sonner los maneja internamente pero esto asegura consistencia)
  });
};

// ============================================================================
// State Updaters
// ============================================================================

export const toastUpdateSuccess = (id: string | number, message: string) => {
  sonnerToast.success(message, {
    id,
    icon: Icons.success,
    duration: 3000,
  });
};

export const toastUpdateError = (id: string | number, message: string) => {
  sonnerToast.error(message, {
    id,
    icon: Icons.error,
    duration: 4000,
  });
};

export const toastDismiss = (id?: string | number) => sonnerToast.dismiss(id);

// ============================================================================
// Custom Styled Toast (Custom Layouts)
// Use esto cuando el toast estándar de Sonner no sea suficiente
// ============================================================================

export const toastCustom = (render: (id: string | number) => React.ReactElement, options?: ExternalToast) => {
  return sonnerToast.custom(render, options);
};

// ============================================================================
// Fintech Domain Specific Toasts
// ============================================================================

export const toastTransactionSaved = (amount: number, type: 'income' | 'expense', onUndo?: () => void) => {
  const formattedAmount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  sonnerToast.success(
    type === 'income' ? 'Ingreso registrado' : 'Gasto registrado',
    {
      description: `${type === 'income' ? '+' : '-'}${formattedAmount}`,
      icon: Icons.success,
      action: onUndo ? {
        label: 'Deshacer',
        onClick: onUndo
      } : undefined
    }
  );
};

export const toastMSIPayment = (amount: number, planName: string) => {
  const formattedAmount = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  sonnerToast.message('Pago de MSI registrado', {
    icon: <span className="material-symbols-outlined text-purple-500 text-[20px]"> credit_score </span>,
    description: `Se abonaron ${formattedAmount} a "${planName}"`
  });
};

export const toastInsufficientFunds = (details?: string) => {
  toastError('Fondos Insuficientes', details || 'La cuenta seleccionada no tiene saldo para cubrir esta operación.');
};

export const toastNetworkError = () => {
  toastError('Sin conexión', 'Verifica tu internet e inténtalo de nuevo.');
};

// Re-export original for edge cases
export { sonnerToast as toast };