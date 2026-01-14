import React from 'react';
import { Transaction, Category, Account } from '../types';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';
import { formatDateUTC } from '../utils/dateUtils'; // Ensure correct path or use helper below if utils not available

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  category?: Partial<Category> & { icon?: string; color?: string; name?: string };
  account?: Account;
  destinationAccount?: Account;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  formatCurrency: (amount: number) => string;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  category,
  account,
  destinationAccount,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  formatCurrency,
}) => {
  if (!transaction) return null;

  // Configuration map for styles
  const isTransfer = transaction.type === 'transfer';
  const typeStyle = {
    expense: { color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'remove', label: 'Gasto' },
    income: { color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'add', label: 'Ingreso' },
    transfer: { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'sync_alt', label: 'Transferencia' }
  }[transaction.type];

  // Visuals
  const displayIcon = isTransfer ? typeStyle.icon : category?.icon || 'payments';
  const displayColor = isTransfer ? undefined : category?.color; // If category, use category color, else type color default handled via class or style injection below

  return (
    <SwipeableBottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="pb-safe-offset-4 px-4 pt-2">

        {/* 1. Header Profile */}
        <div className="flex flex-col items-center mb-6">
          <div
            className={`size-20 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-black/5 ${!displayColor ? typeStyle.bg : ''}`}
            style={{
              backgroundColor: displayColor ? `${displayColor}20` : undefined,
              color: displayColor || undefined
            }}
          >
            <span className={`material-symbols-outlined text-[40px] ${!displayColor ? typeStyle.color : ''}`}>
              {displayIcon}
            </span>
          </div>

          <h2 className="text-xl font-bold text-app-text text-center leading-snug px-4">
            {transaction.description || 'Sin concepto'}
          </h2>

          <div className={`mt-2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeStyle.bg} ${typeStyle.color}`}>
            {typeStyle.label}
          </div>
        </div>

        {/* 2. Amount Card */}
        <div className="bg-app-subtle border border-app-border rounded-3xl p-6 mb-6 text-center shadow-sm">
          <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1">Monto</p>
          <p className={`text-4xl font-black font-numbers tracking-tight ${typeStyle.color}`}>
            {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-app-muted mt-2 font-medium">
            {formatDateUTC(transaction.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* 3. Details List */}
        <div className="space-y-4 mb-8">

          {/* Account Row */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-app-surface border border-app-border">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-app-subtle rounded-xl flex items-center justify-center text-app-muted">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-app-muted uppercase">
                  {isTransfer ? 'Origen' : 'Cuenta'}
                </p>
                <p className="text-sm font-bold text-app-text truncate max-w-[150px]">{account?.name || '---'}</p>
              </div>
            </div>
          </div>

          {/* Dest Account (Transfer Only) */}
          {isTransfer && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-app-surface border border-app-border">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-app-subtle rounded-xl flex items-center justify-center text-app-muted">
                  <span className="material-symbols-outlined">login</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-app-muted uppercase">Destino</p>
                  <p className="text-sm font-bold text-app-text truncate max-w-[150px]">{destinationAccount?.name || '---'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Category (Non-transfer) */}
          {!isTransfer && category && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-app-surface border border-app-border">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-app-subtle rounded-xl flex items-center justify-center text-app-muted">
                  <span className="material-symbols-outlined">category</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-app-muted uppercase">Categoría</p>
                  <p className="text-sm font-bold text-app-text">{category.name}</p>
                </div>
              </div>
            </div>
          )}

          {/* Linked MSI */}
          {transaction.installmentPurchaseId && (
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-500">link</span>
              <div>
                <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-200 uppercase">Vinculado a Plan</p>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Este movimiento es el pago de una cuota MSI.</p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Action Footer */}
        <div className="hidden md:grid grid-cols-2 gap-3 pt-2 border-t border-app-border/50">
          <button
            onClick={() => onEdit(transaction)}
            className="h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2 text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="h-12 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Borrar
          </button>
        </div>

      </div>
    </SwipeableBottomSheet>
  );
};

export default TransactionDetailSheet;