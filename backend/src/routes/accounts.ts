import express from 'express';
import prisma from '../services/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// Get all accounts for the authenticated user
router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const accounts = await prisma.account.findMany({
            where: { userId },
            include: {
                transactions: true, // Optionally include transactions associated with the account
            }
        });
        res.json(accounts);
    } catch (error) {
        console.error("Failed to retrieve accounts:", error);
        res.status(500).json({ message: 'Failed to retrieve accounts.' });
    }
});

// Create a new account
router.post('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { name, type, balance, creditLimit, cutoffDay, paymentDay } = req.body || {};

    if (!name || !type || balance === undefined) {
        return res.status(400).json({ message: 'Missing required fields: name, type, and balance are required.' });
    }

    // Basic validation for account type
    const validTypes = ['DEBIT', 'CREDIT', 'CASH'];
    if (!validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({ message: `Invalid account type. Must be one of: ${validTypes.join(', ')}` });
    }

    try {
        const newAccount = await prisma.account.create({
            data: {
                name,
                type: type.toUpperCase(),
                balance,
                creditLimit: type.toUpperCase() === 'CREDIT' ? creditLimit : null,
                cutoffDay: type.toUpperCase() === 'CREDIT' ? cutoffDay : null,
                paymentDay: type.toUpperCase() === 'CREDIT' ? paymentDay : null,
                userId: userId,
            }
        });
        res.status(201).json(newAccount);
    } catch (error) {
        console.error("Failed to create account:", error);
        res.status(500).json({ message: 'Failed to create account.' });
    }
});

// Update an existing account
router.put('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, type, balance, creditLimit, cutoffDay, paymentDay } = req.body || {};

    if (!name && !type && balance === undefined && creditLimit === undefined && cutoffDay === undefined && paymentDay === undefined) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    // Basic validation for account type if provided
    if (type && !['DEBIT', 'CREDIT', 'CASH'].includes(type.toUpperCase())) {
        return res.status(400).json({ message: `Invalid account type. Must be one of: DEBIT, CREDIT, CASH` });
    }

    try {
        const updatedAccount = await prisma.account.updateMany({
            where: { id, userId },
            data: {
                name,
                type: type ? type.toUpperCase() : undefined,
                balance,
                creditLimit,
                cutoffDay,
                paymentDay,
            },
        });

        if (updatedAccount.count === 0) {
            return res.status(404).json({ message: 'Account not found or you do not have permission to update it.' });
        }

        const account = await prisma.account.findFirst({ where: { id, userId } });
        res.json(account);

    } catch (error) {
        console.error("Failed to update account:", error);
        res.status(500).json({ message: 'Failed to update account.' });
    }
});

// Delete an account
router.delete('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    try {
        // Before deleting an account, ensure there are no transactions associated with it
        // Check for ACTIVE transactions (deletedAt: null)
        // We consider both source and destination roles
        const activeTransactionsCount = await prisma.transaction.count({
            where: {
                OR: [
                    { accountId: id },
                    { destinationAccountId: id }
                ],
                deletedAt: null
            }
        });

        if (activeTransactionsCount > 0) {
            return res.status(409).json({ message: 'No puedes eliminar la cuenta porque tiene transacciones activas. Elimina las transacciones primero.' });
        }

        // If only soft-deleted transactions exist, HARD DELETE them to free up the account
        await prisma.transaction.deleteMany({
            where: {
                OR: [
                    { accountId: id },
                    { destinationAccountId: id }
                ]
            }
        });

        const deletedAccount = await prisma.account.deleteMany({
            where: { id, userId },
        });

        if (deletedAccount.count === 0) {
            return res.status(404).json({ message: 'Account not found or you do not have permission to delete it.' });
        }

        res.status(204).send();
    } catch (error) {
        console.error("Failed to delete account:", error);
        res.status(500).json({ message: 'Failed to delete account.' });
    }
});

export default router;
