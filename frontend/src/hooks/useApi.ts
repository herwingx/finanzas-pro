import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiService from '../services/apiService';
import { Transaction, Profile, Category, RecurringTransaction } from '../types';

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