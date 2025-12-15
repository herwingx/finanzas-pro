import React, { useState, useRef, useMemo } from 'react';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { usePayRecurringTransaction, useAccounts, usePayFullStatement, usePayMsiInstallment } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDateUTC } from '../utils/dateUtils';

// --- Sub-components (Visuals Updated) ---

const StatusBadge = ({ days, overdue }: { days: number, overdue: boolean }) => {
  let colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
  let icon = "check_circle";
  let label = `${days} días para corte`;

  if (overdue) {
    colorClass = "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
    icon = "warning";
    label = "¡Vence Hoy!";
  } else if (days <= 3) {
    colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    icon = "priority_high";
    label = `${days} días restantes`;
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-transparent ${colorClass}`}>
      <span className="material-symbols-outlined text-[14px]">{icon}</span>
      {label}
    </div>
  );
};

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
  const threshold = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > 0) setOffsetX(Math.min(diff, 150));
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

  const opacity = Math.min(offsetX / threshold, 1);

  return (
    <div className="relative mb-0 border-b border-app-border last:border-0 group select-none overflow-hidden">
      {/* Background Swipe Action */}
      <div
        className="absolute inset-y-0 left-0 bg-app-success flex items-center pl-6 transition-opacity duration-200"
        style={{ width: '100%', opacity: offsetX > 0 ? opacity : 0 }}
      >
        <div className="flex items-center gap-2 text-white font-bold" style={{ transform: `translateX(${opacity * 20 - 20}px)` }}>
          <span className="material-symbols-outlined">check</span>
          <span className="text-xs tracking-wider">MARCAR PAGADO</span>
        </div>
      </div>

      {/* Main Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-app-surface p-3 flex items-center justify-between transition-transform duration-200 hover:bg-app-subtle cursor-pointer"
        style={{ transform: `translateX(${offsetX}px)` }}
        onClick={(e) => {
          // Allow desktop click to open edit/pay
          if (!isDragging && offsetX === 0) { /* Optional click logic */ }
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-app-subtle border border-app-border flex items-center justify-center shrink-0 text-app-muted">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-app-text truncate leading-none mb-1">{item.description}</p>
            <div className="flex items-center gap-2">
              {item.isOverdue && (
                <span className="text-[9px] font-bold text-app-danger bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-md">ATRASADO</span>
              )}
              <span className={`text-xs ${item.isOverdue ? 'text-app-danger' : 'text-app-muted'}`}>
                Vence: {formatDate(item.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-app-text tabular-nums">{formatCurrency(item.amount)}</span>
          {/* Desktop Only Hover Action */}
          <button
            onClick={(e) => { e.stopPropagation(); onPay(); }}
            className="hidden md:flex size-8 items-center justify-center rounded-full bg-app-success text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-105"
            title="Registrar Pago"
          >
            <span className="material-symbols-outlined text-[16px]">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Credit Card "Bill" Component
const CreditCardBill = ({
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
}: any) => {
  const msiItems = group.items.filter((i: any) => i.isMsi);
  const regularItems = group.items.filter((i: any) => !i.isMsi);

  const paymentDate = new Date(group.dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isDue = daysUntil <= 0;

  return (
    <div className={`
      relative bg-app-surface border transition-all duration-300 rounded-2xl overflow-hidden
      ${isDue ? 'border-l-4 border-l-rose-500 border-app-border' : 'border border-app-border hover:border-app-primary/50'}
      shadow-sm hover:shadow-md
    `}>
      {/* Resumen Cabecera */}
      <div onClick={onToggleExpand} className="p-4 cursor-pointer select-none">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-app-text">
              <span className="material-symbols-outlined text-xl">credit_card</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-app-text">{group.accountName}</h4>
              <div className="text-xs text-app-muted mt-0.5">Cierre: {formatDate(group.dueDate)}</div>
            </div>
          </div>
          <StatusBadge days={daysUntil} overdue={isDue} />
        </div>

        <div className="flex items-end justify-between border-t border-app-border pt-3">
          <div>
            <p className="text-[10px] uppercase text-app-muted font-bold tracking-wider mb-1">Pago para no generar intereses</p>
            <div className="flex gap-4 text-xs text-app-text">
              <span className="flex items-center gap-1 text-indigo-500">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                {msiItems.length} MSI
              </span>
              <span className="flex items-center gap-1 text-app-muted">
                <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-600" />
                {regularItems.length} Nuevos
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-app-text tabular-nums tracking-tight">{formatCurrency(group.totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Expanded Actions Zone */}
      {isExpanded && (
        <div className="bg-app-bg p-4 border-t border-app-border animate-slide-up">

          {/* Selector Cuenta Origen */}
          <div className="mb-4">
            <label className="block text-[10px] uppercase font-bold text-app-muted mb-1.5 ml-1">Pagar desde cuenta</label>
            <div className="relative">
              <select
                value={selectedSourceAccount}
                onChange={(e) => onSourceAccountChange(e.target.value)}
                className="w-full bg-app-surface border border-app-border rounded-xl text-sm px-3 py-2.5 appearance-none focus:ring-2 focus:ring-app-primary/20 focus:border-app-primary outline-none"
              >
                <option value="">Seleccionar cuenta...</option>
                {sourceAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance})</option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-app-muted material-symbols-outlined text-sm">unfold_more</span>
            </div>
          </div>

          {/* Payment Breakdown Details (Scrollable if many items) */}
          <div className="max-h-48 overflow-y-auto custom-scrollbar mb-4 border rounded-xl bg-app-surface divide-y divide-app-border">
            {msiItems.concat(regularItems).map((item: any) => (
              <div key={item.id} className="flex justify-between items-center p-3 text-xs">
                <div className="truncate pr-4 flex-1">
                  <div className="font-medium text-app-text">{item.description}</div>
                  <div className="text-[10px] text-app-muted">{item.isMsi ? 'Mensualidad activa' : 'Consumo reciente'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatCurrency(item.amount)}</span>
                  <button onClick={(e) => { e.stopPropagation(); onPayIndividual(item); }} title="Pagar individual" className="text-app-primary hover:text-app-primary-dark">
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onPayAll}
            disabled={!selectedSourceAccount}
            className="w-full btn btn-primary py-3 rounded-xl text-sm shadow-md"
          >
            Pagar Todo ({formatCurrency(group.totalAmount)})
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Widget Component ---

export const FinancialPlanningWidget: React.FC = () => {
  const navigate = useNavigate();
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual'>('quincenal');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedSourceAccounts, setSelectedSourceAccounts] = useState<Record<string, string>>({});

  const { data: summary, isLoading, isError } = useFinancialPeriodSummary(periodType);
  const { data: accounts } = useAccounts();

  const { mutateAsync: payRecurring } = usePayRecurringTransaction();
  const { mutateAsync: payFullStatement } = usePayFullStatement();
  const { mutateAsync: payMsiInstallment } = usePayMsiInstallment();

  // Filters & Helpers
  const sourceAccounts = useMemo(() => {
    return accounts?.filter(a => !['credit', 'CREDIT', 'Credit Card', 'Tarjeta de Crédito'].includes(a.type)) || [];
  }, [accounts]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateUTC(dateString, { style: 'short' });
  };

  // Logic: Grouping (Same as before)
  const groupedCreditCardPayments = useMemo(() => {
    if (!summary?.msiPaymentsDue) return {};
    const groups: any = {};
    summary.msiPaymentsDue.forEach((payment: any) => {
      const key = `${payment.accountId}-${payment.dueDate}`;
      if (!groups[key]) {
        groups[key] = {
          accountName: payment.accountName || 'Tarjeta', accountId: payment.accountId,
          dueDate: payment.dueDate, totalAmount: 0, items: []
        };
      }
      groups[key].items.push(payment);
      groups[key].totalAmount += payment.amount;
    });
    return groups;
  }, [summary]);

  // Logic: Handlers (Simplified wrappers around api calls with toast)
  const handlePay = (id: string, amount: number, desc: string, date: string) => {
    toast(`¿Confirmar pago de ${desc}?`, {
      description: `Monto: ${formatCurrency(amount)}`,
      action: { label: 'Pagar', onClick: async () => { await payRecurring({ id, data: { amount, date } }); toast.success('Pagado'); } }
    });
  };

  const handlePayWholeCard = async (key: string) => {
    const group = groupedCreditCardPayments[key];
    const sourceId = selectedSourceAccounts[key];
    if (!sourceId) return toast.error('Selecciona cuenta origen');

    // Aquí puedes poner el toast custom que tenías si quieres
    await payFullStatement({ accountId: group.accountId, sourceAccountId: sourceId });
    toast.success('Corte liquidado exitosamente');
  };

  const handlePayIndividual = async (item: any, key: string) => {
    const sourceId = selectedSourceAccounts[key];
    if (!sourceId) return toast.error('Selecciona cuenta origen');

    if (item.isMsi) {
      await payMsiInstallment({ installmentId: item.id, sourceAccountId: sourceId });
      toast.success('Cuota pagada');
    } else {
      // Redirigir a lógica normal
      navigate('/new', { state: { type: 'transfer', amount: item.amount, description: item.description, sourceAccountId: sourceId, date: new Date().toISOString() } });
    }
  };


  // --- Loading States ---
  if (isLoading) return <div className="bento-card h-64 p-6 animate-pulse flex items-center justify-center text-app-muted">Cargando planificación...</div>;
  if (isError || !summary) return <div className="bento-card p-6 text-app-danger text-center">Error cargando datos.</div>;

  const hasCards = Object.keys(groupedCreditCardPayments).length > 0;
  const hasExpenses = summary.expectedExpenses.length > 0;

  return (
    <div className="bento-card p-5 md:p-6 bg-white dark:bg-[#18181B] border-app-border shadow-sm flex flex-col gap-6">

      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-app-text tracking-tight">Planificación</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-xs text-app-muted font-medium">{formatDate(summary.periodStart)} - {formatDate(summary.periodEnd)}</p>
          </div>
        </div>

        {/* Native Select with custom styling */}
        <div className="relative">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as any)}
            className="appearance-none bg-app-subtle hover:bg-app-subtle/80 text-app-text text-xs font-semibold pl-3 pr-8 py-1.5 rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-app-primary border-transparent transition-colors"
          >
            <option value="semanal">Semana</option>
            <option value="quincenal">Quincena</option>
            <option value="mensual">Mes</option>
            <option value="bimestral">Bimestre</option>
            <option value="semestral">Semestre</option>
            <option value="anual">Año</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1.5 material-symbols-outlined text-[16px] text-app-muted">expand_more</span>
        </div>
      </div>

      {/* Main KPI Row (Horizontal for Efficiency) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-app-subtle/50 border border-app-border/50">
          <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Ingresos</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(summary.totalExpectedIncome)}</p>
        </div>
        <div className="p-3 rounded-2xl bg-app-subtle/50 border border-app-border/50">
          <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Tarjetas</p>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(summary.msiPaymentsDue?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)}
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-app-subtle/50 border border-app-border/50">
          <p className="text-[10px] uppercase font-bold text-app-muted mb-1">Fijos</p>
          <p className="text-lg font-bold text-app-text tabular-nums">
            {formatCurrency(summary.expectedExpenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)}
          </p>
        </div>
        <div className={`p-3 rounded-2xl border ${summary.isSufficient ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800' : 'bg-red-50 dark:bg-red-900/10 border-red-100'}`}>
          <p className={`text-[10px] uppercase font-bold mb-1 ${summary.isSufficient ? 'text-indigo-600 dark:text-indigo-300' : 'text-red-600'}`}>Resultado</p>
          <p className={`text-lg font-bold tabular-nums ${summary.isSufficient ? 'text-indigo-700 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(summary.disposableIncome)}
          </p>
        </div>
      </div>

      {/* 50/30/20 Bar (Clean Minimalist) */}
      {summary.budgetAnalysis && summary.totalExpectedIncome > 0 && (
        <div className="flex h-1.5 w-full rounded-full bg-app-border/50 overflow-hidden">
          <div className="bg-emerald-400 h-full" style={{ width: `${(summary.budgetAnalysis.needs.projected / summary.totalExpectedIncome) * 100}%` }} title="Necesidades" />
          <div className="bg-purple-400 h-full" style={{ width: `${(summary.budgetAnalysis.wants.projected / summary.totalExpectedIncome) * 100}%` }} title="Deseos" />
          <div className="bg-amber-400 h-full" style={{ width: `${(summary.budgetAnalysis.savings.projected / summary.totalExpectedIncome) * 100}%` }} title="Ahorro" />
        </div>
      )}

      {/* Credit Card Bills */}
      {hasCards && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider">Cortes de Tarjeta por Pagar</h4>
            <div className="h-px flex-1 bg-app-border/50"></div>
          </div>
          {Object.entries(groupedCreditCardPayments).map(([key, group]) => (
            <CreditCardBill
              key={key}
              group={group}
              groupKey={key}
              isExpanded={expandedCard === key}
              onToggleExpand={() => setExpandedCard(expandedCard === key ? null : key)}
              onPayAll={() => handlePayWholeCard(key)}
              onPayIndividual={(item: any) => handlePayIndividual(item, key)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              sourceAccounts={sourceAccounts}
              selectedSourceAccount={selectedSourceAccounts[key] || ''}
              onSourceAccountChange={(accountId: any) => setSelectedSourceAccounts(prev => ({ ...prev, [key]: accountId }))}
            />
          ))}
        </div>
      )}

      {/* Expenses List */}
      {hasExpenses && (
        <div className="mt-2">
          <div className="flex items-center gap-2 mb-3 px-1">
            <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider">Próximos Cargos</h4>
            <div className="h-px flex-1 bg-app-border/50"></div>
          </div>
          <div className="border border-app-border rounded-xl bg-app-bg divide-y divide-app-border overflow-hidden">
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
        <div className="py-8 flex flex-col items-center justify-center text-center opacity-60">
          <span className="material-symbols-outlined text-4xl mb-2 text-app-muted">spa</span>
          <p className="text-sm font-medium text-app-text">Sin pagos pendientes</p>
          <p className="text-xs text-app-muted">Disfruta tu libertad financiera este periodo</p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button onClick={() => navigate('/analysis')} className="btn btn-secondary text-xs py-2">
          Ver Análisis Detallado
        </button>
        <button onClick={() => navigate('/installments')} className="btn btn-secondary text-xs py-2">
          Gestionar Meses (MSI)
        </button>
      </div>
    </div>
  );
};