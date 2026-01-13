import { Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import prisma from '../services/database';
import { AuthRequest } from '../middleware/auth';
import { createTransactionAndAdjustBalances } from '../services/transactions';

// ============ GOALS CONTROLLER ============

/**
 * Get all savings goals for the user
 * @route GET /api/goals
 */
export const getGoals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
          take: 5
        }
      }
    });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Error fetching goals' });
  }
};

/**
 * Create a new savings goal
 * @route POST /api/goals
 */
export const createGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      name,
      targetAmount,
      currentAmount,
      deadline,
      icon,
      color,
      priority
    } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        deadline: deadline ? new Date(deadline) : null,
        icon: icon || 'savings',
        color: color || '#10B981',
        priority: priority ? parseInt(priority) : 1
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Error creating goal' });
  }
};

/**
 * Add contribution to a goal
 * @route POST /api/goals/:id/contribute
 */
export const addContribution = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { amount, date, notes, sourceAccountId } = req.body;

    if (!amount || !sourceAccountId) {
      return res.status(400).json({ message: 'Amount and Source Account are required' });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Verify Goal exists
      const goal = await tx.savingsGoal.findUnique({ where: { id } });
      if (!goal || goal.userId !== userId) throw new Error('Goal not found');

      // 2. Find/Create "Ahorro" category
      let category = await tx.category.findFirst({
        where: { userId, name: { contains: 'Ahorro', mode: 'insensitive' } }
      });

      if (!category) {
        category = await tx.category.create({
          data: {
            userId,
            name: 'Ahorro',
            icon: 'savings',
            color: '#10B981',
            type: 'expense',
            budgetType: 'SAVINGS'
          }
        });
      }

      // 3. Create Expense Transaction (Deduct from Source)
      // This handles validation and balance deduction
      const transaction = await createTransactionAndAdjustBalances(tx, {
        amount: parseFloat(amount),
        description: `Ahorro: ${goal.name}`,
        date: new Date(date || new Date()),
        type: 'expense',
        userId,
        accountId: sourceAccountId,
        categoryId: category.id
      });

      // 4. Create Contribution Record
      const contribution = await tx.savingsContribution.create({
        data: {
          amount: parseFloat(amount),
          date: new Date(date || new Date()),
          notes,
          savingsGoalId: goal.id,
          transactionId: transaction.id
        }
      });

      // 5. Update Goal Amount
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: { increment: parseFloat(amount) }
        }
      });

      return { contribution, goal: updatedGoal };
    });

    res.json(result);

  } catch (error: any) {
    console.error('Error adding contribution:', error);
    res.status(500).json({ message: error.message || 'Error adding contribution' });
  }
};

/**
 * Update a goal
 * @route PUT /api/goals/:id
 */
export const updateGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      name,
      targetAmount,
      deadline,
      icon,
      color,
      priority,
      status
    } = req.body;

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name,
        targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
        icon,
        color,
        priority: priority ? parseInt(priority) : undefined,
        status
      }
    });

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: error || 'Error updating goal' });
  }
};

/**
 * Delete a goal
 * @route DELETE /api/goals/:id
 */
export const deleteGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if we need to revert contributions? 
    // Usually deleting a goal shouldn't refund money automatically unless requested.
    // Ideally, the money was "spent" into the goal. If deleted, maybe it should become "Cash" again?
    // For now, let's just delete the goal record. The transactions remain as "Expenses" (Valid historical record).
    // User might want to "Withdraw" funds first if they want the money back.

    await prisma.savingsGoal.delete({
      where: { id }
    });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Error deleting goal' });
  }
};

/**
 * Withdraw from goal (Liquidate to account)
 * @route POST /api/goals/:id/withdraw
 */
export const withdrawFromGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { amount, targetAccountId } = req.body; // targetAccount = where money goes

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!targetAccountId) return res.status(400).json({ message: 'Target Account required' });

    const result = await prisma.$transaction(async (tx: any) => {
      const goal = await tx.savingsGoal.findUnique({ where: { id } });
      if (!goal) throw new Error('Goal not found');

      const withdrawAmount = parseFloat(amount);
      if (goal.currentAmount < withdrawAmount) {
        throw new Error('Insufficient funds in goal');
      }

      // 1. Create Income Transaction (Money coming back to account)
      // Or Transfer? Since Goal is not an Account, "Income" is safer to increase Balance.
      // Category? "Ahorro" (Income type)
      let category = await tx.category.findFirst({
        where: { userId, name: { contains: 'Ahorro', mode: 'insensitive' }, type: 'income' }
      });

      if (!category) {
        category = await tx.category.create({
          data: { userId, name: 'Retiro Ahorro', icon: 'savings', color: '#10B981', type: 'income' }
        });
      }

      await createTransactionAndAdjustBalances(tx, {
        amount: withdrawAmount,
        description: `Retiro Meta: ${goal.name}`,
        date: new Date(),
        type: 'income',
        userId,
        accountId: targetAccountId,
        categoryId: category.id
      });

      // 2. Update Goal
      const updatedGoal = await tx.savingsGoal.update({
        where: { id },
        data: { currentAmount: { decrement: withdrawAmount } }
      });

      return updatedGoal;
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error withdrawing:', error);
    res.status(500).json({ message: error.message });
  }
};
