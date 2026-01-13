import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SwipeableSheet } from '../SwipeableSheet'; // Asegúrate de que este path sea correcto
import { useNotifications, useDismissNotification, useMarkAllNotificationsRead, useAddTransaction } from '../../hooks/useApi';
import { toastSuccess, toastError, toastInfo } from '../../utils/toast';

interface NotificationsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsSheet: React.FC<NotificationsSheetProps> = ({ isOpen, onClose }) => {
  const { data: notifications } = useNotifications();
  const { mutate: dismiss } = useDismissNotification();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: addTransaction } = useAddTransaction();

  // Lógica para procesar el pago directamente desde la alerta
  const handlePaymentAction = (n: any) => {
    if (n.type === 'PAYMENT_DUE') {
      const { amount, description, categoryId, accountId } = n.data || {};

      if (amount && accountId) {
        // "Quick Pay": Registra la transacción automáticamente
        addTransaction({
          amount: Number(amount),
          description: description || n.title.replace('Vence Hoy', '').trim(),
          date: new Date().toISOString(),
          type: 'expense',
          categoryId: categoryId || 'other',
          accountId: accountId,
        }, {
          onSuccess: () => {
            toastSuccess('Pago registrado correctamente');
            dismiss(n.id); // Elimina la alerta al pagar
          },
          onError: () => toastError('Error al registrar el pago')
        });
      } else {
        toastInfo('Faltan datos para el autopago. Por favor registra manual.');
      }
    } else {
      dismiss(n.id);
    }
  };

  const hasUnread = (notifications?.length || 0) > 0;

  return (
    <SwipeableSheet isOpen={isOpen} onClose={onClose} title="Alertas e Insights">
      <div className="pb-24">

        {/* Header Action */}
        {hasUnread && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => markAllRead()}
              className="text-xs font-bold text-app-primary uppercase tracking-wide hover:underline"
            >
              Marcar todo como leído
            </button>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {notifications?.map((n: any) => (
              <motion.div
                key={n.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className={`
                  relative overflow-hidden p-4 rounded-2xl border bg-app-surface
                  ${n.type === 'PAYMENT_DUE' ? 'border-app-warning/50' : 'border-app-border'}
                  shadow-sm
                `}
              >
                <div className="flex gap-3">
                  {/* Icon based on type */}
                  <div className={`
                        size-10 rounded-full flex items-center justify-center shrink-0
                        ${n.type === 'PAYMENT_DUE' ? 'bg-amber-500/10 text-amber-600' : 'bg-app-subtle text-app-muted'}
                    `}>
                    <span className="material-symbols-outlined text-[20px]">
                      {n.type === 'PAYMENT_DUE' ? 'receipt_long' : 'notifications'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-app-text leading-tight mb-1 truncate">{n.title}</h4>
                    <p className="text-xs text-app-muted leading-relaxed mb-3 break-words">{n.body}</p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {n.type === 'PAYMENT_DUE' && (
                        <button
                          onClick={() => handlePaymentAction(n)}
                          className="px-3 py-1.5 bg-app-primary text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all"
                        >
                          Pagar Ahora
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="px-3 py-1.5 bg-app-subtle text-app-text text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {n.type === 'PAYMENT_DUE' ? 'Posponer' : 'Entendido'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {(!notifications || notifications.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-app-muted">
              <div className="size-16 rounded-full bg-app-subtle flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl opacity-30">check_circle</span>
              </div>
              <p className="font-medium text-sm">Estás al día</p>
              <p className="text-xs opacity-60">No tienes alertas pendientes.</p>
            </div>
          )}
        </div>
      </div>
    </SwipeableSheet>
  );
};