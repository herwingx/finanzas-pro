import { Response } from 'express';
import prisma from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { isWithinInterval } from 'date-fns';

/**
 * Credit Card Payment Controller
 * 
 * This controller handles credit card statement-based payments:
 * - Get statement summary based on cutoff cycle
 * - Pay full statement (with breakdown)
 * - Pay individual MSI installment
 * - Auto-update MSI tracking when payments are made
 */

// Helper to calculate current billing cycle for an account
function getBillingCycle(account: { cutoffDay: number; paymentDay: number }, referenceDate?: Date) {
  const now = referenceDate || new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Determine which payment date is relevant
  // Payment comes AFTER cutoff. We need to find the next payment date.
  let paymentMonth = currentMonth;
  let paymentYear = currentYear;

  // If current day is past this month's payment day, next payment is next month
  if (currentDay > account.paymentDay) {
    paymentMonth += 1;
    if (paymentMonth > 11) {
      paymentMonth = 0;
      paymentYear += 1;
    }
  }

  const paymentDate = new Date(paymentYear, paymentMonth, account.paymentDay, 12, 0, 0);

  // Calculate cutoff date associated with this payment
  // If paymentDay < cutoffDay, cutoff was previous month
  let cutoffMonth = paymentMonth;
  let cutoffYear = paymentYear;

  if (account.paymentDay < account.cutoffDay) {
    cutoffMonth -= 1;
    if (cutoffMonth < 0) {
      cutoffMonth = 11;
      cutoffYear -= 1;
    }
  }

  const cutoffDate = new Date(cutoffYear, cutoffMonth, account.cutoffDay, 23, 59, 59, 999);

  // Previous cutoff (start of billing cycle) is one month before current cutoff
  const prevCutoffDate = new Date(cutoffDate);
  prevCutoffDate.setMonth(prevCutoffDate.getMonth() - 1);

  // Cycle starts the day AFTER previous cutoff
  const cycleStartDate = new Date(prevCutoffDate);
  cycleStartDate.setDate(cycleStartDate.getDate() + 1);
  cycleStartDate.setHours(0, 0, 0, 0);

  return {
    cycleStartDate,
    cutoffDate,
    paymentDate,
    isBeforeCutoff: now <= cutoffDate,
    daysUntilPayment: Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    daysUntilCutoff: Math.ceil((cutoffDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  };
}

// Get detailed statement for a credit card
export const getStatementDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accountId } = req.params;

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
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

    if (!account) {
      return res.status(404).json({ error: 'Credit card account not found' });
    }

    if (!account.cutoffDay || !account.paymentDay) {
      return res.status(400).json({ error: 'Account missing cutoff/payment day configuration' });
    }

    const cycle = getBillingCycle({ cutoffDay: account.cutoffDay, paymentDay: account.paymentDay });

    // 1. Calculate MSI charges for this billing cycle
    const msiCharges: Array<{
      id: string;
      description: string;
      amount: number;
      currentInstallment: number;
      totalInstallments: number;
      remainingAmount: number;
      paidAmount: number;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
    }> = [];

    for (const msi of account.installmentPurchases) {
      const purchaseDate = new Date(msi.purchaseDate);
      const purchaseDay = purchaseDate.getDate();

      // Check if installment charge date falls within billing cycle
      const candidate1 = new Date(cycle.cycleStartDate.getFullYear(), cycle.cycleStartDate.getMonth(), purchaseDay, 12, 0, 0);
      const candidate2 = new Date(cycle.cutoffDate.getFullYear(), cycle.cutoffDate.getMonth(), purchaseDay, 12, 0, 0);

      const valid1 = candidate1 >= cycle.cycleStartDate && candidate1 <= cycle.cutoffDate && candidate1 >= purchaseDate;
      const valid2 = candidate2 >= cycle.cycleStartDate && candidate2 <= cycle.cutoffDate && candidate2 >= purchaseDate;

      if (valid1 || valid2) {
        // Calculate which installment number this is
        const chargeDate = valid1 ? candidate1 : candidate2;
        let monthsDiff = (chargeDate.getFullYear() - purchaseDate.getFullYear()) * 12;
        monthsDiff += chargeDate.getMonth() - purchaseDate.getMonth();
        const currentInstallment = Math.min(monthsDiff + 1, msi.installments);

        msiCharges.push({
          id: msi.id,
          description: msi.description,
          amount: msi.monthlyPayment,
          currentInstallment,
          totalInstallments: msi.installments,
          remainingAmount: msi.totalAmount - msi.paidAmount,
          paidAmount: msi.paidAmount,
          categoryName: msi.category?.name || 'Sin categoría',
          categoryColor: msi.category?.color || '#64748b',
          categoryIcon: msi.category?.icon || 'credit_card',
        });
      }
    }

    // 2. Calculate regular purchases (non-MSI) for this billing cycle
    const regularPurchases = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
        type: 'expense',
        installmentPurchaseId: null,
        date: {
          gte: cycle.cycleStartDate,
          lte: cycle.cutoffDate
        },
        deletedAt: null
      },
      include: { category: true },
      orderBy: { date: 'desc' }
    });

    const regularCharges = regularPurchases.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      categoryName: tx.category?.name || 'Sin categoría',
      categoryColor: tx.category?.color || '#64748b',
      categoryIcon: tx.category?.icon || 'shopping_cart'
    }));

    // 3. Calculate totals
    const msiTotal = msiCharges.reduce((sum, m) => sum + m.amount, 0);
    const regularTotal = regularCharges.reduce((sum, r) => sum + r.amount, 0);
    const totalDue = msiTotal + regularTotal;

    // 4. Check for existing payments this cycle
    const existingPayments = await prisma.transaction.findMany({
      where: {
        destinationAccountId: account.id,
        type: 'transfer',
        date: {
          gte: cycle.cycleStartDate,
          lte: new Date() // Up to now
        },
        deletedAt: null
      }
    });

    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingDue = Math.max(0, totalDue - totalPaid);

    return res.json({
      accountId: account.id,
      accountName: account.name,
      creditLimit: account.creditLimit,
      currentBalance: Math.abs(account.balance), // Debt is typically negative

      billingCycle: {
        startDate: cycle.cycleStartDate.toISOString(),
        cutoffDate: cycle.cutoffDate.toISOString(),
        paymentDate: cycle.paymentDate.toISOString(),
        isBeforeCutoff: cycle.isBeforeCutoff,
        daysUntilCutoff: cycle.daysUntilCutoff,
        daysUntilPayment: cycle.daysUntilPayment
      },

      msiCharges,
      msiTotal,
      msiCount: msiCharges.length,

      regularCharges,
      regularTotal,
      regularCount: regularCharges.length,

      totalDue,
      totalPaid,
      remainingDue,

      isFullyPaid: remainingDue <= 0.01,
      payments: existingPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date,
        description: p.description
      }))
    });
  } catch (error) {
    console.error('Error getting statement details:', error);
    res.status(500).json({ error: 'Failed to get statement details' });
  }
};

// Pay full statement - Creates individual transactions for proper tracking
export const payFullStatement = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accountId } = req.params;
    const { sourceAccountId, date } = req.body;

    if (!sourceAccountId) {
      return res.status(400).json({ error: 'Source account ID is required' });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
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
          }
        }
      }
    });

    if (!account || !account.cutoffDay || !account.paymentDay) {
      return res.status(404).json({ error: 'Credit card account not found or missing configuration' });
    }

    const sourceAccount = await prisma.account.findFirst({
      where: { id: sourceAccountId, userId }
    });

    if (!sourceAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    const cycle = getBillingCycle({ cutoffDay: account.cutoffDay, paymentDay: account.paymentDay });

    // Calculate what needs to be paid
    const msiToPay: Array<{ id: string; description: string; amount: number; installmentNumber: number; totalInstallments: number }> = [];

    for (const msi of account.installmentPurchases) {
      const purchaseDate = new Date(msi.purchaseDate);
      const purchaseDay = purchaseDate.getDate();

      const candidate1 = new Date(cycle.cycleStartDate.getFullYear(), cycle.cycleStartDate.getMonth(), purchaseDay, 12, 0, 0);
      const candidate2 = new Date(cycle.cutoffDate.getFullYear(), cycle.cutoffDate.getMonth(), purchaseDay, 12, 0, 0);

      const valid1 = candidate1 >= cycle.cycleStartDate && candidate1 <= cycle.cutoffDate && candidate1 >= purchaseDate;
      const valid2 = candidate2 >= cycle.cycleStartDate && candidate2 <= cycle.cutoffDate && candidate2 >= purchaseDate;

      if (valid1 || valid2) {
        const chargeDate = valid1 ? candidate1 : candidate2;
        let monthsDiff = (chargeDate.getFullYear() - purchaseDate.getFullYear()) * 12;
        monthsDiff += chargeDate.getMonth() - purchaseDate.getMonth();
        const installmentNumber = Math.min(monthsDiff + 1, msi.installments);

        msiToPay.push({
          id: msi.id,
          description: msi.description,
          amount: msi.monthlyPayment,
          installmentNumber,
          totalInstallments: msi.installments
        });
      }
    }

    // Get regular purchases total
    const regularPurchases = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        accountId: account.id,
        type: 'expense',
        installmentPurchaseId: null,
        date: {
          gte: cycle.cycleStartDate,
          lte: cycle.cutoffDate
        },
        deletedAt: null
      }
    });

    const msiTotal = msiToPay.reduce((sum, m) => sum + m.amount, 0);
    const regularTotal = regularPurchases._sum.amount || 0;
    const totalAmount = msiTotal + regularTotal;

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'No hay saldo por pagar en este corte' });
    }

    if (sourceAccount.balance < totalAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente en cuenta de origen' });
    }

    const paymentDate = date ? new Date(date) : new Date();
    const cutoffDateStr = cycle.cutoffDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

    // Track created transaction IDs for response
    const createdTransactions: string[] = [];

    // Execute payment in transaction - Create INDIVIDUAL transactions for each item
    await prisma.$transaction(async (tx) => {
      // 1. Create individual transactions for each MSI (linked to installmentPurchaseId)
      for (const msi of msiToPay) {
        const msiDescription = `Pago Corte ${cutoffDateStr}: ${msi.description} (${msi.installmentNumber}/${msi.totalInstallments})`;

        const txRecord = await tx.transaction.create({
          data: {
            amount: msi.amount,
            description: msiDescription,
            date: paymentDate,
            type: 'transfer',
            userId,
            accountId: sourceAccountId,
            destinationAccountId: accountId,
            installmentPurchaseId: msi.id  // Link to MSI for proper tracking!
          }
        });
        createdTransactions.push(txRecord.id);

        // Update MSI tracking
        await tx.installmentPurchase.update({
          where: { id: msi.id },
          data: {
            paidInstallments: { increment: 1 },
            paidAmount: { increment: msi.amount }
          }
        });
      }

      // 2. Create one transaction for regular purchases (not linked to MSI)
      if (regularTotal > 0) {
        const regularDescription = `Pago Corte ${cutoffDateStr}: Consumos ${account.name}`;

        const txRecord = await tx.transaction.create({
          data: {
            amount: regularTotal,
            description: regularDescription,
            date: paymentDate,
            type: 'transfer',
            userId,
            accountId: sourceAccountId,
            destinationAccountId: accountId,
            installmentPurchaseId: null  // No MSI link
          }
        });
        createdTransactions.push(txRecord.id);
      }

      // 3. Update account balances (total amount)
      await tx.account.update({
        where: { id: sourceAccountId },
        data: { balance: { decrement: totalAmount } }  // Take money from source
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: totalAmount } }  // DECREMENT = Reduce debt on credit card
      });
    });

    // Build summary for response
    const msiBreakdown = msiToPay.map(m => `${m.description} (${m.installmentNumber}/${m.totalInstallments})`).join(', ');
    const summaryDescription = `Pago Corte ${account.name} - ${cutoffDateStr}${msiBreakdown ? ` | MSI: ${msiBreakdown}` : ''}${regularTotal > 0 ? ` | Consumos: $${regularTotal.toFixed(2)}` : ''}`;

    res.json({
      success: true,
      amount: totalAmount,
      description: summaryDescription,
      msiPaid: msiToPay.length,
      regularPaid: regularTotal > 0 ? 1 : 0,
      transactionsCreated: createdTransactions.length,
      message: 'Pago de corte registrado exitosamente'
    });
  } catch (error) {
    console.error('Error paying full statement:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

// Pay individual MSI installment
export const payMsiInstallment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { installmentId } = req.params;
    const { sourceAccountId, date } = req.body;

    if (!sourceAccountId) {
      return res.status(400).json({ error: 'Source account ID is required' });
    }

    const msi = await prisma.installmentPurchase.findFirst({
      where: { id: installmentId, userId },
      include: { account: true }
    });

    if (!msi) {
      return res.status(404).json({ error: 'Installment purchase not found' });
    }

    if (msi.paidAmount >= msi.totalAmount) {
      return res.status(400).json({ error: 'Esta compra ya está totalmente pagada' });
    }

    const sourceAccount = await prisma.account.findFirst({
      where: { id: sourceAccountId, userId }
    });

    if (!sourceAccount) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    const paymentAmount = msi.monthlyPayment;
    const newInstallmentNumber = msi.paidInstallments + 1;

    if (sourceAccount.balance < paymentAmount) {
      return res.status(400).json({ error: 'Saldo insuficiente en cuenta de origen' });
    }

    const description = `Pago MSI: ${msi.description} (${newInstallmentNumber}/${msi.installments})`;

    await prisma.$transaction(async (tx) => {
      const paymentDate = date ? new Date(date) : new Date();

      // 1. Create transfer transaction
      await tx.transaction.create({
        data: {
          amount: paymentAmount,
          description,
          date: paymentDate,
          type: 'transfer',
          userId,
          accountId: sourceAccountId,
          destinationAccountId: msi.accountId,
          installmentPurchaseId: msi.id
        }
      });

      // 2. Update balances
      await tx.account.update({
        where: { id: sourceAccountId },
        data: { balance: { decrement: paymentAmount } }  // Take money from source
      });

      await tx.account.update({
        where: { id: msi.accountId },
        data: { balance: { decrement: paymentAmount } }  // DECREMENT = Reduce debt on credit card
      });

      // 3. Update MSI tracking
      await tx.installmentPurchase.update({
        where: { id: msi.id },
        data: {
          paidInstallments: { increment: 1 },
          paidAmount: { increment: paymentAmount }
        }
      });
    });

    res.json({
      success: true,
      amount: paymentAmount,
      description,
      installmentNumber: newInstallmentNumber,
      totalInstallments: msi.installments,
      remainingAmount: msi.totalAmount - msi.paidAmount - paymentAmount,
      message: 'Cuota MSI pagada exitosamente'
    });
  } catch (error) {
    console.error('Error paying MSI installment:', error);
    res.status(500).json({ error: 'Failed to process MSI payment' });
  }
};

// Undo/revert a statement payment (optional - for when user removes transfer)
export const revertStatementPayment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transactionId } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        type: 'transfer',
        destinationAccountId: { not: null }
      },
      include: {
        account: true,
        destinationAccount: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Payment transaction not found' });
    }

    // Check if destination is a credit card
    const isCreditCard = ['credit', 'CREDIT', 'Credit Card', 'Tarjeta de Crédito'].includes(
      transaction.destinationAccount?.type || ''
    );

    if (!isCreditCard) {
      return res.status(400).json({ error: 'This is not a credit card payment' });
    }

    // Check if there are MSI installments linked
    const linkedMsi = await prisma.transaction.findMany({
      where: {
        installmentPurchaseId: { not: null },
        date: transaction.date,
        destinationAccountId: transaction.destinationAccountId
      },
      include: { installmentPurchase: true }
    });

    await prisma.$transaction(async (tx) => {
      // 1. Revert account balances
      if (transaction.accountId) {
        // Return money to source account
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } }
        });
      }

      if (transaction.destinationAccountId) {
        // Increase debt back on credit card (payment is reversed)
        await tx.account.update({
          where: { id: transaction.destinationAccountId },
          data: { balance: { increment: transaction.amount } }  // INCREMENT = Increase debt back
        });
      }

      // 2. Soft delete the transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() }
      });

      // 3. Revert MSI tracking if applicable
      // Note: This is a simplified version - in a real scenario you'd need
      // to parse the description or have a more robust linking mechanism
    });

    res.json({
      success: true,
      message: 'Pago revertido exitosamente',
      amountReverted: transaction.amount
    });
  } catch (error) {
    console.error('Error reverting statement payment:', error);
    res.status(500).json({ error: 'Failed to revert payment' });
  }
};
