import { Transaction, Category, Budget } from '../types';
import { DEFAULT_CATEGORIES, MOCK_TRANSACTIONS, DEFAULT_BUDGETS } from '../constants';

// Storage Keys
const KEYS = {
  TRANSACTIONS: 'fin_app_transactions',
  CATEGORIES: 'fin_app_categories',
  BUDGETS: 'fin_app_budgets',
  INITIALIZED: 'fin_app_initialized',
} as const;

// Simple event system for reactive updates
type StorageEventType = 'transaction' | 'category' | 'budget';
type StorageListener = () => void;

const listeners: Record<StorageEventType, StorageListener[]> = {
  transaction: [],
  category: [],
  budget: [],
};

const notifyListeners = (type: StorageEventType) => {
  listeners[type].forEach(listener => listener());
};

// Safe localStorage wrapper with error handling
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

// Initialize data if empty
const initData = () => {
  const isInitialized = safeGetItem(KEYS.INITIALIZED);

  if (!isInitialized) {
    safeSetItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    safeSetItem(KEYS.TRANSACTIONS, JSON.stringify(MOCK_TRANSACTIONS));
    safeSetItem(KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
    safeSetItem(KEYS.INITIALIZED, 'true');
  }
};

// Initialize on module load
initData();

export const StorageService = {
  // ============ Event Listeners ============
  subscribe: (type: StorageEventType, listener: StorageListener) => {
    listeners[type].push(listener);
    return () => {
      listeners[type] = listeners[type].filter(l => l !== listener);
    };
  },

  // ============ Transactions ============
  getTransactions: (): Transaction[] => {
    const data = safeGetItem(KEYS.TRANSACTIONS);
    const transactions = data ? JSON.parse(data) : [];
    // Always return sorted by date desc
    return transactions.sort((a: Transaction, b: Transaction) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },

  getTransaction: (id: string): Transaction | undefined => {
    const transactions = StorageService.getTransactions();
    return transactions.find(t => t.id === id);
  },

  saveTransaction: (transaction: Transaction): boolean => {
    const transactions = StorageService.getTransactions();
    const updated = [transaction, ...transactions];
    const success = safeSetItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
    if (success) {
      notifyListeners('transaction');
    }
    return success;
  },

  updateTransaction: (updatedTx: Transaction): boolean => {
    const transactions = StorageService.getTransactions();
    const index = transactions.findIndex(t => t.id === updatedTx.id);
    if (index !== -1) {
      transactions[index] = updatedTx;
      const success = safeSetItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
      if (success) {
        notifyListeners('transaction');
      }
      return success;
    }
    return false;
  },

  deleteTransaction: (id: string): boolean => {
    const transactions = StorageService.getTransactions();
    const updated = transactions.filter(t => t.id !== id);
    const success = safeSetItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
    if (success) {
      notifyListeners('transaction');
    }
    return success;
  },

  // ============ Categories ============
  getCategories: (): Category[] => {
    const data = safeGetItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  },

  saveCategory: (category: Category): boolean => {
    const categories = StorageService.getCategories();
    const updated = [...categories, category];
    const success = safeSetItem(KEYS.CATEGORIES, JSON.stringify(updated));
    if (success) {
      notifyListeners('category');
    }
    return success;
  },

  updateCategory: (updatedCategory: Category): boolean => {
    const categories = StorageService.getCategories();
    const index = categories.findIndex(c => c.id === updatedCategory.id);
    if (index !== -1) {
      categories[index] = updatedCategory;
      const success = safeSetItem(KEYS.CATEGORIES, JSON.stringify(categories));
      if (success) {
        notifyListeners('category');
      }
      return success;
    }
    return false;
  },

  deleteCategory: (id: string): boolean => {
    const categories = StorageService.getCategories();
    const updated = categories.filter(c => c.id !== id);
    const success = safeSetItem(KEYS.CATEGORIES, JSON.stringify(updated));
    if (success) {
      notifyListeners('category');
    }
    return success;
  },

  // ============ Budgets ============
  getBudgets: (): Budget[] => {
    const data = safeGetItem(KEYS.BUDGETS);
    return data ? JSON.parse(data) : [];
  },

  getBudget: (categoryId: string): Budget | undefined => {
    const budgets = StorageService.getBudgets();
    return budgets.find(b => b.categoryId === categoryId);
  },

  saveBudget: (budget: Budget): boolean => {
    const budgets = StorageService.getBudgets();
    // Check if budget already exists for this category
    const existingIndex = budgets.findIndex(b => b.categoryId === budget.categoryId);

    if (existingIndex !== -1) {
      // Update existing budget
      budgets[existingIndex] = budget;
    } else {
      // Add new budget
      budgets.push(budget);
    }

    const success = safeSetItem(KEYS.BUDGETS, JSON.stringify(budgets));
    if (success) {
      notifyListeners('budget');
    }
    return success;
  },

  updateBudget: (categoryId: string, limit: number): boolean => {
    const budgets = StorageService.getBudgets();
    const index = budgets.findIndex(b => b.categoryId === categoryId);

    if (index !== -1) {
      budgets[index].limit = limit;
      const success = safeSetItem(KEYS.BUDGETS, JSON.stringify(budgets));
      if (success) {
        notifyListeners('budget');
      }
      return success;
    }
    return false;
  },

  deleteBudget: (categoryId: string): boolean => {
    const budgets = StorageService.getBudgets();
    const updated = budgets.filter(b => b.categoryId !== categoryId);
    const success = safeSetItem(KEYS.BUDGETS, JSON.stringify(updated));
    if (success) {
      notifyListeners('budget');
    }
    return success;
  },

  // ============ Utility Methods ============
  clearAllData: (): boolean => {
    try {
      localStorage.removeItem(KEYS.TRANSACTIONS);
      localStorage.removeItem(KEYS.CATEGORIES);
      localStorage.removeItem(KEYS.BUDGETS);
      localStorage.removeItem(KEYS.INITIALIZED);
      initData(); // Reinitialize with defaults
      notifyListeners('transaction');
      notifyListeners('category');
      notifyListeners('budget');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  exportData: () => {
    return {
      transactions: StorageService.getTransactions(),
      categories: StorageService.getCategories(),
      budgets: StorageService.getBudgets(),
      exportedAt: new Date().toISOString(),
    };
  },

  importData: (data: {
    transactions?: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
  }): boolean => {
    try {
      if (data.transactions) {
        safeSetItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        notifyListeners('transaction');
      }
      if (data.categories) {
        safeSetItem(KEYS.CATEGORIES, JSON.stringify(data.categories));
        notifyListeners('category');
      }
      if (data.budgets) {
        safeSetItem(KEYS.BUDGETS, JSON.stringify(data.budgets));
        notifyListeners('budget');
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },
};