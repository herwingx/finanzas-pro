export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string; // ISO string
  type: TransactionType;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

// Helper type for charts
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}
