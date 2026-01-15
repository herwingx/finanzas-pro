import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SwipeableBottomSheet } from '../SwipeableBottomSheet';
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

  // Action Logic
  const handlePaymentAction = (n: any) => {
    if (n.type === 'PAYMENT_DUE') {
      const { amount, description, categoryId, accountId } = n.data || {};

      if (amount && accountId) {
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
            dismiss(n.id);
          },
          onError: () => toastError('Error al registrar pago automático')
        });
      } else {
        toastInfo('Faltan datos para el pago automático.');
      }
    } else {
      dismiss(n.id);
    }
  };

  const hasUnread = (notifications?.length || 0) > 0;

  return (
    <SwipeableBottomSheet isOpen={isOpen} onClose={onClose} title="Alertas e Insights">
      <div className="pb-10 pt-2 min-h-[50vh]">

        {/* Bulk Action Header */}
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="text-xs font-bold text-app-muted uppercase tracking-wider">{notifications?.length || 0} Nuevas</span>
          {hasUnread && (
            <button
              onClick={() => markAllRead()}
              className="text-xs font-bold text-app-primary hover:bg-app-subtle px-2 py-1 rounded-lg transition-colors"
            >
              Limpiar Todo
            </button>
          )}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications?.map((n: any) => {
              const isDue = n.type === 'PAYMENT_DUE';

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`
                      relative p-4 rounded-3xl border bg-app-surface
                      ${isDue ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10' : 'border-app-border'}
                    `}
                >
                  <div className="flex gap-4 items-start">
                    {/* Icon Badge */}
                    <div className={`
                            size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                            ${isDue ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-app-subtle text-app-muted'}
                        `}>
                      <span className="material-symbols-outlined text-[20px]">{isDue ? 'receipt_long' : 'notifications'}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold leading-tight mb-1 truncate ${isDue ? 'text-amber-900 dark:text-amber-100' : 'text-app-text'}`}>
                        {n.title}
                      </h4>
                      <p className="text-xs text-app-muted leading-relaxed mb-4">{n.body}</p>

                      <div className="flex gap-2">
                        {isDue && (
                          <button
                            onClick={() => handlePaymentAction(n)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                          >
                            Pagar Ahora
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="px-4 py-2 bg-white dark:bg-black/20 border border-black/5 text-xs font-bold text-app-text rounded-xl hover:bg-black/5 active:scale-95 transition-all"
                        >
                          {isDue ? 'Descartar' : 'Entendido'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {!hasUnread && (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <div className="size-20 rounded-full bg-app-subtle flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-app-muted opacity-50">done_all</span>
              </div>
              <p className="text-sm font-bold text-app-text">Sin Notificaciones</p>
              <p className="text-xs text-app-muted mt-1 max-w-[200px] text-center">Te avisaremos sobre pagos pendientes y logros financieros.</p>
            </div>
          )}
        </div>
      </div>
    </SwipeableBottomSheet>
  );
};