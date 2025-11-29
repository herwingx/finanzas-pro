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

export const MOCK_TRANSACTIONS = [];

export const DEFAULT_BUDGETS = [];
