import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

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
      let instanceCount = 0;

      // Project instances while within period (Safe limit 10)
      while (isWithinInterval(projectionDate, { start: periodStart, end: periodEnd }) && instanceCount < 10) {

        const item = {
          id: rt.id,
          uniqueId: `${rt.id}-${projectionDate.toISOString().split('T')[0]}`,
          description: rt.description,
          amount: rt.amount,
          dueDate: new Date(projectionDate),
          category: rt.category
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

    // 3. MSI Logic
    // Filter active MSI plans and calculate due payments for this period
    const msiPurchases = await prisma.installmentPurchase.findMany({
      where: {
        userId,
        // status: 'active'  // Prisma schema might use ACTIVE/COMPLETED or similar. Assuming active based on paidAmount < totalAmount
        paidAmount: { lt: prisma.installmentPurchase.fields.totalAmount }
      },
      include: {
        category: true,
        generatedTransactions: {
          where: { deletedAt: null }
        }
      }
    });

    const msiPaymentsDue = msiPurchases.map(msi => {
      // Simple projection: If it's active, it's due this month.
      // Refinement: Check if monthly payment date falls in period.
      const purchaseDay = new Date(msi.purchaseDate).getDate();
      const dueDay = purchaseDay > 28 ? 28 : purchaseDay;
      const projectedDueDate = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), dueDay); // Approx due date in current month

      // Check if ALREADY PAID this month
      // We look for any PAYMENT transaction (income/transfer) linked to this MSI that occurred in the same month/year
      // CRITICAL: Exclude 'expense' type, which is the initial purchase transaction.
      const alreadyPaid = msi.generatedTransactions.some(tx => {
        // Filter only payments (income/transfer)
        if (tx.type !== 'income' && tx.type !== 'transfer') return false;

        const txDate = new Date(tx.date);
        // Check if transaction is recent (same month/year as due date)
        return txDate.getMonth() === projectedDueDate.getMonth() &&
          txDate.getFullYear() === projectedDueDate.getFullYear();
      });

      if (alreadyPaid) return null;

      // Only include if date falls in range (broad check for monthly payments)
      if (isWithinInterval(projectedDueDate, { start: periodStart, end: periodEnd })) {
        return {
          id: msi.id,
          description: msi.description,
          amount: msi.monthlyPayment,
          dueDate: projectedDueDate,
          category: msi.category
        };
      }
      return null;
    }).filter(item => item !== null);


    // 4. Calculate Balances & Totals
    const accounts = await prisma.account.findMany({ where: { userId } });
    const currentBalance = accounts.filter(a => a.type !== 'CREDIT').reduce((sum, a) => sum + a.balance, 0);
    const currentDebt = accounts.filter(a => a.type === 'CREDIT').reduce((sum, a) => sum + Math.abs(a.balance), 0);

    // Calculate MSI remaining debt
    const currentMSIDebt = msiPurchases.reduce((sum, msi) => sum + (msi.totalAmount - msi.paidAmount), 0);

    const totalExpectedIncome = expectedIncome.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRecurringExpenses = expectedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalMsiPayments = msiPaymentsDue.reduce((acc, curr: any) => acc + curr.amount, 0);
    const totalCommitments = totalRecurringExpenses + totalMsiPayments;

    const disposableIncome = currentBalance + totalExpectedIncome - totalCommitments; // Projected Balance
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
