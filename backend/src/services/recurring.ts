import prisma from './database';
import { createTransactionAndAdjustBalances } from './transactions';

export const calculateNextDueDate = (currentDate: Date, frequency: string): Date => {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'biweekly_15_30':
      const day = nextDate.getDate();
      const currentMonth = nextDate.getMonth();
      const currentYear = nextDate.getFullYear();

      if (day < 15) {
        // Si estamos antes del 15, el siguiente es el 15 de este mes
        nextDate.setDate(15);
      } else if (day === 15) {
        // Si es el 15, el siguiente es el último día de este mes
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        nextDate.setDate(lastDayOfMonth);
      } else {
        // Si es después del 15 (fin de mes), el siguiente es el 15 del próximo mes
        // IMPORTANTE: Primero día 15, luego mes siguiente para evitar saltos (e.g. 31 Ene -> 15 Mar)
        nextDate.setDate(15);
        nextDate.setMonth(currentMonth + 1);
      }
      break;
  }
  return nextDate;
};

export const processRecurringTransactions = async (userId: string) => {
  // AUTOMATION DISABLED: We moved to a "Manual Approval" model via the UI.
  // The system no longer auto-creates transactions. The user must click "Pay" in the Financial Planning Widget.
  // This allows for amount adjustments and strict control before money is deducted.

  /* 
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999); 

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    // ... logic preserved in comments ...
  });
  ...
  */
  // No-op
};
