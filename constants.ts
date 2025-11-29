import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: 'restaurant', color: 'hsl(38, 92%, 50%)', type: 'expense' },
  { id: '2', name: 'Hogar', icon: 'home', color: 'hsl(200, 98%, 48%)', type: 'expense' },
  { id: '3', name: 'Transporte', icon: 'directions_bus', color: 'hsl(280, 100%, 70%)', type: 'expense' },
  { id: '4', name: 'Ocio', icon: 'sports_esports', color: 'hsl(330, 85%, 60%)', type: 'expense' },
  { id: '5', name: 'Salud', icon: 'health_and_safety', color: 'hsl(0, 84%, 60%)', type: 'expense' },
  { id: '6', name: 'Salario', icon: 'payments', color: 'hsl(142, 76%, 56%)', type: 'income' },
  { id: '7', name: 'Freelance', icon: 'work', color: 'hsl(250, 84%, 54%)', type: 'income' },
];

export const MOCK_TRANSACTIONS = [
  { id: 't1', amount: 8.50, description: 'Cafetería del Sol', categoryId: '1', date: new Date().toISOString(), type: 'expense' },
  { id: 't2', amount: 75.40, description: 'Supermercado La Plaza', categoryId: '1', date: new Date(Date.now() - 86400000).toISOString(), type: 'expense' },
  { id: 't3', amount: 2100.00, description: 'Salario Mensual', categoryId: '6', date: new Date(Date.now() - 172800000).toISOString(), type: 'income' },
];

export const DEFAULT_BUDGETS = [
  { categoryId: '1', limit: 500 },
  { categoryId: '2', limit: 1600 },
  { categoryId: '3', limit: 400 },
  { categoryId: '4', limit: 200 },
];
