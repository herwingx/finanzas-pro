import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiService from '../services/apiService';
import { Transaction, Profile, Category } from '../types';

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

export const useProfile = () => {
    return useQuery<Profile, Error>({
        queryKey: ['profile'],
        queryFn: apiService.getProfile,
    });
}