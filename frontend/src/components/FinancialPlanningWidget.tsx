import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Hooks & Utils
import { useFinancialPeriodSummary } from '../hooks/useFinancialPlanning';
import { usePayRecurringTransaction, useAccounts, usePayFullStatement, usePayMsiInstallment } from '../hooks/useApi';
import { formatDateUTC } from '../utils/dateUtils';
import { SkeletonPlanningWidget } from './Skeleton';
import { InfoTooltip } from '../components/InfoTooltip';

/* ==================================================================================
   1. UTILITY COMPONENTS & BADGES
   ================================================================================== */

const StatusBadge = ({ days, isToday }: { days: number, isToday?: boolean }) => {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
        <span className="material-symbols-outlined text-[12px] filled">warning</span> Vencido
      </span>
    );
  }
  if (isToday || days === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
        <span className="material-symbols-outlined text-[12px] filled">today</span> Hoy
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${days <= 3
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
      }`}>
      {days}d restantes
    </span>
  );
};

/* ==================================================================================
   2. SWIPEABLE ROW (Optimized with Framer Motion)
   ================================================================================== */

const SwipeableActionRow = ({
  children,
  onAction,
  actionType = 'pay', // 'pay' | 'receive'
  threshold = 80,
}: {
  children: React.ReactNode;
  onAction: () => void;
  actionType?: 'pay' | 'receive';
  threshold?: number;
}) => {
  const x = useMotionValue(0);
  const controls = useAnimation(); // Control manual para animaciones

  // Transformaciones visuales: opacidad de fondo e icono escalando
  const bgOpacity = useTransform(x, [0, threshold * 0.5], [0, 1]);
  const iconScale = useTransform(x, [0, threshold], [0.8, 1.2]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const isTriggered = info.offset.x > threshold || info.velocity.x > 500;

    if (isTriggered) {
      // Haptic feedback simple (comúnmente ignorado por navegadores desktop pero útil en móviles si soportado)
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

      // UI Feedback: completar el swipe visualmente
      await controls.start({ x: threshold, transition: { type: "spring", stiffness: 400, damping: 25 } });

      // Ejecutar la acción real
      onAction();

      // Resetear posición suavemente después de un momento
      setTimeout(() => {
        controls.start({ x: 0 });
      }, 500);
    } else {
      // Snap back (regresar)
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  return (
    <div className="relative overflow-hidden group border-b border-app-border last:border-0 select-none">
      {/* Background Action Layer */}
      <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center pl-6 pointer-events-none">

        {/* Capa de color sólido que aparece progresivamente */}
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 bg-emerald-500 flex items-center pl-6"
        >
          <motion.div style={{ scale: iconScale }} className="flex items-center gap-2 text-white font-bold">
            <span className="material-symbols-outlined text-[20px] bg-white text-emerald-600 rounded-full p-0.5 shadow-sm">check</span>
            <span className="text-xs tracking-wider uppercase font-black">
              {actionType === 'pay' ? 'PAGADO' : 'RECIBIDO'}
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Foreground Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: threshold + 20 }} // Permitir un poco de overdrag
        dragElastic={{ left: 0, right: 0.1 }}
        dragSnapToOrigin={false}
        animate={controls}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-app-surface active:bg-app-subtle/50 transition-colors touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
};


/* ==================================================================================
   3. CREDIT CARD GROUP COMPONENT
   ================================================================================== */

const CreditCardGroup = ({
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
  const uniqueMsiPurchases = new Set(msiItems.map((i: any) => i.originalId || i.id)).size;

  const paymentDate = new Date(group.dueDate);
  const now = new Date();
  const daysUntil = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntil < 0;
  const isToday = daysUntil === 0;

  return (
    <div className={`
      relative bg-app-surface transition-all duration-300 rounded-2xl overflow-hidden
      border group
      ${isExpanded ? 'ring-2 ring-app-primary/20 border-app-primary/40 z-10' : 'border-app-border hover:border-app-border-strong'}
    `}>
      {/* CARD HEADER (Always Visible) */}
      <div onClick={onToggleExpand} className="p-4 cursor-pointer select-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {/* Brand Logo Placeholder / Icon */}
            <div className="relative size-11 rounded-xl flex items-center justify-center bg-linear-to-br from-[#2E2E3A] to-[#1C1C22] shadow-inner text-white">
              <span className="material-symbols-outlined text-[22px] opacity-90">credit_card</span>
              {isOverdue && !isLongPeriod && (
                <span className="absolute -top-1 -right-1 size-3 bg-app-danger rounded-full border-2 border-app-surface animate-pulse" />
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm text-app-text tracking-tight flex items-center gap-2">
                {group.accountName}
                {!isLongPeriod && <StatusBadge days={daysUntil} isToday={isToday} />}
              </h4>
              <p className="text-[11px] text-app-muted font-medium mt-0.5">
                {isLongPeriod
                  ? `${group.paymentDatesCount} fechas de pago • ${group.items.length} movimientos`
                  : `Corte: ${formatDate(group.dueDate)}`
                }
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-bold text-app-text font-numbers tracking-tight">{formatCurrency(group.totalAmount)}</p>
            {endingMsi.length > 0 && (
              <div className="flex justify-end items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="material-symbols-outlined text-[10px]">celebration</span>
                {endingMsi.length} Terminados
              </div>
            )}
          </div>
        </div>

        {/* Footer info visible when closed */}
        {!isExpanded && (uniqueMsiPurchases > 0 || regularItems.length > 0) && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-dashed border-app-border opacity-70 group-hover:opacity-100 transition-opacity">
            {uniqueMsiPurchases > 0 && <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-1"><span className="size-1 rounded-full bg-current" /> {uniqueMsiPurchases} a MSI</span>}
            {regularItems.length > 0 && <span className="text-[10px] font-bold bg-app-subtle text-app-muted px-1.5 py-0.5 rounded">{regularItems.length} cargos directos</span>}
          </div>
        )}
      </div>

      {/* EXPANDED CONTENT AREA */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-app-border bg-app-subtle/30 dark:bg-black/20"
          >
            <div className="p-4 space-y-4">

              {/* Payment Action Row */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-bold text-app-muted mb-1.5">Cuenta de retiro</label>
                  <select
                    value={selectedSourceAccount}
                    onChange={(e) => onSourceAccountChange(e.target.value)}
                    className="w-full h-10 bg-app-surface border border-app-border rounded-xl text-xs px-3 focus:ring-2 focus:ring-app-primary/20 outline-none transition-shadow"
                  >
                    <option value="">Selecciona cuenta origen...</option>
                    {sourceAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={onPayAll}
                  disabled={!selectedSourceAccount}
                  className="h-10 px-5 bg-app-text text-app-inverted font-bold text-xs rounded-xl shadow-lg disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  Pagar Total
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>

              {/* Items List */}
              <div className="rounded-xl border border-app-border bg-app-surface divide-y divide-app-border overflow-hidden">
                {msiItems.concat(regularItems).map((item: any, idx: number) => (
                  <div key={`${item.id}-${idx}`} className="group flex justify-between items-center p-3 hover:bg-app-subtle/50 transition-colors">
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        {item.isLastInstallment && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded font-bold">Última</span>}
                        <span className="text-xs font-semibold text-app-text truncate">
                          {item.purchaseName || item.description?.replace(/^Cuota \d+\/\d+ - /, '')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-app-muted font-medium">
                        {item.isMsi
                          ? (
                            <>
                              <span className="text-indigo-600 dark:text-indigo-400">MSI {item.installmentNumber}/{item.totalInstallments}</span>
                              {item.count > 1 && <span className="text-app-muted">• Multi-cuotas agrupadas</span>}
                            </>
                          )
                          : 'Consumo directo'}
                        <span>• {formatDate(item.dueDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-numbers">{formatCurrency(item.amount)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onPayIndividual(item); }}
                        className="size-7 rounded-full border border-app-border flex items-center justify-center text-app-muted hover:bg-app-primary hover:text-white hover:border-transparent transition-all"
                        title="Pagar individualmente"
                      >
                        <span className="material-symbols-outlined text-[14px]">payments</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ==================================================================================
   4. MAIN WIDGET COMPONENT
   ================================================================================== */

export const FinancialPlanningWidget: React.FC = () => {
  const navigate = useNavigate();
  // State
  const [periodType, setPeriodType] = useState<'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual'>('quincenal');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [selectedSourceAccounts, setSelectedSourceAccounts] = useState<Record<string, string>>({});
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);

  // Queries
  const { data: summary, isLoading, isError } = useFinancialPeriodSummary(periodType);
  const { data: accounts } = useAccounts();

  // Mutations
  const { mutateAsync: payRecurring } = usePayRecurringTransaction();
  const { mutateAsync: payFullStatement } = usePayFullStatement();
  const { mutateAsync: payMsiInstallment } = usePayMsiInstallment();

  // --- MEMOIZED DATA PROCESSING ---
  const sourceAccounts = useMemo(() => accounts?.filter(a => !['credit', 'CREDIT'].includes(a.type)) || [], [accounts]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);
  const formatDate = (d: string) => formatDateUTC(d, { style: 'short' });

  const isLongPeriod = ['bimestral', 'semestral', 'anual'].includes(periodType);

  // Grouped Credit Cards
  const groupedCards = useMemo(() => {
    if (!summary?.msiPaymentsDue) return {};
    const groups: any = {};
    summary.msiPaymentsDue.forEach((p: any) => {
      const key = isLongPeriod ? p.accountId : `${p.accountId}-${p.dueDate}`;
      if (!groups[key]) {
        groups[key] = {
          accountName: p.accountName || 'TDC Desconocida',
          accountId: p.accountId,
          dueDate: p.dueDate,
          totalAmount: 0,
          items: [],
          dueDates: new Set()
        };
      }
      groups[key].items.push(p);
      groups[key].totalAmount += p.amount;
      groups[key].dueDates.add(p.dueDate);
    });
    // Add stats
    Object.values(groups).forEach((g: any) => {
      g.paymentDatesCount = g.dueDates.size;
    });
    return groups;
  }, [summary, isLongPeriod]);

  // Handle Pay Action (Reusable for Expense & Income)
  const executePayAction = async (id: string, amount: number, label: string, type: 'pay' | 'receive') => {
    const promise = payRecurring({ id, data: { amount } });
    toast.promise(promise, {
      loading: type === 'pay' ? 'Procesando pago...' : 'Registrando ingreso...',
      success: (data) => `${type === 'pay' ? 'Pagado' : 'Recibido'}: ${label}`,
      error: 'Hubo un error al procesar'
    });
  };

  if (isLoading) return <SkeletonPlanningWidget />;
  if (isError || !summary) return <div className="bento-card p-6 text-center text-app-danger">Error al cargar planificación.</div>;

  const cardKeys = Object.keys(groupedCards);
  const msiEndingCount = summary.msiPaymentsDue?.filter((m: any) => m.isLastInstallment).length || 0;

  return (
    <div className="flex flex-col gap-5 md:gap-6 animate-fade-in">

      {/* 1. HERO HEADER WITH SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-app-text tracking-tight">Tu Planificación</h2>
            <InfoTooltip content="Proyección de flujo de caja basada en recurrencias y deudas." />
          </div>
          <p className="text-sm text-app-muted font-medium">
            {formatDate(summary.periodStart)} — {formatDate(summary.periodEnd)}
          </p>
        </div>

        <div className="relative inline-flex bg-app-subtle p-1 rounded-xl shadow-inner">
          {(['semanal', 'quincenal', 'mensual'] as const).map(t => (
            <button
              key={t}
              onClick={() => setPeriodType(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${periodType === t
                ? 'bg-app-surface text-app-text shadow-sm ring-1 ring-black/5'
                : 'text-app-muted hover:text-app-text'
                }`}
            >
              {t}
            </button>
          ))}

          <div className="relative flex items-center">
            <select
              className={`
                appearance-none bg-transparent text-xs font-bold outline-none pl-3 pr-6 py-1.5 cursor-pointer transition-colors rounded-lg
                ${['bimestral', 'semestral', 'anual'].includes(periodType) ? 'text-app-primary bg-app-surface shadow-sm ring-1 ring-black/5' : 'text-app-muted hover:text-app-text'}
              `}
              value={['bimestral', 'semestral', 'anual'].includes(periodType) ? periodType : ''}
              onChange={(e) => e.target.value && setPeriodType(e.target.value as any)}
            >
              <option value="" disabled className="hidden">Más...</option>
              {['bimestral', 'semestral', 'anual'].includes(periodType) && (
                <option value={periodType} className="hidden">{periodType.charAt(0).toUpperCase() + periodType.slice(1)}</option>
              )}
              <option value="bimestral">Bimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
            <span className={`pointer-events-none absolute right-1 material-symbols-outlined text-[14px] ${['bimestral', 'semestral', 'anual'].includes(periodType) ? 'text-app-primary' : 'text-app-muted'}`}>
              expand_more
            </span>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS BAR */}
      <div className="bento-card p-4 relative overflow-hidden">
        {/* ... (Previous progress logic maintained, simplified style) ... */}
        {(() => {
          const total = Math.ceil((new Date(summary.periodEnd).getTime() - new Date(summary.periodStart).getTime()) / 86400000);
          const passed = Math.max(0, Math.ceil((new Date().getTime() - new Date(summary.periodStart).getTime()) / 86400000));
          const pct = Math.min(100, Math.max(0, (passed / total) * 100));

          return (
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-app-muted">
                  <span>Progreso del Período</span>
                  <span>{total - passed} días restantes</span>
                </div>
                <div className="h-2 w-full bg-app-subtle rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-app-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>

              {summary.isSufficient ? (
                <div className="hidden md:block text-right">
                  <p className="text-[10px] uppercase font-bold text-indigo-500">Saldo proyectado</p>
                  <p className="text-xl font-black text-app-text font-numbers text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(summary.disposableIncome)}
                  </p>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 bg-rose-500/10 text-rose-600 px-3 py-1.5 rounded-lg border border-rose-500/20">
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold leading-none">Déficit</p>
                    <p className="text-sm font-bold font-numbers">{formatCurrency(summary.disposableIncome)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 3. ALERTS & KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Incoming Money Widget */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-between h-24 md:h-auto">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span className="text-[10px] font-bold uppercase">Ingresos</span>
          </div>
          <p className="text-xl font-bold text-app-text font-numbers">{formatCurrency(summary.totalPeriodIncome)}</p>
        </div>

        {/* Fixed Commitments */}
        <div className="p-4 rounded-2xl bg-app-surface border border-app-border flex flex-col justify-between h-24 md:h-auto">
          <div className="flex items-center gap-1.5 text-app-muted">
            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
            <span className="text-[10px] font-bold uppercase">Fijos</span>
          </div>
          <p className="text-xl font-bold text-app-text font-numbers">{formatCurrency(summary.expectedExpenses?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0)}</p>
        </div>

        {/* Debt */}
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-between h-24 md:h-auto">
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <span className="material-symbols-outlined text-[16px]">credit_card</span>
            <span className="text-[10px] font-bold uppercase">Deuda TDC</span>
          </div>
          <p className="text-xl font-bold text-app-text font-numbers">{formatCurrency(summary.msiPaymentsDue?.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0)}</p>
        </div>

        {/* Action Button: Analysis */}
        <Link to="/analysis" className="p-4 rounded-2xl bg-app-primary text-white flex flex-col justify-center items-center gap-1 text-center shadow-lg hover:bg-app-primary-dark transition-colors cursor-pointer group">
          <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">analytics</span>
          <span className="text-[10px] font-bold uppercase">Ver Reporte</span>
        </Link>
      </div>

      {/* 4. EXPANDABLE SECTIONS LISTS */}

      {/* INCOME LIST */}
      {summary.expectedIncome?.length > 0 && (
        <div className="space-y-3">
          <h3 className="px-1 text-xs font-bold text-app-muted uppercase tracking-wider flex items-center justify-between">
            Ingresos por Recibir
            {!showAllIncome && summary.expectedIncome.length > 3 && (
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                +{summary.expectedIncome.length - 3}
              </span>
            )}
          </h3>
          <div className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-sm">
            {(showAllIncome ? summary.expectedIncome : summary.expectedIncome.slice(0, 3)).map((item: any) => (
              <SwipeableActionRow key={item.id} actionType="receive" onAction={() => executePayAction(item.id, item.amount, item.description, 'receive')}>
                <div className="flex justify-between items-center p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-app-text">{item.description}</p>
                      <p className="text-[11px] text-app-muted font-medium">{formatDate(item.dueDate)}</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-emerald-600 font-numbers">+{formatCurrency(item.amount)}</p>
                </div>
              </SwipeableActionRow>
            ))}
            {summary.expectedIncome.length > 3 && (
              <button
                onClick={() => setShowAllIncome(!showAllIncome)}
                className="w-full py-3 text-center text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-t border-app-border"
              >
                {showAllIncome ? 'Ver menos' : `Ver ${summary.expectedIncome.length - 3} más`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CREDIT CARD SECTION */}
      {cardKeys.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">
              {isLongPeriod ? 'Deuda TDC del Período' : 'TDC por Pagar'}
            </h3>
            {msiEndingCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[12px]">celebration</span> {msiEndingCount} MSI Finalizan
              </span>
            )}
          </div>

          <div className="space-y-2">
            {cardKeys.map(key => (
              <CreditCardGroup
                key={key}
                groupKey={key}
                group={groupedCards[key]}
                isExpanded={expandedCard === key}
                onToggleExpand={() => setExpandedCard(expandedCard === key ? null : key)}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onPayAll={() => {/* handle full pay */ }} // Simplificado
                onPayIndividual={(i: any) => {/* handle item */ }}
                isLongPeriod={isLongPeriod}
                sourceAccounts={sourceAccounts}
                selectedSourceAccount={selectedSourceAccounts[key] || ''}
                onSourceAccountChange={(id: string) => setSelectedSourceAccounts(p => ({ ...p, [key]: id }))}
              />
            ))}
          </div>
        </div>
      )}

      {/* EXPENSE LIST (Swipeable) */}
      {summary.expectedExpenses?.length > 0 && (
        <div className="space-y-3 pb-8">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-bold text-app-muted uppercase tracking-wider">Gastos Fijos Pendientes</h3>
            <Link to="/recurring/new" className="text-app-primary hover:text-app-primary-dark">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface overflow-hidden shadow-sm">
            {(showAllExpenses ? summary.expectedExpenses : summary.expectedExpenses.slice(0, 5)).map((item: any) => {
              // Check Status
              const due = new Date(item.dueDate);
              const now = new Date();
              const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);

              return (
                <SwipeableActionRow key={item.id} actionType="pay" onAction={() => executePayAction(item.id, item.amount, item.description, 'pay')}>
                  <div className="flex justify-between items-center p-3.5 group-hover:bg-app-subtle transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`size-9 rounded-lg flex items-center justify-center bg-app-subtle text-app-muted`}>
                        <span className="material-symbols-outlined text-[18px]">receipt</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-app-text truncate">{item.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StatusBadge days={diff} isToday={diff === 0} />
                          <span className="text-[11px] text-app-muted font-medium">{formatDate(item.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-app-text font-numbers">{formatCurrency(item.amount)}</p>
                      <span className="text-[10px] text-app-muted">Desliza para pagar</span>
                    </div>
                  </div>
                </SwipeableActionRow>
              );
            })}

            {summary.expectedExpenses.length > 5 && (
              <button
                onClick={() => setShowAllExpenses(!showAllExpenses)}
                className="w-full py-3 text-center text-xs font-bold text-app-primary hover:bg-app-subtle transition-colors border-t border-app-border"
              >
                {showAllExpenses ? 'Ver menos' : `Ver ${summary.expectedExpenses.length - 5} más`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty State / All Clear */}
      {!cardKeys.length && !summary.expectedExpenses?.length && (
        <div className="py-8 text-center opacity-60">
          <span className="material-symbols-outlined text-4xl mb-2 text-emerald-500">check_circle</span>
          <p className="text-sm font-medium">Todo pagado para este período.</p>
        </div>
      )}

    </div>
  );
};

export default FinancialPlanningWidget;