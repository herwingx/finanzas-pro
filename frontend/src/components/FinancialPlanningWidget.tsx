import React, { useState, useRef, useMemo } from 'react';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { usePayRecurringTransaction, useAccounts, usePayFullStatement, usePayMsiInstallment } from '../hooks/useApi';
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
  const threshold = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > 0) {
      setOffsetX(Math.min(diff, 150));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > threshold) {
      onPay();
      setOffsetX(0);
    } else {
      setOffsetX(0);
    }
  };

  const progress = Math.min(offsetX / threshold, 1);

  return (
    <div className="relative overflow-hidden mb-2 select-none touch-pan-y group">
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

      <div
        ref={itemRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative p-3 rounded-xl flex items-center justify-between border transition-transform duration-200 ease-out hover:bg-app-card ${item.isOverdue
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-app-elevated border-transparent'
          }`}
        style={{
          transform: `translateX(${offsetX}px)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${item.isOverdue ? 'bg-red-500/20 text-red-500' : 'bg-app-warning/10 text-app-warning'}`}>
            <span className="material-symbols-outlined text-lg">
              {item.isOverdue ? 'warning' : 'payments'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-app-text leading-tight">{item.description}</p>
              {item.isOverdue && (
                <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                  ATRASADO
                </span>
              )}
            </div>
            <p className={`text-xs ${item.isOverdue ? 'text-red-400' : 'text-app-muted'}`}>
              {formatDate(item.dueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-semibold ${item.isOverdue ? 'text-red-500' : 'text-app-text'}`}>
            {formatCurrency(item.amount)}
          </span>
          <span className="material-symbols-outlined text-app-muted text-sm opacity-50">chevron_right</span>
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

// Credit Card Statement Card Component
const CreditCardStatementCard = ({
  group,
  groupKey,
  isExpanded,
  onToggleExpand,
  onPayAll,
  onPayIndividual,
  formatCurrency,
  formatDate,
  sourceAccounts,
  selectedSourceAccount,
  onSourceAccountChange
}: {
  group: any;
  groupKey: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPayAll: () => void;
  onPayIndividual: (item: any) => void;
  formatCurrency: (val: number) => string;
  formatDate: (date: string) => string;
  sourceAccounts: any[];
  selectedSourceAccount: string;
  onSourceAccountChange: (accountId: string) => void;
}) => {
  const msiItems = group.items.filter((i: any) => i.isMsi);
  const regularItems = group.items.filter((i: any) => !i.isMsi);
  const msiTotal = msiItems.reduce((sum: number, i: any) => sum + i.amount, 0);
  const regularTotal = regularItems.reduce((sum: number, i: any) => sum + i.amount, 0);

  // Calculate days until payment
  const paymentDate = new Date(group.dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysUntil <= 3;
  const isDue = daysUntil <= 0;

  return (
    <div className={`relative bg-gradient-to-br ${isDue ? 'from-red-500/10 to-red-900/20' : isUrgent ? 'from-amber-500/10 to-amber-900/20' : 'from-app-elevated/80 to-app-card/50'} 
      border ${isDue ? 'border-red-500/30' : isUrgent ? 'border-amber-500/30' : 'border-app-border'} rounded-2xl overflow-hidden transition-all duration-300 shadow-lg backdrop-blur-sm`}>

      {/* Card Header */}
      <div
        onClick={onToggleExpand}
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors relative"
      >
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${isDue ? 'bg-red-500 text-white' :
            isUrgent ? 'bg-amber-500 text-black' :
              'bg-app-primary/20 text-app-primary'
            }`}>
            {isDue ? '¡Vence Hoy!' : isUrgent ? `${daysUntil} días` : `${daysUntil} días`}
          </span>
        </div>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-app-credit flex items-center justify-center text-white shadow-lg shrink-0">
            <span className="material-symbols-outlined text-2xl">credit_card</span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-app-text text-lg">{group.accountName}</h5>
            <p className="text-xs text-app-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">event</span>
              Fecha límite: <span className="font-semibold text-app-text">{formatDate(group.dueDate)}</span>
            </p>
          </div>
        </div>

        {/* Total to Pay */}
        <div className="bg-app-card/50 rounded-xl p-3 mb-3 border border-app-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-app-muted uppercase tracking-wider font-medium">Total a Pagar al Corte</span>
            <span className="text-2xl font-bold text-app-text">{formatCurrency(group.totalAmount)}</span>
          </div>
        </div>

        {/* Breakdown Summary */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-app-msi-bg rounded-lg p-2 border border-app-msi/20">
            <p className="text-[10px] text-app-msi font-bold uppercase">MSI ({msiItems.length})</p>
            <p className="text-sm font-bold text-app-text">{formatCurrency(msiTotal)}</p>
          </div>
          <div className="bg-app-debit-bg rounded-lg p-2 border border-app-debit/20">
            <p className="text-[10px] text-app-debit font-bold uppercase">Consumos ({regularItems.length})</p>
            <p className="text-sm font-bold text-app-text">{formatCurrency(regularTotal)}</p>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center justify-center mt-3 pt-2 border-t border-app-border/30">
          <span className={`material-symbols-outlined text-app-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
          <span className="text-xs text-app-muted ml-1">
            {isExpanded ? 'Ocultar detalles' : 'Ver desglose completo'}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-app-card/80 border-t border-app-border animate-in slide-in-from-top-2 duration-200 backdrop-blur-sm">

          {/* Source Account Selector */}
          <div className="p-3 border-b border-app-border/50">
            <label className="text-[10px] text-app-muted uppercase tracking-wider font-medium block mb-1">
              Pagar desde:
            </label>
            <select
              value={selectedSourceAccount}
              onChange={(e) => onSourceAccountChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-app-elevated border border-app-border text-app-text"
            >
              <option value="">Selecciona cuenta...</option>
              {sourceAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* MSI Items */}
          {msiItems.length > 0 && (
            <div className="p-3 border-b border-app-border/50">
              <h6 className="text-xs font-bold text-app-msi uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Mensualidades (MSI)
              </h6>
              <div className="space-y-2">
                {msiItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-app-elevated/50 hover:bg-app-elevated transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-text truncate">{item.description}</p>
                      <p className="text-[10px] text-app-muted">
                        Cuota del mes • Restante: {formatCurrency(item.msiTotal - item.paidAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-app-text">{formatCurrency(item.amount)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onPayIndividual(item); }}
                        className="p-1.5 rounded-lg text-app-muted hover:bg-app-success hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Pagar solo esta cuota"
                      >
                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Purchases */}
          {regularItems.length > 0 && (
            <div className="p-3 border-b border-app-border/50">
              <h6 className="text-xs font-bold text-app-debit uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">shopping_cart</span>
                Consumos del Periodo
              </h6>
              <div className="space-y-2">
                {regularItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-app-elevated/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-app-text truncate">{item.description}</p>
                      <p className="text-[10px] text-app-muted">Cargo regular</p>
                    </div>
                    <span className="text-sm font-semibold text-app-text">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Actions */}
          <div className="p-3 space-y-2">
            <button
              onClick={onPayAll}
              disabled={!selectedSourceAccount}
              className={`btn btn-block ${selectedSourceAccount
                ? 'btn-pay'
                : 'btn-cancel cursor-not-allowed'
                }`}
            >
              <span className="material-symbols-outlined">payments</span>
              Pagar Todo al Corte ({formatCurrency(group.totalAmount)})
            </button>
            <p className="text-[10px] text-center text-app-muted">
              Se registrará una transferencia con el desglose completo
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


export const FinancialPlanningWidget: React.FC = () => {
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'semanal'>('quincenal');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedSourceAccounts, setSelectedSourceAccounts] = useState<Record<string, string>>({});
  const { data: summary, isLoading, isError } = useFinancialPeriodSummary(periodType);
  const { data: accounts } = useAccounts();
  const { mutateAsync: payRecurring } = usePayRecurringTransaction();
  const { mutateAsync: payFullStatement, isPending: isPayingStatement } = usePayFullStatement();
  const { mutateAsync: payMsiInstallment, isPending: isPayingMsi } = usePayMsiInstallment();

  // Filter source accounts (non-credit)
  const sourceAccounts = useMemo(() => {
    return accounts?.filter(a => !['credit', 'CREDIT', 'Credit Card', 'Tarjeta de Crédito'].includes(a.type)) || [];
  }, [accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // Group Payments by Credit Card Account
  const groupedCreditCardPayments = useMemo(() => {
    if (!summary?.msiPaymentsDue) return {};

    const groups: Record<string, {
      accountName: string,
      accountId: string,
      dueDate: string,
      totalAmount: number,
      items: any[]
    }> = {};

    summary.msiPaymentsDue.forEach((payment: any) => {
      const key = `${payment.accountId}-${payment.dueDate}`;
      if (!groups[key]) {
        groups[key] = {
          accountName: payment.accountName || 'Tarjeta de Crédito',
          accountId: payment.accountId,
          dueDate: payment.dueDate,
          totalAmount: 0,
          items: []
        };
      }
      groups[key].items.push(payment);
      groups[key].totalAmount += payment.amount;
    });

    return groups;
  }, [summary]);

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
      duration: 5000,
    });
  };

  const handlePayWholeCard = async (groupKey: string) => {
    const group = groupedCreditCardPayments[groupKey];
    if (!group) return;

    const sourceAccountId = selectedSourceAccounts[groupKey];
    if (!sourceAccountId) {
      toast.error('Selecciona una cuenta de origen');
      return;
    }

    const sourceAccount = sourceAccounts.find(a => a.id === sourceAccountId);
    if (!sourceAccount) return;

    if (sourceAccount.balance < group.totalAmount) {
      toast.error('Saldo insuficiente en la cuenta seleccionada');
      return;
    }

    // Show confirmation toast
    toast.custom((t) => (
      <div className="bg-app-card border border-app-border rounded-xl p-4 shadow-xl max-w-sm w-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-app-success/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-app-success">payments</span>
          </div>
          <div>
            <p className="font-bold text-app-text text-sm">Confirmar Pago de Corte</p>
            <p className="text-xs text-app-muted">{group.accountName}</p>
          </div>
        </div>

        <div className="bg-app-elevated rounded-lg p-3 mb-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-app-muted">Monto Total:</span>
            <span className="font-bold text-app-text">{formatCurrency(group.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-app-muted">Desde:</span>
            <span className="font-medium text-app-text">{sourceAccount.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-app-muted">Conceptos:</span>
            <span className="font-medium text-app-text">{group.items.length} items</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 py-2 rounded-lg bg-app-elevated text-app-text text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                await payFullStatement({
                  accountId: group.accountId,
                  sourceAccountId: sourceAccountId
                });
                toast.success('¡Corte pagado exitosamente!', {
                  description: `Se pagaron ${group.items.length} conceptos por ${formatCurrency(group.totalAmount)}`
                });
              } catch (error: any) {
                toast.error(error.message || 'Error al pagar el corte');
              }
            }}
            className="flex-1 py-2 rounded-lg bg-app-success text-white text-sm font-bold"
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handlePayIndividualItem = async (item: any, groupKey: string) => {
    const sourceAccountId = selectedSourceAccounts[groupKey];

    if (!sourceAccountId) {
      toast.error('Selecciona una cuenta de origen primero');
      return;
    }

    if (!item.isMsi) {
      // For regular purchases, navigate to transfer form
      navigate('/new', {
        state: {
          type: 'transfer',
          amount: item.amount,
          description: `Pago Parcial: ${item.description}`,
          destinationAccountId: item.accountId,
          sourceAccountId: sourceAccountId,
          date: new Date().toISOString()
        }
      });
      return;
    }

    // For MSI, use the dedicated endpoint
    toast(`¿Pagar cuota de ${formatCurrency(item.amount)}?`, {
      description: `${item.description}`,
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await payMsiInstallment({
              installmentId: item.id,
              sourceAccountId: sourceAccountId
            });
            toast.success('¡Cuota MSI pagada!');
          } catch (error: any) {
            toast.error(error.message || 'Error al pagar la cuota');
          }
        },
      },
      duration: 5000,
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

  const hasCards = Object.keys(groupedCreditCardPayments).length > 0;
  const hasExpenses = summary.expectedExpenses.length > 0;

  return (
    <div className="bg-gradient-to-br from-app-card to-app-elevated border border-app-border rounded-2xl p-5 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-app-primary to-purple-600 flex items-center justify-center shadow-lg shadow-app-primary/20">
            <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-app-text">Planificación</h3>
            <p className="text-[10px] text-app-muted uppercase tracking-wider">Control de Cortes</p>
          </div>
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

      {/* Stats Summary Grid - Enhanced Breakdown */}
      <div className="space-y-3">
        {/* Income Row */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-lg">trending_up</span>
            </div>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ingresos Esperados</span>
          </div>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(summary.totalExpectedIncome)}</span>
        </div>

        {/* Expenses Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          {/* TDC Payments */}
          <div className="bg-app-credit-bg border border-app-credit/20 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-app-credit text-sm">credit_card</span>
              <span className="text-[10px] text-app-muted font-bold uppercase">Tarjetas</span>
            </div>
            <span className="text-lg font-bold text-app-text">
              {formatCurrency(summary.msiPaymentsDue?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)}
            </span>
          </div>

          {/* Recurring Expenses */}
          <div className="bg-app-recurring-bg border border-app-recurring/20 rounded-xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-app-recurring text-sm">sync</span>
              <span className="text-[10px] text-app-muted font-bold uppercase">Recurrentes</span>
            </div>
            <span className="text-lg font-bold text-app-text">
              {formatCurrency(summary.expectedExpenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)}
            </span>
          </div>
        </div>

        {/* Total Commitments Row */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-900/20 border border-red-500/20 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-lg">payments</span>
            </div>
            <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Total por Pagar</span>
          </div>
          <span className="text-lg font-bold text-red-400">{formatCurrency(summary.totalCommitments)}</span>
        </div>
      </div>

      {/* Credit Card Section */}
      {hasCards && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-app-credit text-lg">credit_card</span>
            <h4 className="text-sm font-bold text-app-text">Pagos de Tarjeta al Corte</h4>
          </div>

          <div className="space-y-3">
            {Object.entries(groupedCreditCardPayments).map(([key, group]) => (
              <CreditCardStatementCard
                key={key}
                group={group}
                groupKey={key}
                isExpanded={expandedCard === key}
                onToggleExpand={() => setExpandedCard(expandedCard === key ? null : key)}
                onPayAll={() => handlePayWholeCard(key)}
                onPayIndividual={(item) => handlePayIndividualItem(item, key)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                sourceAccounts={sourceAccounts}
                selectedSourceAccount={selectedSourceAccounts[key] || ''}
                onSourceAccountChange={(accountId) => setSelectedSourceAccounts(prev => ({ ...prev, [key]: accountId }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular Recurring Expenses Section */}
      {hasExpenses && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-app-recurring text-lg">sync</span>
            <h4 className="text-sm font-bold text-app-text">Gastos Recurrentes</h4>
          </div>

          <div className="space-y-2">
            {summary.expectedExpenses.map((expense: any) => (
              <SwipeableExpenseRow
                key={expense.uniqueId || expense.id}
                item={expense}
                onPay={() => handlePay(expense.id, expense.amount, expense.description, expense.dueDate)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasCards && !hasExpenses && (
        <div className="text-center py-8 text-app-muted">
          <div className="w-16 h-16 rounded-full bg-app-success/10 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-app-success text-3xl">check_circle</span>
          </div>
          <p className="text-sm font-medium">¡Todo al día!</p>
          <p className="text-xs">No tienes compromisos pendientes este periodo</p>
        </div>
      )}

      {/* Projected Result */}
      <div className="bg-gradient-to-br from-app-elevated to-app-card rounded-xl p-4 border border-app-border">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-medium text-app-muted uppercase tracking-wide">Disponible Final</span>
            <p className="text-[10px] text-app-muted">Después de pagar todo</p>
          </div>
          <span className={`text-2xl font-bold ${summary.isSufficient ? 'text-app-success' : 'text-app-danger'}`}>
            {formatCurrency(summary.disposableIncome)}
          </span>
        </div>

        {!summary.isSufficient && (
          <div className="flex items-center gap-2 text-xs text-app-danger bg-app-danger/10 p-2 rounded-lg font-medium border border-app-danger/20 mt-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>Faltan {formatCurrency(Math.abs(summary.shortfall))} para cubrir todo.</span>
          </div>
        )}

        {summary.warnings && summary.warnings.length > 0 && (
          <div className="mt-2 space-y-1">
            {summary.warnings.slice(0, 2).map((warning: string, idx: number) => (
              <p key={idx} className="text-[10px] text-app-warning flex items-start gap-1">
                <span className="material-symbols-outlined text-[12px] mt-0.5">info</span>
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 50/30/20 Mini-Bar */}
      {summary.budgetAnalysis && summary.totalExpectedIncome > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-app-muted">
            <span>Necesidades</span>
            <span>Deseos</span>
            <span>Ahorro</span>
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-app-border w-full">
            <div className="bg-blue-500" style={{ width: `${Math.min((summary.budgetAnalysis.needs.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
            <div className="bg-purple-500" style={{ width: `${Math.min((summary.budgetAnalysis.wants.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
            <div className="bg-emerald-500" style={{ width: `${Math.min((summary.budgetAnalysis.savings.projected / summary.totalExpectedIncome) * 100, 100)}%` }}></div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/analysis')}
          className="flex-1 py-2.5 bg-app-elevated hover:bg-app-hover text-xs font-medium text-app-text rounded-xl transition-colors border border-app-border flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">analytics</span>
          Ver Análisis
        </button>
        <button
          onClick={() => navigate('/installments')}
          className="flex-1 py-2.5 bg-app-elevated hover:bg-app-hover text-xs font-medium text-app-text rounded-xl transition-colors border border-app-border flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">schedule</span>
          Mis MSI
        </button>
      </div>
    </div>
  );
};
