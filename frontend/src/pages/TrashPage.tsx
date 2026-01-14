import React, { useMemo } from 'react';

// Hooks & Types
import { useDeletedTransactions, useRestoreTransaction, usePermanentDeleteTransaction, useCategories, useAccounts } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import { Transaction } from '../types';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonTransactionList } from '../components/Skeleton';

// Utils
import { toastSuccess, toastError, toast } from '../utils/toast';
import { formatDateUTC } from '../utils/dateUtils';

const TrashPage: React.FC = () => {
  // Query
  const { data: deletedTransactions, isLoading } = useDeletedTransactions();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  // Mutation
  const restoreTx = useRestoreTransaction();
  const permDeleteTx = usePermanentDeleteTransaction();
  const isMobile = useIsMobile();

  /* Logic & Memos */
  const categoryMap = useMemo(() => new Map(categories?.map(c => [c.id, c])), [categories]);

  const getCategoryInfo = (id: string | null) => categoryMap.get(id || '') || { icon: 'delete', color: 'var(--text-muted)', name: 'General' };
  const getAccount = (id: string | null) => accounts?.find(a => a.id === id);
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const getDaysLeft = (dateStr?: string) => {
    if (!dateStr) return 0;
    const expire = new Date(dateStr).getTime() + (7 * 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((expire - Date.now()) / (24 * 60 * 60 * 1000)));
  };

  /* Handlers */
  const handleRestore = async (tx: Transaction) => {
    if (!getAccount(tx.accountId)) return toastError('Cuenta origen eliminada', 'Restaura la cuenta primero.');
    if (tx.destinationAccountId && !getAccount(tx.destinationAccountId)) return toastError('Cuenta destino no existe.');

    try {
      await restoreTx.mutateAsync(tx.id);
      toastSuccess('Elemento recuperado');
    } catch (e: any) { toastError('Falló restauración'); }
  };

  const handleDeletePermanent = (tx: Transaction) => {
    // Inline confirmation for safety
    if (!window.confirm('¿Borrar definitivamente? Esta acción no se puede deshacer.')) return;
    permDeleteTx.mutate(tx.id);
  };


  if (isLoading) return (
    <div className="min-h-dvh bg-app-bg pb-safe">
      <PageHeader title="Papelera" showBackButton />
      <div className="p-4"><SkeletonTransactionList count={5} /></div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
      <PageHeader title="Reciclaje" showBackButton />

      <main className="max-w-2xl mx-auto px-4 py-4 pb-20 animate-fade-in space-y-6">

        {/* 1. INFO CARD */}
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 items-start">
          <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full p-1.5 shrink-0">
            <span className="material-symbols-outlined text-lg">auto_delete</span>
          </div>
          <div>
            <p className="text-xs text-amber-900 dark:text-amber-100 font-bold mb-0.5">Purgado Automático</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
              Los ítems se eliminan permanentemente después de 7 días. Desliza para gestionar.
            </p>
          </div>
        </div>

        {/* 2. LIST */}
        <div className="space-y-3">
          {deletedTransactions?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40 border-2 border-dashed border-app-border rounded-3xl">
              <span className="material-symbols-outlined text-5xl mb-2 text-app-muted">recycling</span>
              <p className="text-sm font-medium text-app-text">La papelera está vacía</p>
            </div>
          ) : (
            deletedTransactions?.map(tx => {
              const daysLeft = getDaysLeft(tx.deletedAt);
              const isExp = tx.type === 'expense';
              const cat = getCategoryInfo(tx.categoryId);

              return (
                <SwipeableItem
                  key={tx.id}
                  leftAction={{ icon: 'restore_from_trash', color: 'text-white', bgColor: 'bg-indigo-500', label: 'Restaurar' }}
                  onSwipeRight={() => handleRestore(tx)}
                  rightAction={{ icon: 'delete_forever', color: 'text-white', bgColor: 'bg-rose-500', label: 'Eliminar' }}
                  onSwipeLeft={() => handleDeletePermanent(tx)}
                  className="rounded-2xl"
                  disabled={!isMobile}
                >
                  <div className="bento-card p-4 flex items-center gap-4 bg-app-surface/60 opacity-85 hover:opacity-100 hover:border-app-border-strong transition-all grayscale-30 hover:grayscale-0">
                    <div className="size-10 rounded-xl bg-app-subtle border border-app-border flex items-center justify-center text-app-muted">
                      <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-app-text line-through decoration-rose-500/50 decoration-2">{tx.description}</p>
                      </div>
                      <div className="flex gap-2 text-[10px] text-app-muted mt-0.5 font-medium uppercase tracking-wide">
                        <span>{isExp ? 'Gasto' : 'Ingreso'}</span>
                        <span>•</span>
                        <span className={daysLeft <= 2 ? 'text-rose-500 font-bold' : ''}>
                          Caduca en {daysLeft} días
                        </span>
                      </div>
                    </div>

                    <div className="text-right opacity-60">
                      <p className="text-sm font-bold text-app-text tabular-nums line-through decoration-app-muted">{formatCurrency(tx.amount)}</p>
                      <p className="text-[9px] text-app-muted">{formatDateUTC(tx.deletedAt!, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
};

export default TrashPage;