import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { usePayRecurringTransaction, useAccounts, usePayFullStatement, usePayMsiInstallment } from '../hooks/useApi';
import { toast } from 'sonner';
import { formatDateUTC } from '../utils/dateUtils';

// --- Sub-components ---

const StatusBadge = ({ days, overdue }: { days: number, overdue: boolean }) => {
  let colorClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
  let icon = "check_circle";
  let label = `${days}d`;

  if (overdue) {
    colorClass = "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400";
    icon = "warning";
    label = "¡Hoy!";
  } else if (days <= 3) {
    colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
    icon = "schedule";
    label = `${days}d`;
  }

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${colorClass}`}>
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
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
    <div className="relative border-b border-app-border last:border-0 group select-none overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-app-success flex items-center pl-5 transition-opacity duration-200"
        style={{ width: '100%', opacity: offsetX > 0 ? opacity : 0 }}
      >
        <div className="flex items-center gap-2 text-white font-bold" style={{ transform: `translateX(${opacity * 20 - 20}px)` }}>
          <span className="material-symbols-outlined text-lg">check</span>
          <span className="text-xs">PAGADO</span>
        </div>
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative bg-app-surface px-3 py-2.5 flex items-center justify-between transition-transform duration-200 hover:bg-app-subtle"
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: item.category?.color ? `${item.category.color}15` : 'var(--bg-subtle)',
              color: item.category?.color || 'var(--text-muted)'
            }}
          >
            <span className="material-symbols-outlined text-[16px]">{item.category?.icon || 'receipt'}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-app-text truncate">{item.description}</p>
            <div className="flex items-center gap-1.5">
              {item.isOverdue && (
                <span className="text-[9px] font-bold text-white bg-rose-500 px-1 py-0.5 rounded">VENCIDO</span>
              )}
              <span className={`text-[11px] ${item.isOverdue ? 'text-app-danger' : 'text-app-muted'}`}>
                {formatDate(item.dueDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-app-text tabular-nums">{formatCurrency(item.amount)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onPay(); }}
            className="hidden md:flex size-7 items-center justify-center rounded-full bg-app-success/10 text-app-success opacity-0 group-hover:opacity-100 transition-all hover:bg-app-success hover:text-white"
            title="Marcar pagado"
          >
            <span className="material-symbols-outlined text-[14px]">check</span>
          </button>
        </div>
      </div>
    </div>
  );
};

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
  onSourceAccountChange,
  isLongPeriod
}: any) => {
  const msiItems = group.items.filter((i: any) => i.isMsi);
  const regularItems = group.items.filter((i: any) => !i.isMsi);
  const endingMsi = group.items.filter((i: any) => i.isLastInstallment);

  // Contar compras únicas, no cuotas individuales
  const uniqueMsiPurchases = new Set(msiItems.map((i: any) => i.originalId || i.id)).size;

  const paymentDate = new Date(group.dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isDue = daysUntil <= 0;

  // Agrupar items por fecha de pago para vista de período largo
  const itemsByDate = useMemo(() => {
    if (!isLongPeriod) return {};
    const byDate: Record<string, any[]> = {};
    group.items.forEach((item: any) => {
      const dateKey = new Date(item.dueDate).toISOString().split('T')[0];
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(item);
    });
    return byDate;
  }, [group.items, isLongPeriod]);

  return (
    <div className={`
      relative bg-app-surface border transition-all duration-300 rounded-2xl overflow-hidden
      ${!isLongPeriod && isDue ? 'border-l-4 border-l-rose-500 border-app-border' : 'border border-app-border hover:border-app-primary/40'}
      shadow-sm
    `}>
      <div onClick={onToggleExpand} className="p-4 cursor-pointer select-none">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <span className="material-symbols-outlined text-xl">credit_card</span>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-app-text">{group.accountName}</h4>
              {isLongPeriod ? (
                <div className="text-[11px] text-app-muted">
                  {group.paymentDatesCount} pagos en el período
                </div>
              ) : (
                <div className="text-[11px] text-app-muted">{formatDate(group.dueDate)}</div>
              )}
            </div>
          </div>
          {!isLongPeriod && <StatusBadge days={daysUntil} overdue={isDue} />}
        </div>

        <div className="flex items-end justify-between pt-2 border-t border-app-border/50">
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-3 text-[11px]">
              {uniqueMsiPurchases > 0 && (
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <span className="size-1.5 rounded-full bg-indigo-500" />
                  {uniqueMsiPurchases} MSI
                </span>
              )}
              {regularItems.length > 0 && (
                <span className="flex items-center gap-1 text-app-muted">
                  <span className="size-1.5 rounded-full bg-gray-400" />
                  {regularItems.length} Consumos
                </span>
              )}
            </div>
            {endingMsi.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg max-w-full">
                <span className="material-symbols-outlined text-[12px] shrink-0">celebration</span>
                <span className="truncate">
                  {endingMsi.length === 1
                    ? `¡Terminas "${endingMsi[0].purchaseName || endingMsi[0].description?.replace(/^(Cuota |Última cuota de "|"$)/g, '') || 'MSI'}"!`
                    : `¡${endingMsi.length} MSI terminan!`
                  }
                </span>
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-app-text tabular-nums">{formatCurrency(group.totalAmount)}</p>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-app-bg p-4 border-t border-app-border animate-fade-in">
          <div className="mb-3">
            <label className="block text-[10px] uppercase font-bold text-app-muted mb-1.5">Pagar desde</label>
            <select
              value={selectedSourceAccount}
              onChange={(e) => onSourceAccountChange(e.target.value)}
              className="w-full bg-app-surface border border-app-border rounded-xl text-sm px-3 py-2.5 appearance-none focus:ring-2 focus:ring-app-primary/20 focus:border-app-primary outline-none"
            >
              <option value="">Seleccionar cuenta...</option>
              {sourceAccounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div className="max-h-40 overflow-y-auto custom-scrollbar mb-3 border rounded-xl bg-app-surface divide-y divide-app-border">
            {msiItems.concat(regularItems).map((item: any, index: number) => (
              <div key={`${item.id}-${index}`} className={`flex justify-between items-center p-2.5 text-xs ${item.isLastInstallment ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                <div className="truncate pr-3 flex-1">
                  <div className="font-medium text-app-text flex items-center gap-1">
                    {item.isLastInstallment && <span className="material-symbols-outlined text-emerald-500 text-[12px]">check_circle</span>}
                    {item.purchaseName || item.description}
                  </div>
                  <div className="text-[10px] text-app-muted">
                    {item.isMsi
                      ? (item.isLastInstallment
                        ? '¡Última cuota!'
                        : item.installmentNumber && item.totalInstallments
                          ? `Cuota ${item.installmentNumber}/${item.totalInstallments}`
                          : 'MSI'
                      )
                      : 'Consumo'}
                    {item.dueDate && ` • ${formatDate(item.dueDate)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPayIndividual(item); }}
                    className="size-6 rounded-full bg-app-primary/10 text-app-primary hover:bg-app-primary hover:text-white transition-colors flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onPayAll}
            disabled={!selectedSourceAccount}
            className="w-full btn btn-primary py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            Pagar Todo ({formatCurrency(group.totalAmount)})
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Widget ---

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

  const sourceAccounts = useMemo(() => {
    return accounts?.filter(a => !['credit', 'CREDIT', 'Credit Card', 'Tarjeta de Crédito'].includes(a.type)) || [];
  }, [accounts]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return formatDateUTC(dateString, { style: 'short' });
  };

  // Determinar si es período largo
  const isLongPeriod = ['bimestral', 'semestral', 'anual'].includes(periodType);

  // Para períodos cortos: agrupar por tarjeta + fecha de corte
  // Para períodos largos: agrupar solo por tarjeta (resumen del período)
  const groupedCreditCardPayments = useMemo(() => {
    if (!summary?.msiPaymentsDue) return {};
    const groups: any = {};

    summary.msiPaymentsDue.forEach((payment: any) => {
      // Key diferente según el tipo de período
      const key = isLongPeriod
        ? payment.accountId  // Solo por cuenta para períodos largos
        : `${payment.accountId}-${payment.dueDate}`; // Por cuenta + fecha para cortos

      if (!groups[key]) {
        groups[key] = {
          accountName: payment.accountName || 'Tarjeta',
          accountId: payment.accountId,
          dueDate: payment.dueDate,
          totalAmount: 0,
          items: [],
          // Para períodos largos, trackeamos fechas y compras únicas
          dueDates: new Set(),
          uniquePurchases: new Set()
        };
      }
      groups[key].items.push(payment);
      groups[key].totalAmount += payment.amount;
      groups[key].dueDates.add(payment.dueDate);
      groups[key].uniquePurchases.add(payment.originalId || payment.id);
    });

    // Convertir Sets a números para el render
    Object.values(groups).forEach((g: any) => {
      g.paymentDatesCount = g.dueDates.size;
      g.uniquePurchasesCount = g.uniquePurchases.size;
      delete g.dueDates;
      delete g.uniquePurchases;
    });

    return groups;
  }, [summary, isLongPeriod]);

  // Count MSI ending in period
  const msiEndingCount = useMemo(() => {
    if (!summary?.msiPaymentsDue) return 0;
    return summary.msiPaymentsDue.filter((m: any) => m.isLastInstallment).length;
  }, [summary]);

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

    await payFullStatement({ accountId: group.accountId, sourceAccountId: sourceId });
    toast.success('Corte liquidado');
  };

  const handlePayIndividual = async (item: any, key: string) => {
    const sourceId = selectedSourceAccounts[key];
    if (!sourceId) return toast.error('Selecciona cuenta origen');

    if (item.isMsi) {
      await payMsiInstallment({ installmentId: item.id, sourceAccountId: sourceId });
      toast.success('Cuota pagada');
    } else {
      navigate('/new', { state: { type: 'transfer', amount: item.amount, description: item.description, sourceAccountId: sourceId } });
    }
  };

  if (isLoading) return (
    <div className="bento-card h-64 p-6 animate-pulse flex items-center justify-center text-app-muted">
      <span className="material-symbols-outlined text-3xl animate-spin mr-2">autorenew</span>
      Cargando...
    </div>
  );

  if (isError || !summary) return (
    <div className="bento-card p-6 text-center">
      <span className="material-symbols-outlined text-3xl text-app-danger mb-2">error</span>
      <p className="text-app-danger text-sm">Error cargando datos</p>
    </div>
  );

  const hasCards = Object.keys(groupedCreditCardPayments).length > 0;
  const hasExpenses = summary.expectedExpenses.length > 0;
  const cardTotal = summary.msiPaymentsDue?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const fixedTotal = summary.expectedExpenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;

  return (
    <div className="bento-card p-5 md:p-6 bg-app-surface border-app-border shadow-sm flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-app-text">Planificación</h3>
            {msiEndingCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold whitespace-nowrap" title="MSI que se terminan de pagar en este período">
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                {msiEndingCount === 1 ? 'Terminas 1 MSI' : `Terminas ${msiEndingCount} MSI`}
              </span>
            )}
          </div>
          <p className="text-xs text-app-muted mt-0.5">
            {formatDate(summary.periodStart)} → {formatDate(summary.periodEnd)}
          </p>
        </div>

        <select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as any)}
          className="appearance-none bg-app-subtle text-app-text text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-app-primary border border-transparent hover:border-app-border transition-colors"
        >
          <option value="semanal">Semana</option>
          <option value="quincenal">Quincena</option>
          <option value="mensual">Mes</option>
          <option value="bimestral">Bimestre</option>
          <option value="semestral">Semestre</option>
          <option value="anual">Año</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[14px]">trending_up</span>
            <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Ingresos</p>
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatCurrency(summary.totalExpectedIncome)}</p>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[14px]">credit_card</span>
            <p className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Tarjetas</p>
          </div>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-400 tabular-nums">{formatCurrency(cardTotal)}</p>
        </div>

        <div className="p-3 rounded-xl bg-app-subtle/50 border border-app-border/50">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-app-muted text-[14px]">receipt_long</span>
            <p className="text-[10px] uppercase font-bold text-app-muted">Fijos</p>
          </div>
          <p className="text-lg font-bold text-app-text tabular-nums">{formatCurrency(fixedTotal)}</p>
        </div>

        <div className={`p-3 rounded-xl border-2 ${summary.isSufficient
          ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800'
          : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`material-symbols-outlined text-[14px] ${summary.isSufficient ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.isSufficient ? 'savings' : 'warning'}
            </span>
            <p className={`text-[10px] uppercase font-bold ${summary.isSufficient ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400'}`}>Resultado</p>
          </div>
          <p className={`text-lg font-bold tabular-nums ${summary.isSufficient ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatCurrency(summary.disposableIncome)}
          </p>
        </div>
      </div>

      {/* 50/30/20 Budget Bar */}
      {summary.budgetAnalysis && summary.totalExpectedIncome > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-app-muted mb-1">
            <span className="font-bold uppercase">Distribución de Gastos</span>
            <Link to="/categories" className="text-app-primary hover:underline">Configurar</Link>
          </div>
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-app-border/30">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${Math.min((summary.budgetAnalysis.needs.projected / summary.totalExpectedIncome) * 100, 100)}%` }}
            />
            <div
              className="bg-purple-500 h-full transition-all"
              style={{ width: `${Math.min((summary.budgetAnalysis.wants.projected / summary.totalExpectedIncome) * 100, 100)}%` }}
            />
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: `${Math.min((summary.budgetAnalysis.savings.projected / summary.totalExpectedIncome) * 100, 100)}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {((summary.budgetAnalysis.needs.projected / summary.totalExpectedIncome) * 100).toFixed(0)}%
              </span>
              <span className="text-app-muted">Necesidades</span>
            </div>
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/10">
              <span className="text-purple-700 dark:text-purple-400 font-bold">
                {((summary.budgetAnalysis.wants.projected / summary.totalExpectedIncome) * 100).toFixed(0)}%
              </span>
              <span className="text-app-muted">Deseos</span>
            </div>
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10">
              <span className="text-amber-700 dark:text-amber-400 font-bold">
                {((summary.budgetAnalysis.savings.projected / summary.totalExpectedIncome) * 100).toFixed(0)}%
              </span>
              <span className="text-app-muted">Ahorro</span>
            </div>
          </div>
        </div>
      )}

      {/* Warning Alert */}
      {summary.warnings?.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg shrink-0">warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{summary.warnings[0]}</p>
            {summary.warnings.length > 1 && (
              <Link to="/analysis" className="text-[10px] text-amber-600 dark:text-amber-400 font-medium hover:underline">
                +{summary.warnings.length - 1} alertas más
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Credit Card Bills */}
      {hasCards && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider">
              {isLongPeriod ? 'Resumen de Tarjetas' : 'Tarjetas por Pagar'}
            </h4>
            <Link to="/installments" className="text-xs text-app-primary font-medium hover:underline">Ver MSI</Link>
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
              onSourceAccountChange={(accountId: string) => setSelectedSourceAccounts(prev => ({ ...prev, [key]: accountId }))}
              isLongPeriod={isLongPeriod}
            />
          ))}
        </div>
      )}

      {/* Expenses List */}
      {hasExpenses && (
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider">Gastos Fijos</h4>
            <Link to="/recurring" className="text-xs text-app-primary font-medium hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">add</span>
              Añadir
            </Link>
          </div>
          <div className="border border-app-border rounded-xl bg-app-bg divide-y divide-app-border overflow-hidden">
            {summary.expectedExpenses.slice(0, 5).map((expense: any) => (
              <SwipeableExpenseRow
                key={expense.uniqueId || expense.id}
                item={expense}
                onPay={() => handlePay(expense.id, expense.amount, expense.description, expense.dueDate)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
            {summary.expectedExpenses.length > 5 && (
              <Link to="/recurring" className="block p-2.5 text-center text-xs text-app-primary font-medium hover:bg-app-subtle transition-colors">
                Ver {summary.expectedExpenses.length - 5} más →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasCards && !hasExpenses && (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-5xl mb-3 text-app-muted opacity-30">celebration</span>
          <p className="text-sm font-medium text-app-text">Sin pagos pendientes</p>
          <p className="text-xs text-app-muted mt-1">Disfruta tu libertad financiera este período</p>
          <Link to="/recurring/new" className="mt-4 text-xs font-medium text-app-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add_circle</span>
            Programar gasto recurrente
          </Link>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => navigate('/analysis')} className="flex-1 btn btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">analytics</span>
          Ver Análisis
        </button>
        <button onClick={() => navigate('/installments')} className="flex-1 btn btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">credit_card</span>
          Mis MSI
        </button>
      </div>
    </div>
  );
};