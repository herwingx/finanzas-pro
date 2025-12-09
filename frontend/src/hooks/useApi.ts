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
        },
    });
};

export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
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
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

export const useAddRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: Omit<RecurringTransaction, 'id'>) => apiService.addRecurringTransaction(transaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
};

export const useUpdateRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, transaction }: { id: string; transaction: Partial<Omit<RecurringTransaction, 'id'>> }) => apiService.updateRecurringTransaction(id, transaction),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
};

export const useDeleteRecurringTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.deleteRecurringTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring'] });
        },
    });
};