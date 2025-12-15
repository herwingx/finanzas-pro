import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccounts, addLoan, getLoan, updateLoan } from '../services/apiService';
import { toastSuccess, toastError } from '../utils/toast';
import { PageHeader } from '../components/PageHeader';
import { LoanType } from '../types';

const LoanFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const queryClient = useQueryClient();

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

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const { data: existingLoan, isLoading: loadingLoan } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => getLoan(id!),
    enabled: isEditing,
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
        affectBalance: true,
      });
    }
  }, [existingLoan]);

  const addMutation = useMutation({
    mutationFn: addLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toastSuccess('¡Préstamo registrado!');
      navigate('/loans', { replace: true });
    },
    onError: (error: any) => {
      toastError(error.message || 'Error al registrar el préstamo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLoan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan', id] });
      toastSuccess('¡Préstamo actualizado!');
      navigate('/loans', { replace: true });
    },
    onError: (error: any) => {
      toastError(error.message || 'Error al actualizar');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.borrowerName.trim()) {
      toastError('Ingresa el nombre de la persona');
      return;
    }

    if (!formData.originalAmount || parseFloat(formData.originalAmount) <= 0) {
      toastError('Ingresa un monto válido');
      return;
    }

    if (isEditing) {
      updateMutation.mutate({
        id: id!,
        data: {
          borrowerName: formData.borrowerName,
          borrowerPhone: formData.borrowerPhone || undefined,
          borrowerEmail: formData.borrowerEmail || undefined,
          reason: formData.reason || undefined,
          expectedPayDate: formData.expectedPayDate || undefined,
          notes: formData.notes || undefined,
          originalAmount: formData.originalAmount || undefined,
        },
      });
    } else {
      addMutation.mutate({
        borrowerName: formData.borrowerName,
        borrowerPhone: formData.borrowerPhone || undefined,
        borrowerEmail: formData.borrowerEmail || undefined,
        reason: formData.reason || undefined,
        loanType: formData.loanType,
        originalAmount: parseFloat(formData.originalAmount),
        loanDate: formData.loanDate,
        expectedPayDate: formData.expectedPayDate || undefined,
        notes: formData.notes || undefined,
        accountId: formData.accountId || undefined,
        affectBalance: formData.affectBalance,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const debitAccounts = accounts.filter(a => a.type !== 'CREDIT');
  const isLent = formData.loanType === 'lent';

  if (isEditing && loadingLoan) {
    return (
      <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
        <PageHeader title="Cargando..." showBackButton={true} />
        <div className="p-4 space-y-4">
          <div className="h-48 bg-app-subtle rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app-bg pb-safe text-app-text">
      <PageHeader
        title={isEditing ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        showBackButton={true}
      />

      <div className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Loan Type Selection (New loan only) */}
          {!isEditing && (
            <div className="bg-app-surface border border-app-border rounded-2xl p-4">
              <h3 className="text-xs font-bold text-app-muted uppercase tracking-wide mb-3">Tipo de Préstamo</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, loanType: 'lent' })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.loanType === 'lent'
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                      : 'border-app-border hover:border-app-primary/30'
                    }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-2 ${formData.loanType === 'lent' ? 'text-violet-500' : 'text-app-muted'
                    }`}>
                    trending_up
                  </span>
                  <p className={`text-sm font-bold ${formData.loanType === 'lent' ? 'text-violet-600 dark:text-violet-400' : 'text-app-text'}`}>
                    Presté dinero
                  </p>
                  <p className="text-[10px] text-app-muted mt-1">Me deben a mí</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, loanType: 'borrowed' })}
                  className={`p-4 rounded-xl border-2 transition-all ${formData.loanType === 'borrowed'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-app-border hover:border-app-primary/30'
                    }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-2 ${formData.loanType === 'borrowed' ? 'text-rose-500' : 'text-app-muted'
                    }`}>
                    trending_down
                  </span>
                  <p className={`text-sm font-bold ${formData.loanType === 'borrowed' ? 'text-rose-600 dark:text-rose-400' : 'text-app-text'}`}>
                    Me prestaron
                  </p>
                  <p className="text-[10px] text-app-muted mt-1">Yo debo</p>
                </button>
              </div>
            </div>
          )}

          {/* Person Info Section */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">person</span>
              {isLent ? '¿A quién le prestaste?' : '¿Quién te prestó?'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-app-muted mb-1.5">Nombre *</label>
              <input
                type="text"
                value={formData.borrowerName}
                onChange={(e) => setFormData({ ...formData, borrowerName: e.target.value })}
                className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                placeholder="Juan Pérez"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-app-muted mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={formData.borrowerPhone}
                  onChange={(e) => setFormData({ ...formData, borrowerPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                  placeholder="55 1234 5678"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-app-muted mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.borrowerEmail}
                  onChange={(e) => setFormData({ ...formData, borrowerEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Loan Details Section */}
          <div className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">payments</span>
              Detalles del préstamo
            </h3>

            <div>
              <label className="block text-xs font-semibold text-app-muted mb-1.5">
                {isLent ? 'Monto prestado *' : 'Monto recibido *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                  placeholder="0.00"
                />
              </div>
              {isEditing && (
                <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">warning</span>
                  Al editar el monto, el saldo restante se recalculará.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-muted mb-1.5">Motivo</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                placeholder="Ej: Para la renta, emergencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-app-muted mb-1.5">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.loanDate}
                  onChange={(e) => setFormData({ ...formData, loanDate: e.target.value })}
                  disabled={isEditing}
                  className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-app-muted mb-1.5">Fecha límite</label>
                <input
                  type="date"
                  value={formData.expectedPayDate}
                  onChange={(e) => setFormData({ ...formData, expectedPayDate: e.target.value })}
                  className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                />
                <p className="text-[10px] text-app-muted mt-1">Opcional - deja vacío si no hay límite</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-app-muted mb-1.5">Notas</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary resize-none"
                placeholder="Cualquier información adicional..."
              />
            </div>
          </div>

          {/* Account Selection (New loan only) */}
          {!isEditing && (
            <div className="bg-app-surface border border-app-border rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-app-muted uppercase tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">account_balance</span>
                {isLent ? 'Cuenta de origen' : 'Cuenta destino'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-app-muted mb-1.5">
                  {isLent ? '¿De qué cuenta salió el dinero?' : '¿A qué cuenta llegó el dinero?'}
                </label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-3 bg-app-subtle border border-app-border rounded-xl text-app-text focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary"
                >
                  <option value="">No vincular a cuenta</option>
                  {debitAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-app-muted mt-1">
                  {isLent
                    ? 'Si seleccionas una cuenta, el monto se restará'
                    : 'Si seleccionas una cuenta, el monto se sumará'
                  }
                </p>
              </div>

              {formData.accountId && (
                <label className="flex items-center gap-3 p-3 bg-app-subtle rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.affectBalance}
                    onChange={(e) => setFormData({ ...formData, affectBalance: e.target.checked })}
                    className="size-5 rounded border-app-border text-app-primary focus:ring-app-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-app-text">
                      {isLent ? 'Descontar de mi cuenta' : 'Agregar a mi cuenta'}
                    </p>
                    <p className="text-[10px] text-app-muted">
                      {isLent ? 'El saldo disminuirá' : 'El saldo aumentará'}
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={addMutation.isPending || updateMutation.isPending}
            className={`w-full py-4 text-white rounded-2xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isLent
                ? 'bg-violet-500 hover:bg-violet-600'
                : 'bg-rose-500 hover:bg-rose-600'
              }`}
          >
            <span className="material-symbols-outlined">
              {isEditing ? 'save' : 'add_circle'}
            </span>
            {addMutation.isPending || updateMutation.isPending
              ? 'Guardando...'
              : isEditing
                ? 'Guardar Cambios'
                : isLent ? 'Registrar Préstamo' : 'Registrar Deuda'
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoanFormPage;
