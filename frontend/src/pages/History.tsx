import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';
import { useTransactions, useCategories, useDeleteTransaction, useAccounts, useRestoreTransaction, useInstallmentPurchases } from '../hooks/useApi';
import { toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DeleteConfirmationSheet, WarningLevel, ImpactDetail } from '../components/DeleteConfirmationSheet';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonTransactionList } from '../components/Skeleton';
import { formatDateUTC } from '../utils/dateUtils';
import { TransactionDetailSheet } from '../components/TransactionDetailSheet';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: installments } = useInstallmentPurchases();

  // Mutations
  const deleteTransactionMutation = useDeleteTransaction();
  const restoreTransactionMutation = useRestoreTransaction();

  // State
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  // Helpers
  const getCategoryInfo = (id: string | null) => categories?.find(c => c.id === id) || { icon: 'sell', color: '#71717A', name: 'General' };
  const getAccount = (id: string | null) => accounts?.find(a => a.id === id);
  const getAccountName = (id: string | null) => getAccount(id)?.name || 'Cuenta';

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Sorting & Filtering
  const sortedTxs = useMemo(() => {
    if (!transactions) return [];
    const filtered = filterType === 'all' ? transactions : transactions.filter(tx => tx.type === filterType);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const grouped = sortedTxs.reduce((groups, tx) => {
    const date = formatDateUTC(tx.date, { style: 'long' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Edit Logic
  const handleEditClick = (tx: Transaction) => {
    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';
    const isAdjustment = tx.description.toLowerCase().includes('ajuste');

    const isLoan = tx.loanId;

    if (isInitialMsi) {
      toast.info('Bloqueado', { description: 'Edita esta compra desde la sección MSI' });
      return;
    }

    if (isLoan) {
      toast.info('Gestionar Préstamo', {
        description: 'Redirigiendo al detalle del préstamo...',
        duration: 1500
      });
      navigate(`/loans`, { replace: true });
      return;
    }

    if (isAdjustment) {
      toast.info('No editable', { description: 'Los ajustes de saldo no se pueden modificar' });
      return;
    }

    navigate(`/new?editId=${tx.id}`, { replace: true });
  };

  // Deletion Logic
  const handleDeleteClick = (tx: Transaction) => {
    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';
    const isLoan = tx.loanId;

    if (isInitialMsi) {
      toast.info('Bloqueado', { description: 'Administra esta compra desde MSI' });
      return;
    }

    if (isLoan) {
      toast.warning('Acción requerida', {
        description: 'Debes eliminar el préstamo desde la sección de Préstamos para asegurar la integridad de los datos.',
        action: {
          label: 'Ir a Préstamos',
          onClick: () => navigate('/loans')
        }
      });
      return;
    }
    setItemToDelete(tx);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteTransactionMutation.mutateAsync(itemToDelete.id);

      const deletedId = itemToDelete.id;
      const desc = itemToDelete.description;
      setItemToDelete(null);

      toast.success('Transacción eliminada', {
        description: desc,
        action: {
          label: 'Deshacer',
          onClick: () => restoreTransactionMutation.mutateAsync(deletedId)
        },
      });
    } catch (e: any) {
      toast.error('Error eliminando', { description: e.message });
    }
  };

  // Warning Logic
  const getDeletionImpact = (tx: Transaction): any => {
    // Simplificación rápida de tu lógica original para mantener el refactor limpio
    const isMsiPayment = tx.installmentPurchaseId && ['income', 'transfer'].includes(tx.type);
    const installment = installments?.find(i => i.id === tx.installmentPurchaseId);
    const isSettled = installment ? (installment.totalAmount - installment.paidAmount) <= 0.05 : false;

    if (isMsiPayment && isSettled) return { warningLevel: 'critical', warningMessage: 'MSI Liquidado afectado' };
    if (isMsiPayment) return { warningLevel: 'warning', warningMessage: 'Pago de MSI' };
    return { warningLevel: 'normal', impactPreview: { account: getAccountName(tx.accountId), balanceChange: tx.amount } };
  };

  const deletionImpact = itemToDelete ? getDeletionImpact(itemToDelete) : null;
  const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingAccounts;


  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
      <PageHeader title="Historial" />

      {/* Sticky Filter Bar */}
      <div className="sticky top-14 z-20 bg-app-bg/95 backdrop-blur-md border-b border-app-border pt-3 pb-2 px-4 transition-all">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => {
            const labels: any = { all: 'Todo', income: 'Ingresos', expense: 'Gastos', transfer: 'Transferencias' };
            const active = filterType === type;

            let activeClass = 'bg-app-text text-app-bg shadow-sm'; // default (all)
            if (active && type === 'income') activeClass = 'bg-emerald-500 text-white shadow-sm';
            if (active && type === 'expense') activeClass = 'bg-rose-500 text-white shadow-sm';
            if (active && type === 'transfer') activeClass = 'bg-blue-500 text-white shadow-sm';

            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all border ${active
                  ? `${activeClass} border-transparent`
                  : 'bg-app-surface text-app-muted border-app-border hover:bg-app-subtle'
                  }`}
              >
                {labels[type]}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 py-6"><SkeletonTransactionList count={6} /></div>
      ) : (
        <div className="px-4 py-4 max-w-2xl mx-auto min-h-[500px]">
          {Object.entries(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <span className="material-symbols-outlined text-4xl mb-2">history</span>
              <p className="text-sm font-medium">No hay movimientos recientes</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, txs]) => (
              <div key={date} className="mb-6 relative">
                <h3 className="sticky top-[110px] z-10 py-1.5 px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-app-muted bg-app-subtle/80 backdrop-blur-md rounded-lg w-fit">
                  {date}
                </h3>
                <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border">
                  {txs.map((tx, index) => {
                    const cat = getCategoryInfo(tx.categoryId);
                    const isExp = tx.type === 'expense';
                    const isInc = tx.type === 'income';
                    const isTrf = tx.type === 'transfer';
                    const accName = getAccountName(tx.accountId);

                    // Badges logic simplified
                    const isMsi = tx.installmentPurchaseId && !isExp;
                    const isFirst = index === 0;
                    const isLast = index === txs.length - 1;

                    return (
                      <SwipeableItem
                        key={tx.id}
                        className={`${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''}`}
                        // Swipe RIGHT -> muestra leftAction (Editar)
                        leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                        onSwipeRight={() => handleEditClick(tx)}
                        // Swipe LEFT -> muestra rightAction (Eliminar)
                        rightAction={{ icon: 'delete', color: '#ef4444', label: 'Borrar' }}
                        onSwipeLeft={() => handleDeleteClick(tx)}
                      >
                        <div
                          onClick={() => setSelectedTx(tx)}
                          className="flex items-center gap-3 p-3.5 transition-colors cursor-pointer hover:bg-app-subtle/50"
                        >
                          <div
                            className={`size-10 rounded-full flex items-center justify-center shrink-0 border`}
                            style={{
                              backgroundColor: isTrf ? '#f1f5f9' : `${cat.color}15`,
                              borderColor: isTrf ? 'transparent' : `${cat.color}30`,
                              color: isTrf ? '#64748b' : cat.color
                            }}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isTrf ? 'sync_alt' : cat.icon}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-app-text truncate">{isTrf ? 'Transferencia' : tx.description}</span>
                              {isMsi && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">MSI</span>}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-app-muted truncate">{cat.name}</span>
                              <span className="text-[10px] text-app-border font-light">•</span>
                              <span className="text-xs text-app-muted truncate max-w-[100px]">{accName}</span>
                            </div>
                          </div>

                          <div className={`font-bold tabular-nums text-[15px] shrink-0 ${isInc ? 'text-emerald-600 dark:text-emerald-400' : isExp ? 'text-app-text' : 'text-blue-600 dark:text-blue-400'}`}>
                            {isExp ? '-' : isInc ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
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

      {/* Confirmation Modal Logic */}
      {itemToDelete && deletionImpact && (
        <DeleteConfirmationSheet
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
          itemName={itemToDelete.description}
          isDeleting={deleteTransactionMutation.isPending}
          {...deletionImpact}
        />
      )}

      {/* Transaction Detail Sheet */}
      <TransactionDetailSheet
        transaction={selectedTx}
        category={selectedTx ? getCategoryInfo(selectedTx.categoryId) : undefined}
        account={selectedTx ? getAccount(selectedTx.accountId) : undefined}
        destinationAccount={selectedTx?.destinationAccountId ? getAccount(selectedTx.destinationAccountId) : undefined}
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={(tx) => {
          setSelectedTx(null);
          handleEditClick(tx);
        }}
        onDelete={(tx) => {
          setSelectedTx(null);
          handleDeleteClick(tx);
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default History;