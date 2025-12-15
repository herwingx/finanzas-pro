import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoans, getLoanSummary, markLoanAsPaid, deleteLoan, registerLoanPayment } from '../services/apiService';
import { Loan, LoanStatus, LoanType } from '../types';
import { SwipeableItem } from '../components/SwipeableItem';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { SkeletonAccountList } from '../components/Skeleton';

type FilterStatus = 'all' | 'active' | 'paid';
type FilterType = 'all' | 'lent' | 'borrowed';

// ====== LOAN DETAIL SHEET ======
const LoanDetailSheet = ({
  loan,
  onClose,
  onEdit,
  onDelete,
  onMarkPaid,
  formatCurrency,
}: {
  loan: Loan;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPaid: () => void;
  formatCurrency: (v: number) => string;
}) => {
  const queryClient = useQueryClient();
  const [isPaymentMode, setIsPaymentMode] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const isLent = loan.loanType === 'lent';
  const progress = ((loan.originalAmount - loan.remainingAmount) / loan.originalAmount) * 100;

  const paymentMutation = useMutation({
    mutationFn: (data: any) => registerLoanPayment(loan.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toastSuccess('¡Abono registrado!');
      setIsPaymentMode(false);
      onClose();
    },
    onError: (err: any) => toastError(err.message || 'Error al registrar pago')
  });

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toastError('Monto inválido');
      return;
    }
    paymentMutation.mutate({
      amount: parseFloat(amount),
      notes: notes || undefined,
      accountId: loan.accountId // Default to linked account if exists, logic handles it
    });
  };

  const getDaysUntil = (date?: string) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntil(loan.expectedPayDate);
  const isOverdue = daysUntil !== null && daysUntil < 0 && loan.status !== 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-app-surface rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-slide-up shadow-xl border border-app-border">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`size-14 rounded-2xl flex items-center justify-center ${isLent
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
              : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
              }`}>
              <span className="material-symbols-outlined text-[28px]">
                {isLent ? 'trending_up' : 'trending_down'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-app-text">{loan.borrowerName}</h3>
              <p className="text-xs text-app-muted">
                {isLent ? 'Te debe dinero' : 'Le debes dinero'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-app-subtle rounded-full transition-colors">
            <span className="material-symbols-outlined text-xl text-app-muted">close</span>
          </button>
        </div>

        {/* Amount */}
        <div className="text-center mb-6 py-4 bg-app-subtle rounded-2xl">
          <p className="text-xs text-app-muted uppercase font-bold mb-1">Monto Pendiente</p>
          <p className={`text-3xl font-bold tabular-nums ${loan.status === 'paid'
            ? 'text-emerald-500 line-through'
            : isLent
              ? 'text-violet-600 dark:text-violet-400'
              : 'text-rose-600 dark:text-rose-400'
            }`}>
            {formatCurrency(loan.remainingAmount)}
          </p>
          {loan.status !== 'paid' && loan.remainingAmount !== loan.originalAmount && (
            <p className="text-xs text-app-muted mt-1">de {formatCurrency(loan.originalAmount)} original</p>
          )}

          {/* Progress bar */}
          {loan.status === 'partial' && (
            <div className="mt-3 px-4">
              <div className="h-2 bg-app-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isLent ? 'bg-violet-500' : 'bg-rose-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-app-muted mt-1">{progress.toFixed(0)}% pagado</p>
            </div>
          )}
        </div>

        {/* Payment Form Mode */}
        {isPaymentMode ? (
          <form onSubmit={handlePayment} className="animate-fade-in mb-6 bg-app-bg border border-app-border rounded-2xl p-4">
            <h4 className="font-bold text-sm mb-3">Registrar Abono</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-app-muted font-bold block mb-1">Cantidad</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted">$</span>
                  <input
                    type="number"
                    autoFocus
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-app-surface border border-app-border rounded-xl text-lg font-bold"
                    placeholder="0.00"
                    max={loan.remainingAmount}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-app-muted font-bold block mb-1">Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-app-surface border border-app-border rounded-xl text-sm"
                  placeholder="Recibo #1..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentMode(false)}
                  className="flex-1 py-2 bg-app-surface hover:bg-app-subtle border border-app-border rounded-xl text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold"
                >
                  {paymentMutation.isPending ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Normal Info Mode */
          <>
            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-app-bg border border-app-border rounded-xl p-3">
                <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Fecha Préstamo</p>
                <p className="text-sm font-semibold text-app-text">
                  {new Date(loan.loanDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className={`rounded-xl p-3 border ${isOverdue
                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                : 'bg-app-bg border-app-border'
                }`}>
                <p className="text-[10px] text-app-muted uppercase font-bold mb-1">
                  {loan.expectedPayDate ? (isOverdue ? 'Vencido desde' : 'Fecha límite') : 'Sin fecha límite'}
                </p>
                <p className={`text-sm font-semibold ${isOverdue ? 'text-rose-600' : 'text-app-text'}`}>
                  {loan.expectedPayDate
                    ? new Date(loan.expectedPayDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Flexible'
                  }
                </p>
              </div>
              {loan.reason && (
                <div className="col-span-2 bg-app-bg border border-app-border rounded-xl p-3">
                  <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Motivo</p>
                  <p className="text-sm text-app-text">{loan.reason}</p>
                </div>
              )}
              {loan.account && (
                <div className="col-span-2 bg-app-bg border border-app-border rounded-xl p-3">
                  <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Cuenta vinculada</p>
                  <p className="text-sm font-semibold text-app-text">{loan.account.name}</p>
                </div>
              )}
              {loan.notes && (
                <div className="col-span-2 bg-app-bg border border-app-border rounded-xl p-3">
                  <p className="text-[10px] text-app-muted uppercase font-bold mb-1">Notas</p>
                  <p className="text-sm text-app-text whitespace-pre-line">{loan.notes}</p>
                </div>
              )}
            </div>

            {/* Contact info */}
            {(loan.borrowerPhone || loan.borrowerEmail) && (
              <div className="flex gap-2 mb-6">
                {loan.borrowerPhone && (
                  <a
                    href={`tel:${loan.borrowerPhone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-app-subtle rounded-xl text-app-text text-sm font-medium hover:bg-app-border transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    Llamar
                  </a>
                )}
                {loan.borrowerEmail && (
                  <a
                    href={`mailto:${loan.borrowerEmail}`}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-app-subtle rounded-xl text-app-text text-sm font-medium hover:bg-app-border transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">mail</span>
                    Email
                  </a>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {loan.status !== 'paid' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPaymentMode(true)}
                    className="flex-1 btn bg-indigo-600 hover:bg-indigo-700 text-white py-3 flex items-center justify-center gap-2 font-bold rounded-xl shadow-lg shadow-indigo-500/20"
                  >
                    <span className="material-symbols-outlined text-lg">payments</span>
                    Abonar
                  </button>
                  <button
                    onClick={onMarkPaid}
                    className="flex-1 btn bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 py-3 flex items-center justify-center gap-2 font-semibold rounded-xl"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Liquidar
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onEdit}
                  className="flex-1 btn btn-secondary py-3 flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Editar
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 btn bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 py-3 flex items-center justify-center gap-2 text-sm"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Eliminar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ====== MAIN PAGE ======
const LoansPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ loan: Loan; revert: boolean } | null>(null);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['loans'],
    queryFn: getLoans,
  });

  const { data: summary } = useQuery({
    queryKey: ['loans-summary'],
    queryFn: getLoanSummary,
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => markLoanAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toastSuccess('¡Préstamo marcado como pagado!');
      setSelectedLoan(null);
    },
    onError: (error: any) => {
      toastError(error.message || 'Error al marcar como pagado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, revert }: { id: string; revert: boolean }) => deleteLoan(id, revert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toastSuccess('Préstamo eliminado');
      setDeleteModal(null);
      setSelectedLoan(null);
    },
    onError: (error: any) => {
      toastError(error.message || 'Error al eliminar');
    },
  });

  const filteredLoans = useMemo(() => {
    let filtered = loans;

    // Filter by type
    if (typeFilter === 'lent') {
      filtered = filtered.filter(l => l.loanType === 'lent');
    } else if (typeFilter === 'borrowed') {
      filtered = filtered.filter(l => l.loanType === 'borrowed');
    }

    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(l => l.status === 'active' || l.status === 'partial');
    } else if (statusFilter === 'paid') {
      filtered = filtered.filter(l => l.status === 'paid');
    }

    return filtered;
  }, [loans, typeFilter, statusFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysUntilExpected = (expectedDate?: string) => {
    if (!expectedDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = new Date(expectedDate);
    expected.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">PAGADO</span>;
      case 'partial':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">PARCIAL</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">ACTIVO</span>;
    }
  };

  // Counts for filters
  const lentCount = loans.filter(l => l.loanType === 'lent' && l.status !== 'paid').length;
  const borrowedCount = loans.filter(l => l.loanType === 'borrowed' && l.status !== 'paid').length;

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
        <PageHeader title="Préstamos" showBackButton={true} />
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="h-24 bg-app-subtle rounded-2xl animate-pulse" />
          <SkeletonAccountList />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
      <PageHeader title="Préstamos" showBackButton={true} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Section Header with Add Button */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold text-app-muted uppercase tracking-wide">Control de Préstamos</h2>
          <button
            onClick={() => navigate('/loans/new')}
            className="text-app-primary hover:bg-app-primary/10 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (summary.lentLoansCount > 0 || summary.borrowedLoansCount > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Me deben */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg opacity-80">trending_up</span>
                <span className="text-xs font-medium opacity-90">Me deben</span>
              </div>
              <div className="text-2xl font-black">{formatCurrency(summary.totalOwedToMe)}</div>
              <p className="text-xs opacity-70 mt-1">{summary.lentLoansCount} préstamo{summary.lentLoansCount !== 1 ? 's' : ''}</p>
            </div>

            {/* Debo */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-lg opacity-80">trending_down</span>
                <span className="text-xs font-medium opacity-90">Debo</span>
              </div>
              <div className="text-2xl font-black">{formatCurrency(summary.totalIOwe)}</div>
              <p className="text-xs opacity-70 mt-1">{summary.borrowedLoansCount} préstamo{summary.borrowedLoansCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}

        {/* Type Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${typeFilter === 'all'
              ? 'bg-app-primary text-white shadow-sm'
              : 'bg-app-subtle text-app-muted hover:text-app-text'
              }`}
          >
            <span className="material-symbols-outlined text-sm">list</span>
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('lent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${typeFilter === 'lent'
              ? 'bg-violet-500 text-white shadow-sm'
              : 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100'
              }`}
          >
            <span className="material-symbols-outlined text-sm">trending_up</span>
            Me deben
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${typeFilter === 'lent' ? 'bg-white/20' : 'bg-violet-100 dark:bg-violet-800'}`}>
              {lentCount}
            </span>
          </button>
          <button
            onClick={() => setTypeFilter('borrowed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${typeFilter === 'borrowed'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
              }`}
          >
            <span className="material-symbols-outlined text-sm">trending_down</span>
            Debo
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${typeFilter === 'borrowed' ? 'bg-white/20' : 'bg-rose-100 dark:bg-rose-800'}`}>
              {borrowedCount}
            </span>
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 p-1 bg-app-subtle rounded-xl">
          {[
            { value: 'active', label: 'Activos' },
            { value: 'paid', label: 'Pagados' },
            { value: 'all', label: 'Todos' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as FilterStatus)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${statusFilter === tab.value
                ? 'bg-app-surface text-app-text shadow-sm'
                : 'text-app-muted hover:text-app-text'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loans List */}
        <div className="space-y-3">
          {filteredLoans.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center opacity-50 border-2 border-dashed border-app-border rounded-3xl">
              <span className="material-symbols-outlined text-4xl mb-3 text-app-muted">handshake</span>
              <p className="text-sm font-medium">Sin préstamos</p>
              <button
                onClick={() => navigate('/loans/new')}
                className="mt-4 btn btn-secondary text-xs px-4 py-2"
              >
                Crear Primero
              </button>
            </div>
          ) : (
            filteredLoans.map((loan) => {
              const daysUntil = getDaysUntilExpected(loan.expectedPayDate);
              const isOverdue = daysUntil !== null && daysUntil < 0 && loan.status !== 'paid';
              const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && loan.status !== 'paid';
              const isLent = loan.loanType === 'lent';

              return (
                <SwipeableItem
                  key={loan.id}
                  leftAction={loan.status !== 'paid' ? { icon: 'check', color: '#10b981', label: 'Pagado' } : undefined}
                  rightAction={{ icon: 'delete', color: '#ef4444', label: 'Eliminar' }}
                  onSwipeRight={loan.status !== 'paid' ? () => markPaidMutation.mutate(loan.id) : undefined}
                  onSwipeLeft={() => setDeleteModal({ loan, revert: loan.status !== 'paid' })}
                >
                  <div
                    onClick={() => setSelectedLoan(loan)}
                    className={`
                      bg-app-surface border p-4 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform
                      ${isOverdue ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/30' : 'border-app-border hover:border-app-primary/30'}
                    `}
                  >
                    <div className={`
                      size-12 rounded-2xl flex items-center justify-center shrink-0
                      ${loan.status === 'paid'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : isLent
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      }
                    `}>
                      <span className="material-symbols-outlined text-[24px]">
                        {loan.status === 'paid' ? 'check_circle' : isLent ? 'trending_up' : 'trending_down'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm text-app-text truncate">{loan.borrowerName}</h4>
                        {getStatusBadge(loan.status)}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-app-muted">
                        <span>{isLent ? 'Te debe' : 'Le debes'}</span>
                        <span>•</span>
                        <span>{formatDate(loan.loanDate)}</span>
                        {loan.expectedPayDate && loan.status !== 'paid' && (
                          <>
                            <span>•</span>
                            <span className={isOverdue ? 'text-rose-500 font-bold' : isDueSoon ? 'text-amber-500' : ''}>
                              {isOverdue
                                ? `Vencido`
                                : daysUntil === 0
                                  ? 'Hoy'
                                  : `${daysUntil}d`
                              }
                            </span>
                          </>
                        )}
                        {!loan.expectedPayDate && loan.status !== 'paid' && (
                          <>
                            <span>•</span>
                            <span className="text-app-muted/70">Sin límite</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <p className={`font-bold text-[15px] ${loan.status === 'paid'
                        ? 'text-emerald-500 line-through'
                        : isLent
                          ? 'text-violet-600 dark:text-violet-400'
                          : 'text-rose-600 dark:text-rose-400'
                        }`}>
                        {formatCurrency(loan.remainingAmount)}
                      </p>
                      <span className="material-symbols-outlined text-app-muted text-sm">chevron_right</span>
                    </div>
                  </div>
                </SwipeableItem>
              );
            })
          )}
        </div>

        {/* Spacer */}
        <div className="h-16" />
      </div>

      {/* Detail Sheet */}
      {selectedLoan && (
        <LoanDetailSheet
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onEdit={() => {
            setSelectedLoan(null);
            navigate(`/loans/${selectedLoan.id}`);
          }}
          onDelete={() => {
            setDeleteModal({ loan: selectedLoan, revert: selectedLoan.status !== 'paid' });
          }}
          onMarkPaid={() => markPaidMutation.mutate(selectedLoan.id)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-app-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="size-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-3xl text-rose-500">delete</span>
              </div>
              <h3 className="text-lg font-bold text-app-text">¿Eliminar préstamo?</h3>
              <p className="text-sm text-app-muted mt-1">
                Préstamo con <strong>{deleteModal.loan.borrowerName}</strong>
              </p>
            </div>

            {deleteModal.loan.status !== 'paid' && deleteModal.loan.accountId && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Nota:</strong> Se revertirá el saldo ({formatCurrency(deleteModal.loan.remainingAmount)}) a tu cuenta.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-3 px-4 bg-app-subtle text-app-text rounded-xl font-semibold hover:bg-app-border transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteModal.loan.id, revert: deleteModal.revert })}
                className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
