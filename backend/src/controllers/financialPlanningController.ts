import { Request, Response } from 'express';
import prisma from '../services/database';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { AuthRequest } from '../middleware/auth';



// Calculate period dates based on type
function calculatePeriod(type: 'quincenal' | 'mensual' | 'semanal') {
  const now = new Date();
  const currentDay = now.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  switch (type) {
    case 'quincenal':
      // If we're in first half (1-15), period is 1-15
      // If we're in second half (16-31), period is 16-end of month
      if (currentDay <= 15) {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59);
      } else {
        periodStart = new Date(now.getFullYear(), now.getMonth(), 16);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Last day of month
      }
      break;

    case 'mensual':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;

    case 'semanal':
      periodStart = startOfDay(now);
      periodEnd = endOfDay(addDays(now, 6));
      break;

    default:
      throw new Error('Invalid period type');
  }

  return { periodStart, periodEnd };
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

    const periodType = (req.query.period as 'quincenal' | 'mensual' | 'semanal') || 'quincenal';
    const { periodStart, periodEnd } = calculatePeriod(periodType);

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

    // 1. Process Income (Recurrent Income)
    const expectedIncome: any[] = [];

    // 2. Process Expenses (Recurrent Expenses - Multi-instance Projection)
    const expectedExpenses: any[] = [];

    // Helper to calculate next date for projection
    const getNextDate = (date: Date, freq: string): Date => {
      const d = new Date(date);
      if (freq === 'DAILY') d.setDate(d.getDate() + 1);
      if (freq === 'WEEKLY') d.setDate(d.getDate() + 7);
      if (freq === 'BIWEEKLY') d.setDate(d.getDate() + 14);
      if (freq === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      if (freq === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
      // Compatibility
      if (freq === 'daily') d.setDate(d.getDate() + 1);
      if (freq === 'weekly') d.setDate(d.getDate() + 7);
      if (freq === 'biweekly') d.setDate(d.getDate() + 14);
      if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
      return d;
    };

    for (const rt of recurringTransactions) {
      let projectionDate = new Date(rt.nextDueDate);
      projectionDate.setHours(12, 0, 0, 0); // Normalize time

      let instanceCount = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Check for existing payments linked to this recurring transaction
      const existingPayments = await prisma.transaction.findMany({
        where: {
          recurringTransactionId: rt.id,
          deletedAt: null,
        },
        select: { date: true, amount: true }
      });

      // Create a set of paid dates (normalized to date string)
      const paidDates = new Set(
        existingPayments.map(p => new Date(p.date).toISOString().split('T')[0])
      );

      // If nextDueDate is in the FUTURE, project it and continue projecting more
      // No "overdue" logic applies to future dates
      if (projectionDate > todayEnd) {
        // Future date - project if within period
        while (isWithinInterval(projectionDate, { start: periodStart, end: periodEnd }) && instanceCount < 10) {
          const projDateStr = projectionDate.toISOString().split('T')[0];
          if (!paidDates.has(projDateStr)) {
            const item = {
              id: rt.id,
              uniqueId: `${rt.id}-${projDateStr}`,
              description: rt.description,
              amount: rt.amount,
              dueDate: new Date(projectionDate),
              category: rt.category,
              isOverdue: false  // Future dates are never overdue
            };

            if (rt.type === 'income') {
              expectedIncome.push(item);
            } else {
              expectedExpenses.push(item);
            }
          }
          projectionDate = getNextDate(projectionDate, rt.frequency);
          instanceCount++;
        }
        continue; // Move to next recurring transaction
      }

      // nextDueDate is TODAY or in the PAST
      // Check if there's an OVERDUE instance (before today but not paid)
      if (projectionDate < today) {
        const projDateStr = projectionDate.toISOString().split('T')[0];
        if (!paidDates.has(projDateStr)) {
          // This is overdue and unpaid - show it!
          const item = {
            id: rt.id,
            uniqueId: `${rt.id}-${projDateStr}`,
            description: rt.description,
            amount: rt.amount,
            dueDate: new Date(projectionDate),
            category: rt.category,
            isOverdue: true
          };

          if (rt.type === 'income') {
            expectedIncome.push(item);
          } else {
            expectedExpenses.push(item);
          }
        }
        // Advance to next instance
        projectionDate = getNextDate(projectionDate, rt.frequency);
      }

      // Now project current and future instances within period (Safe limit 10)
      while (isWithinInterval(projectionDate, { start: periodStart, end: periodEnd }) && instanceCount < 10) {
        const projDateStr = projectionDate.toISOString().split('T')[0];

        // Skip if already paid
        if (paidDates.has(projDateStr)) {
          projectionDate = getNextDate(projectionDate, rt.frequency);
          instanceCount++;
          continue;
        }

        const item = {
          id: rt.id,
          uniqueId: `${rt.id}-${projDateStr}`,
          description: rt.description,
          amount: rt.amount,
          dueDate: new Date(projectionDate),
          category: rt.category,
          isOverdue: projectionDate < today
        };

        if (rt.type === 'income') {
          expectedIncome.push(item);
        } else {
          expectedExpenses.push(item);
        }

        projectionDate = getNextDate(projectionDate, rt.frequency);
        instanceCount++;
      }
    }

    // 3. Credit Card Payment Logic (Robust Version)
    const startLog = `Financial Planning: Validating period ${periodStart.toISOString()} - ${periodEnd.toISOString()}`;
    console.log(startLog);

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

    console.log(`Financial Planning: Found ${creditAccounts.length} credit accounts for user.`);

    const msiPaymentsDue: any[] = [];

    for (const account of creditAccounts) {
      if (!account.cutoffDay || !account.paymentDay) {
        console.log(`Account ${account.name} missing cutoff/payment day config.`);
        continue;
      }

      console.log(`Analyzing Account: ${account.name}. Cutoff: ${account.cutoffDay}, Payment: ${account.paymentDay}`);

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
          console.log(`>> Found relevant payment date: ${payDate.toISOString().split('T')[0]}`);

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

          console.log(`   Billing Cycle: ${cycleStartDate.toISOString().split('T')[0]} to ${cutoffDate.toISOString().split('T')[0]}`);

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
          console.log(`   Already paid MSI in this cycle: ${paidMsiIds.size}`);

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
              console.log(`      [SKIP] MSI '${msi.description}' already paid this cycle.`);
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
              console.log(`      [MATCH] MSI '${msi.description}' (Day ${purchaseDay}) falls in this cycle.`);
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
              msiPaymentsDue.push({
                id: msi.id,
                description: `Cuota ${msi.description}`,
                amount: msi.monthlyPayment,
                dueDate: payDate,
                category: msi.category,
                accountId: account.id,
                accountName: account.name,
                isMsi: true,
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

    const totalExpectedIncome = expectedIncome.reduce((acc, curr) => acc + curr.amount, 0);
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

    // 5. 50/30/20 Analysis (Projected)
    const budgetAnalysis = {
      needs: { projected: 0, ideal: (totalExpectedIncome + (totalExpectedIncome === 0 ? currentBalance : 0)) * 0.5 }, // Fallback to balance if income 0
      wants: { projected: 0, ideal: (totalExpectedIncome + (totalExpectedIncome === 0 ? currentBalance : 0)) * 0.3 },
      savings: { projected: 0, ideal: (totalExpectedIncome + (totalExpectedIncome === 0 ? currentBalance : 0)) * 0.2 }
    };

    // Helper to categorize
    const categorize = (amount: number, type: string) => {
      if (type === 'NEEDS') budgetAnalysis.needs.projected += amount;
      else if (type === 'WANTS') budgetAnalysis.wants.projected += amount;
      else if (type === 'SAVINGS') budgetAnalysis.savings.projected += amount;
      else budgetAnalysis.needs.projected += amount; // Default to needs
    };

    expectedExpenses.forEach(bg => categorize(bg.amount, bg.category?.budgetType || 'NEEDS'));
    msiPaymentsDue.forEach(msi => categorize(msi!.amount, msi!.category?.budgetType || 'NEEDS'));

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
      periodType,
      currentBalance,
      currentDebt,
      currentMSIDebt,
      expectedIncome,
      expectedExpenses,
      msiPaymentsDue,
      totalExpectedIncome,
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
