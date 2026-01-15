import { Transaction, Category, Budget, Profile, RecurringTransaction, Account, InstallmentPurchase, Loan, LoanSummary, Investment, InvestmentType } from '../types';

const API_URL = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } as any;
};

// Installment Purchases
export const getInstallmentPurchases = async (): Promise<InstallmentPurchase[]> => {
    const response = await fetch(`${API_URL}/installments`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch installment purchases');
    return response.json();
};

export const addInstallmentPurchase = async (purchase: Omit<InstallmentPurchase, 'id' | 'user' | 'account' | 'generatedTransactions' | 'paidInstallments' | 'paidAmount' | 'userId' | 'monthlyPayment'>): Promise<InstallmentPurchase> => {
    const response = await fetch(`${API_URL}/installments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(purchase),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add installment purchase');
    }
    return response.json();
};

export const getInstallmentPurchase = async (id: string): Promise<InstallmentPurchase> => {
    const response = await fetch(`${API_URL}/installments/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch installment purchase');
    return response.json();
};

export const updateInstallmentPurchase = async (id: string, purchase: Partial<Omit<InstallmentPurchase, 'id' | 'user' | 'account' | 'generatedTransactions' | 'paidInstallments' | 'paidAmount' | 'userId' | 'monthlyPayment'>>): Promise<InstallmentPurchase> => {
    const response = await fetch(`${API_URL}/installments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(purchase),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update installment purchase');
    }
    return response.json();
};

export const deleteInstallmentPurchase = async (id: string, revertBalance: boolean = false): Promise<void> => {
    const url = revertBalance ? `${API_URL}/installments/${id}?revert=true` : `${API_URL}/installments/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete installment purchase');
    }
};

export const payInstallment = async (id: string, payment: { amount: number; description?: string; date: string; accountId: string }): Promise<any> => {
    const response = await fetch(`${API_URL}/installments/${id}/pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payment),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process installment payment');
    }
    return response.json();
};

// Accounts
export const getAccounts = async (): Promise<Account[]> => {
    const response = await fetch(`${API_URL}/accounts`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch accounts');
    return response.json();
};

export const addAccount = async (account: Omit<Account, 'id' | 'userId' | 'transactions'>): Promise<Account> => {
    const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(account),
    });
    if (!response.ok) throw new Error('Failed to add account');
    return response.json();
};

export const updateAccount = async (id: string, account: Partial<Omit<Account, 'id' | 'userId' | 'transactions'>>): Promise<Account> => {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(account),
    });
    if (!response.ok) throw new Error('Failed to update account');
    return response.json();
};

export const deleteAccount = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('Cannot delete account because it has associated transactions.');
        }
        throw new Error('Failed to delete account');
    }
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

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add transaction');
    }
    return response.json();
};

export const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(transaction),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
    }
    return response.json();
};

export const deleteTransaction = async (id: string, force: boolean = false): Promise<void> => {
    const url = force ? `${API_URL}/transactions/${id}?force=true` : `${API_URL}/transactions/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete transaction');
    }
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

export const getRecurringTransaction = async (id: string): Promise<RecurringTransaction> => {
    const response = await fetch(`${API_URL}/recurring/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch recurring transaction');
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

// Deleted Transactions (Trash/Recycle Bin)
export const getDeletedTransactions = async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/transactions/deleted`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch deleted transactions');
    return response.json();
};

export const restoreTransaction = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/transactions/${id}/restore`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to restore transaction');
    }
};

// Financial Planning
export interface FinancialPeriodSummary {
    periodStart: string;
    periodEnd: string;
    periodType: 'quincenal' | 'mensual' | 'semanal';
    currentBalance: number;
    currentDebt: number;
    currentMSIDebt: number;
    expectedIncome: any[];
    totalExpectedIncome: number;
    totalReceivedIncome: number;
    totalPeriodIncome: number;
    expectedExpenses: any[];
    msiPaymentsDue: any[];
    totalExpectedExpenses: number;
    totalMSIPayments: number;
    totalCommitments: number;
    projectedBalance: number;
    netWorth: number;
    disposableIncome: number;
    budgetAnalysis?: {
        needs: { projected: number; ideal: number };
        wants: { projected: number; ideal: number };
        savings: { projected: number; ideal: number };
    };
    isSufficient: boolean;
    shortfall?: number;
    warnings: string[];
}

export const getFinancialPeriodSummary = async (
    periodType: 'quincenal' | 'mensual' | 'semanal' | 'bimestral' | 'semestral' | 'anual' = 'quincenal',
    mode: 'calendar' | 'projection' = 'calendar'
): Promise<FinancialPeriodSummary> => {
    const response = await fetch(`${API_URL}/financial-planning/summary?period=${periodType}&mode=${mode}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch financial period summary');
    return response.json();
};

export const getUpcomingCommitments = async (days: number = 7): Promise<any> => {
    const response = await fetch(`${API_URL}/financial-planning/upcoming?days=${days}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch upcoming commitments');
    return response.json();
};

// Manual Recurring Actions
export const payRecurringTransaction = async (id: string, data?: { amount?: number; date?: string }): Promise<any> => {
    const response = await fetch(`${API_URL}/recurring/${id}/pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to pay recurring transaction' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

export const skipRecurringTransaction = async (id: string): Promise<any> => {
    const response = await fetch(`${API_URL}/recurring/${id}/skip`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to skip recurring transaction' }));
        throw new Error(errorData.message);
    }
    return response.json();
};

// Credit Card Payments
export interface CreditCardStatement {
    accountId: string;
    accountName: string;
    creditLimit: number | null;
    currentBalance: number;
    billingCycle: {
        startDate: string;
        cutoffDate: string;
        paymentDate: string;
        isBeforeCutoff: boolean;
        daysUntilCutoff: number;
        daysUntilPayment: number;
    };
    msiCharges: Array<{
        id: string;
        description: string;
        amount: number;
        currentInstallment: number;
        totalInstallments: number;
        remainingAmount: number;
        paidAmount: number;
        categoryName: string;
        categoryColor: string;
        categoryIcon: string;
    }>;
    msiTotal: number;
    msiCount: number;
    regularCharges: Array<{
        id: string;
        description: string;
        amount: number;
        date: string;
        categoryName: string;
        categoryColor: string;
        categoryIcon: string;
    }>;
    regularTotal: number;
    regularCount: number;
    totalDue: number;
    totalPaid: number;
    remainingDue: number;
    isFullyPaid: boolean;
    payments: Array<{
        id: string;
        amount: number;
        date: string;
        description: string;
    }>;
}

export const getCreditCardStatement = async (accountId: string): Promise<CreditCardStatement> => {
    const response = await fetch(`${API_URL}/credit-card/statement/${accountId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch credit card statement');
    return response.json();
};

export const payFullStatement = async (accountId: string, sourceAccountId: string, date?: string): Promise<any> => {
    const response = await fetch(`${API_URL}/credit-card/pay-statement/${accountId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sourceAccountId, date })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to pay statement' }));
        throw new Error(errorData.error || 'Failed to pay statement');
    }
    return response.json();
};

export const payMsiInstallment = async (installmentId: string, sourceAccountId: string, date?: string): Promise<any> => {
    const response = await fetch(`${API_URL}/credit-card/pay-msi/${installmentId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ sourceAccountId, date })
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to pay MSI installment' }));
        throw new Error(errorData.error || 'Failed to pay MSI installment');
    }
    return response.json();
};

export const revertStatementPayment = async (transactionId: string): Promise<any> => {
    const response = await fetch(`${API_URL}/credit-card/revert/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to revert payment' }));
        throw new Error(errorData.error || 'Failed to revert payment');
    }
    return response.json();
};

// ============== LOANS API ==============

export const getLoans = async (): Promise<Loan[]> => {
    const response = await fetch(`${API_URL}/loans`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch loans');
    return response.json();
};

export const getLoanSummary = async (): Promise<LoanSummary> => {
    const response = await fetch(`${API_URL}/loans/summary`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch loan summary');
    return response.json();
};

export const getLoan = async (id: string): Promise<Loan> => {
    const response = await fetch(`${API_URL}/loans/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch loan');
    return response.json();
};

export const addLoan = async (loan: {
    borrowerName: string;
    borrowerPhone?: string;
    borrowerEmail?: string;
    reason?: string;
    loanType?: 'lent' | 'borrowed';
    originalAmount: number;
    loanDate: string;
    expectedPayDate?: string;
    notes?: string;
    accountId?: string;
    affectBalance?: boolean;
}): Promise<Loan> => {
    const response = await fetch(`${API_URL}/loans`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(loan),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add loan');
    }
    return response.json();
};

export const updateLoan = async (id: string, loan: {
    borrowerName?: string;
    borrowerPhone?: string;
    borrowerEmail?: string;
    reason?: string;
    expectedPayDate?: string;
    notes?: string;
}): Promise<Loan> => {
    const response = await fetch(`${API_URL}/loans/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(loan),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update loan');
    }
    return response.json();
};

export const registerLoanPayment = async (id: string, payment: {
    amount: number;
    paymentDate?: string;
    notes?: string;
    accountId?: string;
}): Promise<Loan> => {
    const response = await fetch(`${API_URL}/loans/${id}/payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payment),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register payment');
    }
    return response.json();
};

export const markLoanAsPaid = async (id: string, accountId?: string): Promise<Loan> => {
    const response = await fetch(`${API_URL}/loans/${id}/mark-paid`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ accountId }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark loan as paid');
    }
    return response.json();
};

export const deleteLoan = async (id: string, revertBalance: boolean = false): Promise<void> => {
    const url = revertBalance ? `${API_URL}/loans/${id}?revert=true` : `${API_URL}/loans/${id}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete loan');
    }
};

// ============== INVESTMENTS API ==============

export const getInvestments = async (): Promise<Investment[]> => {
    const response = await fetch(`${API_URL}/investments`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch investments');
    return response.json();
};

export const addInvestment = async (investment: Omit<Investment, 'id' | 'userId' | 'lastPriceUpdate'>): Promise<Investment> => {
    const response = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(investment),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add investment');
    }
    return response.json();
};

export const updateInvestment = async (id: string, investment: Partial<Omit<Investment, 'id' | 'userId'>>): Promise<Investment> => {
    const response = await fetch(`${API_URL}/investments/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(investment),
    });
    if (!response.ok) throw new Error('Failed to update investment');
    return response.json();
};

export const deleteInvestment = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/investments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete investment');
};

// ============== GOALS API ==============

import { SavingsGoal } from '../types';

export const getGoals = async (): Promise<SavingsGoal[]> => {
    const response = await fetch(`${API_URL}/goals`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch goals');
    return response.json();
};

export const addGoal = async (goal: Omit<SavingsGoal, 'id' | 'currentAmount' | 'contributions'>): Promise<SavingsGoal> => {
    const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(goal),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add goal');
    }
    return response.json();
};

export const updateGoal = async (id: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal> => {
    const response = await fetch(`${API_URL}/goals/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(goal),
    });
    if (!response.ok) throw new Error('Failed to update goal');
    return response.json();
};

export const deleteGoal = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete goal');
};

export const addGoalContribution = async (id: string, contribution: { amount: number; date?: string; notes?: string; sourceAccountId: string }): Promise<any> => {
    const response = await fetch(`${API_URL}/goals/${id}/contribute`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(contribution),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add contribution');
    }
    return response.json();
};

export const withdrawFromGoal = async (id: string, withdrawal: { amount: number; targetAccountId: string }): Promise<any> => {
    const response = await fetch(`${API_URL}/goals/${id}/withdraw`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(withdrawal),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to withdraw');
    }
    return response.json();
};

// ============== NOTIFICATIONS API ==============

export const getNotifications = async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/notifications`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

export const markNotificationRead = async (id: string): Promise<any> => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
};

export const markAllNotificationsRead = async (): Promise<any> => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark all notifications as read');
    return response.json();
};

export const triggerDebugNotification = async (): Promise<any> => {
    const response = await fetch(`${API_URL}/notifications/debug-trigger`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to trigger debug notification');
    return response.json();
};