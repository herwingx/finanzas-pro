import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '../types';
import { useTransactions, useCategories, useDeleteTransaction, useAccounts, useRestoreTransaction, useInstallmentPurchases } from '../hooks/useApi';
import { toastInfo, toastSuccess, toastError, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DeleteConfirmationSheet, WarningLevel, ImpactDetail } from '../components/DeleteConfirmationSheet';
import { SwipeableItem } from '../components/SwipeableItem';
import { SkeletonTransactionList } from '../components/Skeleton';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading: isLoadingTransactions } = useTransactions();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: installments } = useInstallmentPurchases();
  const deleteTransactionMutation = useDeleteTransaction();
  const restoreTransactionMutation = useRestoreTransaction();

  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  const sortedTxs = useMemo(() => {
    if (!transactions) return [];

    // Apply type filter only
    const filteredTxs = filterType === 'all'
      ? transactions
      : transactions.filter(tx => tx.type === filterType);

    return filteredTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType]);

  const getCategoryInfo = (id: string | null) => categories?.find(c => c.id === id) || { icon: 'sell', color: '#999', name: 'General' };
  const getAccountName = (id: string | null) => accounts?.find(a => a.id === id)?.name || 'Cuenta';
  const getAccount = (id: string | null) => accounts?.find(a => a.id === id);

  // Get account type color
  const getAccountColor = (id: string | null) => {
    const account = getAccount(id);
    if (!account) return '#64748b';
    if (account.type === 'CREDIT') return '#f59e0b'; // amber
    if (account.type === 'DEBIT') return '#3b82f6'; // blue
    if (account.type === 'CASH') return '#22c55e'; // green
    return '#64748b';
  };

  // Get account icon
  const getAccountIcon = (id: string | null) => {
    const account = getAccount(id);
    if (!account) return 'account_balance';
    if (account.type === 'CREDIT') return 'credit_card';
    if (account.type === 'DEBIT') return 'account_balance';
    if (account.type === 'CASH') return 'payments';
    return 'account_balance_wallet';
  };

  // Calculate warning level and details for deletion
  const getDeletionImpact = (tx: Transaction): {
    warningLevel: WarningLevel;
    warningMessage?: string;
    warningDetails?: string[];
    impactPreview?: ImpactDetail;
    requireConfirmation?: boolean;
  } => {
    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';
    const isMsiPayment = tx.installmentPurchaseId && (tx.type === 'income' || tx.type === 'transfer');
    const installment = installments?.find(i => i.id === tx.installmentPurchaseId);
    const isSettled = installment ? (installment.totalAmount - installment.paidAmount) <= 0.05 : false;

    // Level 3: Critical - Settled MSI Plan
    if (isMsiPayment && isSettled) {
      return {
        warningLevel: 'critical',
        warningMessage: 'PELIGRO: Integridad Histórica Comprometida',
        warningDetails: [
          'Este pago pertenece a un plan MSI totalmente liquidado.',
          'Eliminarlo revertirá TODOS los registros contables.',
          'Tus saldos actuales dejarán de coincidir con la realidad de tu banco.',
          'Solo elimina esto si TODA la operación fue un error de captura.',
        ],
        impactPreview: {
          account: getAccountName(tx.accountId),
          balanceChange: tx.type === 'income' ? -tx.amount : tx.amount,
          msiPlan: installment?.description,
          msiProgress: {
            current: installment?.paidInstallments || 0,
            total: installment?.installments || 0,
          },
        },
        requireConfirmation: true,
      };
    }

    // Level 2: Warning - Active MSI Payment
    if (isMsiPayment && !isSettled) {
      return {
        warningLevel: 'warning',
        warningMessage: 'Advertencia: Esto afectará tu plan de MSI',
        warningDetails: [
          'El dinero regresará a tu cuenta de origen.',
          'La deuda en tu tarjeta de crédito aumentará.',
          'El plan MSI retrocederá en progreso.',
          'Solo elimina esto si fue un error de captura reciente.',
        ],
        impactPreview: {
          account: getAccountName(tx.accountId),
          balanceChange: tx.type === 'income' ? -tx.amount : tx.amount,
          msiPlan: installment?.description,
          msiProgress: {
            current: installment?.paidInstallments || 0,
            total: installment?.installments || 0,
          },
        },
      };
    }

    // Initial MSI should not reach here (blocked earlier), but just in case
    if (isInitialMsi) {
      return {
        warningLevel: 'critical',
        warningMessage: 'No puedes eliminar esta compra',
        warningDetails: ['Administra esta compra desde la sección "Meses Sin Intereses".'],
      };
    }

    // Level 1: Normal transaction
    const account = getAccount(tx.accountId);
    const destinationAccount = tx.destinationAccountId ? getAccount(tx.destinationAccountId) : null;

    let balanceChange = 0;
    if (tx.type === 'income') {
      balanceChange = account?.type === 'CREDIT' ? tx.amount : -tx.amount;
    } else if (tx.type === 'expense') {
      balanceChange = account?.type === 'CREDIT' ? -tx.amount : tx.amount;
    } else if (tx.type === 'transfer') {
      balanceChange = account?.type === 'CREDIT' ? -tx.amount : tx.amount;
    }

    return {
      warningLevel: 'normal',
      impactPreview: {
        account: getAccountName(tx.accountId),
        balanceChange,
      },
    };
  };

  const handleDeleteClick = (tx: Transaction) => {
    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';

    if (isInitialMsi) {
      toastInfo('Administra esta compra desde la sección "Meses Sin Intereses"');
      return;
    }

    setItemToDelete(tx);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const deletedTxId = itemToDelete.id;
    const deletedTxDescription = itemToDelete.description;

    try {
      await deleteTransactionMutation.mutateAsync(itemToDelete.id);
      setItemToDelete(null);

      // Show success toast with UNDO action
      toast.success('Transacción eliminada', {
        description: deletedTxDescription,
        duration: 5000,
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              await restoreTransactionMutation.mutateAsync(deletedTxId);
              toast.success('Transacción restaurada');
            } catch (error: any) {
              toast.error(`Error al restaurar: ${error.message}`);
            }
          },
        },
      });
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message || 'Error desconocido'}`);
    }
  };

  const grouped = sortedTxs.reduce((groups, tx) => {
    const date = new Date(tx.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  // Calculate totals for the filter bar
  const totals = useMemo(() => {
    if (!transactions) return { income: 0, expense: 0, transfer: 0 };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTxs = transactions.filter(tx => new Date(tx.date) >= startOfMonth);
    return {
      income: thisMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0),
      expense: thisMonthTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0),
      transfer: thisMonthTxs.filter(tx => tx.type === 'transfer').reduce((sum, tx) => sum + tx.amount, 0),
    };
  }, [transactions]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const isLoading = isLoadingTransactions || isLoadingCategories || isLoadingAccounts;

  const deletionImpact = itemToDelete ? getDeletionImpact(itemToDelete) : null;

  return (
    <div className="pb-28 bg-app-bg min-h-screen text-app-text relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-app-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-app-secondary/10 rounded-full blur-[100px]" />
      </div>

      <PageHeader title="Historial" />

      {/* Filter Chips */}
      <div className="px-4 pt-2 pb-4 border-b border-app-border sticky top-16 bg-app-bg/95 backdrop-blur-sm z-10">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filterType === 'all'
                ? 'bg-app-primary text-white shadow-lg shadow-app-primary/20'
                : 'bg-app-elevated text-app-muted border border-app-border'
              }`}
          >
            Todo
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'income'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-app-elevated text-app-muted border border-app-border'
              }`}
          >
            <span className="material-symbols-outlined text-sm">arrow_downward</span>
            Ingresos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'expense'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-app-elevated text-app-muted border border-app-border'
              }`}
          >
            <span className="material-symbols-outlined text-sm">arrow_upward</span>
            Gastos
          </button>
          <button
            onClick={() => setFilterType('transfer')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 ${filterType === 'transfer'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-app-elevated text-app-muted border border-app-border'
              }`}
          >
            <span className="material-symbols-outlined text-sm">swap_horiz</span>
            Transferencias
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 py-6">
          <SkeletonTransactionList count={8} />
        </div>
      ) :
        <div className="px-4 py-2 space-y-6">
          {Object.keys(grouped).length === 0 ? (
            <div className="pt-20 text-center text-app-muted">No hay transacciones.</div>
          ) : (
            Object.keys(grouped).map(date => (
              <div key={date}>
                <h3 className="text-sm font-bold my-3 sticky top-32 bg-app-bg/95 backdrop-blur-sm py-2 z-10 border-b border-app-border/50">{date}</h3>
                <div className="space-y-2">
                  {grouped[date].map(tx => {
                    const category = getCategoryInfo(tx.categoryId);
                    const isInitialMsi = tx.installmentPurchaseId && tx.type === 'expense';
                    const isMsiPayment = tx.installmentPurchaseId && (tx.type === 'income' || tx.type === 'transfer');
                    const isAdjustment = tx.description.includes('🔧') || tx.description.toLowerCase().includes('ajuste');
                    const account = getAccount(tx.accountId);
                    const destAccount = tx.destinationAccountId ? getAccount(tx.destinationAccountId) : null;

                    return (
                      <SwipeableItem
                        key={tx.id}
                        onSwipeRight={() => {
                          if (isInitialMsi) {
                            toast.info('Edita esta compra en "Meses Sin Intereses"', { duration: 2000 });
                            return;
                          }
                          if (isAdjustment) {
                            toast.info('Los ajustes de saldo no son editables', { description: 'Elimínalo y crea uno nuevo si es necesario.', duration: 3000 });
                            return;
                          }
                          navigate(`/new?editId=${tx.id}&mode=edit`);
                        }}
                        rightAction={{
                          icon: (isAdjustment || isInitialMsi) ? 'lock' : 'edit',
                          color: (isAdjustment || isInitialMsi) ? 'var(--color-text-tertiary)' : 'var(--color-primary)',
                          label: (isAdjustment || isInitialMsi) ? 'Bloqueado' : 'Editar',
                        }}
                        onSwipeLeft={() => handleDeleteClick(tx)}
                        leftAction={{
                          icon: 'delete',
                          color: 'var(--color-danger)',
                          label: 'Eliminar',
                        }}
                        className="rounded-2xl"
                      >
                        <div
                          onClick={() => navigate(`/new?editId=${tx.id}`)}
                          className="bg-app-card border border-app-border rounded-2xl p-3 transition-all hover:shadow-lg hover:border-app-primary/20 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div
                              className="size-11 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: tx.type === 'transfer' ? '#64748b20' : `${category.color}20`
                              }}
                            >
                              <span
                                className="material-symbols-outlined text-xl"
                                style={{ color: tx.type === 'transfer' ? '#64748b' : category.color }}
                              >
                                {tx.type === 'transfer' ? 'swap_horiz' : category.icon}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Title Row */}
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-semibold text-app-text truncate text-sm">
                                  {tx.type === 'transfer' ? 'Transferencia' : tx.description}
                                </p>
                                {/* Badges */}
                                {isMsiPayment && (
                                  <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                                    MSI
                                  </span>
                                )}
                                {isInitialMsi && (
                                  <span className="text-[9px] font-bold text-app-primary bg-app-primary/10 px-1.5 py-0.5 rounded">
                                    Compra MSI
                                  </span>
                                )}
                                {tx.recurringTransactionId && (
                                  <span className="text-[9px] font-bold text-app-warning bg-app-warning/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[10px]">repeat</span>
                                  </span>
                                )}
                              </div>

                              {/* Transfer Description */}
                              {tx.type === 'transfer' && tx.description && (
                                <p className="text-xs text-app-muted truncate mb-1">{tx.description}</p>
                              )}

                              {/* Category & Account Info */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {tx.type !== 'transfer' && (
                                  <span className="text-xs text-app-muted">{category.name}</span>
                                )}

                                {/* Account Badge */}
                                <div
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    backgroundColor: `${getAccountColor(tx.accountId)}15`,
                                    color: getAccountColor(tx.accountId)
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[12px]">{getAccountIcon(tx.accountId)}</span>
                                  <span className="truncate max-w-[80px]">{getAccountName(tx.accountId)}</span>
                                </div>

                                {/* Destination for transfers */}
                                {tx.type === 'transfer' && destAccount && (
                                  <>
                                    <span className="material-symbols-outlined text-app-muted text-xs">arrow_forward</span>
                                    <div
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                      style={{
                                        backgroundColor: `${getAccountColor(tx.destinationAccountId)}15`,
                                        color: getAccountColor(tx.destinationAccountId)
                                      }}
                                    >
                                      <span className="material-symbols-outlined text-[12px]">{getAccountIcon(tx.destinationAccountId)}</span>
                                      <span className="truncate max-w-[80px]">{getAccountName(tx.destinationAccountId)}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-base ${tx.type === 'income' ? 'text-emerald-500' :
                                  tx.type === 'expense' ? 'text-red-500' :
                                    'text-app-text'
                                }`}>
                                {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                                {formatCurrency(tx.amount)}
                              </p>
                            </div>
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
      }

      {/* Delete Confirmation Sheet */}
      {
        itemToDelete && deletionImpact && (
          <DeleteConfirmationSheet
            isOpen={!!itemToDelete}
            onClose={() => setItemToDelete(null)}
            onConfirm={handleDelete}
            itemName={itemToDelete.description}
            warningLevel={deletionImpact.warningLevel}
            warningMessage={deletionImpact.warningMessage}
            warningDetails={deletionImpact.warningDetails}
            impactPreview={deletionImpact.impactPreview}
            requireConfirmation={deletionImpact.requireConfirmation}
            isDeleting={deleteTransactionMutation.isPending}
          />
        )
      }
    </div >
  );
};

export default History;
