import React from 'react';
import { Transaction, Category, Account } from '../types';
import { SwipeableBottomSheet } from './SwipeableBottomSheet';

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

  const isExpense = transaction.type === 'expense';
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const typeConfig = {
    expense: { label: 'Gasto', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'arrow_upward' },
    income: { label: 'Ingreso', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'arrow_downward' },
    transfer: { label: 'Transferencia', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'swap_horiz' },
  };

  const config = typeConfig[transaction.type];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <SwipeableBottomSheet isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="pb-4 border-b border-app-border -mx-6 px-6 -mt-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div
              className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${config.bg}`}
              style={{
                backgroundColor: !isTransfer && category?.color ? `${category.color}15` : undefined,
                color: !isTransfer && category?.color ? category.color : undefined,
              }}
            >
              <span className={`material-symbols-outlined text-2xl ${isTransfer ? config.color : ''}`}>
                {isTransfer ? 'swap_horiz' : category?.icon || 'payments'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-app-text truncate">
                {transaction.description || 'Sin descripción'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                {category && !isTransfer && (
                  <span className="text-xs text-app-muted">{category.name}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-subtle rounded-full transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-app-muted">close</span>
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="py-6 text-center border-b border-app-border -mx-6 px-6">
        <p className="text-xs text-app-muted uppercase font-bold tracking-wider mb-1">Monto</p>
        <p className={`text-4xl font-black font-numbers ${config.color}`}>
          {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
        </p>
      </div>

      {/* Details */}
      <div className="py-4 space-y-4">
        {/* Date */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-app-subtle flex items-center justify-center">
            <span className="material-symbols-outlined text-app-muted text-xl">calendar_today</span>
          </div>
          <div>
            <p className="text-[10px] text-app-muted uppercase font-bold">Fecha</p>
            <p className="text-sm font-semibold text-app-text capitalize">{formatDate(transaction.date)}</p>
          </div>
        </div>

        {/* Account */}
        {account && (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-app-subtle flex items-center justify-center">
              <span className="material-symbols-outlined text-app-muted text-xl">account_balance</span>
            </div>
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold">
                {isTransfer ? 'Cuenta Origen' : 'Cuenta'}
              </p>
              <p className="text-sm font-semibold text-app-text">{account.name}</p>
            </div>
          </div>
        )}

        {/* Destination Account (for transfers) */}
        {isTransfer && destinationAccount && (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-app-subtle flex items-center justify-center">
              <span className="material-symbols-outlined text-app-muted text-xl">arrow_forward</span>
            </div>
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold">Cuenta Destino</p>
              <p className="text-sm font-semibold text-app-text">{destinationAccount.name}</p>
            </div>
          </div>
        )}

        {/* Category (for income/expense) */}
        {!isTransfer && category && (
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              <span className="material-symbols-outlined text-xl">{category.icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold">Categoría</p>
              <p className="text-sm font-semibold text-app-text">{category.name}</p>
            </div>
          </div>
        )}

        {/* Installment Link */}
        {transaction.installmentPurchaseId && (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-500 text-xl">credit_card</span>
            </div>
            <div>
              <p className="text-[10px] text-app-muted uppercase font-bold">Pago a Meses</p>
              <p className="text-sm font-semibold text-app-text">Vinculado a plan MSI</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="hidden md:flex gap-3 pt-2 border-t border-app-border -mx-6 px-6 mt-2">
        <button
          onClick={() => onEdit(transaction)}
          className="flex-1 py-3.5 rounded-xl bg-app-primary text-white font-bold shadow-lg shadow-app-primary/25 hover:bg-app-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">edit</span>
          Editar
        </button>
        <button
          onClick={() => onDelete(transaction)}
          className="py-3.5 px-5 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 font-bold hover:opacity-80 transition-opacity flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </SwipeableBottomSheet>
  );
};

export default TransactionDetailSheet;
