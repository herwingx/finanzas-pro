import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';
import { useDeletedTransactions, useRestoreTransaction, usePermanentDeleteTransaction, useCategories, useAccounts } from '../hooks/useApi';
import { toastSuccess, toastError, toastWarning, toastInfo, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { SwipeableItem } from '../components/SwipeableItem';

const TrashPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: deletedTransactions, isLoading } = useDeletedTransactions();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const restoreTransactionMutation = useRestoreTransaction();
  const permanentDeleteMutation = usePermanentDeleteTransaction();

  const sortedTxs = useMemo(() => {
    return deletedTransactions
      ? [...deletedTransactions].sort(
        (a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
      )
      : [];
  }, [deletedTransactions]);

  const getCategoryInfo = (id: string | null) =>
    categories?.find((c) => c.id === id) || { icon: 'sell', color: '#999', name: 'General' };
  const getAccountName = (id: string | null) =>
    accounts?.find((a) => a.id === id)?.name || 'Cuenta desconocida';

  const handleRestore = async (tx: Transaction) => {
    // Security Check: Ensure accounts still exist
    const accountExists = accounts?.some(a => a.id === tx.accountId);
    if (!accountExists) {
      toastError('La cuenta de origen ya no existe. No se puede restaurar.');
      return;
    }

    if (tx.type === 'transfer' && tx.destinationAccountId) {
      const destAccountExists = accounts?.some(a => a.id === tx.destinationAccountId);
      if (!destAccountExists) {
        toastError('La cuenta destino ya no existe. No se puede restaurar.');
        return;
      }
    }

    try {
      await restoreTransactionMutation.mutateAsync(tx.id);
      toastSuccess(`Transacción restaurada: ${tx.description}`);
    } catch (error: any) {
      toastError(`Error al restaurar: ${error.message}`);
    }
  };

  const handlePermanentDelete = (tx: Transaction) => {
    // Direct hard delete without extra confirm (Swipe is the confirm)
    // or maybe a gentle confirm toast? "Deleting forever..."
    permanentDeleteMutation.mutate(tx.id, {
      onSuccess: () => toastSuccess('Eliminado permanentemente'),
      onError: () => toastError('Error al eliminar')
    });
  };

  const grouped = sortedTxs.reduce((groups, tx) => {
    const deletedDate = tx.deletedAt
      ? new Date(tx.deletedAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : 'Fecha desconocida';
    if (!groups[deletedDate]) groups[deletedDate] = [];
    groups[deletedDate].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const getDaysUntilPurge = (deletedAt?: string) => {
    if (!deletedAt) return 0;
    const deleted = new Date(deletedAt);
    const purgeDate = new Date(deleted.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const now = new Date();
    const diffTime = purgeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="pb-28 bg-app-bg min-h-screen text-app-text relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-app-primary/5 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-app-secondary/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      <PageHeader title="Papelera" showBackButton />

      {/* Info Banner */}
      <div className="mx-4 mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <div className="text-sm">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Transacciones Eliminadas Recientemente
            </p>
            <p className="text-app-muted">
              Las transacciones eliminadas se mantienen aquí por 7 días antes de ser eliminadas
              permanentemente. Puedes restaurarlas en cualquier momento durante este período.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 mt-6">
          <SkeletonTransactionList count={5} />
        </div>
      ) : (
        <div className="px-4 py-2 mt-4 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="pt-20 text-center">
              <span className="material-symbols-outlined text-6xl text-app-muted mb-4 block">
                delete_sweep
              </span>
              <p className="text-app-muted">No hay transacciones eliminadas.</p>
            </div>
          ) : (
            Object.keys(grouped).map((date) => (
              <div key={date}>
                <h3 className="text-sm font-bold my-3 sticky top-16 bg-app-bg py-2 z-10">{date}</h3>
                <div className="space-y-3">
                  {grouped[date].map((tx) => {
                    const isTransfer = tx.type === 'transfer';
                    const isOrphanedMSI = tx.installmentPurchaseId && tx.type === 'expense'; // Initial MSI purchase (plan deleted)
                    const category = isTransfer
                      ? { icon: 'swap_horiz', color: '#64748b', name: 'Transferencia' } // Slate-500 for generic transfer
                      : getCategoryInfo(tx.categoryId);

                    const daysLeft = getDaysUntilPurge(tx.deletedAt);
                    const subTitle = isTransfer
                      ? `${getAccountName(tx.accountId)} → ${getAccountName(tx.destinationAccountId)}`
                      : `${category.name} • ${daysLeft} días restantes`;

                    return (
                      <SwipeableItem
                        key={tx.id}
                        onSwipeRight={() => {
                          if (isOrphanedMSI) {
                            toastError('No se puede restaurar: El plan MSI fue eliminado. Crea uno nuevo desde "Meses Sin Intereses".');
                            return;
                          }
                          handleRestore(tx);
                        }}
                        rightAction={{
                          icon: isOrphanedMSI ? 'block' : 'restore_from_trash',
                          color: isOrphanedMSI ? '#94a3b8' : '#10b981',
                          label: isOrphanedMSI ? 'Bloqueado' : 'Restaurar',
                        }}
                        onSwipeLeft={() => handlePermanentDelete(tx)}
                        leftAction={{
                          icon: 'delete_forever', // Indicating permanent
                          color: '#ef4444',
                          label: 'Eliminar',
                        }}
                        className="rounded-2xl"
                      >
                        <div className="card-modern bg-app-card border border-app-border rounded-2xl p-3 opacity-60 flex items-center justify-between gap-4 transition-premium hover:opacity-100 hover:shadow-md">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className="size-10 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${category.color}20` }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ color: category.color }}
                              >
                                {category.icon}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-app-text">{tx.description || (isTransfer ? 'Transferencia' : 'Sin descripción')}</p>
                              <div className="flex items-center gap-2">
                                {tx.recurringTransactionId && (
                                  <span
                                    className="material-symbols-outlined text-xs text-app-muted"
                                    title="Recurrente"
                                  >
                                    repeat
                                  </span>
                                )}
                                {tx.installmentPurchaseId && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOrphanedMSI
                                    ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
                                    : 'text-app-primary bg-app-primary/10'
                                    }`}>
                                    {isOrphanedMSI ? 'MSI ⚠️' : 'MSI'}
                                  </span>
                                )}
                                <p className="text-xs text-app-muted truncate">{subTitle}</p>
                              </div>
                            </div>
                          </div>
                          <p className={`font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-app-success' : 'text-app-text'}`}>
                            {tx.type === 'expense' ? '-' : (tx.type === 'transfer' ? '' : '+')}{tx.amount.toFixed(2)}
                          </p>
                        </div>
                      </SwipeableItem>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default TrashPage;
