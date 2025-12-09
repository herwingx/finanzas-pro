import { Prisma, PrismaClient } from '@prisma/client';
import prisma from './database';

type TransactionInput = {
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
 * Creates a transaction and updates the balances of the affected accounts within a Prisma transaction.
 * @param tx - The Prisma transaction client.
 * @param data - The transaction data.
 * @returns The created transaction.
 */
export async function createTransactionAndAdjustBalances(
  tx: any,
  data: TransactionInput
) {
  const {
    amount,
    description,
    date,
    type,
    userId,
    accountId,
    categoryId,
    destinationAccountId,
  } = data;

  // 0. Pre-check InstallmentPurchase for overpayment validation
  let installment = null; // Keep installment variable for later use

  if (data.installmentPurchaseId && (type === 'income' || type === 'transfer')) {
    installment = await tx.installmentPurchase.findUnique({
      where: { id: data.installmentPurchaseId },
    });

    if (installment) {
      const targetAccountId = type === 'transfer' ? destinationAccountId : accountId;
      if (installment.accountId === targetAccountId) {
        const remaining = installment.totalAmount - installment.paidAmount;

        // Error if fully paid
        if (remaining <= 0.05) {
          throw new Error('This installment is already fully paid.');
        }

        // 1. Strict Validation: Reject if amount exceeds remaining (User request: "no se debe poder")
        if (amount > remaining + 0.05) {
          throw new Error(`El monto del pago ($${amount.toFixed(2)}) excede el saldo restante de la compra ($${remaining.toFixed(2)}).`);
        }
      }
    }
  }

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

  // 3. Create the transaction record
  const createdTx = await tx.transaction.create({
    data: {
      amount: amount,
      description,
      date,
      type,
      userId,
      accountId,
      categoryId: type === 'transfer' ? null : categoryId,
      destinationAccountId: type === 'transfer' ? destinationAccountId : null,
      installmentPurchaseId: data.installmentPurchaseId,
    },
    include: { category: true, account: true, destinationAccount: true },
  });

  // 4. Update InstallmentPurchase if this is a payment
  if (data.installmentPurchaseId && (type === 'income' || type === 'transfer')) {
    const installment = await tx.installmentPurchase.findUnique({
      where: { id: data.installmentPurchaseId },
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

  return createdTx;
}
