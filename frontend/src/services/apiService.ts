import { Transaction, Category, Budget, Profile } from '../types';

const API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/transactions`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
};

export const getTransaction = async (id: string): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch transaction');
    return response.json();
}

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'categoryId'> & { categoryId: string }): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to add transaction');
    return response.json();
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to update transaction');
    return response.json();
};

export const deleteTransaction = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
};


// Categories
export const getCategories = async (): Promise<Category[]> => {
    // This endpoint needs to be created in the backend
    const response = await fetch(`${API_URL}/categories`, { headers: getAuthHeaders() });
    if (!response.ok) {
        // returning a default category for now
        return [{ id: '1', name: 'Default', icon: 'receipt_long', color: '#999', type: 'expense' }];
    }
    const categories = await response.json();
    if (!categories || categories.length === 0) {
        return [{ id: '1', name: 'Default', icon: 'receipt_long', color: '#999', type: 'expense' }];
    }
    return categories;
};

// Budgets
export const getBudgets = async (): Promise<Budget[]> => {
    // This endpoint needs to be created in the backend
    const response = await fetch(`${API_URL}/budgets`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    return response.json();
};

// Profile
export const getProfile = async (): Promise<Profile> => {
    // This endpoint needs to be created in the backend
    const response = await fetch(`${API_... (truncated)