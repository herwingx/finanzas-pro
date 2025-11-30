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

// Create recurring transaction
router.post('/', async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const { amount, description, type, frequency, startDate, categoryId } = req.body || {}; // Provide a default empty object

  if (!amount || !description || !type || !frequency || !startDate || !categoryId) {
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
    const { amount, description, type, frequency, startDate, categoryId } = req.body || {};

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

export default router;
