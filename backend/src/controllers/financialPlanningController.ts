import { Request, Response } from 'express';
import prisma from '../services/database';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { AuthRequest } from '../middleware/auth';



// Calculate period dates based on type, mode, and user's timezone
// - mode 'calendar': Calendar-based periods (for Planning - "how is this month going")
// - mode 'projection': Rolling projection from today (for Analysis - "how will I be in X time")
// Returns:
// - periodStart/periodEnd: UTC dates for database queries
// - displayStart/displayEnd: Local dates (as ISO strings) for display in UI
function calculatePeriod(
  type: 'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual',
  mode: 'calendar' | 'projection' = 'calendar',
  timezone: string = 'America/Mexico_City'
) {
  // Get current time in user's timezone
  const nowUTC = new Date();
  const nowInUserTZ = toZonedTime(nowUTC, timezone);

  const currentDay = nowInUserTZ.getDate();
  const currentMonth = nowInUserTZ.getMonth();
  const currentYear = nowInUserTZ.getFullYear();

  let periodStartLocal: Date;
  let periodEndLocal: Date;

  // PROJECTION MODE: Rolling from today (for Financial Analysis)
  if (mode === 'projection') {
    // Start from today in user's timezone
    periodStartLocal = startOfDay(nowInUserTZ);
    switch (type) {
      case 'semanal':
        periodEndLocal = endOfDay(addDays(nowInUserTZ, 7));
        break;
      case 'quincenal':
        periodEndLocal = endOfDay(addDays(nowInUserTZ, 15));
        break;
      case 'mensual':
        periodEndLocal = endOfDay(addMonths(nowInUserTZ, 1));
        break;
      case 'bimestral':
        periodEndLocal = endOfDay(addMonths(nowInUserTZ, 2));
        break;
      case 'semestral':
        periodEndLocal = endOfDay(addMonths(nowInUserTZ, 6));
        break;
      case 'anual':
        periodEndLocal = endOfDay(addMonths(nowInUserTZ, 12));
        break;
      default:
        throw new Error('Invalid period type');
    }
    // Return both UTC (for DB) and local strings (for display)
    return {
      periodStart: fromZonedTime(periodStartLocal, timezone),
      periodEnd: fromZonedTime(periodEndLocal, timezone),
      displayStart: `${currentYear}-${String(periodStartLocal.getMonth() + 1).padStart(2, '0')}-${String(periodStartLocal.getDate()).padStart(2, '0')}`,
      displayEnd: `${periodEndLocal.getFullYear()}-${String(periodEndLocal.getMonth() + 1).padStart(2, '0')}-${String(periodEndLocal.getDate()).padStart(2, '0')}`,
      userLocalNow: nowInUserTZ
    };
  }

  // CALENDAR MODE: Calendar-based periods (for Planning Widget)
  switch (type) {
    case 'semanal':
      // Calendar week: Monday to Sunday
      const dayOfWeek = nowInUserTZ.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStartLocal = startOfDay(addDays(nowInUserTZ, -daysToMonday));
      periodEndLocal = endOfDay(addDays(periodStartLocal, 6));
      break;

    case 'quincenal':
      // Calendar-based fortnights: 1-15 or 16-end
      if (currentDay <= 15) {
        periodStartLocal = new Date(currentYear, currentMonth, 1);
        periodEndLocal = new Date(currentYear, currentMonth, 15);
      } else {
        periodStartLocal = new Date(currentYear, currentMonth, 16);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        periodEndLocal = new Date(currentYear, currentMonth, lastDayOfMonth);
      }
      break;

    case 'mensual':
      // Current calendar month
      periodStartLocal = new Date(currentYear, currentMonth, 1);
      const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      periodEndLocal = new Date(currentYear, currentMonth, lastDayOfCurrentMonth);
      break;

    case 'bimestral':
      // Current bimester
      const bimesterIndex = Math.floor(currentMonth / 2);
      const bimesterStartMonth = bimesterIndex * 2;
      periodStartLocal = new Date(currentYear, bimesterStartMonth, 1);
      const lastDayOfBimester = new Date(currentYear, bimesterStartMonth + 2, 0).getDate();
      periodEndLocal = new Date(currentYear, bimesterStartMonth + 1, lastDayOfBimester);
      break;

    case 'semestral':
      // Current semester: Jan-Jun or Jul-Dec
      if (currentMonth < 6) {
        periodStartLocal = new Date(currentYear, 0, 1);
        periodEndLocal = new Date(currentYear, 5, 30);
      } else {
        periodStartLocal = new Date(currentYear, 6, 1);
        periodEndLocal = new Date(currentYear, 11, 31);
      }
      break;

    case 'anual':
      // Current calendar year
      periodStartLocal = new Date(currentYear, 0, 1);
      periodEndLocal = new Date(currentYear, 11, 31);
      break;

    default:
      throw new Error('Invalid period type');
  }

  // Create display strings (YYYY-MM-DD format in local time)
  const displayStart = `${periodStartLocal.getFullYear()}-${String(periodStartLocal.getMonth() + 1).padStart(2, '0')}-${String(periodStartLocal.getDate()).padStart(2, '0')}`;
  const displayEnd = `${periodEndLocal.getFullYear()}-${String(periodEndLocal.getMonth() + 1).padStart(2, '0')}-${String(periodEndLocal.getDate()).padStart(2, '0')}`;

  // Convert to UTC for database queries
  return {
    periodStart: fromZonedTime(startOfDay(periodStartLocal), timezone),
    periodEnd: fromZonedTime(endOfDay(periodEndLocal), timezone),
    displayStart,
    displayEnd,
    userLocalNow: nowInUserTZ
  };
}

// Get next due date for a recurring transaction
function getNextDueDate(recurring: any): Date {
  const lastDate = recurring.lastGeneratedDate ? new Date(recurring.lastGeneratedDate) : new Date(recurring.startDate);

  switch (recurring.frequency) {
    case 'DAILY':
      return addDays(lastDate, 1);
    case 'WEEKLY':
      return addWeeks(lastDate, 1);
    case 'BIWEEKLY':
      return addWeeks(lastDate, 2);
    case 'MONTHLY':
      return addMonths(lastDate, 1);
    case 'BIMONTHLY':
      return addMonths(lastDate, 2);
    default:
      return lastDate;
  }
}

export const getFinancialPeriodSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's timezone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true }
    });
    const userTimezone = user?.timezone || 'America/Mexico_City';

    const periodType = (req.query.period as 'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual') || 'quincenal';
    const mode = (req.query.mode as 'calendar' | 'projection') || 'calendar';
    const { periodStart, periodEnd, displayStart, displayEnd, userLocalNow } = calculatePeriod(periodType, mode, userTimezone);

    // Get all active recurring transactions
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
      },
      include: {
        category: true,
        account: true, // Needed if we want to filter by account type later
      }
    });

    // ... (Existing code fetching transactions)

    // 0. Fetch Active Loans for Projection
    const activeLoans = await prisma.loan.findMany({
      where: {
        userId,
        status: { in: ['active', 'partial'] },
        expectedPayDate: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: { account: true }
    });

    // 1. Process Income (Recurrent Income + Loan Collections)
    const expectedIncome: any[] = [];

    activeLoans.filter((l: any) => l.loanType === 'lent').forEach((l: any) => {
      expectedIncome.push({
        id: l.id,
        uniqueId: `loan-inc-${l.id}`,
        description: `Cobrar: ${l.borrowerName}`, // Short description
        amount: l.remainingAmount,
        dueDate: l.expectedPayDate,
        category: { name: 'Préstamos', color: '#f59e0b', icon: 'credit_score', budgetType: 'savings' },
        isOverdue: l.expectedPayDate ? new Date(l.expectedPayDate) < userLocalNow : false,
        isLoan: true
      });
    });

    // 2. Process Expenses (Recurrent Expenses + Loan Payments)
    const expectedExpenses: any[] = [];

    activeLoans.filter((l: any) => l.loanType === 'borrowed').forEach((l: any) => {
      const uniqueId = `loan-exp-${l.id}`;
      expectedExpenses.push({
        id: l.id,
        uniqueId,
        description: `Pagar: ${l.borrowerName}`, // Short description
        amount: l.remainingAmount,
        dueDate: l.expectedPayDate,
        category: { name: 'Préstamos', color: '#f59e0b', icon: 'credit_score', budgetType: 'need' }, // Debt is a NEED
        isOverdue: l.expectedPayDate ? new Date(l.expectedPayDate) < userLocalNow : false,
        isLoan: true
      });
    });

    // ... (Existing Recurring Expenses Processing)

    // ... (Existing logic continues with for loops for recurring) 

    // Need to carefully weave this into the existing file structure without breaking the flow.
    // The current file structure has:
    // 1. fetch recurringTransactions
    // 2. Process Income arrays init
    // 3. Process Expenses arrays init
    // 4. Loop recurringTransactions -> push to arrays
    // 5. Credit Card Logic ...

    // I will construct the Replacement carefully. The tool call requires contiguous block.
    // Lines 156-160 are where arrays are init. I will insert Loan fetching and pushing there.

    // ...

    // GLOBAL deduplication to prevent any duplicate uniqueIds
    const globalAddedIds = new Set<string>();

    // Dynamic limit based on period type (ensures we project enough instances)
    const maxInstances: Record<string, number> = {
      semanal: 7,
      quincenal: 15,
      mensual: 31,
      bimestral: 62,
      semestral: 185,
      anual: 370
    };
    const projectionLimit = maxInstances[periodType] || 50;

    // Helper to calculate next date for projection
    const getNextDate = (date: Date, freq: string): Date => {
      const d = new Date(date);
      if (freq === 'DAILY' || freq === 'daily') d.setDate(d.getDate() + 1);
      else if (freq === 'WEEKLY' || freq === 'weekly') d.setDate(d.getDate() + 7);
      else if (freq === 'BIWEEKLY' || freq === 'biweekly') d.setDate(d.getDate() + 14);
      else if (freq === 'biweekly_15_30' || freq === 'BIWEEKLY_15_30') {
        // Quincena mexicana: días 15 y último del mes
        const day = d.getDate();
        const currentMonth = d.getMonth();
        const currentYear = d.getFullYear();

        if (day <= 15) {
          // Si estamos en el 15 o antes, próximo es fin de este mes
          // getDate(0) del MES SIGUIENTE da el último día del mes actual
          const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          d.setDate(lastDayOfMonth);
        } else {
          // Si estamos después del 15 (fin de mes), próximo es el 15 del siguiente mes
          // IMPORTANTE: Primero cambiamos al día 15 (que existe en todos los meses) para evitar
          // que setMonth salte un mes si venimos de un día 31 y vamos a un mes de 30 días.
          d.setDate(15);
          d.setMonth(currentMonth + 1);
        }
      }
      else if (freq === 'MONTHLY' || freq === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (freq === 'YEARLY' || freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
      return d;
    };

    for (const rt of recurringTransactions) {
      let projectionDate = new Date(rt.nextDueDate);
      projectionDate.setHours(12, 0, 0, 0); // Normalize time

      let instanceCount = 0;
      // Use user's local time for "today" calculation
      const today = startOfDay(userLocalNow);

      // Check for existing payments linked to this recurring transaction
      const existingPayments = await prisma.transaction.findMany({
        where: {
          recurringTransactionId: rt.id,
          deletedAt: null,
        },
        select: { date: true }
      });

      // Create a set of paid dates (normalized to date string)
      const paidDates = new Set(
        existingPayments.map(p => new Date(p.date).toISOString().split('T')[0])
      );

      // Project instances within period (simplified unified logic)
      while (instanceCount < projectionLimit) {
        const projDateStr = projectionDate.toISOString().split('T')[0];
        const uniqueId = `${rt.id}-${projDateStr}`;

        // Check if within period
        const isInPeriod = isWithinInterval(projectionDate, { start: periodStart, end: periodEnd });

        // If we've gone past the period end, stop projecting
        if (projectionDate > periodEnd) {
          break;
        }

        // Only add if in period, not already added globally, and not paid
        if (isInPeriod && !globalAddedIds.has(uniqueId) && !paidDates.has(projDateStr)) {
          globalAddedIds.add(uniqueId);

          const isOverdue = projectionDate < today;

          const item = {
            id: rt.id,
            uniqueId,
            description: rt.description,
            amount: rt.amount,
            dueDate: new Date(projectionDate),
            category: rt.category,
            isOverdue
          };

          if (rt.type === 'income') {
            expectedIncome.push(item);
          } else {
            expectedExpenses.push(item);
          }
        }

        // Advance to next date
        const prevTime = projectionDate.getTime();
        projectionDate = getNextDate(projectionDate, rt.frequency);

        // Safety: prevent infinite loop
        if (projectionDate.getTime() === prevTime) {
          projectionDate.setDate(projectionDate.getDate() + 1);
        }

        instanceCount++;
      }
    }

    // 2.5 Include OVERDUE unpaid items from previous periods
    // These are recurring transactions whose nextDueDate is BEFORE periodStart but haven't been paid
    for (const rt of recurringTransactions) {
      const nextDue = new Date(rt.nextDueDate);
      nextDue.setHours(12, 0, 0, 0);

      // Only process if the nextDueDate is BEFORE the current period start (truly overdue)
      if (nextDue < periodStart) {
        // Check if there's a payment for this specific date
        const existingPayments = await prisma.transaction.findMany({
          where: {
            recurringTransactionId: rt.id,
            deletedAt: null,
          },
          select: { date: true }
        });

        const paidDates = new Set(
          existingPayments.map(p => new Date(p.date).toISOString().split('T')[0])
        );

        const dueDateStr = nextDue.toISOString().split('T')[0];
        const uniqueId = `${rt.id}-overdue-${dueDateStr}`;

        // If not paid and not already added, include as overdue in current period
        if (!paidDates.has(dueDateStr) && !globalAddedIds.has(uniqueId)) {
          globalAddedIds.add(uniqueId);

          const item = {
            id: rt.id,
            uniqueId,
            description: rt.description,
            amount: rt.amount,
            dueDate: nextDue,
            category: rt.category,
            isOverdue: true  // Always true since it's from a previous period
          };

          if (rt.type === 'income') {
            expectedIncome.push(item);
          } else {
            expectedExpenses.push(item);
          }
        }
      }
    }

    // 3. Credit Card Payment Logic (Robust Version)

    const creditAccounts = await prisma.account.findMany({
      where: {
        userId,
        OR: [
          { type: 'credit' },
          { type: 'CREDIT' },
          { type: 'Credit Card' },
          { type: 'Tarjeta de Crédito' }
        ]
      },
      include: {
        installmentPurchases: {
          where: {
            paidAmount: { lt: prisma.installmentPurchase.fields.totalAmount }
          },
          include: { category: true }
        }
      }
    });


    const msiPaymentsDue: any[] = [];
    const isLongPeriod = ['bimestral', 'semestral', 'anual'].includes(periodType);

    // Para períodos cortos: usar lógica de ciclos de corte
    // Para períodos largos: usar solo proyección extendida (más abajo)
    if (!isLongPeriod) {
      for (const account of creditAccounts) {
        if (!account.cutoffDay || !account.paymentDay) {
          continue;
        }


        // We look for PAYMENT DATES that fall within the user's view period.
        // E.g. User views "December". Payment Date is Dec 30.
        const checkDates = [
          new Date(periodStart.getFullYear(), periodStart.getMonth(), account.paymentDay),
          new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, account.paymentDay),
          new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, account.paymentDay)
        ];

        for (const payDate of checkDates) {
          // Ensure accurate comparison by resetting hours
          payDate.setHours(12, 0, 0, 0);

          if (isWithinInterval(payDate, { start: periodStart, end: periodEnd })) {

            // 1. Calculate the Cutoff Date associated with this Payment Date
            // Usually Payment is ~20 days after Cutoff.
            // If Payment(30) > Cutoff(12), they are in same month.
            // If Payment(05) < Cutoff(20), Payment is Month X+1, Cutoff is Month X.

            let cutoffDate = new Date(payDate);
            if (account.paymentDay < account.cutoffDay) {
              cutoffDate.setMonth(cutoffDate.getMonth() - 1);
            }
            cutoffDate.setDate(account.cutoffDay);
            cutoffDate.setHours(23, 59, 59, 999); // End of the cutoff day

            // 2. Calculate the Previous Cutoff Date (Start of Cycle)
            const prevCutoffDate = new Date(cutoffDate);
            prevCutoffDate.setMonth(prevCutoffDate.getMonth() - 1);
            // Cycle starts the DAY AFTER previous cutoff
            const cycleStartDate = new Date(prevCutoffDate);
            cycleStartDate.setDate(cycleStartDate.getDate() + 1);
            cycleStartDate.setHours(0, 0, 0, 0);


            // 3.0 Check for existing payments in this cycle (to exclude already-paid items)
            const existingMsiPayments = await prisma.transaction.findMany({
              where: {
                destinationAccountId: account.id,
                type: 'transfer',
                installmentPurchaseId: { not: null },
                date: {
                  gte: cycleStartDate,
                  lte: new Date() // Up to now
                },
                deletedAt: null
              },
              select: { installmentPurchaseId: true, amount: true }
            });

            const paidMsiIds = new Set(existingMsiPayments.map(p => p.installmentPurchaseId));

            // Check for existing regular purchase payments (transfers without MSI link)
            const existingRegularPayments = await prisma.transaction.aggregate({
              _sum: { amount: true },
              where: {
                destinationAccountId: account.id,
                type: 'transfer',
                installmentPurchaseId: null,
                date: {
                  gte: cycleStartDate,
                  lte: new Date()
                },
                deletedAt: null
              }
            });

            const paidRegularAmount = existingRegularPayments._sum.amount || 0;

            // 3.1 MSI Logic: Which installments fall in this cycle?
            // An installment 'event' happens on the purchase day of each month.
            // We check if that 'event date' falls within [cycleStartDate, cutoffDate].

            const accountMsiDue = account.installmentPurchases.filter(msi => {
              // Skip if already paid in this cycle
              if (paidMsiIds.has(msi.id)) {
                return false;
              }

              const purchaseDate = new Date(msi.purchaseDate);
              const purchaseDay = purchaseDate.getDate();

              // Construct potential charge dates in the months covered by the cycle
              // The cycle can span two months (e.g. Nov 13 - Dec 12).

              // We test the "Purchase Day" in the Month of the CycleStart
              const candidate1 = new Date(cycleStartDate.getFullYear(), cycleStartDate.getMonth(), purchaseDay, 12, 0, 0);

              // We test the "Purchase Day" in the Month of the CutoffDate
              const candidate2 = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), purchaseDay, 12, 0, 0);

              // Is Candidate 1 within the cycle? AND is it after/on the original purchase date?
              const valid1 = candidate1 >= cycleStartDate && candidate1 <= cutoffDate && candidate1 >= purchaseDate;

              // Is Candidate 2 within the cycle?
              const valid2 = candidate2 >= cycleStartDate && candidate2 <= cutoffDate && candidate2 >= purchaseDate;

              if (valid1 || valid2) {
                return true;
              }
              return false;
            });

            // 3.2 Regular Purchases Logic
            const cycleExpenses = await prisma.transaction.aggregate({
              _sum: { amount: true },
              where: {
                accountId: account.id,
                type: 'expense',
                installmentPurchaseId: null, // Only non-MSI
                date: {
                  gte: cycleStartDate,
                  lte: cutoffDate
                },
                deletedAt: null
              }
            });

            const nonMsiTotal = cycleExpenses._sum.amount || 0;
            // Subtract already paid regular amount
            const remainingRegularTotal = Math.max(0, nonMsiTotal - paidRegularAmount);

            const msiTotal = accountMsiDue.reduce((sum, m) => sum + m.monthlyPayment, 0);
            const totalPayable = msiTotal + remainingRegularTotal;

            if (totalPayable > 0) {
              accountMsiDue.forEach(msi => {
                // Calcular cuota actual: paidAmount / monthlyPayment + 1
                const paidInstallments = Math.round(msi.paidAmount / msi.monthlyPayment);
                const currentInstallment = paidInstallments + 1;
                const isLastInstallment = currentInstallment >= msi.installments;

                msiPaymentsDue.push({
                  id: msi.id,
                  originalId: msi.id,
                  description: `Cuota ${currentInstallment}/${msi.installments} - ${msi.description}`,
                  purchaseName: msi.description,
                  amount: msi.monthlyPayment,
                  dueDate: payDate,
                  category: msi.category,
                  accountId: account.id,
                  accountName: account.name,
                  isMsi: true,
                  isLastInstallment,
                  installmentNumber: currentInstallment,
                  totalInstallments: msi.installments,
                  msiTotal: msi.totalAmount,
                  paidAmount: msi.paidAmount
                });
              });

              if (remainingRegularTotal > 0) {
                msiPaymentsDue.push({
                  id: `cc-spent-${account.id}-${payDate.getTime()}`,
                  description: `Consumos del Periodo (${account.name})`,
                  amount: remainingRegularTotal,
                  dueDate: payDate,
                  accountId: account.id,
                  accountName: account.name,
                  isMsi: false,
                  category: { name: 'Tarjeta', color: '#64748b', icon: 'credit_card' }
                });
              }
            }
          }
        }
      }
    } // Fin del bloque para períodos cortos

    // 3.5 For LONG periods (bimestral+), project ALL future MSI payments
    // This ensures we see all upcoming installments, not just the next billing cycle
    if (isLongPeriod) {

      for (const account of creditAccounts) {
        for (const msi of account.installmentPurchases) {
          // Calculate remaining installments
          const paidInstallments = Math.floor(msi.paidAmount / msi.monthlyPayment);
          const remainingInstallments = msi.installments - paidInstallments;

          if (remainingInstallments <= 0) continue;

          const purchaseDate = new Date(msi.purchaseDate);
          const purchaseDay = purchaseDate.getDate();

          // Project each remaining installment
          for (let i = 0; i < remainingInstallments; i++) {
            // Calculate the installment date (same day of month as purchase, but months forward)
            const installmentDate = new Date(purchaseDate);
            installmentDate.setMonth(installmentDate.getMonth() + paidInstallments + i + 1);

            // Ensure we're within the period and haven't already added this payment
            if (installmentDate >= periodStart && installmentDate <= periodEnd) {
              // Check if this specific payment was already added in the regular cycle logic
              const alreadyAdded = msiPaymentsDue.some(
                (p: any) => p.id === msi.id &&
                  new Date(p.dueDate).getMonth() === installmentDate.getMonth() &&
                  new Date(p.dueDate).getFullYear() === installmentDate.getFullYear()
              );

              if (!alreadyAdded) {
                const isLastInstallment = (i === remainingInstallments - 1);

                msiPaymentsDue.push({
                  id: `${msi.id}-proj-${i}`,
                  originalId: msi.id,
                  description: isLastInstallment
                    ? `Última cuota de "${msi.description}"`
                    : `Cuota ${paidInstallments + i + 1}/${msi.installments} - ${msi.description}`,
                  purchaseName: msi.description,
                  amount: msi.monthlyPayment,
                  dueDate: installmentDate,
                  category: msi.category,
                  accountId: account.id,
                  accountName: account.name,
                  isMsi: true,
                  isProjection: true,
                  isLastInstallment,
                  installmentNumber: paidInstallments + i + 1,
                  totalInstallments: msi.installments,
                  msiTotal: msi.totalAmount,
                  paidAmount: msi.paidAmount,
                  remainingAmount: msi.totalAmount - msi.paidAmount - (msi.monthlyPayment * (i + 1))
                });
              }
            }
          }
        }
      }
    }

    // 4. Calculate Balances & Totals - CORRECTED
    const accounts = await prisma.account.findMany({ where: { userId } });

    // Liquid Assets: Cash, Debit, Savings. Everything NOT Credit.
    const liquidAccounts = accounts.filter(a => !['credit', 'CREDIT', 'Credit Card'].includes(a.type));
    const currentBalance = liquidAccounts.reduce((sum, a) => sum + a.balance, 0);

    // Debt info for display (Total debt stock)
    const currentDebt = accounts.filter(a => ['credit', 'CREDIT', 'Credit Card'].includes(a.type)).reduce((sum, a) => sum + Math.abs(a.balance), 0);

    // Calculate MSI remaining debt stock
    // Calculate MSI remaining debt stock
    let currentMSIDebt = 0;
    for (const account of creditAccounts) {
      for (const msi of account.installmentPurchases) {
        currentMSIDebt += (msi.totalAmount - msi.paidAmount);
      }
    }

    // Filter income/expenses to only those strictly in the FUTURE of Now (for Disposable calculation)??
    // Actually, "Period Summary" usually includes the whole period.
    // Disposable Final = (Starting Balance of Period + Income) - (Expenses + Payments).
    // But "currentBalance" is NOW. So we should add remaining income and subtract remaining expenses.

    // We already filtered `expectedIncome` and `expectedExpenses` by Period Date Range.
    // We should treat them as "projected for this period".

    // Calculate Total Actual Income received in this period (for display purposes)
    const actualIncome = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'income',
        date: {
          gte: periodStart,
          lte: periodEnd
        },
        deletedAt: null
      }
    });

    const totalReceivedIncome = actualIncome._sum.amount || 0;
    const totalExpectedIncome = expectedIncome.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPeriodIncome = totalReceivedIncome + totalExpectedIncome;
    const totalRecurringExpenses = expectedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalMsiPayments = msiPaymentsDue.reduce((acc, curr: any) => acc + curr.amount, 0);

    const totalCommitments = totalRecurringExpenses + totalMsiPayments;

    // Disposable Income Logic:
    // "How much money will I have left at the end of the period?"
    // = Current Cash + Future Income in Period - Future Bills in Period.
    // (We assume Current Cash already paid for Past Bills).

    const disposableIncome = currentBalance + totalExpectedIncome - totalCommitments;
    const isSufficient = disposableIncome >= 0;
    const shortfall = isSufficient ? 0 : Math.abs(disposableIncome);

    // 5. 50/30/20 Analysis (Projected + Actual)
    const budgetAnalysis = {
      needs: { projected: 0, ideal: (totalPeriodIncome || currentBalance) * 0.5 },
      wants: { projected: 0, ideal: (totalPeriodIncome || currentBalance) * 0.3 },
      savings: { projected: 0, ideal: (totalPeriodIncome || currentBalance) * 0.2 }
    };

    // Helper to categorize (normalize to uppercase for comparison)
    const categorize = (amount: number, type: string) => {
      const normalizedType = (type || '').toUpperCase();
      if (normalizedType === 'NEEDS' || normalizedType === 'NEED') budgetAnalysis.needs.projected += amount;
      else if (normalizedType === 'WANTS' || normalizedType === 'WANT') budgetAnalysis.wants.projected += amount;
      else if (normalizedType === 'SAVINGS' || normalizedType === 'SAVING') budgetAnalysis.savings.projected += amount;
      else budgetAnalysis.needs.projected += amount; // Default to needs
    };

    // 5.1 Include ACTUAL expenses from this period
    const actualExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        date: { gte: periodStart, lte: periodEnd },
        deletedAt: null
      },
      include: {
        category: true,
        loan: true // Need this to identify loan type
      }
    });

    for (const tx of actualExpenses) {
      if (tx.loan) {
        // Handle Loan Transactions
        if (tx.loan.loanType === 'lent') {
          // I lent money = Asset allocation = SAVINGS
          categorize(tx.amount, 'SAVINGS');
        } else {
          // I paid debt = Obligation = NEEDS
          categorize(tx.amount, 'NEEDS');
        }
      } else {
        // Standard expense
        categorize(tx.amount, tx.category?.budgetType || 'NEEDS');
      }
    }

    // 5.2 Include PROJECTED (Future) expenses

    expectedExpenses.forEach(bg => categorize(bg.amount, bg.category?.budgetType || 'NEEDS'));
    msiPaymentsDue.forEach(msi => categorize(msi!.amount, msi!.category?.budgetType || 'NEEDS'));

    // Include loan collections (lent) as Savings in 50/30/20 analysis
    // These are filtered by expectedPayDate in the period (line 193-200), so only loans
    // with a payment date within the period are included
    expectedIncome
      .filter((income: any) => income.isLoan)
      .forEach((loanIncome: any) => {
        // Préstamos que te van a pagar = Ahorro (es capital tuyo que regresa)
        budgetAnalysis.savings.projected += loanIncome.amount;
      });

    // Generate warnings (Smart Logic)
    const warnings: string[] = [];
    const availableLiquidity = currentBalance + totalExpectedIncome;

    // 1. Debt Health
    if (currentDebt > 0 && currentBalance > 0 && currentDebt > currentBalance * 0.6) {
      warnings.push('Tu deuda en tarjetas es alta comparada con tu efectivo actual.');
    } else if (currentDebt > 0 && currentBalance === 0) {
      warnings.push('Tienes deuda y cero efectivo. Prioriza la liquidez.');
    }

    // 2. Capacity Coverage (Liquidity vs Commitments)
    if (totalCommitments > 0) {
      if (availableLiquidity === 0) {
        warnings.push('Tienes compromisos pendientes y $0 recursos disponibles. ¡Alerta!');
      } else if (totalCommitments > availableLiquidity) {
        warnings.push(`Tus compromisos ($${totalCommitments.toFixed(0)}) exceden tus recursos totales ($${availableLiquidity.toFixed(0)}).`);
      } else if (totalCommitments > availableLiquidity * 0.8) {
        warnings.push('Tus gastos comprometidos consumen casi todo tu dinero disponible (80%+).');
      }
    }

    // 3. Needs Ratio (Only if there is significant income/balance flow)
    if (availableLiquidity > 0 && budgetAnalysis.needs.projected > availableLiquidity * 0.6) {
      warnings.push('Tus necesidades básicas proyectadas son muy altas para tu capacidad actual.');
    }

    const summary = {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      displayStart,  // For UI display (local time, YYYY-MM-DD format)
      displayEnd,    // For UI display (local time, YYYY-MM-DD format)
      periodType,
      currentBalance,
      currentDebt,
      currentMSIDebt,
      expectedIncome,
      expectedExpenses,
      msiPaymentsDue,
      totalExpectedIncome,
      totalReceivedIncome,
      totalPeriodIncome,
      totalCommitments,
      disposableIncome,
      isSufficient,
      shortfall,
      budgetAnalysis,
      warnings
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting financial period summary:', error);
    res.status(500).json({ error: 'Failed to get financial summary' });
  }
};

export const getUpcomingCommitments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const days = parseInt(req.query.days as string) || 7;
    const now = new Date();
    const endDate = addDays(now, days);

    // Similar logic but for next X days
    // ... (simplified version of the above)

    res.json({ message: 'Upcoming commitments endpoint' });
  } catch (error) {
    console.error('Error getting upcoming commitments:', error);
    res.status(500).json({ error: 'Failed to get upcoming commitments' });
  }
};
