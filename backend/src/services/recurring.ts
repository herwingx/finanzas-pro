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
      if (day < 15) {
        // Si estamos antes del 15, el siguiente es el 15 de este mes
        nextDate.setDate(15);
      } else if (day === 15) {
        // Si es el 15, el siguiente es el último día del mes
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(0); // Último día del mes actual
      } else {
        // Si es después del 15 (o fin de mes), el siguiente es el 15 del próximo mes
        nextDate.setDate(1); // Primero vamos al 1 del siguiente mes para evitar problemas con meses cortos
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(15);
      }
      break;
  }
  return nextDate;
};

export const processRecurringTransactions = async (userId: string) => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999); // Final del día de hoy

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      active: true,
      nextDueDate: {
        lte: endOfToday, // Menor o igual al final de hoy
      },
    },
  });

  for (const rt of recurringTransactions) {
    await prisma.$transaction(async (tx) => {
      // 1. Create the transaction and adjust balances
      await createTransactionAndAdjustBalances(tx, {
        amount: rt.amount,
        description: rt.description,
        date: new Date(),
        type: rt.type as 'income' | 'expense',
        userId: rt.userId,
        accountId: rt.accountId,
        categoryId: rt.categoryId,
      });

      // 2. Calculate the next due date
      const nextDate = calculateNextDueDate(rt.nextDueDate, rt.frequency);

      // 3. Update the recurring transaction
      await tx.recurringTransaction.update({
        where: { id: rt.id },
        data: {
          lastRun: new Date(),
          nextDueDate: nextDate,
        },
      });
    });
  }
};
