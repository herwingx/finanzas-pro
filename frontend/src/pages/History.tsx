import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useCategories, useDeleteTransaction, useAccounts, useRestoreTransaction, useInstallmentPurchases } from '../hooks/useApi';
import { useIsMobile } from '../hooks/useIsMobile';
import { useGlobalSheets } from '../context/GlobalSheetContext';
import { toast } from 'sonner';

// Componentes y Utilitarios
import { formatDateUTC } from '../utils/dateUtils';
import { SkeletonTransactionList } from '../components/Skeleton';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SwipeableItem } from '../components/SwipeableItem';
import { TransactionDetailSheet } from '../components/TransactionDetailSheet';
import { Transaction } from '../types';

/* ==================================================================================
   SUB-COMPONENT: HEADER (Reemplaza PageHeader simple)
   ================================================================================== */
const HistoryHeader: React.FC<{
  filter: string;
  setFilter: (f: 'all' | 'income' | 'expense' | 'transfer') => void;
  totalAmount?: number;
}> = ({ filter, setFilter, totalAmount }) => {
  return (
    <div className="sticky top-0 z-30 bg-app-bg/95 backdrop-blur-xl border-b border-app-border transition-all">
      <div className="pt-safe pb-3 px-4 md:px-6">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Historial</h1>
          {totalAmount !== undefined && (
            <span className="text-sm font-bold font-numbers text-app-muted bg-app-subtle px-2 py-1 rounded-md">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}
            </span>
          )}
        </div>

        {/* Filter Pill List - Estilo iOS/Apple */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-gradient-r pb-1">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'expense', label: 'Gastos' },
            { id: 'income', label: 'Ingresos' },
            { id: 'transfer', label: 'Traspasos' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`shrink-0 h-9 px-5 rounded-full text-xs font-bold transition-all border ${filter === f.id
                ? f.id === 'all'
                  ? 'bg-app-text text-app-bg border-transparent shadow-lg'
                  : f.id === 'income'
                    ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/30'
                    : f.id === 'expense'
                      ? 'bg-rose-500 text-white border-transparent shadow-lg shadow-rose-500/30'
                      : 'bg-blue-500 text-white border-transparent shadow-lg shadow-blue-500/30'
                : 'bg-app-surface text-app-muted border-app-border hover:bg-app-subtle hover:text-app-text'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


/* ==================================================================================
   MAIN COMPONENT
   ================================================================================== */
const History: React.FC = () => {
  const navigate = useNavigate();
  const { openTransactionSheet } = useGlobalSheets();
  const isMobile = useIsMobile();


  // Queries
  const { data: transactions, isLoading: isLoadingTx } = useTransactions();
  const { data: categories, isLoading: isLoadingCat } = useCategories();
  const { data: accounts, isLoading: isLoadingAcc } = useAccounts();
  const { data: installments } = useInstallmentPurchases();

  // Mutations
  const { mutateAsync: deleteTx, isPending: isDeleting } = useDeleteTransaction();
  const { mutateAsync: restoreTx } = useRestoreTransaction();

  // Local State
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

  // Helper Lookups (Memoized maps for O(1) access)
  const categoryMap = useMemo(() => new Map(categories?.map(c => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts?.map(a => [a.id, a])), [accounts]);

  const getCategoryInfo = (id: string | null) => categoryMap.get(id || '') || { icon: 'payments', color: 'var(--text-muted)', name: 'General' };
  const getAccountName = (id: string | null) => accountMap.get(id || '')?.name || 'Cuenta Desconocida';

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Sorting & Filtering Logic
  const filteredData = useMemo(() => {
    if (!transactions) return { groups: {}, sortedList: [], totalSum: 0 };

    // 1. Filter
    const filtered = filterType === 'all'
      ? transactions
      : transactions.filter(tx => tx.type === filterType);

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Group by Date
    const grouped: Record<string, Transaction[]> = {};
    let sum = 0;

    sorted.forEach(tx => {
      const d = formatDateUTC(tx.date, { style: 'long' }); // e.g. "12 de Enero"
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(tx);

      // Sum Logic (expense negative, others positive just for this view's context)
      sum += tx.type === 'expense' ? -tx.amount : tx.type === 'income' ? tx.amount : 0;
    });

    return { groups: grouped, sortedList: sorted, totalSum: sum };
  }, [transactions, filterType]);


  // Actions
  const handleEdit = (tx: Transaction) => {
    // Validation checks...
    if (tx.installmentPurchaseId && tx.type === 'expense') return toast.info('Gasto protegido', { description: 'Edítalo desde la sección MSI.' });
    if (tx.loanId) return toast.info('Préstamo vinculado', { description: 'Edítalo desde la sección Préstamos.' });
    if (tx.description.toLowerCase().includes('ajuste')) return toast.warning('Sistema', { description: 'Ajuste de saldo no editable.' });

    openTransactionSheet(tx); // Correctly pass the transaction to edit
  };

  const handleDeleteClick = (tx: Transaction) => {
    if (tx.installmentPurchaseId && tx.type === 'expense') return toast.error('Bloqueado', { description: 'Elimina la compra completa en MSI.' });
    if (tx.loanId) return toast.warning('Préstamo', { description: 'Elimínalo desde Préstamos para mantener consistencia.' });

    setItemToDelete(tx);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTx(itemToDelete.id);
      const savedItem = itemToDelete;
      setItemToDelete(null); // Close modal instantly for better UX

      toast.success('Transacción eliminada', {
        action: {
          label: 'Deshacer',
          onClick: () => restoreTx(savedItem.id)
        }
      });
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };


  const isLoading = isLoadingTx || isLoadingAcc || isLoadingCat;

  // Impact Logic for Modal
  const getWarningProps = (tx: Transaction) => {
    if (tx.installmentPurchaseId) return { warningLevel: 'warning' as const, warningMessage: 'Este pago afectará el progreso de tus MSI.' };
    return { warningLevel: 'normal' as const, impactPreview: { account: getAccountName(tx.accountId), balanceChange: tx.amount } };
  };

  return (
    <div className="bg-app-bg">
      <HistoryHeader
        filter={filterType}
        setFilter={setFilterType}
        totalAmount={Math.abs(filteredData.totalSum)} // Optional visual
      />

      <main className="px-4 max-w-2xl mx-auto mt-6 md:mt-10 pb-20 animate-fade-in">
        {isLoading ? (
          <SkeletonTransactionList count={8} />
        ) : Object.keys(filteredData.groups).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-app-muted">
            <div className="size-20 rounded-full bg-app-subtle flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl opacity-20">search_off</span>
            </div>
            <p className="font-bold text-lg text-app-text">Sin movimientos</p>
            <p className="text-sm">No encontramos transacciones para este filtro.</p>
            {filterType !== 'all' && (
              <button onClick={() => setFilterType('all')} className="mt-4 text-app-primary text-sm font-bold hover:underline">
                Ver todo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredData.groups).map(([dateLabel, groupTxs]) => (
              <div key={dateLabel} className="mb-10 md:mb-14 last:mb-0">
                <div className="sticky top-[125px] md:top-[145px] z-20 py-1.5 px-3 mb-4 md:mb-6 rounded-lg bg-app-surface/95 backdrop-blur border border-app-border w-fit shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-app-text/60">
                    {dateLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {groupTxs.map(tx => {
                    const cat = getCategoryInfo(tx.categoryId);
                    const accName = getAccountName(tx.accountId);

                    const isExpense = tx.type === 'expense';
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const isMsi = !!tx.installmentPurchaseId;
                    const isLoan = !!tx.loanId;

                    const displayIcon = isTransfer ? 'swap_horiz' : cat.icon;

                    // Visual color classes
                    let amountColor = isExpense ? 'text-app-text' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-500';

                    // Dynamic Style for Icon
                    const iconStyle = isTransfer ? {} : {
                      backgroundColor: `${cat.color}15`,
                      color: cat.color
                    };

                    return (
                      <SwipeableItem
                        key={tx.id}
                        leftAction={{ icon: 'edit', color: 'text-white', bgColor: 'bg-indigo-500', label: 'Editar' }}
                        rightAction={{ icon: 'delete', color: 'text-white', bgColor: 'bg-rose-500', label: 'Borrar' }}
                        onSwipeRight={() => handleEdit(tx)}
                        onSwipeLeft={() => handleDeleteClick(tx)}
                        className="rounded-3xl"
                        disabled={!isMobile}
                      >
                        <div
                          onClick={() => setSelectedTx(tx)}
                          className="bento-card p-4 flex items-center gap-3.5 hover:border-app-border-strong cursor-pointer active:scale-[0.99] transition-all bg-app-surface"
                        >
                          {/* Icon */}
                          <div
                            className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${isTransfer ? 'bg-app-subtle text-blue-500' : ''}`}
                            style={iconStyle}
                          >
                            <span className="material-symbols-outlined text-[20px]">{displayIcon}</span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm text-app-text truncate">
                                {isTransfer ? 'Transferencia' : tx.description}
                              </span>
                              {isMsi && !isExpense && (
                                <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-500 px-1.5 rounded">MSI</span>
                              )}
                              {isLoan && (
                                <span className="text-[9px] font-bold bg-violet-500/10 text-violet-600 px-1.5 rounded">Préstamo</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-app-muted truncate">
                              {isLoan && tx.loan ? (
                                <span className="text-violet-600 dark:text-violet-400 font-medium">
                                  {tx.loan.loanType === 'lent' ? 'Préstamo otorgado' : 'Préstamo recibido'}
                                </span>
                              ) : (
                                <span>{isTransfer ? 'Interno' : cat.name}</span>
                              )}
                              <span className="opacity-40">•</span>
                              <span className="truncate max-w-[120px]">{accName}</span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className={`font-bold font-numbers text-sm md:text-base shrink-0 ${amountColor}`}>
                            {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      </SwipeableItem>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* DETAILS MODAL */}
      <TransactionDetailSheet
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        transaction={selectedTx}
        category={selectedTx ? getCategoryInfo(selectedTx.categoryId) : undefined}
        account={selectedTx ? accountMap.get(selectedTx.accountId) : undefined}
        onEdit={(tx) => { setSelectedTx(null); handleEdit(tx); }}
        onDelete={(tx) => { setSelectedTx(null); handleDeleteClick(tx); }}
        formatCurrency={formatCurrency}
      />

      {/* DELETE CONFIRMATION */}
      {itemToDelete && (
        <DeleteConfirmationSheet
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          itemName={itemToDelete.description}
          {...getWarningProps(itemToDelete)}
        />
      )}
    </div>
  );
};

export default History;