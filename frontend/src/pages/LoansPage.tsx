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
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { useGlobalSheets } from '../context/GlobalSheetContext';

// --- INLINE COMPONENTS (Refactor to separate files later) ---

const LoanSummaryCard: React.FC<{ lent: number; owed: number }> = ({ lent, owed }) => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    <div className="bg-app-surface border border-app-border p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden group shadow-sm">
      <p className="text-xs font-bold text-app-muted uppercase tracking-wider relative z-10">Me Deben</p>
      <p className="text-2xl font-black text-violet-600 dark:text-violet-400 font-numbers relative z-10">${lent.toLocaleString()}</p>
      <div className="absolute -right-4 -bottom-4 text-violet-500 opacity-[0.08] dark:opacity-[0.15] group-hover:scale-110 transition-transform duration-500">
        <span className="material-symbols-outlined text-[80px]">arrow_outward</span>
      </div>
    </div>
    <div className="bg-app-surface border border-app-border p-4 rounded-2xl flex flex-col justify-between h-28 relative overflow-hidden group shadow-sm">
      <p className="text-xs font-bold text-app-muted uppercase tracking-wider relative z-10">Debo</p>
      <p className="text-2xl font-black text-rose-500 dark:text-rose-400 font-numbers relative z-10">${owed.toLocaleString()}</p>
      <div className="absolute -right-4 -bottom-4 text-rose-500 opacity-[0.08] dark:opacity-[0.15] group-hover:scale-110 transition-transform duration-500">
        <span className="material-symbols-outlined text-[80px]">arrow_downward</span>
      </div>
    </div>
  </div>
);

interface LoanDetailSheetProps {
  loan: Loan;
  onClose: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const LoanDetailSheet: React.FC<LoanDetailSheetProps> = ({ loan, onClose, onMarkPaid, onDelete, onEdit }) => {
  const isLent = loan.loanType === 'lent';
  const isPaid = loan.status === 'paid';

  return (
    <SwipeableBottomSheet isOpen={true} onClose={onClose}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className={`size-20 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-inner ${isPaid ? 'bg-emerald-100 text-emerald-600' :
            isLent ? 'bg-violet-100 text-violet-600' : 'bg-rose-100 text-rose-600'
            }`}>
            <span className="material-symbols-outlined text-[40px]">
              {isPaid ? 'check_circle' : isLent ? 'arrow_outward' : 'arrow_downward'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-app-text">{loan.borrowerName}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${isLent
              ? 'bg-violet-50 border-violet-100 text-violet-700'
              : 'bg-rose-50 border-rose-100 text-rose-700'
              }`}>
              {isLent ? 'Te debe' : 'Le debes'}
            </span>
            {isPaid && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">PAGADO</span>}
          </div>
        </div>

        {/* Amount */}
        <div className="text-center bg-app-subtle/50 p-6 rounded-3xl border border-app-border border-dashed">
          <p className="text-sm font-medium text-app-muted uppercase tracking-wider mb-1">Monto Pendiente</p>
          <p className={`text-4xl font-black font-numbers tracking-tight ${isPaid ? 'text-app-muted line-through opacity-50' : 'text-app-text'
            }`}>
            ${loan.remainingAmount.toLocaleString()}
          </p>
          {loan.remainingAmount !== loan.originalAmount && (
            <p className="text-sm text-app-muted mt-2">Original: ${loan.originalAmount.toLocaleString()}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-app-subtle rounded-xl">
            <p className="text-xs text-app-muted font-bold uppercase">Estado</p>
            <p className="font-medium text-app-text flex items-center gap-1 mt-0.5">
              {loan.status === 'active' ? 'Activo' : loan.status === 'partial' ? 'Abonado' : 'Pagado'}
            </p>
          </div>
          <div className="p-3 bg-app-subtle rounded-xl">
            <p className="text-xs text-app-muted font-bold uppercase">Fecha Préstamo</p>
            <p className="font-medium text-app-text mt-0.5">{new Date(loan.loanDate).toLocaleDateString()}</p>
          </div>
          {loan.expectedPayDate && (
            <div className="p-3 bg-app-subtle rounded-xl col-span-2">
              <p className="text-xs text-app-muted font-bold uppercase">Fecha Promesa Pago</p>
              <p className="font-medium text-app-text mt-0.5 flex items-center justify-between">
                {new Date(loan.expectedPayDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {!isPaid && new Date(loan.expectedPayDate) < new Date() && (
                  <span className="text-rose-500 text-xs font-bold flex items-center bg-rose-100 px-2 py-0.5 rounded-md">VENCIDO</span>
                )}
              </p>
            </div>
          )}
          {loan.notes && (
            <div className="p-3 bg-app-subtle rounded-xl col-span-2">
              <p className="text-xs text-app-muted font-bold uppercase">Notas</p>
              <p className="text-app-text mt-0.5 italic text-sm">"{loan.notes}"</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isPaid && (
            <Button onClick={onMarkPaid} className="w-full h-14 text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined mr-2">check_circle</span>
              Marcar como Pagado
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onEdit} variant="outline" className="h-12 border-app-border text-app-text hover:bg-app-subtle">
              <span className="material-symbols-outlined mr-2 text-[18px]">edit</span>
              Editar
            </Button>
            <Button onClick={onDelete} variant="ghost" className="h-12 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20">
              <span className="material-symbols-outlined mr-2 text-[18px]">delete</span>
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </SwipeableBottomSheet>
  );
};

// ====== MAIN COMPONENT ======



const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openLoanSheet } = useGlobalSheets();

  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  const { data: loans = [], isLoading } = useQuery<Loan[]>({ queryKey: ['loans'], queryFn: getLoans });
  const { data: summary } = useQuery<LoanSummary>({ queryKey: ['loans-summary'], queryFn: getLoanSummary });

  // ... (Mutations existing code) ...
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

  const handleEdit = (loan: Loan) => {
    setSelectedLoan(null); // Close detail
    openLoanSheet(loan); // Open edit sheet
  };

  if (isLoading) return <div className="min-h-dvh bg-app-bg pb-safe"><PageHeader title="Préstamos" showBackButton /><div className="p-4"><SkeletonTransactionList count={5} /></div></div>;

  return (
    <div className="min-h-dvh bg-app-bg text-app-text font-sans pb-safe">
      <PageHeader title="Préstamos" showBackButton={true} />

      <div className="max-w-2xl mx-auto px-4 py-4">

        <LoanSummaryCard
          lent={summary?.totalOwedToMe || 0}
          owed={summary?.totalIOwe || 0}
        />

        {/* Section Header with Add Button */}
        <div className="flex justify-between items-center px-1 mb-4 md:mb-6">
          <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Tus Préstamos</h2>
          <button
            onClick={() => openLoanSheet()}
            className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* ... (Segmented Control - unchanged) ... */}
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
                  leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                  onSwipeRight={() => handleEdit(loan)}
                  // Swipe LEFT -> muestra rightAction (Eliminar)
                  rightAction={{ icon: 'delete', color: '#EF4444', label: 'Borrar' }}
                  onSwipeLeft={() => setLoanToDelete(loan)}
                  className="mb-3 rounded-3xl"
                >
                  <div onClick={() => setSelectedLoan(loan)} className="bg-app-surface p-4 rounded-3xl border border-app-border hover:bg-app-subtle/50 transition-colors flex items-center gap-4 cursor-pointer">
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
          onEdit={() => handleEdit(selectedLoan)}
        />
      )}

      {/* Delete Confirmation Sheet */}
      {loanToDelete && (
        <DeleteConfirmationSheet
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onConfirm={(options) => {
            const isPaid = loanToDelete.status === 'paid';
            // Use user selection if available, otherwise default to logic
            const shouldRevert = options?.revertBalance ?? !isPaid;
            deleteMutation.mutate({ id: loanToDelete.id, revert: shouldRevert });
          }}
          itemName={`"${loanToDelete.borrowerName}"`}
          warningLevel={loanToDelete.status !== 'paid' ? 'warning' : 'normal'}
          warningMessage={loanToDelete.status !== 'paid' ? 'Préstamo activo' : undefined}
          warningDetails={
            loanToDelete.status !== 'paid'
              ? [
                'Se borrará el historial de pagos asociados',
              ]
              : []
          }
          isDeleting={deleteMutation.isPending}
          // Only show toggle for active loans where reversion makes sense
          showRevertOption={loanToDelete.status !== 'paid'}
          revertOptionLabel="Devolver saldo pendiente a mi cuenta"
          defaultRevertState={true}
        />
      )}
    </div>
  );
};

export default LoansPage;