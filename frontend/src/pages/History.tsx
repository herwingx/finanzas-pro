import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useCategories, useDeleteTransaction, useAccounts, useRestoreTransaction, useInstallmentPurchases } from '../hooks/useApi';
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
            <span className="hidden sm:inline-block text-sm font-bold font-numbers text-app-muted bg-app-subtle px-2 py-1 rounded-md">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAmount)}
            </span>
          )}
        </div>

        {/* Filter Pill List - Estilo iOS/Apple */}
        {/* ... (existing filter code) ... */}
      </div>
    </div>
  );
};

/* ... (Main Component) ... */

return (
  <div className="min-h-dvh bg-app-bg pb-28 lg:pb-12">
    <HistoryHeader
      filter={filterType}
      setFilter={setFilterType}
      totalAmount={Math.abs(filteredData.totalSum)} // Optional visual
    />

    <main className="px-4 max-w-3xl mx-auto mt-4 animate-fade-in">
      {/* ... (loading/empty states) ... */}

      {/* List Content */}
      {!isLoading && Object.keys(filteredData.groups).length > 0 && (
        <div className="space-y-6">
          {Object.entries(filteredData.groups).map(([dateLabel, groupTxs]) => (
            <div key={dateLabel}>
              <div className="sticky top-32 z-10 py-1 px-3 mb-2 rounded-lg bg-app-subtle/90 backdrop-blur-sm border border-app-border w-fit shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-app-text">
                  {dateLabel}
                </span>
              </div>

              <div className="bg-app-surface border border-app-border rounded-2xl overflow-hidden divide-y divide-app-border shadow-sm">
                {groupTxs.map(tx => {
                  const cat = getCategoryInfo(tx.categoryId);
                  const accName = getAccountName(tx.accountId);

                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isMsi = !!tx.installmentPurchaseId;

                  const displayIcon = isTransfer ? 'swap_horiz' : cat.icon;

                  // Visual color classes
                  let amountColor = isExpense ? 'text-app-text' : isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-500';
                  let bgIcon = isTransfer ? 'bg-blue-500/10' : '';
                  let colorIcon = isTransfer ? 'text-blue-500' : cat.color;

                  // Dynamic Style for Icon
                  const iconStyle = isTransfer ? {} : {
                    backgroundColor: `${cat.color}15`,
                    color: cat.color
                  };

                  return (
                    <SwipeableItem
                      key={tx.id}
                      leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                      rightAction={{ icon: 'delete', color: '#EF4444', label: 'Borrar' }} // Tailwind Red 500
                      onSwipeRight={() => handleEdit(tx)}
                      onSwipeLeft={() => handleDeleteClick(tx)}
                    >
                      <div
                        onClick={() => setSelectedTx(tx)}
                        className="flex items-center gap-3 p-4 hover:bg-app-subtle/40 active:bg-app-subtle transition-colors cursor-default"
                      >
                        {/* Icon */}
                        <div
                          className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${isTransfer ? 'bg-app-subtle' : ''}`}
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
                          </div>
                          <div className="flex items-center gap-1 text-xs text-app-muted truncate">
                            <span>{isTransfer ? 'Interno' : cat.name}</span>
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