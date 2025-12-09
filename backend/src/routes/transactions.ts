import express from 'express';
import prisma from '../services/database';
import { Prisma } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

import { createTransactionAndAdjustBalances } from '../services/transactions';
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
  const { amount, description, date, type, categoryId, accountId, destinationAccountId } = req.body || {};

  if (!amount && !description && !date && !type && !categoryId && !accountId && !destinationAccountId) {
    return res.status(400).json({ message: 'No fields provided for update.' });
  }

  // Basic validation for transfers
  if (type === 'transfer' && !destinationAccountId) {
    return res.status(400).json({ message: 'destinationAccountId is required for transfer type.' });
  }
  if (type === 'transfer' && accountId === destinationAccountId) {
    return res.status(400).json({ message: 'Source and destination accounts cannot be the same.' });
  }

  try {
    const updatedTransaction = await prisma.$transaction(async (tx: any) => {
      // 1. Find the original transaction and its accounts
      const originalTx = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, destinationAccount: true },
      });

      if (!originalTx) {
        throw new Error('Transaction not found or you do not have permission to update it.');
      }

      // 1.1 Block editing of Initial MSI Purchase (Point 6)
      if (originalTx.installmentPurchaseId && originalTx.type === 'expense') {
        throw new Error('No puedes editar la compra inicial de MSI directamente. Por favor, edita el plan de pagos en la sección de "Meses Sin Intereses".');
      }

      // 1.2 Revert MSI Progress if this was a payment (Point 3)
      let msiPaymentReverted = false;
      let relatedInstallment: any = null;

      if (originalTx.installmentPurchaseId && (originalTx.type === 'income' || originalTx.type === 'transfer')) {
        relatedInstallment = await tx.installmentPurchase.findUnique({ where: { id: originalTx.installmentPurchaseId } });
        if (relatedInstallment) {
          const installmentsToRevert = Math.floor(originalTx.amount / relatedInstallment.monthlyPayment);
          await tx.installmentPurchase.update({
            where: { id: relatedInstallment.id },
            data: {
              paidAmount: { decrement: originalTx.amount },
              paidInstallments: { decrement: installmentsToRevert }
            }
          });
          msiPaymentReverted = true;
        }
      }

      const oldAmount = originalTx.amount;
      const oldType = originalTx.type;
      const oldSourceAccountId = originalTx.accountId;
      const oldDestinationAccountId = originalTx.destinationAccountId;

      // 2. Revert the balances of the original transaction
      if (oldType === 'transfer') {
        // Revert source account (increment its balance by oldAmount)
        await tx.account.update({
          where: { id: oldSourceAccountId! },
          data: { balance: { increment: oldAmount } },
        });

        // Revert destination account
        const oldDestinationAccount = await tx.account.findUnique({ where: { id: oldDestinationAccountId! } });
        if (!oldDestinationAccount) throw new Error('Original destination account not found.');
        const incrementOrDecrement = (oldDestinationAccount.type === 'DEBIT' || oldDestinationAccount.type === 'CASH') ? 'decrement' : 'increment';
        await tx.account.update({
          where: { id: oldDestinationAccountId! },
          data: { balance: { [incrementOrDecrement]: oldAmount } },
        });

      } else { // Revert for old 'income' or 'expense'
        const originalAccount = await tx.account.findUnique({ where: { id: oldSourceAccountId! } });
        if (!originalAccount) throw new Error('Original account not found.');

        let balanceToRevert;
        if (originalAccount.type === 'CREDIT') {
          balanceToRevert = oldType === 'expense' ? originalAccount.balance - oldAmount : originalAccount.balance + oldAmount;
        } else { // DEBIT or CASH
          balanceToRevert = oldType === 'expense' ? originalAccount.balance + oldAmount : originalAccount.balance - oldAmount;
        }
        await tx.account.update({
          where: { id: oldSourceAccountId! },
          data: { balance: balanceToRevert },
        });
      }

      // 3. Update the transaction record itself
      const finalAmount = amount ? parseFloat(amount) : originalTx.amount;
      const finalType = type ?? originalTx.type;
      const finalSourceAccountId = accountId ?? originalTx.accountId;
      const finalDestinationAccountId = destinationAccountId ?? originalTx.destinationAccountId;
      const finalCategoryId = categoryId ?? originalTx.categoryId;

      // Fetch new/updated accounts to apply new balance logic
      const newSourceAccount = await tx.account.findUnique({ where: { id: finalSourceAccountId! } });
      if (!newSourceAccount) throw new Error('New source account not found.');

      let newDestinationAccount: any = null;
      if (finalType === 'transfer') {
        newDestinationAccount = await tx.account.findUnique({ where: { id: finalDestinationAccountId! } });
        if (!newDestinationAccount) throw new Error('New destination account not found.');

        // Additional validation for transfers
        if ((newSourceAccount.type === 'DEBIT' || newSourceAccount.type === 'CASH') && newSourceAccount.balance < finalAmount) {
          throw new Error('Insufficient funds in new source account.');
        }
        if (newDestinationAccount.type === 'CREDIT' && finalAmount > newDestinationAccount.balance) {
          throw new Error('Cannot transfer more than the current debt to a credit card.');
        }
      }

      const txData: any = {
        amount: finalAmount,
        description: description ?? originalTx.description,
        date: date ? new Date(date) : originalTx.date,
        type: finalType,
        categoryId: finalCategoryId, // Keep categoryId if it's not a transfer, set to null otherwise
        accountId: finalSourceAccountId,
        destinationAccountId: finalDestinationAccountId, // Set to null if not a transfer
      };

      if (finalType === 'transfer') {
        txData.categoryId = null; // Transfers don't have categories
      } else if (finalType !== 'transfer' && !txData.categoryId) {
        throw new Error('Category ID is required for income/expense transactions.');
      }

      const updatedTx = await tx.transaction.update({
        where: { id },
        data: txData,
        include: { account: true, destinationAccount: true, category: true },
      });

      // 4. Apply the new balances based on the updated transaction
      if (updatedTx.type === 'transfer') {
        // Apply new source balance (decrement by new amount)
        await tx.account.update({
          where: { id: newSourceAccount.id },
          data: { balance: { decrement: finalAmount } },
        });

        // Apply new destination balance
        const incrementOrDecrement = (newDestinationAccount.type === 'DEBIT' || newDestinationAccount.type === 'CASH') ? 'increment' : 'decrement';
        await tx.account.update({
          where: { id: newDestinationAccount.id },
          data: { balance: { [incrementOrDecrement]: finalAmount } },
        });

      } else { // Apply for new 'income' or 'expense'
        let newBalance;
        if (newSourceAccount.type === 'CREDIT') {
          newBalance = updatedTx.type === 'expense'
            ? newSourceAccount.balance + finalAmount
            : newSourceAccount.balance - finalAmount;
        } else { // DEBIT or CASH
          newBalance = updatedTx.type === 'expense'
            ? newSourceAccount.balance - finalAmount
            : newSourceAccount.balance + finalAmount;
        }

        await tx.account.update({
          where: { id: newSourceAccount.id },
          data: { balance: newBalance },
        });
      }

      // 5. Re-apply MSI Progress (Point 3 & 1)
      if (msiPaymentReverted && relatedInstallment) {
        // Fetch the *current* state of the installment (after revert) to validate
        const currentInstallment = await tx.installmentPurchase.findUnique({ where: { id: relatedInstallment.id } });

        if (currentInstallment) {
          const remaining = currentInstallment.totalAmount - currentInstallment.paidAmount;

          // Strict Validation: Cannot overpay what's remaining
          if (finalAmount > remaining + 0.05) {
            throw new Error(`El nuevo monto ($${finalAmount.toFixed(2)}) excede el saldo restante de la compra ($${remaining.toFixed(2)}).`);
          }

          const installmentsToAdd = Math.floor(finalAmount / currentInstallment.monthlyPayment);

          const updateData: any = {
            paidAmount: { increment: finalAmount }
          };

          // If this finishes the debt (or close enough), force max installments
          if (finalAmount >= remaining - 0.05) {
            updateData.paidInstallments = currentInstallment.installments;
          } else {
            // Otherwise just increment
            updateData.paidInstallments = { increment: installmentsToAdd };
          }

          await tx.installmentPurchase.update({
            where: { id: currentInstallment.id },
            data: updateData
          });
        }
      }

      return updatedTx;
    });

    res.json(updatedTransaction);
  } catch (error: any) {
    if (error.message.includes('Transaction not found')) {
      return res.status(404).json({ message: error.message });
    }
    console.error("Failed to update transaction:", error);
    res.status(500).json({ message: error.message || 'Failed to update transaction.' });
  }
});

// Delete a transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    await prisma.$transaction(async (tx: any) => {
      // 1. Find the transaction to be deleted, including source and destination accounts
      const transaction = await tx.transaction.findFirst({
        where: { id, userId },
        include: { account: true, destinationAccount: true },
      });

      if (!transaction) {
        throw new Error('Transaction not found or you do not have permission to delete it.');
      }

      const { account, destinationAccount, amount, type, installmentPurchaseId } = transaction;

      // ... (existing balance update logic) ...
      if (type === 'transfer') {
        if (!account || !destinationAccount) {
          throw new Error('Transfer transaction is missing one or both associated accounts.');
        }
        await tx.account.update({
          where: { id: account.id },
          data: { balance: { increment: amount } },
        });

        const incrementOrDecrement = (destinationAccount.type === 'DEBIT' || destinationAccount.type === 'CASH') ? 'decrement' : 'increment';
        await tx.account.update({
          where: { id: destinationAccount.id },
          data: { balance: { [incrementOrDecrement]: amount } },
        });

      } else {
        if (!account) {
          throw new Error('Transaction is missing an associated account.');
        }
        let newBalance;
        if (account.type === 'CREDIT') {
          newBalance = type === 'expense'
            ? account.balance - amount
            : account.balance + amount;
        } else { // DEBIT or CASH
          newBalance = type === 'expense'
            ? account.balance + amount
            : account.balance - amount;
        }

        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });
      }

      // Handle InstallmentPurchase updates
      if (installmentPurchaseId) {
        const installment = await tx.installmentPurchase.findUnique({ where: { id: installmentPurchaseId } });
        if (installment) {
          // Case 1: Deleting a Payment (Income or Transfer)
          if (type === 'income' || type === 'transfer') {
            // Decrement paid amount/installments
            const installmentsPaidC = Math.floor(amount / installment.monthlyPayment);
            await tx.installmentPurchase.update({
              where: { id: installmentPurchaseId },
              data: {
                paidAmount: { decrement: amount },
                paidInstallments: { decrement: installmentsPaidC }
              }
            });
          }
          // Case 2: Deleting the Initial Purchase (Expense)
          else if (type === 'expense') {
            // User Issue 5: "Al eliminar la transaccion de msi no se quita de /installments"
            // If we delete the initial transaction, we should probably delete the InstallmentPurchase too.
            // BUT, we must be careful. deleting InstallmentPurchase might leave OTHER payments orphaned or invalid?
            // The schema says `generatedTransactions` relate to it.
            // If we delete InstallmentPurchase, we might need to cascade delete or untie generated transactions.
            // For now, let's delete the InstallmentPurchase.

            // First, find other transactions linked to this installment (payments)
            // and maybe unlink them? or delete them?
            // Usually, if you delete the Purchase, you probably want to delete the plan.
            // Let's delete it. The schema doesn't strictly enforce cascade on Transaction->Installment, 
            // but Installment has `generatedTransactions`.

            // We need to delete the installment purchase.
            // Note: The generic `delete ` on Transaction below will delete THIS transaction.
            // We need to delete the `InstallmentPurchase` separateley.
            // And deleting InstallmentPurchase might trigger cascading deletes if configured, 
            // or fail if there are other foreign keys.

            // Schema: Transaction.installmentPurchaseId -> InstallmentPurchase.id
            // If we delete InstallmentPurchase, transactions referencing it will fail unless we update them.
            // Let's just unlink other transactions first.

            await tx.transaction.updateMany({
              where: { installmentPurchaseId: installmentPurchaseId, id: { not: id } },
              data: { installmentPurchaseId: null }
            });

            await tx.installmentPurchase.delete({
              where: { id: installmentPurchaseId }
            });
          }
        }
      }

      // 3. Delete the single transaction record
      await tx.transaction.delete({
        where: { id },
      });
    });

    res.status(204).send(); // No content
  } catch (error: any) {
    if (error.message.includes('Transaction not found')) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message || 'Failed to delete transaction.' });
  }
});


export default router;
