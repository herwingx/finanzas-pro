import React, { useState, useRef, useEffect } from 'react';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { usePayRecurringTransaction, useSkipRecurringTransaction } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Helper component for Swipe-to-Pay interaction
const SwipeableExpenseRow = ({
  item,
  onPay,
  formatCurrency,
  formatDate
}: {
  item: any,
  onPay: () => void,
  formatCurrency: (val: number) => string,
  formatDate: (date: string) => string
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const threshold = 100; // Pixel usage to trigger action

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Only allow swipe right (positive diff), flatten resistance after threshold
    if (diff > 0) {
      setOffsetX(Math.min(diff, 150)); // Clamp max swipe
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > threshold) {
      // Trigger pay
      onPay();
      setOffsetX(0); // Reset immediately or await animation? Reset usually better after action
    } else {
      // Bounce back
      setOffsetX(0);
    }
  };

  // Calculate opacity/scale of the action background based on swipe progress
  const progress = Math.min(offsetX / threshold, 1);

  return (
    <div className="relative overflow-hidden mb-2 select-none touch-pan-y group">
      {/* Background Action Layer (Visible when swiping right) */}
      <div
        className="absolute inset-0 bg-app-success rounded-xl flex items-center justify-start pl-4"
        style={{ opacity: offsetX > 0 ? 1 : 0 }}
      >
        <div
          className="text-app-text-inverted font-bold flex items-center gap-2"
          style={{ transform: `translateX(${progress * 10}px)` }}
        >
          <span className="material-symbols-outlined">check</span>
          <span className="text-sm">PAGAR</span>
        </div>
      </div>

      {/* Foreground Content Layer */}
      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-app-elevated p-3 rounded-xl flex items-center justify-between border border-transparent transition-transform duration-200 ease-out hover:bg-app-card"
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-app-danger/10 text-app-danger">
            <span className="material-symbols-outlined text-lg">payments</span>
          </div>
          <div>
            <p className="text-sm font-medium text-app-text leading-tight">{item.description}</p>
            <p className="text-xs text-app-muted">{formatDate(item.dueDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-app-text">{formatCurrency(item.amount)}</span>

          {/* Mobile Hint (Chevron) - Optional, indicates swipeability */}
          <span className="material-symbols-outlined text-app-muted text-sm opacity-50">chevron_right</span>

          {/* Desktop Hover Button (Always useful as fallback) */}
          <button
            onClick={(e) => { e.stopPropagation(); onPay(); }}
            className="hidden md:flex absolute right-2 opacity-0 group-hover:opacity-100 transition-all p-2 bg-app-success text-app-text-inverted rounded-lg shadow-lg hover:scale-105"
            title="Registrar Pago"
          >
            <span className="material-symbols-outlined text-sm">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};


export const FinancialPlanningWidget: React.FC = () => {
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'semanal'>('quincenal');
  const { data: summary, isLoading, isError } = useFinancialPeriodSummary(periodType);
  const { mutateAsync: payRecurring } = usePayRecurringTransaction();
  const { mutateAsync: skipRecurring } = useSkipRecurringTransaction();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Fix Timezone Issue: Parse YYYY-MM-DD manually to create local date at noon
    const parts = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const handlePay = (id: string, amount: number, description: string, date: string) => {
    toast(`¿Registrar pago de ${formatCurrency(amount)}?`, {
      description: `Para: ${description} (${formatDate(date)})`,
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await payRecurring({ id, data: { amount, date } });
            toast.success('Pago registrado exitosamente');
          } catch (error) {
            toast.error('Error al registrar el pago');
          }
        },
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => { },
      },
      duration: 5000,
    });
  };

  const handlePayMSI = (msi: any) => {
    // Navigate to transfer screen pre-filled
    navigate('/new', {
      state: {
        type: 'transfer',
        amount: msi.amount,
        description: `Pago Cuota: ${msi.description}`,
        destinationAccountId: msi.accountId, // The credit card account
        installmentPurchaseId: msi.id,
        date: new Date().toISOString()
      }
    });
  };

  const periodNames = {
    quincenal: 'Quincena',
    mensual: 'Mes',
    semanal: 'Semana'
  };

  if (isLoading) {
    return (
      <div className="bg-app-card border border-app-border rounded-2xl p-5 animate-pulse">
        <div className="h-6 bg-app-elevated rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-app-elevated rounded-lg opacity-50"></div>)}
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="bg-app-card border border-app-border rounded-2xl p-5">
        <p className="text-app-muted text-sm">No se pudo cargar el resumen financiero</p>
      </div>
    );
  }

  return (
    <div className="bg-app-card border border-app-border rounded-2xl p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-app-primary text-xl">account_balance_wallet</span>
          <h3 className="text-lg font-bold text-app-text">Planificación</h3>
        </div>
        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as typeof periodType)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-app-elevated border border-app-border text-app-text focus:outline-none focus:ring-2 focus:ring-app-primary"
        >
          <option value="quincenal">Quincena</option>
          <option value="mensual">Mes</option>
          <option value="semanal">Semana</option>
        </select>
      </div>

      {/* Period Indicator */}
      <div className="flex items-center gap-2 text-xs text-app-muted bg-app-elevated px-3 py-1.5 rounded-full w-fit">
        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
        <span>{periodNames[periodType]}: <span className="text-app-text font-medium">{formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}</span></span>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-app-success/10 border border-app-success/20 rounded-xl p-3 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <span className="text-xs text-app-success font-bold mb-1 uppercase tracking-wider">Ingresos</span>
          <span className="text-lg font-bold text-app-success shadow-app-success/20 drop-shadow-sm">{formatCurrency(summary.totalExpectedIncome)}</span>
        </div>
        <div className="bg-app-danger/10 border border-app-danger/20 rounded-xl p-3 flex flex-col items-center justify-center text-center backdrop-blur-sm">
          <span className="text-xs text-app-danger font-bold mb-1 uppercase tracking-wider">Gastos</span>
          <span className="text-lg font-bold text-app-danger shadow-app-danger/20 drop-shadow-sm">{formatCurrency(summary.totalCommitments)}</span>
        </div>
      </div>

      {/* Expenses List (Swipeable) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-app-text">Compromisos Pendientes</h4>
        </div>

        <div className="space-y-0">
          {summary.expectedExpenses.length > 0 && summary.expectedExpenses.map((expense: any) => (
            <SwipeableExpenseRow
              key={expense.uniqueId || expense.id}
              item={expense}
              onPay={() => handlePay(expense.id, expense.amount, expense.description, expense.dueDate)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ))}

          {summary.msiPaymentsDue.map((msi: any) => (
            <div key={msi.id} className="relative group mb-2 cursor-pointer" onClick={() => handlePayMSI(msi)}>
              <div className="relative bg-app-elevated p-3 rounded-xl flex items-center justify-between border border-transparent hover:border-app-secondary/30 transition-all duration-300 shadow-sm hover:shadow-glow-sm">
                {/* Decorative gradient for premium feel */}
                <div className="absolute inset-0 bg-gradient-to-r from-app-secondary/10 to-transparent opacity-50 rounded-xl pointer-events-none" />

                <div className="relative flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-app-secondary/10 text-app-secondary ring-1 ring-app-secondary/20 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-app-text leading-none">{msi.description}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-app-secondary text-app-text-inverted font-bold shadow-sm shadow-app-secondary/20 tracking-wider">MSI</span>
                    </div>
                    <p className="text-xs text-app-muted flex items-center gap-1">
                      <span>{formatDate(msi.dueDate)}</span>
                    </p>
                  </div>
                </div>
                <div className="relative flex flex-col items-end">
                  <span className="font-bold text-app-text">{formatCurrency(msi.amount)}</span>
                  <span className="text-[10px] text-app-secondary/80 font-medium group-hover:text-app-secondary transition-colors">Tocar para Pagar</span>
                </div>
              </div>
            </div>
          ))}

          {summary.expectedExpenses.length === 0 && summary.msiPaymentsDue.length === 0 && (
            <div className="text-center py-6 text-app-muted">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle_outline</span>
              <p className="text-sm">¡Todo pagado por este periodo!</p>
            </div>
          )}
        </div>
      </div>

      {/* Projected Result */}
      <div className="bg-app-elevated rounded-xl p-4 border border-app-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-app-muted uppercase tracking-wide">Disponible Final</span>
          <span className={`text-xl font-bold ${summary.isSufficient
            ? 'text-app-success'
            : 'text-app-danger'
            }`}>
            {formatCurrency(summary.disposableIncome)}
          </span>
        </div>

        {!summary.isSufficient && (
          <p className="text-xs text-app-danger mt-2 flex items-center gap-1 bg-app-danger/10 p-2 rounded-lg font-medium border border-app-danger/20">
            <span className="material-symbols-outlined text-sm">warning</span>
            Faltan {formatCurrency(Math.abs(summary.shortfall))} para cubrir todo.
          </p>
        )}
      </div>

      {/* 50/30/20 Mini-Bar */}
      {summary.budgetAnalysis && summary.totalExpectedIncome > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden bg-app-border w-full">
          <div className="bg-app-info" style={{ width: `${Math.min((summary.budgetAnalysis.needs.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
          <div className="bg-app-secondary" style={{ width: `${Math.min((summary.budgetAnalysis.wants.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
          <div className="bg-app-success" style={{ width: `${Math.min((summary.budgetAnalysis.savings.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/analysis')}
          className="w-full py-2 bg-app-elevated hover:bg-app-hover text-xs font-medium text-app-text rounded-lg transition-colors border border-app-border"
        >
          Ver Análisis Completo
        </button>
      </div>

    </div>
  );
};
