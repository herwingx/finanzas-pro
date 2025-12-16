import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, addLoan, getLoan, updateLoan } from '../services/apiService';
import { toastSuccess, toastError, toast } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { DatePicker } from '../components/DatePicker';
import { LoanType, Account, Loan } from '../types';

const LoanFormPage: React.FC = () => {
  // --- Routing & State ---
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  // --- Form Data ---
  const [formData, setFormData] = useState({
    borrowerName: '',
    borrowerPhone: '',
    borrowerEmail: '',
    reason: '',
    loanType: 'lent' as LoanType,
    originalAmount: '',
    loanDate: new Date().toISOString().split('T')[0],
    expectedPayDate: '',
    notes: '',
    accountId: '',
    affectBalance: true,
  });

  // --- Theme Helpers ---
  // Violeta para "Prestar" (Inversión/Activo), Rosa para "Pedir" (Deuda/Pasivo)
  const isLent = formData.loanType === 'lent';
  const themeColor = isLent ? 'violet' : 'rose';
  const themeClass = isLent ? 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
  const borderClass = isLent ? 'focus:border-violet-500 focus:ring-violet-500/20' : 'focus:border-rose-500 focus:ring-rose-500/20';

  // --- Queries ---
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
  const { data: existingLoan, isLoading: loadingLoan } = useQuery<Loan>({
    queryKey: ['loan', id],
    queryFn: () => getLoan(id!),
    enabled: isEditing
  });

  useEffect(() => {
    if (existingLoan) {
      setFormData({
        borrowerName: existingLoan.borrowerName,
        borrowerPhone: existingLoan.borrowerPhone || '',
        borrowerEmail: existingLoan.borrowerEmail || '',
        reason: existingLoan.reason || '',
        loanType: existingLoan.loanType || 'lent',
        originalAmount: existingLoan.originalAmount.toString(),
        loanDate: existingLoan.loanDate.split('T')[0],
        expectedPayDate: existingLoan.expectedPayDate?.split('T')[0] || '',
        notes: existingLoan.notes || '',
        accountId: existingLoan.accountId || '',
        affectBalance: true, // Reset logic logic usually
      });
    }
  }, [existingLoan]);

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: addLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] }); // Important
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toastSuccess(isLent ? 'Préstamo registrado' : 'Deuda registrada');
      navigate('/loans', { replace: true });
    },
    onError: (e: any) => toastError(e.message || 'Error al registrar')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateLoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
      toastSuccess('Préstamo actualizado');
      navigate('/loans', { replace: true });
    },
    onError: (e: any) => toastError(e.message || 'Error al actualizar')
  });

  // --- Handlers ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.borrowerName.trim()) return toastError('Nombre requerido');
    if (!formData.originalAmount || parseFloat(formData.originalAmount) <= 0) return toastError('Monto inválido');

    const payload = {
      ...formData,
      borrowerPhone: formData.borrowerPhone || undefined,
      borrowerEmail: formData.borrowerEmail || undefined,
      reason: formData.reason || undefined,
      expectedPayDate: formData.expectedPayDate || undefined,
      notes: formData.notes || undefined,
      accountId: formData.accountId || undefined,
      originalAmount: parseFloat(formData.originalAmount)
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, data: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const debitAccounts = accounts.filter(a => a.type !== 'CREDIT');

  if (isEditing && loadingLoan) {
    return <div className="min-h-dvh flex items-center justify-center animate-pulse text-app-muted">Cargando...</div>;
  }

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text font-sans">
      <PageHeader
        title={isEditing ? 'Editar' : 'Nuevo Préstamo'}
        showBackButton={true}
      />

      <div className="max-w-lg mx-auto px-5 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Loan Type Select (Solo creación) */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, loanType: 'lent' })}
                className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${formData.loanType === 'lent'
                  ? 'border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/20'
                  : 'border-app-border bg-app-surface hover:border-app-muted'
                  }`}
              >
                <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${formData.loanType === 'lent' ? 'bg-violet-500 text-white' : 'bg-app-subtle text-app-muted'}`}>
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <p className={`text-sm font-bold ${formData.loanType === 'lent' ? 'text-violet-600 dark:text-violet-400' : 'text-app-text'}`}>Yo presté</p>
                <p className="text-[10px] text-app-muted">Me deben dinero</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, loanType: 'borrowed' })}
                className={`p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${formData.loanType === 'borrowed'
                  ? 'border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/20'
                  : 'border-app-border bg-app-surface hover:border-app-muted'
                  }`}
              >
                <div className={`size-10 rounded-full flex items-center justify-center mb-3 ${formData.loanType === 'borrowed' ? 'bg-rose-500 text-white' : 'bg-app-subtle text-app-muted'}`}>
                  <span className="material-symbols-outlined">trending_down</span>
                </div>
                <p className={`text-sm font-bold ${formData.loanType === 'borrowed' ? 'text-rose-600 dark:text-rose-400' : 'text-app-text'}`}>Me prestaron</p>
                <p className="text-[10px] text-app-muted">Yo debo dinero</p>
              </button>
            </div>
          )}

          {/* 2. Hero Amount */}
          <div className="text-center py-4">
            <label className="text-xs text-app-muted uppercase font-bold tracking-widest block mb-2">Monto {isLent ? 'a Prestar' : 'Recibido'}</label>
            <div className="inline-flex items-center justify-center">
              <span className="text-3xl text-app-muted font-bold mr-1 opacity-50">$</span>
              <input
                type="number" step="0.01" min="0" inputMode="decimal" onWheel={(e) => e.currentTarget.blur()}
                value={formData.originalAmount}
                onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                placeholder="0.00"
                autoFocus
                className="w-48 bg-transparent text-5xl font-black text-center text-app-text placeholder-app-muted/20 outline-none no-spin-button"
              />
            </div>
          </div>

          {/* 3. Details Card */}
          <div className="bg-app-surface border border-app-border rounded-3xl p-5 space-y-5 shadow-sm">
            {/* Name & Contact */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-app-muted uppercase pl-1 mb-1">Nombre {isLent ? 'del Deudor' : 'del Prestamista'}</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-app-muted material-symbols-outlined text-[20px]">person</span>
                  <input
                    type="text"
                    value={formData.borrowerName} onChange={e => setFormData({ ...formData, borrowerName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm font-semibold outline-none focus:ring-2 ${borderClass} transition-all`}
                    placeholder={isLent ? "Juan Pérez" : "Banco Azteca"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Teléfono (Op.)"
                  value={formData.borrowerPhone} onChange={e => setFormData({ ...formData, borrowerPhone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs font-medium outline-none focus:border-app-muted"
                />
                <input
                  type="text"
                  placeholder="Email (Op.)"
                  value={formData.borrowerEmail} onChange={e => setFormData({ ...formData, borrowerEmail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs font-medium outline-none focus:border-app-muted"
                />
              </div>
            </div>

            <div className="h-px bg-app-border/50"></div>

            {/* Dates & Reason */}
            <div className="space-y-4">
              <input
                type="text"
                value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                className={`w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm outline-none focus:ring-2 ${borderClass} transition-all`}
                placeholder="Motivo (Ej. Renta, Emergencia...)"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-app-muted uppercase pl-1 mb-1">Fecha {isLent ? 'Entrega' : 'Recepción'}</label>
                  <DatePicker
                    date={new Date(formData.loanDate + 'T00:00:00')}
                    onDateChange={(d) => d && setFormData({ ...formData, loanDate: d.toISOString().split('T')[0] })}
                    disabled={isEditing}
                    className="w-full bg-app-bg border border-app-border rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-muted uppercase pl-1 mb-1 text-rose-500">Fecha Límite</label>
                  <DatePicker
                    date={formData.expectedPayDate ? new Date(formData.expectedPayDate + 'T00:00:00') : undefined}
                    onDateChange={(d) => setFormData({ ...formData, expectedPayDate: d ? d.toISOString().split('T')[0] : '' })}
                    className="w-full bg-app-bg border border-app-border rounded-xl font-medium focus-within:border-app-text"
                    placeholder="Sin fecha límite"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Link Account (Only on create) */}
          {!isEditing && (
            <div className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className={`size-8 rounded-lg flex items-center justify-center ${themeClass}`}>
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-app-text">Movimiento de dinero</h3>
                  <p className="text-[10px] text-app-muted">¿Registrar en tus cuentas?</p>
                </div>
              </div>

              <div className="space-y-3">
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-3 bg-app-bg border border-app-border rounded-xl text-sm font-semibold outline-none appearance-none cursor-pointer"
                >
                  <option value="">No afectar mis saldos</option>
                  {debitAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {isLent ? 'Retirar de ' : 'Depositar a '} {account.name}
                    </option>
                  ))}
                </select>

                {formData.accountId && (
                  <p className="text-[10px] text-app-muted text-center animate-fade-in px-2">
                    Se creará una transacción de {isLent ? 'Gasto' : 'Ingreso'} automáticamente en la cuenta seleccionada.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 5. Submit */}
          <div className="pt-2 pb-12">
            <button
              type="submit"
              disabled={addMutation.isPending || updateMutation.isPending}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 bg-app-primary hover:bg-app-primary-dark shadow-app-primary/30"

            >
              {addMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : isEditing ? 'Guardar Cambios' : 'Confirmar'
              }
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default LoanFormPage;