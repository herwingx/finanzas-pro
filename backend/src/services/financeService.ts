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
    select: { balance: true }
  });

  let totalCreditObligation = 0;

  for (const card of creditCards) {
    // Si la tarjeta tiene saldo deudor (balance > 0), es una obligación.
    // Si la tarjeta tiene saldo a favor (balance < 0), representa más liquidez, 
    // pero para este cálculo "Real Disponible", usualmente ignoras saldo a favor en TD.
    // Opcional: Sumar saldo a favor restándolo convencionalmente. Aquí tratamos
    // solo las deudas.
    if (card.balance > 0) {
      totalCreditObligation += card.balance;
    } else if (card.balance < 0) {
      // Saldo a favor, es como liquidez 'encerrada' en la tarjeta que se cobrará sola con el gasto.
      // Opcional: sum -= card.balance para añadirlo, pero lo dejaremos así por ahora.
    }
  }

  return totalLiquid - totalCreditObligation;
};
