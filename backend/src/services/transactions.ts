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

    // Check for sufficient funds in source for non-credit accounts
    if ((sourceAccount.type === 'DEBIT' || sourceAccount.type === 'CASH') && sourceAccount.balance < amount) {
      throw new Error('Insufficient funds in source account.');
    }
    // Special validation for credit card payments: Cannot pay more than the debt.
    if (destinationAccount.type === 'CREDIT' && amount > destinationAccount.balance) {
      throw new Error('Cannot transfer more than the current debt to a credit card.');
    }

    // Update source account (always decrease for transfer out)
    await tx.account.update({
      where: { id: sourceAccount.id },
      data: { balance: { decrement: amount } },
    });

    // Update destination account
    const incrementOrDecrement = (destinationAccount.type === 'DEBIT' || destinationAccount.type === 'CASH') ? 'increment' : 'decrement';
    await tx.account.update({
      where: { id: destinationAccount.id },
      data: { balance: { [incrementOrDecrement]: amount } },
    });
  } else { // 'income' or 'expense'
    // Check for sufficient funds for expense from non-credit accounts
    if (type === 'expense' && (sourceAccount.type === 'DEBIT' || sourceAccount.type === 'CASH') && sourceAccount.balance < amount) {
      throw new Error('Insufficient funds for this expense.');
    }

    let newBalance;
    if (sourceAccount.type === 'CREDIT') {
      newBalance = type === 'expense' ? sourceAccount.balance + amount : sourceAccount.balance - amount;
    } else { // DEBIT or CASH
      newBalance = type === 'expense' ? sourceAccount.balance - amount : sourceAccount.balance + amount;
    }

    await tx.account.update({
      where: { id: accountId },
      data: { balance: newBalance },
    });
  }
}

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
            paidInstallments: { increment: newInstallmentsPaid }
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
    },
    include: { category: true, account: true, destinationAccount: true },
  });

  // 4. Update MSI
  await updateInstallmentProgress(tx, data);

  return createdTx;
}
