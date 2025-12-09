import express from 'express';
import { Prisma } from '@prisma/client';
import prismaClient from '../services/database';
const prisma = prismaClient as any;
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createTransactionAndAdjustBalances } from '../services/transactions';

const router = express.Router();
router.use(authMiddleware);

// GET all installment purchases for the user
router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    try {
        const purchases = await prisma.installmentPurchase.findMany({
            where: { userId },
            include: { account: true, generatedTransactions: true },
            orderBy: { purchaseDate: 'desc' },
        });
        res.json(purchases);
    } catch (error) {
        console.error("Failed to retrieve installment purchases:", error);
        res.status(500).json({ message: 'Failed to retrieve installment purchases.' });
    }
});

// POST a new installment purchase
router.post('/', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const {
        description,
        totalAmount,
        installments,
        purchaseDate,
        accountId,
        categoryId, // We need a category for the monthly transactions
    } = req.body;

    if (!description || !totalAmount || !installments || !purchaseDate || !accountId || !categoryId) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (installments <= 0) {
        return res.status(400).json({ message: 'Installments must be a positive number.' });
    }

    try {
        const newPurchase = await prisma.$transaction(async (tx: any) => {
            // 1. Find the account and validate it's a CREDIT account
            const account = await tx.account.findFirst({
                where: { id: accountId, userId: userId }
            });

            if (!account) {
                throw new Error('Account not found.');
            }
            if (account.type !== 'CREDIT') {
                throw new Error('Installment purchases can only be made with CREDIT accounts.');
            }

            // 2. Create the InstallmentPurchase record first
            const monthlyPayment = parseFloat((totalAmount / installments).toFixed(2));
            const purchase = await tx.installmentPurchase.create({
                data: {
                    description,
                    totalAmount,
                    installments,
                    monthlyPayment,
                    purchaseDate: new Date(purchaseDate),
                    accountId,
                    userId,
                    categoryId,
                }
            });

            // 3. Create the initial Transaction record (which also updates account balance)
            // We import createTransactionAndAdjustBalances dynamically or assume it's imported at top
            await createTransactionAndAdjustBalances(tx, {
                amount: totalAmount,
                description: description || 'Compra a Meses Sin Intereses',
                date: new Date(purchaseDate),
                type: 'expense',
                userId,
                accountId,
                categoryId,
                installmentPurchaseId: purchase.id,
            });

            return purchase;
        });

        res.status(201).json(newPurchase);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to create installment purchase.' });
    }
});

// GET a single installment purchase by ID
router.get('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    try {
        const purchase = await prisma.installmentPurchase.findFirst({
            where: { id, userId },
            include: { account: true, generatedTransactions: true },
        });

        if (!purchase) {
            return res.status(404).json({ message: 'Installment purchase not found.' });
        }
        res.json(purchase);
    } catch (error) {
        console.error("Failed to retrieve installment purchase:", error);
        res.status(500).json({ message: 'Failed to retrieve installment purchase.' });
    }
});

// PUT (Update) an installment purchase
router.put('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { description, totalAmount, installments, purchaseDate, categoryId } = req.body;

    if (!description && !totalAmount && !installments && !purchaseDate && !categoryId) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        const updatedPurchase = await prisma.$transaction(async (tx: any) => {
            const originalPurchase = await tx.installmentPurchase.findFirst({
                where: { id, userId },
                include: { account: true },
            });

            if (!originalPurchase) {
                throw new Error('Installment purchase not found or you do not have permission to update it.');
            }

            // Recalculate monthly payment if totalAmount or installments change
            const newTotalAmount = totalAmount ?? originalPurchase.totalAmount;
            const newInstallments = installments ?? originalPurchase.installments;
            const newMonthlyPayment = parseFloat((newTotalAmount / newInstallments).toFixed(2));

            const purchase = await tx.installmentPurchase.update({
                where: { id },
                data: {
                    description: description ?? originalPurchase.description,
                    totalAmount: newTotalAmount,
                    installments: newInstallments,
                    monthlyPayment: newMonthlyPayment,
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : originalPurchase.purchaseDate,
                },
                include: { account: true, generatedTransactions: true },
            });

            // User Issue 1: "Al actualizar... no se actualiza la deuda en mis cuentas"
            // 1. Find the initial transaction (created at time of purchase)
            // We assume it's the one with type='expense', installmentPurchaseId=id, and same accountId
            const initialTransaction = await tx.transaction.findFirst({
                where: {
                    installmentPurchaseId: id,
                    type: 'expense', // Initial purchase is an expense (adds debt to credit card)
                    // created near purchaseDate? or just the one linked.
                }
            });

            if (initialTransaction && (totalAmount !== undefined || description !== undefined || purchaseDate !== undefined)) {
                const oldTxAmount = initialTransaction.amount;
                const newTxAmount = newTotalAmount; // Should match the new total amount of the purchase

                // Update Transaction
                await tx.transaction.update({
                    where: { id: initialTransaction.id },
                    data: {
                        amount: newTxAmount,
                        description: description ?? initialTransaction.description,
                        date: purchaseDate ? new Date(purchaseDate) : initialTransaction.date
                    }
                });

                // Update Account Balance (Debt)
                // If amount changed:
                if (newTxAmount !== oldTxAmount) {
                    const diff = newTxAmount - oldTxAmount;
                    // For CREDIT account:
                    // if newAmount > oldAmount, debt increases (balance increases)
                    // if newAmount < oldAmount, debt decreases (balance decreases)
                    // Transaction type 'expense' on CREDIT increases balance.

                    // Diff = new - old.
                    // If diff is positive, we increment balance.
                    // If diff is negative, we increment (decrement) balance.
                    await tx.account.update({
                        where: { id: purchase.accountId },
                        data: { balance: { increment: diff } }
                    });
                }
            }

            return purchase;

        });
        res.json(updatedPurchase);
    } catch (error: any) {
        console.error("Failed to update installment purchase:", error);
        res.status(500).json({ message: error.message || 'Failed to update installment purchase.' });
    }
});

// DELETE an installment purchase
router.delete('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    try {
        await prisma.$transaction(async (tx: any) => {
            const purchase = await tx.installmentPurchase.findFirst({
                where: { id, userId },
                include: { account: true },
            });

            if (!purchase) {
                throw new Error('Installment purchase not found or you do not have permission to delete it.');
            }

            // Revert the balance changes from all associated transactions
            if (purchase.account) {
                const relatedTransactions = await tx.transaction.findMany({
                    where: { installmentPurchaseId: id },
                });

                let netEffectOnBalance = 0;
                relatedTransactions.forEach((trx: any) => {
                    // For CREDIT accounts: expense increases balance (debt), income decreases it.
                    if (purchase.account.type === 'CREDIT') {
                        if (trx.type === 'expense') {
                            netEffectOnBalance += trx.amount;
                        } else if (trx.type === 'income') {
                            netEffectOnBalance -= trx.amount;
                        }
                    } else { // DEBIT/CASH: expense decreases balance, income increases it.
                        if (trx.type === 'expense') {
                            netEffectOnBalance -= trx.amount;
                        } else if (trx.type === 'income') {
                            netEffectOnBalance += trx.amount;
                        }
                    }
                });

                // To revert, we apply the opposite of the net effect.
                // If netEffect is positive, we decrement. If negative, we increment.
                if (netEffectOnBalance > 0) {
                    await tx.account.update({
                        where: { id: purchase.accountId },
                        data: { balance: { decrement: netEffectOnBalance } },
                    });
                } else if (netEffectOnBalance < 0) {
                    await tx.account.update({
                        where: { id: purchase.accountId },
                        data: { balance: { increment: -netEffectOnBalance } },
                    });
                }
                // If netEffect is 0, no balance change needed.
            }

            // Delete all generated transactions for this installment purchase
            await tx.transaction.deleteMany({
                where: { installmentPurchaseId: id },
            });

            // Delete the installment purchase itself
            await tx.installmentPurchase.delete({
                where: { id },
            });
        });
        res.status(204).send();
    } catch (error: any) {
        console.error("Failed to delete installment purchase:", error);
        res.status(500).json({ message: error.message || 'Failed to delete installment purchase.' });
    }
});

router.post('/:id/pay', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id: installmentPurchaseId } = req.params;
    const { amount, description, date, accountId } = req.body;

    if (!amount || !date || !accountId) {
        return res.status(400).json({ message: 'Missing required fields: amount, date, accountId.' });
    }

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            const purchase = await tx.installmentPurchase.findFirst({
                where: { id: installmentPurchaseId, userId },
            });

            if (!purchase) {
                throw new Error('Installment purchase not found.');
            }

            if (purchase.paidAmount >= purchase.totalAmount) {
                throw new Error('This purchase has already been fully paid.');
            }

            const paymentAmount = parseFloat(amount);

            // This is a payment towards the credit card, so it's an "income" for the CREDIT account
            const newTransaction = await createTransactionAndAdjustBalances(tx, {
                amount: paymentAmount,
                description: description || `Pago a MSI: ${purchase.description}`,
                date: new Date(date),
                type: 'income', // Payment to a credit card reduces its balance (debt)
                userId,
                accountId: purchase.accountId, // The payment is made TO the credit account
                categoryId: purchase.categoryId, // Associate with the same category for consistency
                installmentPurchaseId,
            });

            // Update the installment purchase progress
            const installmentsPaid = Math.floor(paymentAmount / purchase.monthlyPayment);
            const remainder = paymentAmount % purchase.monthlyPayment;

            const updatedPurchase = await tx.installmentPurchase.update({
                where: { id: installmentPurchaseId },
                data: {
                    paidAmount: { increment: paymentAmount },
                    paidInstallments: { increment: installmentsPaid },
                    // We can also consider how to handle remainders, for now, we just track the total amount.
                },
            });

            return { newTransaction, updatedPurchase };
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Failed to process installment payment:", error);
        res.status(500).json({ message: error.message || 'Failed to process installment payment.' });
    }
});

export default router;
