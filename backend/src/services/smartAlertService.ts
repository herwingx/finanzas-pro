import prisma from './database';
import { AccountType, StatementStatus } from '@prisma/client';
import { formatDate } from '../utils/dateUtils'; // Assuming exists, otherwise I'll use native Date

/**
 * Smart Alert Service
 * Runs checks to generate proactive insights/notifications.
 */
export class SmartAlertService {

  /**
   * Check for recurring payments or plans due TODAY.
   */
  static async checkDueToday(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Recurring Transactions Due
    const dueRecurring = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        active: true,
        nextDueDate: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    for (const item of dueRecurring) {
      await this.createNotification(userId, {
        type: 'PAYMENT_DUE',
        title: 'Pago Recurrente Vence Hoy',
        body: `${item.description} por $${item.amount} vence hoy.`,
        data: { recurringId: item.id, amount: item.amount }
      });
    }
  }

  /**
   * Check Credit Card Cutoffs and MSI status.
   * Warn 3 days before cutoff.
   */
  static async checkCreditCards(userId: string) {
    const creditCards = await prisma.account.findMany({
      where: { userId, type: AccountType.CREDIT, isArchived: false }
    });

    for (const card of creditCards) {
      if (!card.cutoffDay) continue;

      // Calculate next cutoff date
      const today = new Date();
      const cutoffDate = new Date(today.getFullYear(), today.getMonth(), card.cutoffDay);
      // Handle month wrapping if needed (simple approximation for now)

      const diffTime = cutoffDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 3) {
        // Fetch current estimated due (from unbilled transactions if logic allowed, or just warn)
        // For accurate "Current Balance to Pay", we'd sum transactions since last cutoff.
        // For now, simpler alert:
        await this.createNotification(userId, {
          type: 'CC_CUTOFF_NEAR',
          title: `Corte de ${card.name} en 3 días`,
          body: `Prepárate para el corte de tu tarjeta el día ${card.cutoffDay}.`,
          data: { accountId: card.id }
        });
      }

      // MSI Check (Pending MSI)
      // This might be better as a specialized Insight than a push notification, but checking logic here:
      const statement = await prisma.creditCardStatement.findFirst({
        where: { accountId: card.id, status: StatementStatus.PENDING },
        orderBy: { cycleEnd: 'desc' }
      });

      if (statement && statement.msiAmount > 0 && statement.status === 'PENDING') {
        // Maybe notify if near due date?
      }
    }
  }

  /**
   * Detect anomalies like double transaction.
   * (Pass transaction to this method after creation)
   */
  static async checkDuplicateTransaction(userId: string, amount: number, description: string) {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const possibleDuplicate = await prisma.transaction.findFirst({
      where: {
        userId,
        amount,
        description,
        createdAt: { gte: tenMinutesAgo }
      }
    });

    if (possibleDuplicate) {
      await this.createNotification(userId, {
        type: 'DUPLICATE_WARNING',
        title: '¿Transacción Duplicada?',
        body: `Detectamos una transacción idéntica de $${amount} (${description}) hace menos de 10 min.`,
        data: { transactionId: possibleDuplicate.id }
      });
    }
  }

  // --- Helper ---
  private static async createNotification(userId: string, params: { type: string, title: string, body: string, data?: any }) {
    // Prevent spam: Check if similar notification exists for today (optional optimization)
    // For now, just create.
    await prisma.notification.create({
      data: {
        userId,
        ...params,
        data: params.data ?? {}
      }
    });
  }
}
