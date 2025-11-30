export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  budgetType?: 'need' | 'want' | 'savings';
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
}

export type FrequencyType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  frequency: FrequencyType;
  startDate: string;
  nextDueDate: string;
  active: boolean;
}

export interface Profile {
    name: string;
    currency: 'USD' | 'EUR' | 'GBP' | 'MXN';
    avatar?: string;
}