import { useQuery } from '@tanstack/react-query';
import * as apiService from '../services/apiService';

export interface FinancialPeriodSummary {
  periodStart: string;
  periodEnd: string;
  periodType: 'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual';

  // Current state
  currentBalance: number;
  currentDebt: number; // Total credit card debt
  currentMSIDebt: number; // Remaining MSI payments

  // Expected income
  expectedIncome: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    type: string;
  }>;
  totalExpectedIncome: number;

  // Expected expenses
  expectedExpenses: Array<{
    id: string;
    uniqueId?: string;
    description: string;
    amount: number;
    dueDate: string;
    type: string;
    isOverdue?: boolean;
    category?: {
      name: string;
      color: string;
      icon: string;
    };
  }>;

  // MSI payments due
  msiPaymentsDue: Array<{
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    accountId: string;
    accountName: string;
    isMsi: boolean;
    msiTotal?: number;
    paidAmount?: number;
    category?: {
      name: string;
      color: string;
      icon: string;
    };
  }>;

  totalExpectedExpenses: number;
  totalMSIPayments: number;

  // Projections
  totalCommitments: number; // expenses + MSI
  projectedBalance: number; // current + income - commitments
  netWorth: number; // assets - debt
  disposableIncome: number; // What you'll have after all commitments

  budgetAnalysis?: {
    needs: { projected: number; ideal: number };
    wants: { projected: number; ideal: number };
    savings: { projected: number; ideal: number };
  };

  // Alerts
  isSufficient: boolean;
  shortfall?: number;
  warnings: string[];
}

export const useFinancialPeriodSummary = (periodType: 'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual' = 'quincenal') => {
  return useQuery<FinancialPeriodSummary>({
    queryKey: ['financialPeriodSummary', periodType],
    queryFn: () => apiService.getFinancialPeriodSummary(periodType),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpcomingCommitments = (days: number = 7) => {
  return useQuery({
    queryKey: ['upcomingCommitments', days],
    queryFn: () => apiService.getUpcomingCommitments(days),
    staleTime: 1000 * 60 * 5,
  });
};
