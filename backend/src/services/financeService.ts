import prisma from './database';
import { AccountType, StatementStatus } from '@prisma/client';

/**
 * Calculates the "Real Available Balance" for a user.
 * Formula: (Liquid Assets) - (Credit Card Obligations at Cutoff)
 * 
 * Liquid Assets: CASH + DEBIT accounts.
 * Credit Card Obligations: Sum of 'totalDue' - 'paidAmount' from the latest active Statement.
 * Excludes future MSI or spends after the cutoff.
 */
export const calculateRealAvailableBalance = async (userId: string): Promise<number> => {
  // 1. Get Liquid Assets (Cash + Debit)
  const liquidAccounts = await prisma.account.findMany({
    where: {
      userId,
      type: { in: [AccountType.CASH, AccountType.DEBIT] },
      isArchived: false,
    },
    select: { balance: true }
  });

  const totalLiquid = liquidAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  // 2. Get Credit Card Obligations
  const creditCards = await prisma.account.findMany({
    where: {
      userId,
      type: AccountType.CREDIT,
      isArchived: false
    },
    select: { id: true }
  });

  let totalCreditObligation = 0;

  for (const card of creditCards) {
    // Buscar el último estado de cuenta exigible (Pendiente, Parcial o Vencido)
    const statement = await prisma.creditCardStatement.findFirst({
      where: {
        accountId: card.id,
        status: { in: [StatementStatus.PENDING, StatementStatus.PARTIAL, StatementStatus.OVERDUE] }
      },
      orderBy: { cycleEnd: 'desc' }, // El más reciente
    });

    if (statement) {
      // Lo que falta por pagar del corte
      const remaining = statement.totalDue - (statement.paidAmount || 0);
      if (remaining > 0) {
        totalCreditObligation += remaining;
      }
    }
    // Nota: Si no hay statement (ej. compraste ayer pero no ha cortado), 
    // bajo la lógica de "Corte Actual", tu obligación exigible es 0.
    // Esto alinea con la lógica de "Cash Flow" vs "Net Worth".
  }

  return totalLiquid - totalCreditObligation;
};
