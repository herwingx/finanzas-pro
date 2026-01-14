import React, { useMemo, useState } from 'react';
import { Routes, Route, useLocation, Link, NavLink, useNavigate } from 'react-router-dom';

// Global Context
import { GlobalSheetProvider, useGlobalSheets } from '../context/GlobalSheetContext';
import { SwipeableBottomSheet } from '../components/SwipeableBottomSheet';
import { InvestmentForm } from '../components/forms/InvestmentForm';
import { GoalForm } from '../components/forms/GoalForm';
import { InstallmentForm } from '../components/forms/InstallmentForm';
import { LoanForm } from '../components/forms/LoanForm';
import { RecurringForm } from '../components/forms/RecurringForm';
import { TransactionForm } from '../components/forms/TransactionForm';
import { AccountForm } from '../components/forms/AccountForm';
import { CategoryForm } from '../components/forms/CategoryForm';

// Pages
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import NewTransaction from '../pages/NewTransaction';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Reports from '../pages/Reports';
import More from '../pages/More';
import Recurring from '../pages/Recurring';
import NewRecurringPage from '../pages/NewRecurringPage';
import Categories from '../pages/Categories';
import UpsertCategoryPage from '../pages/UpsertCategoryPage';
import AccountsPage from '../pages/AccountsPage';
import UpsertAccountPage from '../pages/Accounts/UpsertAccountPage';
import InstallmentsPage from '../pages/InstallmentsPage';
import UpsertInstallmentPage from '../pages/Installments/UpsertInstallmentPage';
import TrashPage from '../pages/TrashPage';
import FinancialAnalysis from '../pages/FinancialAnalysis';
import LoansPage from '../pages/LoansPage';
import LoanFormPage from '../pages/LoanFormPage';
import InvestmentsPage from '../pages/InvestmentsPage';
import GoalsPage from '../pages/GoalsPage';

// Components
import BottomNav from '../components/BottomNav';
import { AppLogo } from '../components/AppLogo';
import { DesktopFAB } from '../components/DesktopFAB';
import { MobileFAB } from '../components/MobileFAB';
import { DesktopSidebar } from '../components/DesktopSidebar'; // New Import

// Pages that show the mobile bottom nav
const MAIN_NAV_PAGES = ['/', '/history', '/accounts', '/more'];

// --- Component to render dynamic global sheets ---
const GlobalSheetsContainer = () => {
  const {
    isInvestmentSheetOpen,
    closeInvestmentSheet,
    investmentToEdit,
    isGoalSheetOpen,
    closeGoalSheet,
    goalToEdit,
    isInstallmentSheetOpen,
    closeInstallmentSheet,
    installmentToEdit,
    isLoanSheetOpen,
    closeLoanSheet,
    loanToEdit,
    isRecurringSheetOpen,
    closeRecurringSheet,
    recurringToEdit,
    isTransactionSheetOpen,
    closeTransactionSheet,
    transactionToEdit,
    transactionInitialData,
    isAccountSheetOpen,
    closeAccountSheet,
    accountToEdit,
    isCategorySheetOpen,
    closeCategorySheet,
    categoryToEdit
  } = useGlobalSheets();

  return (
    <>
      {isInvestmentSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeInvestmentSheet}>
          <InvestmentForm
            existingInvestment={investmentToEdit}
            onClose={closeInvestmentSheet}
          />
        </SwipeableBottomSheet>
      )}

      {isGoalSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeGoalSheet}>
          <GoalForm
            existingGoal={goalToEdit}
            onClose={closeGoalSheet}
            isSheetMode={true}
          />
        </SwipeableBottomSheet>
      )}

      {isInstallmentSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeInstallmentSheet}>
          <InstallmentForm
            existingPurchase={installmentToEdit}
            onCancel={closeInstallmentSheet}
            onSuccess={closeInstallmentSheet}
            isEditMode={!!installmentToEdit}
            isSheetMode={true}
          />
        </SwipeableBottomSheet>
      )}

      {isLoanSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeLoanSheet}>
          <LoanForm
            existingLoan={loanToEdit}
            onClose={closeLoanSheet}
            isSheetMode={true}
          />
        </SwipeableBottomSheet>
      )}

      {isRecurringSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeRecurringSheet}>
          <RecurringForm
            existingTransaction={recurringToEdit}
            onClose={closeRecurringSheet}
            isSheetMode={true}
          />
        </SwipeableBottomSheet>
      )}

      {isTransactionSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeTransactionSheet}>
          <TransactionForm
            existingTransaction={transactionToEdit}
            initialData={transactionInitialData}
            onClose={closeTransactionSheet}
            isSheetMode={true}
          />
        </SwipeableBottomSheet>
      )}

      {isAccountSheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeAccountSheet}>
          <AccountForm
            existingAccount={accountToEdit}
            onClose={closeAccountSheet}
          />
        </SwipeableBottomSheet>
      )}

      {isCategorySheetOpen && (
        <SwipeableBottomSheet isOpen={true} onClose={closeCategorySheet}>
          <CategoryForm
            existingCategory={categoryToEdit}
            onClose={closeCategorySheet}
          />
        </SwipeableBottomSheet>
      )}
    </>
  );
};

const MainAppContent: React.FC = () => {
  const location = useLocation();
  const isMainNavPage = MAIN_NAV_PAGES.includes(location.pathname);

  return (
    <div className="flex min-h-dvh bg-app-bg text-app-text font-sans selection:bg-app-primary selection:text-white">

      <DesktopSidebar />
      <DesktopFAB />

      <main
        className={`
          flex-1 transition-all duration-300 relative w-full
          lg:pl-72 
          ${isMainNavPage ? 'pb-28' : 'pb-safe'}
        `}
      >
        <div className="w-full max-w-[1200px] mx-auto animate-fade-in h-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/analysis" element={<FinancialAnalysis />} />
            <Route path="/new" element={<NewTransaction />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/more" element={<More />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/recurring/new" element={<NewRecurringPage />} />
            <Route path="/recurring/edit/:id" element={<NewRecurringPage />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/categories/new" element={<UpsertCategoryPage />} />
            <Route path="/categories/edit/:id" element={<UpsertCategoryPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/new" element={<UpsertAccountPage />} />
            <Route path="/accounts/edit/:id" element={<UpsertAccountPage />} />
            <Route path="/installments" element={<InstallmentsPage />} />
            <Route path="/installments/new" element={<UpsertInstallmentPage />} />
            <Route path="/installments/edit/:id" element={<UpsertInstallmentPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/loans/new" element={<LoanFormPage />} />
            <Route path="/loans/:id" element={<LoanFormPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/trash" element={<TrashPage />} />
          </Routes>
        </div>
      </main>

      {/* Global Modals */}
      <GlobalSheetsContainer />

      {isMainNavPage && <BottomNav />}
      <MobileFAB />

    </div>
  );
};

const MainApp: React.FC = () => {
  return (
    <GlobalSheetProvider>
      <MainAppContent />
    </GlobalSheetProvider>
  );
};

export default MainApp;