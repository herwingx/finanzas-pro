import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

import { processRecurringTransactions } from '../services/recurring';

const router = express.Router();

// Middleware to protect all transaction routes
router.use(authMiddleware);

// Get all transactions for the logged-in user
router.get('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  try {
    // Process any due recurring transactions first
    await processRecurringTransactions(userId);

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: { category: true },
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
  const { amount, description, date, type, categoryId } = req.body || {}; // Provide a default empty object

  if (!amount || !description || !date || !type || !categoryId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        type,
        userId,
        categoryId,
      },
      include: { category: true },
    });
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create transaction.' });
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
  const { amount, description, date, type, categoryId } = req.body || {}; // Provide a default empty object

  if (!amount && !description && !date && !type && !categoryId) {
    return res.status(400).json({ message: 'No fields provided for update.' });
  }

  try {
    const updatedTransaction = await prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        description: description ?? undefined,
        date: date ? new Date(date) : undefined,
        type: type ?? undefined,
        categoryId: categoryId ?? undefined,
      },
    });

    if (updatedTransaction.count === 0) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to update it.' });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });


    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update transaction.' });
  }
});

// Delete a transaction
router.delete('/:id', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  try {
    const deletedTransaction = await prisma.transaction.deleteMany({
      where: { id, userId },
    });

    if (deletedTransaction.count === 0) {
      return res.status(404).json({ message: 'Transaction not found or you do not have permission to delete it.' });
    }

    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction.' });
  }
});


export default router;
