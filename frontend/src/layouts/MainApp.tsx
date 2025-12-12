import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import NewTransaction from '../pages/NewTransaction';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import Reports from '../pages/Reports';
import More from '../pages/More';
import Recurring from '../pages/Recurring';
import Categories from '../pages/Categories';
import AccountsPage from '../pages/AccountsPage';
import UpsertAccountPage from '../pages/Accounts/UpsertAccountPage';
import InstallmentsPage from '../pages/InstallmentsPage';
import UpsertInstallmentPage from '../pages/Installments/UpsertInstallmentPage';
import TrashPage from '../pages/TrashPage';
import FinancialAnalysis from '../pages/FinancialAnalysis';
import BottomNav from '../components/BottomNav';

const MainApp: React.FC = () => {
  const location = useLocation();
  const showBottomNav = !['/new'].includes(location.pathname);
  return (
    <div className="bg-app-bg text-app-text min-h-screen">
      <main className="pb-20 min-h-screen">
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
          <Route path="/categories" element={<Categories />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/new" element={<UpsertAccountPage />} />
          <Route path="/accounts/edit/:id" element={<UpsertAccountPage />} />
          <Route path="/installments" element={<InstallmentsPage />} />
          <Route path="/installments/edit/:id" element={<UpsertInstallmentPage />} />
          <Route path="/trash" element={<TrashPage />} />
        </Routes>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default MainApp;