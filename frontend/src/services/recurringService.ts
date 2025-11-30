import { RecurringTransaction, Transaction, FrequencyType } from '../types';
import { StorageService } from './storageService';

const getNextDate = (date: Date, frequency: FrequencyType): Date => {
    const newDate = new Date(date);

    switch (frequency) {
        case 'daily':
            newDate.setDate(newDate.getDate() + 1);
            break;
        case 'weekly':
            newDate.setDate(newDate.getDate() + 7);
            break;
        case 'biweekly':
            // Special logic for 15th and 30th/End of month
            const day = newDate.getDate();
            const month = newDate.getMonth();
            const year = newDate.getFullYear();

            if (day < 15) {
                // Move to 15th of current month
                newDate.setDate(15);
            } else if (day === 15) {
                // Move to last day of current month (usually 30 or 31, or 28/29)
                // Setting date to 0 of next month gives last day of current month
                const lastDay = new Date(year, month + 1, 0).getDate();
                newDate.setDate(lastDay);
            } else {
                // Move to 15th of next month
                newDate.setMonth(month + 1);
                newDate.setDate(15);
            }
            break;
        case 'monthly':
            newDate.setMonth(newDate.getMonth() + 1);
            break;
        case 'yearly':
            newDate.setFullYear(newDate.getFullYear() + 1);
            break;
    }

    return newDate;
};

// Helper for non-secure contexts
const generateUUID = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const RecurringService = {
    processRecurringTransactions: (): number => {
        const recurringRules = StorageService.getRecurringTransactions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let generatedCount = 0;

        recurringRules.forEach(rule => {
            if (!rule.active) return;

            let nextDue = new Date(rule.nextDueDate);
            nextDue.setHours(0, 0, 0, 0);

            // While the due date is today or in the past, generate transactions
            // Limit to prevent infinite loops in case of errors (e.g. max 1 year of catchup)
            let safetyCounter = 0;
            const MAX_ITERATIONS = 365;

            while (nextDue <= today && safetyCounter < MAX_ITERATIONS) {
                // Create transaction
                const newTx: Transaction = {
                    id: generateUUID(),
                    amount: rule.amount,
                    description: rule.description + ' (Recurrente)',
                    categoryId: rule.categoryId,
                    date: nextDue.toISOString(),
                    type: rule.type,
                    recurringId: rule.id
                };

                StorageService.saveTransaction(newTx);
                generatedCount++;

                // Update next due date
                nextDue = getNextDate(nextDue, rule.frequency);

                // Update the rule in storage
                rule.nextDueDate = nextDue.toISOString();
                rule.lastGenerated = newTx.date;
                StorageService.updateRecurringTransaction(rule);

                safetyCounter++;
            }
        });

        return generatedCount;
    }
};
