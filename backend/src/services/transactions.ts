import { Prisma, PrismaClient } from '@prisma/client';
import prisma from './database';

export type TransactionInput = {
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense' | 'transfer';
  userId: string;
  accountId: string;
  categoryId?: string | null;
  destinationAccountId?: string | null;
  installmentPurchaseId?: string | null;
  recurringTransactionId?: string | null;
};

/**
 * Validates strictly if an MSI payment exceeds the remaining balance.
 */
export async function validateMSIPayment(tx: any, data: TransactionInput) {
  const { amount, type, installmentPurchaseId, accountId, destinationAccountId } = data;

  if (installmentPurchaseId && (type === 'income' || type === 'transfer')) {
    const installment = await tx.installmentPurchase.findUnique({
      where: { id: installmentPurchaseId },
    });

    if (installment) {
      const targetAccountId = type === 'transfer' ? destinationAccountId : accountId;
      if (installment.accountId === targetAccountId) {
        const remaining = installment.totalAmount - installment.paidAmount;

        // Error if fully paid
        if (remaining <= 0.05) {
          throw new Error('This installment is already fully paid.');
        }

        // Strict Validation: Reject if amount exceeds remaining
        if (amount > remaining + 0.05) {
          throw new Error(`El monto del pago ($${amount.toFixed(2)}) excede el saldo restante de la compra ($${remaining.toFixed(2)}).`);
        }
      }
    }
  }
}

/**
 * Updates the balances of the affected accounts based on the transaction data.
 * Does NOT create a transaction record.
 */
export async function updateAccountBalances(tx: any, data: TransactionInput) {
  const {
    amount,
    type,
    userId,
    accountId,
    destinationAccountId,
  } = data;

  // 1. Fetch source account
  const sourceAccount = await tx.account.findUnique({ where: { id: accountId, userId } });
  if (!sourceAccount) {
    throw new Error('Source account not found.');
  }

  // 2. Handle different transaction types
  if (type === 'transfer') {
    if (!destinationAccountId) {
      throw new Error('Missing destinationAccountId for transfer.');
    }
    if (accountId === destinationAccountId) {
      throw new Error('Source and destination accounts cannot be the same.');
    }

    const destinationAccount = await tx.account.findUnique({ where: { id: destinationAccountId, userId } });
    if (!destinationAccount) {
      throw new Error('Destination account not found.');
    }

    // Validar divisas
    if (sourceAccount.currency !== destinationAccount.currency) {
      throw new Error('Conversión automática de divisas no soportada. Cuentas deben ser de la misma divisa.');
    }

    // Check for sufficient funds in source for non-credit accounts
    if ((sourceAccount.type === 'DEBIT' || sourceAccount.type === 'CASH') && sourceAccount.balance < amount) {
      throw new Error('Fondos insuficientes en la cuenta de origen.');
    }
    // Para pagos a tarjeta de crédito permitimos sobrepagar (saldo a favor)
    // por lo tanto no validamos "amount > destinationAccount.balance" como un fallo restrictivo.

    // Validate source credit account won't go below 0 (can't have money in favor from withdrawing)
    if (sourceAccount.type === 'CREDIT') {
      const newSourceBalance = sourceAccount.balance + amount; // Money leaving credit = debt increases
      // For credit cards, balance represents debt, so it can increase indefinitely (up to credit limit if enforced elsewhere)
      // But we should warn if they're "withdrawing" from a credit card (cash advance scenario)
      // This is actually valid for cash advances, so we'll allow it but could add a warning
    }

    // Update source account (always decrease for transfer out from DEBIT/CASH, increase debt for CREDIT)
    if (sourceAccount.type === 'CREDIT') {
      // Money leaving a credit card = Cash advance = Debt increases
      await tx.account.update({
        where: { id: sourceAccount.id },
        data: { balance: { increment: amount } },
      });
    } else {
      // Money leaving DEBIT/CASH = Balance decreases
      await tx.account.update({
        where: { id: sourceAccount.id },
        data: { balance: { decrement: amount } },
      });
    }

    // Update destination account
    if (destinationAccount.type === 'CREDIT') {
      // Money arriving to credit card = Payment = Debt decreases
      await tx.account.update({
        where: { id: destinationAccount.id },
        data: { balance: { decrement: amount } },
      });
    } else {
      // Money arriving to DEBIT/CASH = Balance increases
      await tx.account.update({
        where: { id: destinationAccount.id },
        data: { balance: { increment: amount } },
      });
    }
  } else { // 'income' or 'expense'
    // NOTA FIX: Se eliminó la restricción de Income sobre CREDIT.
    // Esto es completamente válido en la vida real para procesar reembolsos / Cashbacks.
    // Un ingreso a una TDC recude su deuda o incrementa el saldo a favor.

    // Check for sufficient funds for expense from non-credit accounts
    if (type === 'expense' && (sourceAccount.type === 'DEBIT' || sourceAccount.type === 'CASH') && sourceAccount.balance < amount) {
      throw new Error('Fondos insuficientes para este gasto.');
    }

    let newBalance;
    if (sourceAccount.type === 'CREDIT') {
      // For CREDIT accounts:
      // - expense = debt increases (balance goes up)
      // - income = debt decreases (balance goes down) - BUT WE BLOCKED THIS ABOVE
      newBalance = type === 'expense' ? sourceAccount.balance + amount : sourceAccount.balance - amount;
      // Ya no bloqueamos 'newBalance < 0'. Si baja de 0 es saldo a favor y es legal en el banco.
    } else { // DEBIT or CASH
      // For DEBIT/CASH accounts:
      // - expense = balance decreases
      // - income = balance increases
      newBalance = type === 'expense' ? sourceAccount.balance - amount : sourceAccount.balance + amount;

      // Validate DEBIT/CASH accounts won't go negative
      if (newBalance < 0) {
        throw new Error('Fondos insuficientes. Esta transacción dejaría la cuenta en negativo.');
      }
    }

    await tx.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }
}

import { addMonths } from 'date-fns';

/**
 * Updates the MSI progress if the transaction is a payment.
 */
export async function updateInstallmentProgress(tx: any, data: TransactionInput) {
  const { amount, type, installmentPurchaseId, accountId, destinationAccountId } = data;

  if (installmentPurchaseId && (type === 'income' || type === 'transfer')) {
    const installment = await tx.installmentPurchase.findUnique({
      where: { id: installmentPurchaseId },
    });

    if (installment) {
      const targetAccountId = type === 'transfer' ? destinationAccountId : accountId;
      if (installment.accountId === targetAccountId) {
        // Calculate installments count based on the applied amount
        const newInstallmentsPaid = Math.floor(amount / installment.monthlyPayment);

        await tx.installmentPurchase.update({
          where: { id: installment.id },
          data: {
            paidAmount: { increment: amount },
            paidInstallments: { increment: newInstallmentsPaid },
          }
        });
      }
    }
  }
}

/**
 * Creates a transaction and updates the balances (Standard Flow).
 * Composes the separated functions.
 */
export async function createTransactionAndAdjustBalances(
  tx: any,
  data: TransactionInput
) {
  // 1. Validation
  await validateMSIPayment(tx, data);

  // 2. Adjust Balances
  await updateAccountBalances(tx, data);

  // 3. Create the transaction record
  const createdTx = await tx.transaction.create({
    data: {
      amount: data.amount,
      description: data.description,
      date: data.date,
      type: data.type,
      userId: data.userId,
      accountId: data.accountId,
      categoryId: data.type === 'transfer' ? null : data.categoryId,
      destinationAccountId: data.type === 'transfer' ? data.destinationAccountId : null,
      installmentPurchaseId: data.installmentPurchaseId,
      recurringTransactionId: data.recurringTransactionId,
    },
    include: { category: true, account: true, destinationAccount: true },
  });

  // 4. Update MSI
  await updateInstallmentProgress(tx, data);

  return createdTx;
}
