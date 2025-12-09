import express from 'express';
import prisma from '../services/database';
import { Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

import { createTransactionAndAdjustBalances, updateAccountBalances } from '../services/transactions';
import { processRecurringTransactions } from '../services/recurring';
import { processInstallmentPurchases } from '../services/installments';

const router = express.Router();

// Middleware to protect all transaction routes
router.use(authMiddleware);

// Get all transactions for the logged-in user
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    // Process any due recurring transactions and installments first
    await processRecurringTransactions(userId);
    await processInstallmentPurchases(userId);

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { category: true, account: true },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: 'Failed to retrieve transactions.' });
  }
});

// Create a new transaction
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { amount, description, date, type, categoryId, accountId, destinationAccountId, installmentPurchaseId } = req.body || {};

  // Validate common required fields
  if (!amount || !date || !type || !accountId) {
    return res.status(400).json({ message: 'Missing required fields: amount, date, type, accountId.' });
  }

  // Validate categoryId for non-transfer transactions
  if (type !== 'transfer' && !categoryId) {
    return res.status(400).json({ message: 'Missing required field: categoryId for income/expense transactions.' });
  }

  // Validate destinationAccountId for transfer transactions
  if (type === 'transfer' && !destinationAccountId) {
    return res.status(400).json({ message: 'Missing required field: destinationAccountId for transfer transactions.' });
  }

  // Prevent transfer to the same account
  if (type === 'transfer' && accountId === destinationAccountId) {
    return res.status(400).json({ message: 'Source and destination accounts cannot be the same.' });
  }

  try {
    const newTransaction = await prisma.$transaction(async (tx: any) => {
      return await createTransactionAndAdjustBalances(tx, {
        amount: parseFloat(amount),
        description: description || 'Transaction',
        date: new Date(date),
        type,
        userId,
        accountId,
        categoryId,
        destinationAccountId,
        installmentPurchaseId,
      });
    });

    res.status(201).json(newTransaction);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Failed to create transaction.' });
  }
});


// Get a single transaction by ID
router.get('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve transaction.' });
  }
});


// Update a transaction
router.put('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedTransaction = await prisma.$transaction(async (tx: any) => {
      const originalTx = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, destinationAccount: true },
      });

      if (!originalTx) {
        throw new Error('Transacción no encontrada.');
      }

      // --- Validations (Moved to top for early exit) ---
      if (originalTx.installmentPurchaseId) {
        const parentInstallment = await tx.installmentPurchase.findUnique({ where: { id: originalTx.installmentPurchaseId } });
        // Strict Block: If settled, NO EDITING allowed. Force Delete -> Recreate.
        if (parentInstallment && (parentInstallment.totalAmount - parentInstallment.paidAmount) <= 0.05) {
          throw new Error('No puedes editar pagos de un plan MSI ya liquidado. Para corregirlo, elimina este pago y crea uno nuevo.');
        }
        if (originalTx.type === 'expense') {
          throw new Error('No puedes editar la compra inicial de MSI. Edita el plan de pagos en la sección "Meses Sin Intereses".');
        }
      }

      // --- Step 1: Revert original transaction's impact on account balances ---
      if (originalTx.type === 'income') {
        await tx.account.update({ where: { id: originalTx.accountId }, data: { balance: { decrement: originalTx.amount } } });
      } else if (originalTx.type === 'expense') {
        await tx.account.update({ where: { id: originalTx.accountId }, data: { balance: { increment: originalTx.amount } } });
      } else if (originalTx.type === 'transfer') {
        await tx.account.update({ where: { id: originalTx.accountId }, data: { balance: { increment: originalTx.amount } } }); // Bring money back to source
        await tx.account.update({ where: { id: originalTx.destinationAccountId }, data: { balance: { decrement: originalTx.amount } } }); // Remove money from destination
      }

      // --- Step 2: Revert original transaction's impact on InstallmentPurchase (if it was an MSI payment) ---
      if (originalTx.installmentPurchaseId && (originalTx.type === 'income' || originalTx.type === 'transfer')) { // Include transfers!
        const installment = await tx.installmentPurchase.findUnique({ where: { id: originalTx.installmentPurchaseId } });
        if (installment) {
          const installmentsToRevert = Math.floor(originalTx.amount / installment.monthlyPayment);
          await tx.installmentPurchase.update({
            where: { id: originalTx.installmentPurchaseId },
            data: {
              paidAmount: { decrement: originalTx.amount },
              paidInstallments: { decrement: installmentsToRevert },
            },
          });
        }
      }

      // --- Step 3: Update the transaction record itself ---
      const finalAmount = parseFloat(data.amount);
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          amount: finalAmount,
          description: data.description ?? originalTx.description,
          date: new Date(data.date ?? originalTx.date),
          type: data.type ?? originalTx.type,
          categoryId: data.categoryId ?? originalTx.categoryId,
          accountId: data.accountId ?? originalTx.accountId,
          destinationAccountId: data.destinationAccountId ?? originalTx.destinationAccountId,
          installmentPurchaseId: data.installmentPurchaseId ?? originalTx.installmentPurchaseId,
        },
        include: { account: true, destinationAccount: true }, // Include for re-applying balances
      });

      // --- Step 4: Apply new transaction's impact on account balances ---
      // Using updateAccountBalances to specificially adjust balances WITHOUT creating a new transaction record.
      await updateAccountBalances(tx, { ...updatedTx, userId });

      // --- Step 5: Re-apply new transaction's impact on InstallmentPurchase (if it's an MSI payment) ---
      if (updatedTx.installmentPurchaseId && (updatedTx.type === 'income' || updatedTx.type === 'transfer')) { // Include transfers!
        const installment = await tx.installmentPurchase.findUnique({ where: { id: updatedTx.installmentPurchaseId } });
        if (!installment) throw new Error('Plan de MSI no encontrado para re-aplicar pago.');

        const remaining = installment.totalAmount - installment.paidAmount;
        // Strict validation: Cannot overpay what's remaining
        if (updatedTx.amount > remaining + 0.01) { // Allow for small floating point differences
          throw new Error(`El monto ($${updatedTx.amount.toFixed(2)}) excede el saldo restante de la compra ($${remaining.toFixed(2)}).`);
        }

        const installmentsToAdd = Math.floor(updatedTx.amount / installment.monthlyPayment);
        await tx.installmentPurchase.update({
          where: { id: updatedTx.installmentPurchaseId },
          data: {
            paidAmount: { increment: updatedTx.amount },
            paidInstallments: { increment: installmentsToAdd },
          },
        });
      }

      return updatedTx;
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    res.json(updatedTransaction);
  } catch (error: any) {
    console.error("Failed to update transaction:", error.message);
    res.status(400).json({ message: error.message || 'Failed to update transaction.' });
  }
});

// Delete a transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, destinationAccount: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found or you do not have permission to delete it.');
      }

      // Point 7 Extension: Block deleting Initial MSI Purchase directly
      if (transaction.installmentPurchaseId) {
        if (transaction.type === 'expense') {
          throw new Error('No puedes eliminar la compra inicial de MSI directamente. Debes eliminar el plan completo en la sección de "Meses Sin Intereses".');
        }
        // Deleting payments IS allowed to enable error correction ("un-settle" flow).
      }

      // BETTER STRATEGY: Allow deleting payments even if settled.
      // This allows correcting the last payment if it was a mistake.
      // The reversion logic will correctly update paidAmount and "un-settle" the plan.


      const { account, destinationAccount, amount, type, installmentPurchaseId } = transaction;

      // Revert balances for the original transaction
      if (account) {
        if (type === 'income') {
          // Income on Debit: Balance +, Revert -. 
          // Income on Credit (Payment): Balance - (Debt down), Revert + (Debt up).
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          }
        } else if (type === 'expense') {
          // Expense on Debit: Balance -, Revert +.
          // Expense on Credit: Balance + (Debt up), Revert - (Debt down).
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          }
        } else if (type === 'transfer') {
          // Transfer Source: Usually Debit (-). Revert (+).
          // If Source is Credit (Cash Advance?): Balance + (Debt). Revert -. 
          // Assuming Source behaves as Debit-like (Funds leave). 
          // If Source is Credit, funds leaving = Debt increase. Revert = Debt decrease.
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          }

          // Transfer Destination
          if (destinationAccount) {
            if (destinationAccount.type === 'CREDIT') {
              // Dest is Credit (Payment): Balance - (Debt down). Revert + (Debt up).
              await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { increment: amount } } });
            } else {
              // Dest is Debit: Balance +. Revert -.
              await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { decrement: amount } } });
            }
          }
        }
      }

      // Handle InstallmentPurchase updates for payments (INCOME or TRANSFER)
      if (installmentPurchaseId && (type === 'income' || type === 'transfer')) {
        const installment = await tx.installmentPurchase.findUnique({ where: { id: installmentPurchaseId } });
        if (installment) {
          const installmentsPaidC = Math.floor(amount / installment.monthlyPayment);
          await tx.installmentPurchase.update({
            where: { id: installmentPurchaseId },
            data: {
              paidAmount: { decrement: amount },
              paidInstallments: { decrement: installmentsPaidC },
            },
          });
        }
      } else if (installmentPurchaseId && type === 'expense') { // Deleting the initial MSI purchase
        // Unlink any other transactions (payments) from this installment plan
        await tx.transaction.updateMany({
          where: { installmentPurchaseId: installmentPurchaseId, id: { not: id } },
          data: { installmentPurchaseId: null },
        });
        // Delete the InstallmentPurchase itself
        await tx.installmentPurchase.delete({
          where: { id: installmentPurchaseId },
        });
      }

      // Delete the transaction record
      await tx.transaction.delete({
        where: { id },
      });
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("Failed to delete transaction:", error.message);
    res.status(400).json({ message: error.message || 'Failed to delete transaction.' });
  }
});


export default router;
