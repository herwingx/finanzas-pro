export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId?: string; // categoryId becomes optional for transfers
  category?: Category;
  accountId: string;
  account?: Account;
  destinationAccountId?: string; // New field for transfers
  destinationAccount?: Account;
  date: string;
  recurringTransactionId?: string;
  installmentPurchaseId?: string;
  loanId?: string;
  deletedAt?: string; // Soft delete timestamp
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

export type FrequencyType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'biweekly_15_30';

export interface RecurringTransaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  frequency: FrequencyType;
  startDate: string;
  nextDueDate: string;
  endDate?: string; // Fecha límite opcional - después de esta fecha no se proyectan más pagos
  active: boolean;
  categoryId: string;
  category?: Category;
  accountId: string;
  account?: Account;
}

export interface InstallmentPurchase {
  id: string;
  description: string;
  totalAmount: number;
  installments: number;
  monthlyPayment: number;
  purchaseDate: string;
  accountId: string;
  userId: string;
  account?: Account;
  generatedTransactions?: Transaction[];
  categoryId: string;
  paidInstallments: number;
  paidAmount: number;
}

export type AccountType = 'DEBIT' | 'CREDIT' | 'CASH' | 'LOAN' | 'INVESTMENT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  cutoffDay?: number;
  paymentDay?: number;
  interestRate?: number;
  userId: string;
  transactions?: Transaction[];
}

export interface Profile {
  name: string;
  email: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'MXN';
  timezone: string;
  avatar?: string;
  monthlyNetIncome?: number;
  incomeFrequency?: 'weekly' | 'biweekly' | 'monthly';
  taxRate?: number;
}

export type LoanStatus = 'active' | 'partial' | 'paid';
export type LoanType = 'lent' | 'borrowed'; // lent = presté (me deben), borrowed = me prestaron (debo)

export interface Loan {
  id: string;
  borrowerName: string;
  borrowerPhone?: string;
  borrowerEmail?: string;
  reason?: string;
  loanType: LoanType;
  originalAmount: number;
  remainingAmount: number;
  loanDate: string;
  expectedPayDate?: string;
  status: LoanStatus;
  notes?: string;
  userId: string;
  accountId?: string;
  account?: Account;
  createdAt: string;
  updatedAt: string;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoansCount: number;
  paidLoansCount: number;
  // Lo que me deben (presté)
  totalOwedToMe: number;
  lentLoansCount: number;
  // Lo que debo (me prestaron)
  totalIOwe: number;
  borrowedLoansCount: number;
  // Balance neto (positivo = me deben más, negativo = debo más)
  netBalance: number;
  totalRecovered: number;
}

export type InvestmentType = 'STOCK' | 'CRYPTO' | 'BOND' | 'FUND' | 'ETF' | 'REAL_ESTATE' | 'OTHER';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  ticker?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice?: number;
  currency: string;
  purchaseDate: string;
  lastPriceUpdate?: string;
  notes?: string;
  userId: string;
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string;
  notes?: string;
  savingsGoalId: string;
  transactionId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  priority: number;
  status: 'active' | 'completed' | 'paused';
  contributions?: SavingsContribution[];
}

export interface TransactionFormInitialData {
  type?: TransactionType;
  amount?: string;
  description?: string;
  categoryId?: string;
  accountId?: string;
  destinationAccountId?: string;
  installmentPurchaseId?: string;
}