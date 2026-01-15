import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import prisma from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { createTransactionAndAdjustBalances } from '../services/transactions';

// ============ INVESTMENTS CONTROLLER ============

/**
 * Get all investments for the user
 * @route GET /api/investments
 */
export const getInvestments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(investments);
  } catch (error) {
    console.error('Error fetching investments:', error);
    res.status(500).json({ message: 'Error fetching investments' });
  }
};

/**
 * Get a single investment by ID
 * @route GET /api/investments/:id
 */
export const getInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const investment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!investment || investment.userId !== userId) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    res.json(investment);
  } catch (error) {
    console.error('Error fetching investment:', error);
    res.status(500).json({ message: 'Error fetching investment' });
  }
};

/**
 * Create a new investment
 * @route POST /api/investments
 */
export const createInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      name,
      type,
      ticker,
      quantity,
      avgBuyPrice,
      currentPrice,
      currency,
      purchaseDate,
      notes,
      sourceAccountId // New optional field
    } = req.body;

    // Basic validation
    if (!name || !type || quantity === undefined || avgBuyPrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Investment record
      const investment = await tx.investment.create({
        data: {
          userId,
          name,
          type,
          ticker,
          quantity: parseFloat(quantity),
          avgBuyPrice: parseFloat(avgBuyPrice),
          currentPrice: currentPrice ? parseFloat(currentPrice) : parseFloat(avgBuyPrice),
          currency: currency || 'MXN',
          purchaseDate: new Date(purchaseDate),
          lastPriceUpdate: new Date(),
          notes
        },
      });

      // 2. If a source account is selected, create an Expense Transaction
      if (sourceAccountId) {
        const totalAmount = parseFloat(quantity) * parseFloat(avgBuyPrice);

        // Find "Inversiones" category or create/use default
        let category = await tx.category.findFirst({
          where: { userId, name: { contains: 'Inversiones', mode: 'insensitive' } }
        });

        // Fallback to "Ahorros" if exists, or create new "Inversiones"
        if (!category) {
          // Try to create it if not exists
          // For now, let's just create one on the fly or fail gracefully?
          // Best effort: search for generic "Savings" or create "Inversiones"
          category = await tx.category.create({
            data: {
              userId,
              name: 'Inversiones',
              icon: 'trending_up',
              color: '#10B981',
              type: 'expense',
              budgetType: 'SAVINGS'
            }
          });
        }

        await createTransactionAndAdjustBalances(tx, {
          amount: totalAmount,
          description: `Inversión: ${name} (${quantity} uni.)`,
          date: new Date(purchaseDate),
          type: 'expense', // Money leaving the account
          userId,
          accountId: sourceAccountId,
          categoryId: category?.id,
          // Note: In strict accounting, this might be a Transfer to an Asset Account.
          // Since Investment is not an Account model yet, Expense is the practical way to deduct funds.
        });
      }

      return investment;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating investment:', error);
    res.status(500).json({ message: error.message || 'Error creating investment' });
  }
};

/**
 * Update an investment
 * @route PUT /api/investments/:id
 */
export const updateInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existingInvestment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existingInvestment || existingInvestment.userId !== userId) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    const {
      name,
      type,
      ticker,
      quantity,
      avgBuyPrice,
      currentPrice,
      currency,
      purchaseDate,
      notes
    } = req.body;

    const updatedInvestment = await prisma.investment.update({
      where: { id },
      data: {
        name,
        type,
        ticker,
        quantity: quantity !== undefined ? parseFloat(quantity) : undefined,
        avgBuyPrice: avgBuyPrice !== undefined ? parseFloat(avgBuyPrice) : undefined,
        currentPrice: currentPrice !== undefined ? parseFloat(currentPrice) : undefined,
        lastPriceUpdate: currentPrice !== undefined ? new Date() : undefined,
        currency,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        notes
      },
    });

    res.json(updatedInvestment);
  } catch (error) {
    console.error('Error updating investment:', error);
    res.status(500).json({ message: 'Error updating investment' });
  }
};

/**
 * Delete an investment
 * @route DELETE /api/investments/:id
 */
export const deleteInvestment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const existingInvestment = await prisma.investment.findUnique({
      where: { id },
    });

    if (!existingInvestment || existingInvestment.userId !== userId) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    await prisma.investment.delete({
      where: { id },
    });

    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('Error deleting investment:', error);
    res.status(500).json({ message: 'Error deleting investment' });
  }
};
