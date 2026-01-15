import React, { createContext, useContext, useState } from 'react';
import { Investment } from '../types';
import { SavingsGoal } from '../types';
import { InstallmentPurchase } from '../types';
import { Loan } from '../types';
import { RecurringTransaction } from '../types';
import { Transaction, TransactionFormInitialData } from '../types';
import { Account, Category } from '../types';

interface GlobalSheetContextType {
  openInvestmentSheet: (investment?: Investment | null) => void;
  closeInvestmentSheet: () => void;
  openGoalSheet: (goal?: SavingsGoal | null) => void;
  closeGoalSheet: () => void;
  openInstallmentSheet: (installment?: InstallmentPurchase | null) => void;
  closeInstallmentSheet: () => void;
  openLoanSheet: (loan?: Loan | null) => void;
  closeLoanSheet: () => void;
  openRecurringSheet: (transaction?: RecurringTransaction | null) => void;
  closeRecurringSheet: () => void;
  openTransactionSheet: (transaction?: Transaction | null, initialData?: TransactionFormInitialData | null) => void;
  closeTransactionSheet: () => void;
  openAccountSheet: (account?: Account | null) => void;
  closeAccountSheet: () => void;
  openCategorySheet: (category?: Category | null) => void;
  closeCategorySheet: () => void;

  isInvestmentSheetOpen: boolean;
  investmentToEdit: Investment | null;
  isGoalSheetOpen: boolean;
  goalToEdit: SavingsGoal | null;
  isInstallmentSheetOpen: boolean;
  installmentToEdit: InstallmentPurchase | null;
  isLoanSheetOpen: boolean;
  loanToEdit: Loan | null;
  isRecurringSheetOpen: boolean;
  recurringToEdit: RecurringTransaction | null;
  isTransactionSheetOpen: boolean;
  transactionToEdit: Transaction | null;
  transactionInitialData: TransactionFormInitialData | null;
  isAccountSheetOpen: boolean;
  accountToEdit: Account | null;
  isCategorySheetOpen: boolean;
  categoryToEdit: Category | null;
}

const GlobalSheetContext = createContext<GlobalSheetContextType | undefined>(undefined);

export const GlobalSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Investment Sheet State
  const [isInvestmentSheetOpen, setIsInvestmentSheetOpen] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(null);

  const openInvestmentSheet = (investment: Investment | null = null) => {
    setInvestmentToEdit(investment);
    setIsInvestmentSheetOpen(true);
  };

  const closeInvestmentSheet = () => {
    setIsInvestmentSheetOpen(false);
    setInvestmentToEdit(null);
  };

  // Goal Sheet State
  const [isGoalSheetOpen, setIsGoalSheetOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);

  const openGoalSheet = (goal: SavingsGoal | null = null) => {
    setGoalToEdit(goal);
    setIsGoalSheetOpen(true);
  };

  const closeGoalSheet = () => {
    setIsGoalSheetOpen(false);
    setGoalToEdit(null);
  };

  // Installment Sheet State
  const [isInstallmentSheetOpen, setIsInstallmentSheetOpen] = useState(false);
  const [installmentToEdit, setInstallmentToEdit] = useState<InstallmentPurchase | null>(null);

  const openInstallmentSheet = (installment: InstallmentPurchase | null = null) => {
    setInstallmentToEdit(installment);
    setIsInstallmentSheetOpen(true);
  };

  const closeInstallmentSheet = () => {
    setIsInstallmentSheetOpen(false);
    setInstallmentToEdit(null);
  };

  // Loan Sheet State
  const [isLoanSheetOpen, setIsLoanSheetOpen] = useState(false);
  const [loanToEdit, setLoanToEdit] = useState<Loan | null>(null);

  const openLoanSheet = (loan: Loan | null = null) => {
    setLoanToEdit(loan);
    setIsLoanSheetOpen(true);
  };

  const closeLoanSheet = () => {
    setIsLoanSheetOpen(false);
    setLoanToEdit(null);
  };

  // Recurring Sheet State
  const [isRecurringSheetOpen, setIsRecurringSheetOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringTransaction | null>(null);

  const openRecurringSheet = (transaction: RecurringTransaction | null = null) => {
    setRecurringToEdit(transaction);
    setIsRecurringSheetOpen(true);
  };

  const closeRecurringSheet = () => {
    setIsRecurringSheetOpen(false);
    setRecurringToEdit(null);
  };

  // Transaction Sheet State
  const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionInitialData, setTransactionInitialData] = useState<TransactionFormInitialData | null>(null);

  const openTransactionSheet = (transaction: Transaction | null = null, initialData: TransactionFormInitialData | null = null) => {
    setTransactionToEdit(transaction);
    setTransactionInitialData(initialData);
    setIsTransactionSheetOpen(true);
  };

  const closeTransactionSheet = () => {
    setIsTransactionSheetOpen(false);
    setTransactionToEdit(null);
    setTransactionInitialData(null);
  };

  // Account Sheet State
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const openAccountSheet = (account: Account | null = null) => {
    setAccountToEdit(account);
    setIsAccountSheetOpen(true);
  };

  const closeAccountSheet = () => {
    setIsAccountSheetOpen(false);
    setAccountToEdit(null);
  };

  // Category Sheet State
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  const openCategorySheet = (category: Category | null = null) => {
    setCategoryToEdit(category);
    setIsCategorySheetOpen(true);
  };

  const closeCategorySheet = () => {
    setIsCategorySheetOpen(false);
    setCategoryToEdit(null);
  };

  return (
    <GlobalSheetContext.Provider
      value={{
        openInvestmentSheet,
        closeInvestmentSheet,
        openGoalSheet,
        closeGoalSheet,
        openInstallmentSheet,
        closeInstallmentSheet,
        openLoanSheet,
        closeLoanSheet,
        openRecurringSheet,
        closeRecurringSheet,
        openTransactionSheet,
        closeTransactionSheet,
        openAccountSheet,
        closeAccountSheet,
        openCategorySheet,
        closeCategorySheet,

        isInvestmentSheetOpen,
        investmentToEdit,
        isGoalSheetOpen,
        goalToEdit,
        isInstallmentSheetOpen,
        installmentToEdit,
        isLoanSheetOpen,
        loanToEdit,
        isRecurringSheetOpen,
        recurringToEdit,
        isTransactionSheetOpen,
        transactionToEdit,
        transactionInitialData,
        isAccountSheetOpen,
        accountToEdit,
        isCategorySheetOpen,
        categoryToEdit,
      }}
    >
      {children}
    </GlobalSheetContext.Provider>
  );
};

export const useGlobalSheets = () => {
  const context = useContext(GlobalSheetContext);
  if (!context) {
    throw new Error('useGlobalSheets must be used within a GlobalSheetProvider');
  }
  return context;
};
