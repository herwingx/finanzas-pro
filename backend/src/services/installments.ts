import prisma from './database';
import { createTransactionAndAdjustBalances } from './transactions';
import { addMonths, endOfDay } from 'date-fns';

/**
 * Checks all active installment purchases for a user and generates any due monthly transactions.
 * This function is designed to be idempotent. It checks how many transactions should exist
 * and creates only the missing ones.
 * @param userId The ID of the user to process.
 */
export const processInstallmentPurchases = async (userId: string): Promise<void> => {
    const now = new Date();

    // Find all installment purchases that are not yet fully paid
    const activePurchases = await prisma.installmentPurchase.findMany({
        where: {
            userId,
            purchaseDate: { lte: now },
        },
    });

    for (const purchase of activePurchases) {
        // If the total paid amount already covers the total amount, or all installments are marked as paid,
        // we can consider it fully paid off.
        if (purchase.paidAmount >= purchase.totalAmount || purchase.paidInstallments >= purchase.installments) {
            // Ensure paidInstallments is correctly set if only paidAmount covered the total
            if (purchase.paidInstallments < purchase.installments) {
                await prisma.installmentPurchase.update({
                    where: { id: purchase.id },
                    data: { paidInstallments: purchase.installments },
                });
            }
            continue;
        }

        const purchaseDate = new Date(purchase.purchaseDate);
        let monthsDiff = (now.getFullYear() - purchaseDate.getFullYear()) * 12;
        monthsDiff -= purchaseDate.getMonth();
        monthsDiff += now.getMonth();

        // Determine how many installments should have been processed by now.
        // We add 1 if the current day of the month is past the purchase day.
        const expectedInstallmentsCount = Math.min(
            Math.max(0, monthsDiff + (now.getDate() >= purchaseDate.getDate() ? 1 : 0)),
            purchase.installments
        );

        const installmentsToCreate = expectedInstallmentsCount - purchase.paidInstallments;

        if (installmentsToCreate > 0) {
            await prisma.$transaction(async (tx) => {
                for (let i = 0; i < installmentsToCreate; i++) {
                    const currentInstallmentNumber = purchase.paidInstallments + i + 1;
                    // Mueve los meses usando utilitarios estrictos e inmutables
                    let dueDate = addMonths(new Date(purchase.purchaseDate), currentInstallmentNumber);
                    dueDate = endOfDay(dueDate);

                    // Only process if the due date is in the past
                    if (dueDate <= now) {
                        // This transaction represents the monthly payment being applied.
                        // For a credit card, this is an 'expense' that reduces the debt.
                        // However, the initial purchase already increased the debt.
                        // Here, we simulate the payment that *should* happen.
                        // In the new system, this might just create a placeholder or do nothing,
                        // as manual payments are now the source of truth.
                        // For now, let's stick to creating the transaction as it was.
                        await createTransactionAndAdjustBalances(tx, {
                            amount: purchase.monthlyPayment,
                            description: `${purchase.description} (${currentInstallmentNumber}/${purchase.installments})`,
                            date: dueDate,
                            type: 'expense', // This correctly simulates a charge on the credit card statement
                            userId: purchase.userId,
                            accountId: purchase.accountId,
                            categoryId: purchase.categoryId,
                            destinationAccountId: null,
                            installmentPurchaseId: purchase.id, // Link the transaction
                        });

                        // IMPORTANT: We now update the tracking fields on the purchase itself.
                        await tx.installmentPurchase.update({
                            where: { id: purchase.id },
                            data: {
                                paidInstallments: { increment: 1 },
                                paidAmount: { increment: purchase.monthlyPayment },
                            },
                        });
                    }
                }
            });
        }
    }
};
