import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Services
import { getAccounts, addLoan, updateLoan } from '../../services/apiService';

// Hooks
import { toastSuccess, toastError, toast } from '../../utils/toast';

// Components
import { PageHeader } from '../PageHeader';
import { DatePicker } from '../DatePicker';
import { ToggleGroup } from '../Button';

// Types
import { LoanType, Account, Loan } from '../../types';

interface LoanFormProps {
  existingLoan?: Loan | null;
  onClose: () => void;
  isSheetMode?: boolean;
}

export const LoanForm: React.FC<LoanFormProps> = ({ existingLoan, onClose, isSheetMode = false }) => {
  const isEditing = !!existingLoan;
  const queryClient = useQueryClient();

  /* --- DATA FETCHING --- */
  const { data: accounts = [] } = useQuery<Account[]>({ queryKey: ['accounts'], queryFn: getAccounts });
  const liquidAccounts = useMemo(() => accounts.filter(a => ['DEBIT', 'CASH'].includes(a.type)), [accounts]);

  /* --- FORM STATE --- */
  const [formData, setFormData] = useState({
    borrowerName: "",
    borrowerPhone: "",
    borrowerEmail: "",
    reason: "",
    loanType: "lent" as LoanType,
    originalAmount: "",
    loanDate: new Date(),
    expectedPayDate: undefined as Date | undefined,
    notes: "",
    accountId: "",
    affectBalance: true, // New flag
  });

  // Effects
  useEffect(() => {
    if (existingLoan) {
      setFormData({
        borrowerName: existingLoan.borrowerName,
        borrowerPhone: existingLoan.borrowerPhone || "",
        borrowerEmail: existingLoan.borrowerEmail || "",
        reason: existingLoan.reason || "",
        loanType: existingLoan.loanType || "lent",
        originalAmount: String(existingLoan.originalAmount),
        loanDate: new Date(existingLoan.loanDate),
        expectedPayDate: existingLoan.expectedPayDate ? new Date(existingLoan.expectedPayDate) : undefined,
        notes: existingLoan.notes || "",
        accountId: existingLoan.accountId || "",
        affectBalance: !!existingLoan.accountId, // Sincronizado: Si ya tiene cuenta, es "Sí"
      });
    } else {
      // RESET COMPLETO para creación
      setFormData({
        borrowerName: "",
        borrowerPhone: "",
        borrowerEmail: "",
        reason: "",
        loanType: "lent",
        originalAmount: "",
        loanDate: new Date(),
        expectedPayDate: undefined,
        notes: "",
        accountId: "",
        affectBalance: true,
      });
    }
  }, [existingLoan]);

  /* --- MUTATIONS --- */
  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['loans-summary'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] }); // balance changes
    queryClient.invalidateQueries({ queryKey: ['transactions'] }); // history sync
    onClose();
  };

  const addM = useMutation({ mutationFn: addLoan, onSuccess, onError: (e: any) => toastError(e.message) });
  const updateM = useMutation({ mutationFn: ({ id, data }: any) => updateLoan(id, data), onSuccess, onError: (e: any) => toastError(e.message) });

  /* --- HANDLERS --- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formData.originalAmount);
    if (!val || val <= 0) return toastError('Monto requerido');
    if (!formData.borrowerName) return toastError('Nombre de persona requerido');

    const payload = {
      ...formData,
      originalAmount: val,
      loanDate: formData.loanDate.toISOString(),
      expectedPayDate: formData.expectedPayDate ? formData.expectedPayDate.toISOString() : null,
      borrowerPhone: formData.borrowerPhone || null,
      borrowerEmail: formData.borrowerEmail || null,
      reason: formData.reason || null,
      notes: formData.notes || null,
      accountId: formData.accountId || null,
      affectBalance: formData.affectBalance
    };

    if (isEditing) updateM.mutate({ id: existingLoan.id, data: payload });
    else addM.mutate(payload);
  };

  // Styles Helpers
  const isLent = formData.loanType === 'lent'; // Yo presto (Activo)
  const themeColor = isLent ? 'violet' : 'rose';

  const pageTitle = isEditing ? "Editar Préstamo" : "Registrar Préstamo";

  return (
    <>
      {/* 1. HEADER */}
      {isSheetMode ? (
        <div className="flex justify-between items-center mb-6 pt-2">
          <button type="button" onClick={onClose} className="text-sm font-medium text-app-muted hover:text-app-text px-2 md:hidden">Cancelar</button>
          <h2 className="text-lg font-bold text-app-text">{pageTitle}</h2>
          <div className="w-10" />
        </div>
      ) : (
        <PageHeader title={pageTitle} showBackButton onBack={onClose} />
      )}

      <div className={`${isSheetMode ? '' : 'px-4 pt-4 max-w-lg mx-auto'} pb-safe flex flex-col h-full`}>
        <form onSubmit={handleSubmit} className="space-y-3 flex-1 flex flex-col">

          {/* A. TOGGLE TYPE */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-2 mb-2 shrink-0">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, loanType: 'lent' }))}
                className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${formData.loanType === 'lent'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20 shadow-sm'
                  : 'border-app-border bg-app-surface text-app-muted hover:border-app-border-strong'}`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_outward</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Yo Presté</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, loanType: 'borrowed' }))}
                className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${formData.loanType === 'borrowed'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 shadow-sm'
                  : 'border-app-border bg-app-surface text-app-muted hover:border-app-border-strong'}`}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Me Prestaron</span>
              </button>
            </div>
          )}

          {/* B. HERO AMOUNT */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <span className="absolute -left-4 top-2 text-xl font-light text-app-muted opacity-50">$</span>
              <input
                type="number" step="0.01" inputMode="decimal"
                value={formData.originalAmount}
                onChange={e => setFormData({ ...formData, originalAmount: e.target.value })}
                placeholder="0.00"
                autoFocus={!isEditing}
                className={`text-center text-4xl font-black bg-transparent w-40 outline-none placeholder:text-app-muted/20 py-1 transition-colors ${isLent ? 'text-violet-500' : 'text-rose-500'}`}
              />
            </div>
          </div>

          {/* C. SCROLLABLE DETAILS AREA */}
          <div className="flex-1 min-h-0 flex flex-col space-y-3 overflow-y-auto">

            {/* Person & Concept */}
            <div className="space-y-3 shrink-0">
              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                <input
                  type="text"
                  value={formData.borrowerName}
                  onChange={e => setFormData({ ...formData, borrowerName: e.target.value })}
                  placeholder={isLent ? "Nombre del Deudor" : "Nombre del Prestamista"}
                  className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60"
                />
              </div>

              <div className="bg-app-subtle border border-app-border rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-app-primary/50 focus-within:border-app-primary transition-all">
                <input
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Motivo (Opcional)"
                  className="w-full bg-transparent text-sm font-medium outline-none text-app-text placeholder:text-app-muted/60"
                />
              </div>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div>
                <label className="text-[10px] font-bold text-app-text ml-1 mb-1 block uppercase tracking-wide opacity-70">Fecha</label>
                <DatePicker
                  date={formData.loanDate}
                  onDateChange={d => d && setFormData(p => ({ ...p, loanDate: d }))}
                  className="bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle"
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold ml-1 mb-1 block uppercase tracking-wide opacity-70 ${formData.expectedPayDate ? 'text-app-primary' : 'text-app-text'}`}>
                  Vencimiento
                </label>
                <div className="flex gap-2">
                  <DatePicker
                    date={formData.expectedPayDate}
                    placeholder="Sin Límite"
                    onDateChange={d => setFormData(p => ({ ...p, expectedPayDate: d }))}
                    className={`bg-app-subtle border-app-border h-11 rounded-xl px-3 text-sm font-bold shadow-sm hover:bg-app-subtle flex-1 ${!formData.expectedPayDate && 'text-app-muted font-normal'}`}
                  />
                  {formData.expectedPayDate && (
                    <button type="button" onClick={() => setFormData(p => ({ ...p, expectedPayDate: undefined }))} className="size-11 rounded-xl border border-app-border flex items-center justify-center text-app-muted hover:bg-rose-50 hover:text-rose-500 transition-colors bg-app-surface shrink-0">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* D. LINK TO WALLET - Compact */}
            <div className="pt-2 border-t border-app-border/40 mt-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-app-text uppercase tracking-wide opacity-70">Afectar Saldo de Caja</label>
                <ToggleGroup
                  options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }]}
                  value={String(formData.affectBalance)}
                  onChange={(v) => {
                    const isAffecting = v === 'true';
                    setFormData(p => ({
                      ...p,
                      affectBalance: isAffecting,
                      accountId: isAffecting ? p.accountId : ""
                    }));
                  }}
                />
              </div>

              <div className={`relative transition-all duration-300 ${!formData.affectBalance ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <select
                  value={formData.accountId}
                  onChange={e => setFormData(p => ({ ...p, accountId: e.target.value }))}
                  className="w-full bg-app-subtle border border-app-border h-11 rounded-xl pl-3 pr-8 text-sm font-bold text-app-text appearance-none outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary shadow-sm transition-all"
                >
                  <option value="">-- No registrar --</option>
                  {liquidAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-2.5 text-app-muted pointer-events-none text-[20px]">account_balance_wallet</span>
              </div>
            </div>

          </div>

          {/* E. SUBMIT */}
          <div className="pt-4 pb-10 mt-auto shrink-0 touch-none">
            <button
              type="submit"
              disabled={addM.isPending || updateM.isPending}
              className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isLent ? 'bg-violet-600 shadow-violet-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}
            >
              {(addM.isPending || updateM.isPending) && <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEditing ? 'Guardar Cambios' : (isLent ? 'Registrar Préstamo' : 'Confirmar Deuda')}
            </button>
          </div>

        </form>
      </div>
    </>
  );
};