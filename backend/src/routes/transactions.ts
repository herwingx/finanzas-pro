import express from 'express';
import prisma from '../services/database';
import { Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { addDays, addMonths, addWeeks, addYears, subMonths } from 'date-fns';

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
    // Process any due recurring transactions first
    await processRecurringTransactions(userId);
    // DISABLED: MSI payments are now fully manual via dedicated widget
    // await processInstallmentPurchases(userId);

    const transactions = await prisma.transaction.findMany({
      where: { userId, deletedAt: null },
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

// IMPORTANT: Specific routes must come BEFORE dynamic routes (/:id)
// Get deleted transactions (for trash/recovery view)
router.get('/deleted', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    const deletedTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: 'desc' },
      include: { category: true, account: true, destinationAccount: true },
    });
    res.json(deletedTransactions);
  } catch (error) {
    console.error("Error fetching deleted transactions:", error);
    res.status(500).json({ message: 'Failed to retrieve deleted transactions.' });
  }
});

// Restore a soft-deleted transaction (UNDO)
router.post('/:id/restore', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId, deletedAt: { not: null } },
        include: { account: true, destinationAccount: true },
      });

      if (!transaction) {
        throw new Error('Deleted transaction not found or you do not have permission to restore it.');
      }

      const { account, destinationAccount, amount, type, installmentPurchaseId, accountId, destinationAccountId, recurringTransactionId, date } = transaction;

      // 1. Validate Account Integrity before restoring
      // If the transaction refers to an account (accountId is present) but the account relation is null,
      // it means the account was physically deleted. We cannot restore balance impact.
      if (accountId && !account) {
        throw new Error('No se puede restaurar: La cuenta asociada ya no existe.');
      }

      // For transfers, validation destination too
      if (type === 'transfer' && destinationAccountId && !destinationAccount) {
        throw new Error('No se puede restaurar: La cuenta destino ya no existe.');
      }

      // Block restoration of initial MSI purchases (expense type with installmentPurchaseId)
      // When MSI is deleted, the entire InstallmentPurchase is removed. Cannot restore without it.
      if (installmentPurchaseId && type === 'expense') {
        const msiPlanExists = await tx.installmentPurchase.findUnique({ where: { id: installmentPurchaseId } });
        if (!msiPlanExists) {
          throw new Error('No se puede restaurar: El plan MSI asociado fue eliminado. Debes crear uno nuevo desde "Meses Sin Intereses".');
        }
      }

      // Re-apply balances (reverse the deletion reversion)
      if (account) {
        if (type === 'income') {
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          }
        } else if (type === 'expense') {
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          }
        } else if (type === 'transfer') {
          if (account.type === 'CREDIT') {
            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
          } else {
            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
          }

          if (destinationAccount) {
            if (destinationAccount.type === 'CREDIT') {
              await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { decrement: amount } } });
            } else {
              await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { increment: amount } } });
            }
          }
        }
      }

      // Re-apply InstallmentPurchase updates for payments
      if (installmentPurchaseId && (type === 'income' || type === 'transfer')) {
        const installment = await tx.installmentPurchase.findUnique({ where: { id: installmentPurchaseId } });
        if (installment) {
          const installmentsPaidC = Math.floor(amount / installment.monthlyPayment);
          await tx.installmentPurchase.update({
            where: { id: installmentPurchaseId },
            data: {
              paidAmount: { increment: amount },
              paidInstallments: { increment: installmentsPaidC },
            },
          });
        }
      }

      // Handle Recurring Transaction Restoration (Re-advance the date)
      // If we restore a payment, we must "push" the recurring rule forward again, 
      // as if we just paid it.
      if (recurringTransactionId) {
        const recurring = await tx.recurringTransaction.findUnique({ where: { id: recurringTransactionId } });
        if (recurring) {
          // We need to calculate the version of the date that comes AFTER this transaction.
          // Since we don't have the sophisticated calculation logic here easily, 
          // we can try to rely on the transaction date + frequency.

          // Simple naive recalculation for now:
          // 1. Take transaction date (which is the due date we just paid)
          // 2. Add frequency

          let nextDate = new Date(date);
          const freq = recurring.frequency;

          if (freq === 'DAILY') nextDate = addDays(nextDate, 1);
          else if (freq === 'WEEKLY') nextDate = addWeeks(nextDate, 1);
          else if (freq === 'BIWEEKLY') nextDate = addWeeks(nextDate, 2);
          else if (freq === 'MONTHLY') nextDate = addMonths(nextDate, 1);
          else if (freq === 'YEARLY') nextDate = addYears(nextDate, 1);
          // lowercase compat
          else if (freq === 'daily') nextDate = addDays(nextDate, 1);
          else if (freq === 'weekly') nextDate = addWeeks(nextDate, 1);
          else if (freq === 'biweekly') nextDate = addWeeks(nextDate, 2);
          else if (freq === 'monthly') nextDate = addMonths(nextDate, 1);

          await tx.recurringTransaction.update({
            where: { id: recurringTransactionId },
            data: { nextDueDate: nextDate }
          });
        }
      }

      // Clear the deletedAt flag to restore the transaction
      await tx.transaction.update({
        where: { id },
        data: { deletedAt: null },
      });
    });

    res.status(200).json({ message: 'Transaction restored successfully.' });
  } catch (error: any) {
    console.error("Failed to restore transaction:", error.message);
    res.status(400).json({ message: error.message || 'Failed to restore transaction.' });
  }
});


// Get a single transaction by ID
router.get('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true, account: true, destinationAccount: true },
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

        // Critical: Check destination account type for correct balance adjustment
        if (originalTx.destinationAccount!.type === 'CREDIT') {
          // For credit cards: increment means INCREASE debt (undo the payment)
          await tx.account.update({ where: { id: originalTx.destinationAccountId }, data: { balance: { increment: originalTx.amount } } });
        } else {
          // For debit/cash: decrement means remove money
          await tx.account.update({ where: { id: originalTx.destinationAccountId }, data: { balance: { decrement: originalTx.amount } } });
        }
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
  const force = req.query.force === 'true';

  try {
    await prisma.$transaction(async (tx: any) => {
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, destinationAccount: true },
      });

      if (!transaction) {
        // If forcing delete, look in deleted
        if (force) {
          const deletedTx = await tx.transaction.findFirst({
            where: { id, userId, deletedAt: { not: null } }
          });
          if (deletedTx) {
            await tx.transaction.delete({ where: { id } });
            return;
          }
        }
        throw new Error('Transaction not found or you do not have permission to delete it.');
      }

      const { account, destinationAccount, amount, type, installmentPurchaseId, recurringTransactionId, date } = transaction;

      // 1b. Handle Recurring Transaction Reversion
      // If this transaction came from a recurring rule, we should reset the recurring rule's 
      // nextDueDate to this transaction's date, so it shows up as "Due" again.
      if (recurringTransactionId && !transaction.deletedAt) { // Only if we are deleting an active transaction
        // Check if recurring transaction still exists
        const recurringExists = await tx.recurringTransaction.findUnique({ where: { id: recurringTransactionId } });
        if (recurringExists) {
          // Reset nextDueDate to match the transaction date we are deleting.
          // This effectively "undoes" the payment in the recurring schedule.
          await tx.recurringTransaction.update({
            where: { id: recurringTransactionId },
            data: { nextDueDate: date }
          });
        }
      }



      // 2. Revert balances logic (ONLY if transaction is active/not already soft-deleted)
      if (!transaction.deletedAt) {
        if (account) {
          if (type === 'income') {
            // ... logic continues ...
            if (account.type === 'CREDIT') {
              await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
            } else {
              await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
            }
          } else if (type === 'expense') {
            if (account.type === 'CREDIT') {
              await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
            } else {
              await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
            }
          } else if (type === 'transfer') {
            if (account.type === 'CREDIT') {
              await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
            } else {
              await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
            }

            if (destinationAccount) {
              if (destinationAccount.type === 'CREDIT') {
                await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { increment: amount } } });
              } else {
                await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { decrement: amount } } });
              }
            }
          }
        }

        // Handle InstallmentPurchase updates
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
        } else if (installmentPurchaseId && type === 'expense') {
          await tx.transaction.updateMany({
            where: { installmentPurchaseId: installmentPurchaseId, id: { not: id } },
            data: { installmentPurchaseId: null },
          });
          await tx.installmentPurchase.delete({ where: { id: installmentPurchaseId } });
        }
      }

      // 3. Perform Delete
      if (force) {
        await tx.transaction.delete({ where: { id } });
      } else {
        await tx.transaction.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error("Failed to delete transaction:", error.message);
    res.status(400).json({ message: error.message || 'Failed to delete transaction.' });
  }
});

export default router;
