import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoans, getLoanSummary, markLoanAsPaid, deleteLoan, registerLoanPayment } from '../services/apiService';
import { Loan, LoanStatus, LoanType, LoanSummary } from '../types';
import { SwipeableItem } from '../components/SwipeableItem';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonTransactionList } from '../components/Skeleton';
import { Button } from '../components/Button';
import { useAccounts } from '../hooks/useApi';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';

// --- Sub-Components (Inline for brevity but could be split) ---

// 1. DETAIL SHEET
const LoanDetailSheet = ({ loan, onClose, onEdit, onDelete, onMarkPaid }: any) => {
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(loan.accountId || '');

  const { data: accounts } = useAccounts();
  const queryClient = useQueryClient();
  const paymentMutation = useMutation({
    mutationFn: (data: any) => registerLoanPayment(loan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
      toastSuccess('Abono registrado');
      onClose();
    },
    onError: (e: any) => toastError(e.message)
  });

  const isLent = loan.loanType === 'lent';
  const percentPaid = Math.min(100, Math.round(((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100));

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Filter accounts - for 'borrowed' show non-credit accounts to pay from; for 'lent' show all (receiving money)
  const availableAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(acc => !['CREDIT', 'credit', 'Credit Card'].includes(acc.type));
  }, [accounts]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-app-surface border-t sm:border border-app-border rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">

        {/* Header handle for mobile feeling */}
        <div className="w-12 h-1.5 bg-app-border rounded-full mx-auto mb-6 opacity-50 sm:hidden" />

        <div className="text-center mb-8">
          <div className={`size-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-3 shadow-sm ${isLent ? 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
            }`}>
            <span className="material-symbols-outlined">{isLent ? 'arrow_outward' : 'arrow_downward'}</span>
          </div>
          <h2 className="text-xl font-bold text-app-text">{loan.borrowerName}</h2>
          <p className="text-sm text-app-muted">{isLent ? 'Te debe' : 'Le debes'}</p>
        </div>

        <div className="bg-app-subtle rounded-2xl p-5 mb-6 text-center border border-app-border/50">
          <p className="text-[10px] uppercase font-bold text-app-muted tracking-widest mb-1">Saldo Pendiente</p>
          <div className={`text-4xl font-black tabular-nums tracking-tight ${isLent ? 'text-violet-600 dark:text-violet-400' : 'text-rose-500'}`}>
            {formatCurrency(loan.remainingAmount)}
          </div>
          {loan.remainingAmount !== loan.originalAmount && (
            <div className="mt-3 w-full bg-app-subtle h-1.5 rounded-full overflow-hidden">
              <div className={`h-full ${isLent ? 'bg-violet-500' : 'bg-rose-500'}`} style={{ width: `${percentPaid}%` }} />
            </div>
          )}
        </div>

        {isPaymentMode ? (
          <form onSubmit={(e) => { e.preventDefault(); paymentMutation.mutate({ amount: parseFloat(amount), accountId: selectedAccountId || undefined }); }} className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold text-app-muted ml-1 mb-1 block">Monto a abonar</label>
              <input autoFocus type="number" step="0.01" min="0" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()} value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-app-primary no-spin-button" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-bold text-app-muted ml-1 mb-1 block">
                {isLent ? 'Recibir en cuenta' : 'Pagar desde cuenta'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-app-primary appearance-none"
              >
                <option value="">Sin afectar cuentas</option>
                {availableAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                ))}
              </select>
              <p className="text-[10px] text-app-muted mt-1 ml-1">
                {selectedAccountId
                  ? (isLent ? 'Se sumará a esta cuenta' : 'Se restará de esta cuenta')
                  : 'Solo se actualizará el saldo del préstamo'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsPaymentMode(false)} fullWidth>Cancelar</Button>
              <Button type="submit" disabled={!amount} isLoading={paymentMutation.isPending} fullWidth>Registrar</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-3">
              {loan.status !== 'paid' && (
                <>
                  <button onClick={() => setIsPaymentMode(true)} className="flex-1 bg-app-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-app-primary/25 hover:bg-app-primary-dark active:scale-95 transition-all">Abonar</button>
                  <button onClick={onMarkPaid} className="flex-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 py-3 rounded-xl font-bold text-sm hover:opacity-80 transition-opacity">Liquidar</button>
                </>
              )}
            </div>
            <div className="flex justify-center gap-6 pt-2">
              <button onClick={onEdit} className="text-app-muted hover:text-app-text text-sm font-medium flex items-center gap-1 transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span> Editar</button>
              <button onClick={onDelete} className="text-app-danger hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span> Eliminar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// 2. SUMMARY CARD
const LoanSummaryCard = ({ lent, owed }: { lent: number, owed: number }) => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    <div className="bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
      <div className="flex items-center gap-1.5 mb-1 text-violet-500">
        <span className="material-symbols-outlined text-[18px]">trending_up</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Me Deben</span>
      </div>
      <p className="text-xl font-bold text-app-text">${lent.toLocaleString()}</p>
    </div>
    <div className="bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm">
      <div className="flex items-center gap-1.5 mb-1 text-rose-500">
        <span className="material-symbols-outlined text-[18px]">trending_down</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">Debo</span>
      </div>
      <p className="text-xl font-bold text-app-text">${owed.toLocaleString()}</p>
    </div>
  </div>
);


// ====== MAIN COMPONENT ======

const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  const { data: loans = [], isLoading } = useQuery<Loan[]>({ queryKey: ['loans'], queryFn: getLoans });
  const { data: summary } = useQuery<LoanSummary>({ queryKey: ['loans-summary'], queryFn: getLoanSummary });

  const deleteMutation = useMutation({
    mutationFn: ({ id, revert }: { id: string; revert: boolean }) => deleteLoan(id, revert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
      toastSuccess('Préstamo eliminado');
      setSelectedLoan(null);
      setLoanToDelete(null);
    },
    onError: (error: any) => {
      toastError(error.message || 'Error al eliminar préstamo');
    }
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markLoanAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
      toastSuccess('Marcado como pagado');
      setSelectedLoan(null);
    }
  });

  const filteredLoans = useMemo(() => {
    if (filter === 'all') return loans;
    return loans.filter(l => l.loanType === filter);
  }, [loans, filter]);

  if (isLoading) return <div className="min-h-dvh bg-app-bg pb-safe"><PageHeader title="Préstamos" showBackButton /><div className="p-4"><SkeletonTransactionList count={5} /></div></div>;

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
      <PageHeader
        title="Préstamos"
        showBackButton={true}
      />

      <div className="max-w-2xl mx-auto px-4 py-4">

        <LoanSummaryCard
          lent={summary?.totalOwedToMe || 0}
          owed={summary?.totalIOwe || 0}
        />

        {/* Section Header with Add Button */}
        <div className="flex justify-between items-center px-1 mb-4">
          <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Préstamos</h2>
          <button
            onClick={() => navigate('/loans/new')}
            className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Segmented Control */}
        <div className="bg-app-subtle p-1 rounded-xl flex mb-6">
          {['all', 'lent', 'borrowed'].map((t) => {
            const label = t === 'all' ? 'Todos' : t === 'lent' ? 'Me deben' : 'Debo';
            const isActive = filter === t;
            return (
              <button
                key={t} onClick={() => setFilter(t as any)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? 'bg-app-surface shadow-sm text-app-text' : 'text-app-muted hover:text-app-text'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredLoans.length === 0 ? (
            <div className="py-12 text-center text-app-muted">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">handshake</span>
              <p className="text-sm">No tienes préstamos en esta sección</p>
            </div>
          ) : (
            filteredLoans.map(loan => {
              const isLent = loan.loanType === 'lent';
              const isPaid = loan.status === 'paid';

              return (
                <SwipeableItem
                  key={loan.id}
                  // Swipe RIGHT -> muestra leftAction (Editar)
                  leftAction={{ icon: 'edit', color: '#3b82f6', label: 'Editar' }}
                  onSwipeRight={() => navigate(`/loans/${loan.id}`)}
                  // Swipe LEFT -> muestra rightAction (Eliminar)
                  rightAction={{ icon: 'delete', color: '#EF4444', label: 'Borrar' }}
                  onSwipeLeft={() => setLoanToDelete(loan)}
                >
                  <div onClick={() => setSelectedLoan(loan)} className="bg-app-surface p-4 rounded-2xl border border-app-border hover:bg-app-subtle/50 transition-colors flex items-center gap-4 cursor-pointer">
                    <div className={`size-12 rounded-full flex items-center justify-center text-xl shrink-0 ${isPaid ? 'bg-emerald-100 text-emerald-600' :
                      isLent ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/20' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
                      }`}>
                      <span className="material-symbols-outlined">
                        {isPaid ? 'check' : isLent ? 'arrow_outward' : 'arrow_downward'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-sm text-app-text truncate ${isPaid ? 'line-through text-app-muted' : ''}`}>{loan.borrowerName}</h4>
                      <p className="text-xs text-app-muted">
                        {new Date(loan.loanDate).toLocaleDateString()}
                        {loan.expectedPayDate && !isPaid && <span className="text-rose-500 font-medium ml-1">• Vence {new Date(loan.expectedPayDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold text-[15px] ${isPaid ? 'text-app-muted' : isLent ? 'text-violet-600 dark:text-violet-400' : 'text-rose-500'}`}>
                        ${loan.remainingAmount.toLocaleString()}
                      </p>
                      {loan.remainingAmount !== loan.originalAmount && (
                        <p className="text-[10px] text-app-muted">de ${loan.originalAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </SwipeableItem>
              )
            })
          )}
        </div>
      </div>

      {/* Sheet Overlay */}
      {selectedLoan && (
        <LoanDetailSheet
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onMarkPaid={() => markPaidMutation.mutate(selectedLoan.id)}
          onDelete={() => {
            setSelectedLoan(null);
            setLoanToDelete(selectedLoan);
          }}
          onEdit={() => navigate(`/loans/${selectedLoan.id}`)}
        />
      )}

      {/* Delete Confirmation Sheet */}
      {loanToDelete && (
        <DeleteConfirmationSheet
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onConfirm={() => {
            const isPaid = loanToDelete.status === 'paid';
            deleteMutation.mutate({ id: loanToDelete.id, revert: !isPaid });
          }}
          itemName={`"${loanToDelete.borrowerName}"`}
          warningLevel={loanToDelete.status !== 'paid' ? 'warning' : 'normal'}
          warningMessage={loanToDelete.status !== 'paid' ? 'Préstamo activo' : undefined}
          warningDetails={
            loanToDelete.status !== 'paid'
              ? [
                'Se revertirán las transacciones asociadas',
                'El saldo de la cuenta vinculada será ajustado'
              ]
              : []
          }
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default LoansPage;