import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// Get all recurring transactions
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { category: true },
    });
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recurring transactions' });
  }
});

// Get a single recurring transaction by ID
router.get('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  try {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found' });
    }
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch recurring transaction' });
  }
});

// Create recurring transaction
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { amount, description, type, frequency, startDate, categoryId, accountId } = req.body || {}; // Provide a default empty object

  if (!amount || !description || !type || !frequency || !startDate || !categoryId || !accountId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const newRecurring = await prisma.recurringTransaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        type,
        frequency,
        startDate: new Date(startDate),
        nextDueDate: new Date(startDate), // First run is on start date
        lastRun: null, // Not run yet
        categoryId,
        accountId,
        userId,
      },
    });
    res.status(201).json(newRecurring);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create recurring transaction' });
  }
});

// Update a recurring transaction
router.put('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { amount, description, type, frequency, startDate, categoryId, accountId } = req.body || {};

  try {
    const updated = await prisma.recurringTransaction.updateMany({
      where: { id, userId },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        description,
        type,
        frequency,
        startDate: startDate ? new Date(startDate) : undefined,
        categoryId,
        accountId,
      },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: 'Transacción recurrente no encontrada o sin permiso para actualizar.' });
    }

    const updatedTx = await prisma.recurringTransaction.findFirst({ where: { id } });
    res.json(updatedTx);

  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la transacción recurrente.' });
  }
});

// Delete recurring transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    await prisma.recurringTransaction.deleteMany({
      where: { id, userId },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete recurring transaction' });
  }
});

// Execute/Pay a recurring transaction manually
router.post('/:id/pay', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { amount, date } = req.body; // Allow overriding amount and date

  try {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }

    const { createTransactionAndAdjustBalances } = require('../services/transactions');
    const { calculateNextDueDate } = require('../services/recurring');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the real transaction
      const newTx = await createTransactionAndAdjustBalances(tx, {
        amount: amount ? parseFloat(amount) : recurring.amount,
        description: recurring.description, // Keep original description or append (Recurrente)?
        date: date ? new Date(date) : new Date(),
        type: recurring.type as 'income' | 'expense',
        userId: recurring.userId,
        accountId: recurring.accountId,
        categoryId: recurring.categoryId,
        recurringTransactionId: recurring.id,
      });

      // 2. Calculate next due date
      // Use the CURRENT nextDueDate as base, or today? 
      // USUALLY: process based on schedule. If due date was Dec 10 and we pay Dec 12, next should be Jan 10.
      const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

      // 3. Update the recurring transaction
      await tx.recurringTransaction.update({
        where: { id: recurring.id },
        data: {
          lastRun: new Date(),
          nextDueDate: nextDate,
        },
      });

      return newTx;
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Failed to pay recurring transaction:", error);
    res.status(500).json({ message: error.message || 'Failed to process recurring payment.' });
  }
});

// Skip/Deffer a recurring transaction (just move date without paying)
router.post('/:id/skip', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });

    if (!recurring) {
      return res.status(404).json({ message: 'Recurring transaction not found.' });
    }

    const { calculateNextDueDate } = require('../services/recurring');
    const nextDate = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);

    await prisma.recurringTransaction.update({
      where: { id: recurring.id },
      data: {
        nextDueDate: nextDate,
      },
    });

    res.status(200).json({ message: 'Skipped successfully', nextDueDate: nextDate });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to skip recurring transaction.' });
  }
});

export default router;
