import { Transaction, Category, Budget, UserProfile, MonthlySummary } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

const STORAGE_VERSION = '1.2.1';
const VERSION_KEY = 'fin_app_version';

const KEYS = {
  TRANSACTIONS: 'fin_app_transactions',
  CATEGORIES: 'fin_app_categories',
  BUDGETS: 'fin_app_budgets',
  PROFILE: 'fin_app_profile',
  SUMMARIES: 'fin_app_monthly_summaries',
} as const;

export type StorageEventType = 'transaction' | 'category' | 'budget' | 'profile' | 'summary';
type StorageListener = () => void;
const listeners: Record<StorageEventType, StorageListener[]> = {
  transaction: [], category: [], budget: [], profile: [], summary: [],
};
const notifyListeners = (type: StorageEventType) => listeners[type].forEach(listener => listener());

const safeGetItem = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`ERROR reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const safeSetItem = (key: string, value: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`ERROR writing to localStorage (${key}):`, error);
    return false;
  }
};

const initData = () => {
  const currentVersion = localStorage.getItem(VERSION_KEY);
  if (currentVersion !== STORAGE_VERSION) {
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.BUDGETS);
    localStorage.removeItem(KEYS.SUMMARIES);
    safeSetItem(KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    safeSetItem(KEYS.PROFILE, { name: 'Usuario', currency: 'MXN' });
    safeSetItem(KEYS.BUDGETS, []);
    safeSetItem(KEYS.SUMMARIES, []);
    localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
  }
};

initData();

const getTransactions = (): Transaction[] => {
  const transactions = safeGetItem<Transaction[]>(KEYS.TRANSACTIONS, []);
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const getTransaction = (id: string): Transaction | undefined => {
  return getTransactions().find(t => t.id === id);
};

export const StorageService = {
  subscribe: (type: StorageEventType, listener: StorageListener): (() => void) => {
    listeners[type].push(listener);
    return () => {
      listeners[type] = listeners[type].filter(l => l !== listener);
    };
  },
  getProfile: (): UserProfile => safeGetItem(KEYS.PROFILE, { name: 'Usuario', currency: 'MXN' }),
  saveProfile: (profile: UserProfile): boolean => {
    const success = safeSetItem(KEYS.PROFILE, profile);
    if (success) notifyListeners('profile');
    return success;
  },
  getTransactions,
  getTransaction,
  saveTransaction: (transaction: Transaction): boolean => {
    const items = getTransactions();
    const success = safeSetItem(KEYS.TRANSACTIONS, [transaction, ...items]);
    if (success) notifyListeners('transaction');
    return success;
  },
  updateTransaction: (updatedTx: Transaction): boolean => {
    const items = getTransactions();
    const index = items.findIndex(t => t.id === updatedTx.id);
    if (index === -1) return false;
    items[index] = updatedTx;
    const success = safeSetItem(KEYS.TRANSACTIONS, items);
    if (success) notifyListeners('transaction');
    return success;
  },
  deleteTransaction: (id: string): boolean => {
    const items = getTransactions().filter(t => t.id !== id);
    const success = safeSetItem(KEYS.TRANSACTIONS, items);
    if (success) notifyListeners('transaction');
    return success;
  },
  getCategories: (): Category[] => safeGetItem(KEYS.CATEGORIES, []),
  saveCategory: (category: Category): boolean => {
    const items = StorageService.getCategories();
    const success = safeSetItem(KEYS.CATEGORIES, [...items, category]);
    if (success) notifyListeners('category');
    return success;
  },
  updateCategory: (updatedCategory: Category): boolean => {
    const items = StorageService.getCategories();
    const index = items.findIndex(c => c.id === updatedCategory.id);
    if (index === -1) return false;
    items[index] = updatedCategory;
    const success = safeSetItem(KEYS.CATEGORIES, items);
    if (success) notifyListeners('category');
    return success;
  },
  deleteCategory: (id: string): boolean => {
    const items = StorageService.getCategories().filter(c => c.id !== id);
    const success = safeSetItem(KEYS.CATEGORIES, items);
    if (success) notifyListeners('category');
    return success;
  },
  getBudgets: (): Budget[] => safeGetItem(KEYS.BUDGETS, []),
  saveBudget: (budget: Budget): boolean => {
    const items = StorageService.getBudgets();
    const index = items.findIndex(b => b.categoryId === budget.categoryId);
    if (index !== -1) items[index] = budget;
    else items.push(budget);
    const success = safeSetItem(KEYS.BUDGETS, items);
    if (success) notifyListeners('budget');
    return success;
  },
  getMonthlySummaries: (): MonthlySummary[] => safeGetItem(KEYS.SUMMARIES, []),
  clearAllData: (): boolean => {
    try {
      Object.values(KEYS).forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(VERSION_KEY);
      initData();
      Object.keys(listeners).forEach(type => notifyListeners(type as StorageEventType));
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },
};
