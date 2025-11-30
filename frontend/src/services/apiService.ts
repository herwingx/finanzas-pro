import { Transaction, Category, Budget, Profile, RecurringTransaction } from '../types';

const API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } as any;
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
    const response = await fetch(`${API_URL}/categories`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to fetch categories');
    }
    const categories = await response.json();
    return categories;
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to add category');
    return response.json();
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<Category> => {
    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
};

export const deleteCategory = async (id: string, newCategoryId?: string): Promise<void> => {
    const headers = getAuthHeaders();
    const body = newCategoryId ? JSON.stringify({ newCategoryId }) : undefined;

    const response = await fetch(`${API_URL}/categories/${id}`, {
        method: 'DELETE',
        headers,
        body,
    });

    if (!response.ok) {
        if (response.status === 409) {
            // Special case: Category is in use. Throw a specific error.
            throw new Error('in-use');
        }
        const errorData = await response.json().catch(() => ({ message: 'Error al eliminar la categoría' }));
        throw new Error(errorData.message);
    }
};

// Budgets
export const getBudgets = async (): Promise<Budget[]> => {
    const response = await fetch(`${API_URL}/budgets`, { headers: getAuthHeaders() });
    if (!response.ok) return [];
    return response.json();
};

// Profile
export const getProfile = async (): Promise<Profile> => {
    const response = await fetch(`${API_URL}/profile`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }
    return response.json();
};

export const updateProfile = async (profile: Partial<Profile>): Promise<Profile> => {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`
    } as any;
    let body;

    // Si el avatar es un string base64, es una nueva imagen.
    if (profile.avatar && profile.avatar.startsWith('data:image')) {
        const formData = new FormData();
        formData.append('name', profile.name || '');
        formData.append('currency', profile.currency || '');
        
        // Convertir base64 a blob
        const response = await fetch(profile.avatar);
        const blob = await response.blob();
        formData.append('avatar', blob, 'avatar.png');

        // No establecemos Content-Type, el navegador lo hará por nosotros con FormData
        body = formData;
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(profile);
    }

    const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: headers,
        body: body,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Error response body:', errorBody);
        throw new Error('Failed to update profile');
    }
    return response.json();
};

// Recurring Transactions
export const getRecurringTransactions = async (): Promise<RecurringTransaction[]> => {
    const response = await fetch(`${API_URL}/recurring`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch recurring transactions');
    return response.json();
};

export const addRecurringTransaction = async (transaction: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> => {
    const response = await fetch(`${API_URL}/recurring`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to add recurring transaction');
    return response.json();
};

export const updateRecurringTransaction = async (id: string, transaction: Partial<Omit<RecurringTransaction, 'id'>>): Promise<RecurringTransaction> => {
    const response = await fetch(`${API_URL}/recurring/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) throw new Error('Failed to update recurring transaction');
    return response.json();
};

export const deleteRecurringTransaction = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/recurring/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete recurring transaction');
};