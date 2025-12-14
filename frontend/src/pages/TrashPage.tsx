import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { useDeletedTransactions, useRestoreTransaction, usePermanentDeleteTransaction, useCategories, useAccounts } from '../hooks/useApi';
import { toastSuccess, toastError, toastInfo } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { SwipeableItem } from '../components/SwipeableItem';

const TrashPage: React.FC = () => {
  const { data: deletedTransactions, isLoading } = useDeletedTransactions();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();
  const restoreTransactionMutation = useRestoreTransaction();
  const permanentDeleteMutation = usePermanentDeleteTransaction();

  const getCategoryInfo = (id: string | null) => categories?.find(c => c.id === id) || { icon: 'delete_outline', color: '#9ca3af', name: 'General' };
  const getAccountName = (id: string | null) => accounts?.find(a => a.id === id)?.name || 'Cuenta Desconocida';

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const sortedTxs = useMemo(() => {
    return deletedTransactions ? [...deletedTransactions].sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()) : [];
  }, [deletedTransactions]);

  const handleRestore = async (tx: Transaction) => {
    // Basic checks
    if (!accounts?.some(a => a.id === tx.accountId)) return toastError('Cuenta origen no existe');
    if (tx.type === 'transfer' && tx.destinationAccountId && !accounts?.some(a => a.id === tx.destinationAccountId)) {
      return toastError('Cuenta destino no existe');
    }

    try {
      await restoreTransactionMutation.mutateAsync(tx.id);
      toastSuccess('Restaurado');
    } catch (error: any) {
      toastError(error.message);
    }
  };

  const handlePermanentDelete = (tx: Transaction) => {
    permanentDeleteMutation.mutate(tx.id, {
      onSuccess: () => toastInfo('Eliminado para siempre'),
      onError: () => toastError('Error al eliminar')
    });
  };

  const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return 0;
    const purgeDate = new Date(new Date(dateStr).getTime() + (7 * 86400000));
    return Math.max(0, Math.ceil((purgeDate.getTime() - Date.now()) / 86400000));
  };

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
      <PageHeader title="Papelera de Reciclaje" showBackButton />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Info Card */}
        <div className="bg-app-subtle border border-app-border rounded-xl p-4 mb-6 flex gap-3">
          <span className="material-symbols-outlined text-app-muted">auto_delete</span>
          <div className="text-xs text-app-muted leading-relaxed">
            Los elementos se eliminarán automáticamente después de <span className="font-bold text-app-text">7 días</span>.
            Desliza a la derecha para restaurar.
          </div>
        </div>

        {isLoading ? <SkeletonTransactionList count={6} /> : (
          <div className="space-y-4">
            {sortedTxs.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                <span className="material-symbols-outlined text-5xl mb-2">delete</span>
                <p className="text-sm">Papelera vacía</p>
              </div>
            ) : (
              sortedTxs.map(tx => {
                const cat = getCategoryInfo(tx.categoryId);
                const isInc = tx.type === 'income';
                const isTrf = tx.type === 'transfer';
                const daysLeft = getDaysLeft(tx.deletedAt);
                const msiPlanDead = tx.installmentPurchaseId && tx.type === 'expense' && !accounts?.some(a => a.id === tx.accountId); // Mock logic for orphaned

                return (
                  <SwipeableItem
                    key={tx.id}
                    onSwipeRight={() => !msiPlanDead && handleRestore(tx)}
                    rightAction={msiPlanDead ? undefined : { icon: 'restore_from_trash', color: 'var(--brand-primary)', label: 'Restaurar' }}
                    onSwipeLeft={() => handlePermanentDelete(tx)}
                    leftAction={{ icon: 'delete_forever', color: '#ef4444', label: 'Eliminar Ya' }}
                    className="mb-3"
                  >
                    <div className="flex items-center gap-3 p-3 bg-app-surface border border-app-border rounded-xl opacity-75 hover:opacity-100 transition-opacity">
                      <div
                        className="size-10 rounded-full flex items-center justify-center shrink-0 border border-transparent bg-app-subtle text-app-muted"
                      >
                        <span className="material-symbols-outlined text-[20px]">{isTrf ? 'swap_horiz' : cat.icon}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-app-text truncate decoration-slice line-through decoration-app-border">{tx.description}</p>
                        <div className="flex gap-2 text-[10px] text-app-muted mt-0.5">
                          <span>{cat.name}</span>
                          <span>•</span>
                          <span className="text-rose-500 font-bold">{daysLeft} días restantes</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-app-muted line-through">{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] text-app-muted">{new Date(tx.deletedAt!).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </SwipeableItem>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashPage;