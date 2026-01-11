import express from 'express';
import { Prisma } from '../generated/prisma/client';
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
            include: {
                account: true,
                generatedTransactions: {
                    where: { deletedAt: null },
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { purchaseDate: 'desc' },
        });

        // Self-healing: Check consistency for ALL items
        // This fixes any desync caused by previous errors
        for (const purchase of purchases) {
            const actualPayments = purchase.generatedTransactions.filter(
                (tx: any) => (tx.type === 'income' || tx.type === 'transfer') && !tx.deletedAt
            );

            const totalPaidReal = actualPayments.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
            const paidInstallmentsReal = Math.floor((totalPaidReal + 0.01) / purchase.monthlyPayment);

            if (Math.abs(totalPaidReal - purchase.paidAmount) > 0.05 || paidInstallmentsReal !== purchase.paidInstallments) {
                await prisma.installmentPurchase.update({
                    where: { id: purchase.id },
                    data: {
                        paidAmount: totalPaidReal,
                        paidInstallments: paidInstallmentsReal
                    }
                });
                // Update the local object to return correct data immediately
                purchase.paidAmount = totalPaidReal;
                purchase.paidInstallments = paidInstallmentsReal;
            }
        }

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
        // Initial fetch with filtering
        let purchase = await prisma.installmentPurchase.findFirst({
            where: { id, userId },
            include: {
                account: true,
                generatedTransactions: {
                    where: { deletedAt: null },
                    orderBy: { date: 'asc' }
                }
            },
        });

        if (!purchase) {
            res.status(404).json({ message: 'Installment purchase not found.' });
            return;
        }

        // --- Self-Healing Logic: Ensure consistency ---
        // Sum all actual payments related to this plan (using the already filtered list)
        const actualPayments = purchase.generatedTransactions.filter(
            (tx: any) => (tx.type === 'income' || tx.type === 'transfer')
        );

        const totalPaidReal = actualPayments.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);
        const paidInstallmentsReal = Math.floor((totalPaidReal + 0.01) / purchase.monthlyPayment);

        // If DB state differs from Reality, Auto-Correct it.
        if (Math.abs(totalPaidReal - purchase.paidAmount) > 0.01 || paidInstallmentsReal !== purchase.paidInstallments) {

            purchase = await prisma.installmentPurchase.update({
                where: { id },
                data: {
                    paidAmount: totalPaidReal,
                    paidInstallments: paidInstallmentsReal
                },
                include: {
                    account: true,
                    generatedTransactions: {
                        where: { deletedAt: null },
                        orderBy: { date: 'asc' }
                    }
                }
            });
        }

        res.json(purchase);
    } catch (error: any) {
        console.error("Failed to retrieve installment purchase:", error);
        res.status(500).json({ message: error.message || 'Failed to retrieve installment purchase.' });
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

            // Point 7: Validate integrity when editing plans with existing payments
            const currentPaidAmount = originalPurchase.paidAmount;
            const newTotalAmount = totalAmount ?? originalPurchase.totalAmount;
            const newInstallments = installments ?? originalPurchase.installments;

            // Case B: If there are existing payments, validate integrity
            if (currentPaidAmount > 0.05) {
                if (newTotalAmount < currentPaidAmount - 0.05) {
                    throw new Error(`No puedes reducir el monto total ($${newTotalAmount.toFixed(2)}) por debajo de lo que ya has pagado ($${currentPaidAmount.toFixed(2)}).`);
                }
            }

            // Recalculate monthly payment
            const newMonthlyPayment = parseFloat((newTotalAmount / newInstallments).toFixed(2));

            // Point 7: Recalculate paidInstallments based on new monthly payment
            let recalculatedPaidInstallments = originalPurchase.paidInstallments;

            if (currentPaidAmount > 0.05 && (totalAmount !== undefined || installments !== undefined)) {
                // Recalculate how many of the NEW installments have been covered
                recalculatedPaidInstallments = Math.floor(currentPaidAmount / newMonthlyPayment);

                // Cap at maximum installments (in case of overpayment scenarios)
                if (recalculatedPaidInstallments > newInstallments) {
                    recalculatedPaidInstallments = newInstallments;
                }
            }

            const purchase = await tx.installmentPurchase.update({
                where: { id },
                data: {
                    description: description ?? originalPurchase.description,
                    totalAmount: newTotalAmount,
                    installments: newInstallments,
                    monthlyPayment: newMonthlyPayment,
                    paidAmount: originalPurchase.paidAmount, // Keep original paid amount
                    paidInstallments: recalculatedPaidInstallments, // Apply recalculated
                    purchaseDate: purchaseDate ? new Date(purchaseDate) : originalPurchase.purchaseDate,
                },
                include: { account: true, generatedTransactions: true },
            });

            // User Issue 1: \"Al actualizar... no se actualiza la deuda en mis cuentas\"
            // Point 7 Case A: Update initial transaction if no payments exist
            const initialTransaction = await tx.transaction.findFirst({
                where: {
                    installmentPurchaseId: id,
                    type: 'expense',
                }
            });

            if (initialTransaction && (totalAmount !== undefined || description !== undefined || purchaseDate !== undefined)) {
                const oldTxAmount = initialTransaction.amount;
                const newTxAmount = newTotalAmount;

                // Update Transaction
                await tx.transaction.update({
                    where: { id: initialTransaction.id },
                    data: {
                        amount: newTxAmount,
                        description: description ?? initialTransaction.description,
                        date: purchaseDate ? new Date(purchaseDate) : initialTransaction.date,
                        categoryId: categoryId ?? initialTransaction.categoryId
                    }
                });

                // Update Account Balance (Debt)
                if (newTxAmount !== oldTxAmount) {
                    const diff = newTxAmount - oldTxAmount;
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
        res.status(400).json({ message: error.message || 'Failed to update installment purchase.' });
    }
});

// DELETE an installment purchase
router.delete('/:id', async (req: AuthRequest, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    try {
        await prisma.$transaction(async (tx: any) => {
            // Step 1: Find the purchase, its account, and all related non-deleted transactions.
            const purchase = await tx.installmentPurchase.findFirst({
                where: { id, userId },
                include: {
                    account: true,
                    generatedTransactions: { where: { deletedAt: null } },
                },
            });

            if (!purchase) {
                throw new Error('Installment purchase not found or you do not have permission to delete it.');
            }

            // Step 2: For every payment made from a different account (transfers), refund the source account ONLY IF REVERT IS REQUESTED.
            const shouldRevert = req.query.revert === 'true';

            if (shouldRevert) {
                const paymentTransactions = purchase.generatedTransactions.filter(
                    (trx: any) => trx.type === 'transfer' && trx.destinationAccountId === purchase.accountId
                );

                if (paymentTransactions.length > 0) {
                    for (const payment of paymentTransactions) {
                        if (payment.accountId) { // accountId is the source of the transfer
                            await tx.account.update({
                                where: { id: payment.accountId },
                                data: { balance: { increment: payment.amount } },
                            });
                        }
                    }
                }
            }

            // Step 3: Calculate the net debt impact on the credit card and create one final transaction to reverse it.
            // The net debt added to the card is Total Amount - Paid Amount. We need to reverse this.
            const remainingDebt = purchase.totalAmount - purchase.paidAmount;


            // To revert the net debt on a CREDIT account, we must DECREMENT its balance.
            if (purchase.account.type === 'CREDIT') {
                await tx.account.update({
                    where: { id: purchase.accountId },
                    data: { balance: { decrement: remainingDebt } },
                });
            } else {
                // This case should ideally not happen based on creation logic, but handle it for safety.
                await tx.account.update({
                    where: { id: purchase.accountId },
                    data: { balance: { increment: remainingDebt } },
                });
            }

            // Step 4: Hard delete all transactions associated with this installment purchase.
            await tx.transaction.deleteMany({
                where: { installmentPurchaseId: id },
            });

            // Step 5: Delete the installment purchase record itself.
            await tx.installmentPurchase.delete({
                where: { id },
            });

        });
        res.status(204).send();
    } catch (error: any) {
        console.error("Failed to delete installment purchase:", error);
        res.status(400).json({ message: error.message || 'Failed to delete installment purchase.' });
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
            const remainingAmount = purchase.totalAmount - purchase.paidAmount;

            if (paymentAmount > remainingAmount) {
                throw new Error(`El monto del pago (${paymentAmount.toFixed(2)}) excede el saldo restante de la compra (${remainingAmount.toFixed(2)}).`);
            }

            // Determine transaction type based on source account
            // If source account (req.body.accountId) is different from plan account (purchase.accountId), it's a TRANSFER.
            const sourceAccountId = accountId; // From request body
            const targetAccountId = purchase.accountId; // The credit card

            let transactionType = 'income';
            let finalAccountId = targetAccountId;
            let finalDestinationId = undefined;

            if (sourceAccountId && sourceAccountId !== targetAccountId) {
                transactionType = 'transfer';
                finalAccountId = sourceAccountId;
                finalDestinationId = targetAccountId;
            }

            const newTransaction = await createTransactionAndAdjustBalances(tx, {
                amount: paymentAmount,
                description: description || `Pago a MSI: ${purchase.description}`,
                date: new Date(date),
                type: transactionType as any,
                userId,
                accountId: finalAccountId,
                destinationAccountId: finalDestinationId,
                categoryId: purchase.categoryId, // Associate with the same category for consistency
                installmentPurchaseId,
            });

            // Update the installment purchase progress
            const newPaidAmount = purchase.paidAmount + paymentAmount;
            const newPaidInstallments = Math.min(
                purchase.installments,
                Math.floor(newPaidAmount / purchase.monthlyPayment)
            );

            const updatedPurchase = await tx.installmentPurchase.update({
                where: { id: installmentPurchaseId },
                data: {
                    paidAmount: { increment: paymentAmount },
                    paidInstallments: newPaidInstallments, // Set directly, not increment
                },
            });

            return { newTransaction, updatedPurchase };
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error("Failed to process installment payment:", error);
        res.status(400).json({ message: error.message || 'Failed to process installment payment.' });
    }
});

export default router;
