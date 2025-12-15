import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiService from '../services/apiService';
import { Transaction, Profile, Category, RecurringTransaction, Account, InstallmentPurchase } from '../types';

export const useInstallmentPurchases = () => {
    return useQuery<InstallmentPurchase[], Error>({
        queryKey: ['installments'],
        queryFn: apiService.getInstallmentPurchases,
    });
};

export const useAddInstallmentPurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (purchase: Omit<InstallmentPurchase, 'id' | 'user' | 'account' | 'generatedTransactions' | 'userId' | 'monthlyPayment' | 'paidInstallments' | 'paidAmount'>) => apiService.addInstallmentPurchase(purchase),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useInstallmentPurchase = (id: string | null) => {
    return useQuery<InstallmentPurchase, Error>({
        queryKey: ['installment', id],
        queryFn: () => {
            if (!id) throw new Error('No id provided');
            return apiService.getInstallmentPurchase(id)
        },
        enabled: !!id,
    });
};

export const useUpdateInstallmentPurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, purchase }: { id: string; purchase: Partial<Omit<InstallmentPurchase, 'id' | 'user' | 'account' | 'generatedTransactions'>> }) => apiService.updateInstallmentPurchase(id, purchase),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['installment', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useDeleteInstallmentPurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteInstallmentPurchase(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const usePayInstallment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payment }: { id: string; payment: { amount: number; description?: string; date: string; accountId: string } }) => apiService.payInstallment(id, payment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};


export const useAccounts = () => {
    return useQuery<Account[], Error>({
        queryKey: ['accounts'],
        queryFn: apiService.getAccounts,
    });
};

export const useAddAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (account: Omit<Account, 'id' | 'userId' | 'transactions'>) => apiService.addAccount(account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useUpdateAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, account }: { id: string; account: Partial<Omit<Account, 'id' | 'userId' | 'transactions'>> }) => apiService.updateAccount(id, account),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useTransactions = () => {
    return useQuery<Transaction[], Error>({
        queryKey: ['transactions'],
        queryFn: apiService.getTransactions,
    });
};

export const useTransaction = (id: string | null) => {
    return useQuery<Transaction, Error>({
        queryKey: ['transaction', id],
        queryFn: () => {
            if (!id) throw new Error('No id provided');
            return apiService.getTransaction(id)
        },
        enabled: !!id,
    });
}

export const useAddTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: Omit<Transaction, 'id'>) => apiService.addTransaction(transaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, transaction }: { id: string; transaction: Partial<Transaction> }) => apiService.updateTransaction(id, transaction),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] }); // Refresh MSI progress
            queryClient.invalidateQueries({ queryKey: ['accounts'] });     // Refresh balances
        },
    });
};

export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ['categories'],
        queryFn: apiService.getCategories,
    });
}

export const useAddCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (category: Omit<Category, 'id'>) => apiService.addCategory(category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, category }: { id: string; category: Partial<Category> }) => apiService.updateCategory(id, category),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, newCategoryId }: { id: string; newCategoryId?: string }) => apiService.deleteCategory(id, newCategoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useProfile = () => {
    return useQuery<Profile, Error>({
        queryKey: ['profile'],
        queryFn: apiService.getProfile,
    });
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (profile: Partial<Profile>) => apiService.updateProfile(profile),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
        },
    });
};

export const useRecurringTransactions = () => {
    return useQuery<RecurringTransaction[], Error>({
        queryKey: ['recurring'],
        queryFn: apiService.getRecurringTransactions,
    });
};

export const useRecurringTransaction = (id: string | null, options?: { enabled?: boolean }) => {
    return useQuery<RecurringTransaction, Error>({
        queryKey: ['recurring', id],
        queryFn: () => {
            if (!id) throw new Error('No id provided');
            return apiService.getRecurringTransaction(id)
        },
        enabled: !!id && (options?.enabled ?? true),
    });
};

export const useAddRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: Omit<RecurringTransaction, 'id'>) => apiService.addRecurringTransaction(transaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useUpdateRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, transaction }: { id: string; transaction: Partial<Omit<RecurringTransaction, 'id'>> }) => apiService.updateRecurringTransaction(id, transaction),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recurring', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useDeleteRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteRecurringTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const usePayRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: { amount?: number; date?: string } }) => apiService.payRecurringTransaction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
};

export const useSkipRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.skipRecurringTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

// Get deleted transactions (for trash/recycle bin)
export const useDeletedTransactions = () => {
    return useQuery<Transaction[], Error>({
        queryKey: ['deletedTransactions'],
        queryFn: apiService.getDeletedTransactions,
    });
};

// Restore a deleted transaction (undo)
export const useRestoreTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.restoreTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['deletedTransactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const usePermanentDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteTransaction(id, true),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deletedTransactions'] });
        },
    });
};

// Credit Card Statement Hooks
export const useCreditCardStatement = (accountId: string | null) => {
    return useQuery({
        queryKey: ['creditCardStatement', accountId],
        queryFn: () => {
            if (!accountId) throw new Error('No account ID');
            return apiService.getCreditCardStatement(accountId);
        },
        enabled: !!accountId,
    });
};

export const usePayFullStatement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ accountId, sourceAccountId, date }: { accountId: string; sourceAccountId: string; date?: string }) =>
            apiService.payFullStatement(accountId, sourceAccountId, date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditCardStatement'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const usePayMsiInstallment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ installmentId, sourceAccountId, date }: { installmentId: string; sourceAccountId: string; date?: string }) =>
            apiService.payMsiInstallment(installmentId, sourceAccountId, date),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditCardStatement'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};

export const useRevertStatementPayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transactionId: string) => apiService.revertStatementPayment(transactionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['creditCardStatement'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['installments'] });
            queryClient.invalidateQueries({ queryKey: ['financialPeriodSummary'] });
        },
    });
};