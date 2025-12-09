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
            res.status(404).json({ message: 'Installment purchase not found.' });
            return; // Ensure we return void
        }

        // --- Self-Healing Logic: Ensure consistency ---
        // Sum all actual payments related to this plan
        const actualPayments = await prisma.transaction.findMany({
            where: {
                installmentPurchaseId: id,
                OR: [{ type: 'income' }, { type: 'transfer' }]
            }
        });

        const totalPaidReal = actualPayments.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

        // Calculate correct installments count (using a small epsilon for float safety)
        const paidInstallmentsReal = Math.floor((totalPaidReal + 0.01) / purchase.monthlyPayment);

        // If DB state differs from Reality, Auto-Correct it.
        if (Math.abs(totalPaidReal - purchase.paidAmount) > 0.01 || paidInstallmentsReal !== purchase.paidInstallments) {
            console.log(`Self-Healing MSI ${id}: Correcting paidAmount ${purchase.paidAmount} -> ${totalPaidReal}, paidInstallments ${purchase.paidInstallments} -> ${paidInstallmentsReal}`);

            const correctedPurchase = await prisma.installmentPurchase.update({
                where: { id },
                data: {
                    paidAmount: totalPaidReal,
                    paidInstallments: paidInstallmentsReal
                },
                include: { account: true, generatedTransactions: true }
            });

            res.json(correctedPurchase);
            return;
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
                        date: purchaseDate ? new Date(purchaseDate) : initialTransaction.date
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
            const purchase = await tx.installmentPurchase.findFirst({
                where: { id, userId },
                include: { account: true },
            });

            if (!purchase) {
                throw new Error('Installment purchase not found or you do not have permission to delete it.');
            }

            // Protect accounting integrity: Warn but allow.
            const remaining = purchase.totalAmount - purchase.paidAmount;
            // Removed strict block to allow user correction if needed.
            // Frontend will handle the heavy warning.

            // Revert the balance changes from all associated transactions
            // We must process each transaction to handle transfers (multi-account) correctly.
            const relatedTransactions = await tx.transaction.findMany({
                where: { installmentPurchaseId: id },
                include: { account: true, destinationAccount: true }
            });

            for (const trx of relatedTransactions) {
                const { account, destinationAccount, amount, type } = trx;

                if (account) {
                    /*
                       Reversion Logic:
                       - Expense (Spent): We increment balance (Undo spend).
                         (For Credit: Debt decreases? No. 
                          Expense on Credit -> Balance += amount (Debt Up). 
                          Revert -> Balance -= amount (Debt Down).
                          Wait, check existing logic in Transactions Route.
                          
                          Transactions Route Revert Logic (Step 389):
                          - Income: decrement.
                          - Expense: increment.
                          - Transfer: increment source, decrement dest.
                          
                          Does this apply to CREDIT accounts?
                          Transaction Route relies on Account Type check?
                          Let's look at `createTransactionAndAdjustBalances` (Service).
                          - Expense on Credit: Balance += amount. (Debt Increases).
                          - Expense on Debit: Balance -= amount. (Asset Decreases).
                          
                          So Revert Expense on Credit: Balance -= amount.
                          Revert Expense on Debit: Balance += amount.
                          
                          The Transaction Route logic in Step 389 (DELETE) seemed generic:
                          `if (type === 'expense') { await tx.account.update({ balance: { increment: amount } }) }`
                          Wait, if I have $100 Debit (Asset). Expense $50. New Balance $50.
                          Revert (Increment $50) -> $100. Correct.
                          
                          If I have $0 Credit (Liability). Expense $50. New Balance $50 (Debt).
                          Revert (Increment $50) -> $100 (More Debt)? INCORRECT.
                          
                          The Transaction Route logic in Step 389 might be simplify assuming DEBIT?
                          Let's check Step 389 again.
                          It replaced specific Credit/Debit logic with generic `increment/decrement`?
                          NO. Step 389 shows:
                          `if (type === 'income') { decrement }`
                          `if (type === 'expense') { increment }`
                          
                          If `type=expense` on CREDIT, original was `balance + amount`.
                          Revert should be `balance - amount`.
                          But Step 389 says `increment`. That would INCREASE debt upon deletion!
                          
                          Wait, let's verify `services/transactions.ts` Step 408 (My Refactor).
                          `if (sourceAccount.type === 'CREDIT') { newBalance = type === 'expense' ? balance + amount : ... }`
                          Yes, Expense adds to Credit balance.
                          
                          So when DELETING an Expense on Credit, we must SUBTRACT (Decrement).
                          The code in Step 389 (DELETE) seems to have a BUG if it uses generic increment for expense.
                          `if (type === 'expense') { increment }`.
                          This works for Debit (Asset). It FAILS for Credit (Liability).
                          
                          UNLESS `account.balance` for Credit is stored as negative?
                          No, traditionally Credit balance is positive (Amount Owed).
                          
                          So I need to implement robust logic here in Installments DELETE which checks Account Type.
                    */

                    if (type === 'expense') {
                        if (account.type === 'CREDIT') {
                            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
                        } else { // DEBIT/CASH
                            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
                        }
                    } else if (type === 'income') {
                        if (account.type === 'CREDIT') {
                            // Income to Credit (Payment) reduces debt (balance -= amount).
                            // Revert: Increase debt (balance += amount).
                            await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });
                        } else { // DEBIT/CASH
                            // Income to Debit increases asset. Revert: Decrement.
                            await tx.account.update({ where: { id: account.id }, data: { balance: { decrement: amount } } });
                        }
                    } else if (type === 'transfer') {
                        // Transfer Source (account) -> Dest (destinationAccount)

                        // Revert Source:
                        // Transfer Out reduces Debit/Cash or Increases Credit Debt?
                        // Service: 
                        //  Debit Source: balance -= amount.
                        //  Credit Source (?? Cash Advance?): balance += amount. (Not implemented in Service? Service throws for Credit Source?)
                        //  Service Only allows TRANSFER OUT if Source is DEBIT/CASH (line 84 check: insufficient funds).
                        //  Wait, Service line 84 checks if Debit/Cash < amount. 
                        //  Does it allow Credit Source?
                        //  Service line 95: `balance: { decrement: amount }`.
                        //  If Source is Credit, decrementing balance (debt) implies paying it off? No.
                        //  Usually you don't transfer OUT of Credit Card (unless cash advance).
                        //  Assuming Source is always DEBIT/CASH for transfers in this app context.

                        // Revert Source (Debit): Increment (Refund).
                        await tx.account.update({ where: { id: account.id }, data: { balance: { increment: amount } } });

                        // Revert Destination:
                        if (destinationAccount) {
                            if (destinationAccount.type === 'CREDIT') {
                                // Transfer INTO Credit (Payment).
                                // Original: Balance -= amount (Debt down).
                                // Revert: Balance += amount (Debt up).
                                await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { increment: amount } } });
                            } else { // DEBIT/CASH
                                // Transfer INTO Debit.
                                // Original: Balance += amount.
                                // Revert: Balance -= amount.
                                await tx.account.update({ where: { id: destinationAccount.id }, data: { balance: { decrement: amount } } });
                            }
                        }
                    }
                }
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
