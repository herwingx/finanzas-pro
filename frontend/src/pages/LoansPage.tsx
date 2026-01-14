import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// API Services
import { getLoans, getLoanSummary, markLoanAsPaid, deleteLoan } from '../services/apiService';

// Hooks & Context
import { useGlobalSheets } from '../context/GlobalSheetContext';

// Components
import { PageHeader } from '../components/PageHeader';
import { SwipeableItem } from '../components/SwipeableItem';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { DeleteConfirmationSheet } from '../components/DeleteConfirmationSheet';
import { SkeletonTransactionList } from '../components/Skeleton';
import { Button } from '../components/Button';

// Utils
import { toastSuccess, toastError } from '../utils/toast';
import { Loan, LoanSummary } from '../types';

/* ==================================================================================
   SUB-COMPONENT: HEADER SUMMARY
   ================================================================================== */
const LoanSummaryCard: React.FC<{ lent: number; owed: number }> = ({ lent, owed }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">

    {/* Card: Me Deben (Lent) */}
    <div className="group bg-violet-50/50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900 rounded-[20px] p-5 relative overflow-hidden transition-all hover:scale-[1.02]">
      <div className="absolute right-0 top-0 opacity-[0.07] dark:opacity-[0.1] -mr-4 -mt-4 transition-transform group-hover:rotate-12 duration-500">
        <span className="material-symbols-outlined text-[90px] text-violet-600">arrow_outward</span>
      </div>
      <p className="text-[10px] uppercase font-bold text-violet-700/70 dark:text-violet-300 tracking-wider mb-1">
        Por cobrar
      </p>
      <p className="text-2xl md:text-3xl font-black text-violet-700 dark:text-violet-300 font-numbers tracking-tight">
        ${lent.toLocaleString()}
      </p>
    </div>

    {/* Card: Debo (Borrowed) */}
    <div className="group bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900 rounded-[20px] p-5 relative overflow-hidden transition-all hover:scale-[1.02]">
      <div className="absolute right-0 top-0 opacity-[0.07] dark:opacity-[0.1] -mr-4 -mt-4 transition-transform group-hover:-rotate-12 duration-500">
        <span className="material-symbols-outlined text-[90px] text-rose-600">arrow_downward</span>
      </div>
      <p className="text-[10px] uppercase font-bold text-rose-700/70 dark:text-rose-300 tracking-wider mb-1">
        Por pagar
      </p>
      <p className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-300 font-numbers tracking-tight">
        ${owed.toLocaleString()}
      </p>
    </div>
  </div>
);

/* ==================================================================================
   SUB-COMPONENT: DETAIL SHEET
   ================================================================================== */
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
  const hasNotes = Boolean(loan.notes);

  return (
    <SwipeableBottomSheet isOpen={true} onClose={onClose}>
      <div className="pt-2 pb-6 px-4 animate-fade-in">

        {/* 1. Header Profile */}
        <div className="text-center mb-8 relative">
          <div
            className={`size-24 rounded-full mx-auto flex items-center justify-center text-4xl mb-4 shadow-xl border-4 border-app-bg ${isPaid ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' :
                isLent ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/20' :
                  'bg-rose-100 text-rose-600 dark:bg-rose-900/20'
              }`}
          >
            <span className="material-symbols-outlined text-[42px]">
              {isPaid ? 'handshake' : isLent ? 'call_made' : 'call_received'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-app-text tracking-tight mb-1">{loan.borrowerName}</h2>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-app-subtle border border-app-border text-app-muted">
            {isPaid
              ? <span className="flex items-center gap-1 text-emerald-600"><span className="material-symbols-outlined text-sm">check</span> Saldado</span>
              : <span>{isLent ? 'Préstamo otorgado' : 'Préstamo recibido'}</span>
            }
          </div>
        </div>

        {/* 2. Amount Box */}
        <div className="bg-app-surface border border-app-border rounded-3xl p-6 text-center shadow-sm mb-6 relative overflow-hidden">
          {isPaid && <div className="absolute inset-0 bg-app-subtle/50 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none" />}

          <p className="text-xs uppercase font-bold text-app-muted tracking-widest mb-1">Pendiente Total</p>
          <p className="text-4xl font-black text-app-text font-numbers tracking-tight">
            ${loan.remainingAmount.toLocaleString()}
          </p>

          {loan.remainingAmount !== loan.originalAmount && (
            <div className="mt-3 text-[10px] font-bold text-app-muted uppercase tracking-wide bg-app-subtle inline-block px-3 py-1 rounded-lg">
              De un total de ${loan.originalAmount.toLocaleString()}
            </div>
          )}
        </div>

        {/* 3. Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-app-subtle/50 p-4 rounded-2xl border border-app-border/50">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Fecha Inicio</p>
            <p className="font-bold text-sm text-app-text">
              {new Date(loan.loanDate).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-app-subtle/50 p-4 rounded-2xl border border-app-border/50">
            <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Vencimiento</p>
            {loan.expectedPayDate ? (
              <div className="flex items-center gap-1.5">
                <span className={`material-symbols-outlined text-sm ${!isPaid && new Date(loan.expectedPayDate) < new Date() ? 'text-rose-500' : 'text-app-primary'}`}>event</span>
                <p className="font-bold text-sm text-app-text">
                  {new Date(loan.expectedPayDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            ) : (
              <p className="font-medium text-sm text-app-muted italic">Sin fecha</p>
            )}
          </div>

          {hasNotes && (
            <div className="col-span-2 bg-app-subtle/30 p-4 rounded-2xl border border-app-border/30">
              <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Notas</p>
              <p className="text-xs text-app-text italic">"{loan.notes}"</p>
            </div>
          )}
        </div>

        {/* 4. Action Buttons */}
        <div className="space-y-3">
          {!isPaid && (
            <Button
              onClick={() => { onClose(); onMarkPaid(); }}
              className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 bg-emerald-500 text-white shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Marcar como Saldado
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => { onClose(); onEdit(); }}
              className="h-12 rounded-xl bg-app-surface border border-app-border text-sm font-bold text-app-text hover:bg-app-subtle flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar
            </button>
            <button
              onClick={() => { onClose(); onDelete(); }}
              className="h-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/10 dark:text-rose-400 text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-rose-100"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Borrar
            </button>
          </div>
        </div>

      </div>
    </SwipeableBottomSheet>
  );
};

/* ==================================================================================
   MAIN PAGE COMPONENT
   ================================================================================== */
const LoansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { openLoanSheet } = useGlobalSheets();

  // State
  const [filter, setFilter] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);

  // Queries
  const { data: loans = [], isLoading } = useQuery<Loan[]>({ queryKey: ['loans'], queryFn: getLoans });
  const { data: summary } = useQuery<LoanSummary>({ queryKey: ['loans-summary'], queryFn: getLoanSummary });

  // Filter Logic
  const filteredLoans = useMemo(() => {
    if (filter === 'all') return loans;
    return loans.filter(l => l.loanType === filter);
  }, [loans, filter]);

  // Mutations
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markLoanAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      toastSuccess('Marcado como pagado');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, revert }: { id: string; revert: boolean }) => deleteLoan(id, revert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Because of potential refunds
      toastSuccess('Préstamo eliminado');
      setLoanToDelete(null);
    },
    onError: () => toastError('Error eliminando préstamo')
  });

  const handleDeleteRequest = (loan: Loan) => {
    setSelectedLoan(null); // Ensure details closed
    setLoanToDelete(loan);
  };

  const handleConfirmDelete = (options: { revertBalance: boolean }) => {
    if (!loanToDelete) return;
    deleteMutation.mutate({ id: loanToDelete.id, revert: options.revertBalance });
  };


  if (isLoading) return (
    <div className="min-h-dvh bg-app-bg">
      <PageHeader title="Préstamos" showBackButton />
      <div className="p-4"><SkeletonTransactionList count={4} /></div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-app-bg pb-safe md:pb-12 text-app-text font-sans">
      <PageHeader
        title="Gestor de Deudas"
        showBackButton
        rightAction={
          <button onClick={() => openLoanSheet()} className="bg-app-text text-app-bg rounded-full size-9 flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-4 animate-fade-in space-y-6 pb-20">

        {/* 1. HERO SUMMARY */}
        <LoanSummaryCard
          lent={summary?.totalOwedToMe || 0}
          owed={summary?.totalIOwe || 0}
        />

        {/* 2. FILTER SEGMENT */}
        <div className="bg-app-subtle p-1 rounded-xl flex mx-auto">
          {['all', 'lent', 'borrowed'].map((t) => {
            const label = t === 'all' ? 'Todos' : t === 'lent' ? 'Me deben' : 'Debo';
            return (
              <button
                key={t} onClick={() => setFilter(t as any)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === t ? 'bg-app-surface shadow-sm text-app-text' : 'text-app-muted hover:text-app-text'}`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* 3. LOAN LIST */}
        <div className="space-y-3">
          {filteredLoans.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-app-muted opacity-50 border-2 border-dashed border-app-border rounded-3xl">
              <span className="material-symbols-outlined text-4xl mb-3">handshake</span>
              <p className="text-sm font-medium">No hay registros activos</p>
            </div>
          ) : (
            filteredLoans.map(loan => {
              const isLent = loan.loanType === 'lent';
              const isPaid = loan.status === 'paid';

              // Icon Colors
              const iconBg = isPaid ? 'bg-emerald-50' : isLent ? 'bg-violet-50' : 'bg-rose-50';
              const iconColor = isPaid ? 'text-emerald-500' : isLent ? 'text-violet-600' : 'text-rose-500';
              const darkIconBg = isPaid ? 'dark:bg-emerald-900/20' : isLent ? 'dark:bg-violet-900/20' : 'dark:bg-rose-900/20';

              return (
                <SwipeableItem
                  key={loan.id}
                  leftAction={{ icon: 'edit', color: 'var(--brand-primary)', label: 'Editar' }}
                  onSwipeRight={() => { setSelectedLoan(null); setTimeout(() => openLoanSheet(loan), 50); }}
                  rightAction={{ icon: 'delete', color: '#EF4444', label: 'Borrar' }}
                  onSwipeLeft={() => handleDeleteRequest(loan)}
                  className="rounded-3xl"
                >
                  <div
                    onClick={() => setSelectedLoan(loan)}
                    className="bento-card p-4 flex items-center gap-4 cursor-pointer hover:border-app-border-strong active:scale-[0.99] transition-all bg-app-surface group"
                  >
                    <div className={`size-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors ${iconBg} ${iconColor} ${darkIconBg}`}>
                      <span className="material-symbols-outlined">
                        {isPaid ? 'check' : isLent ? 'call_made' : 'call_received'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`font-bold text-sm text-app-text truncate ${isPaid ? 'opacity-60 line-through' : ''}`}>
                          {loan.borrowerName}
                        </h4>
                        <span className={`font-black font-numbers text-[15px] ${isPaid ? 'text-app-muted' : isLent ? 'text-violet-600 dark:text-violet-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          ${loan.remainingAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-app-muted">
                        <span className="truncate">{new Date(loan.loanDate).toLocaleDateString()}</span>
                        {loan.remainingAmount < loan.originalAmount && (
                          <span className="text-[10px] font-bold bg-app-subtle px-1.5 py-0.5 rounded">Parcial</span>
                        )}
                      </div>
                    </div>

                    <span className="material-symbols-outlined text-app-border group-hover:text-app-text text-xl">chevron_right</span>
                  </div>
                </SwipeableItem>
              )
            })
          )}
        </div>

      </div>

      {/* 4. DETAIL OVERLAY */}
      {selectedLoan && (
        <LoanDetailSheet
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onMarkPaid={() => markPaidMutation.mutate(selectedLoan.id)}
          onDelete={() => handleDeleteRequest(selectedLoan)}
          onEdit={() => { setSelectedLoan(null); openLoanSheet(selectedLoan); }}
        />
      )}

      {/* 5. CONFIRMATION OVERLAY */}
      {loanToDelete && (
        <DeleteConfirmationSheet
          isOpen={!!loanToDelete}
          onClose={() => setLoanToDelete(null)}
          onConfirm={(opt) => handleConfirmDelete(opt as any)}
          itemName={loanToDelete.borrowerName}
          warningMessage={loanToDelete.status !== 'paid' ? 'Eliminar deuda activa' : 'Eliminar registro'}
          // Show revert toggle ONLY for unpaid loans to offer refund
          showRevertOption={loanToDelete.status !== 'paid'}
          revertOptionLabel={loanToDelete.loanType === 'lent' ? 'Devolver el dinero a mi saldo' : 'Restaurar deuda original'}
          defaultRevertState={true}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default LoansPage;