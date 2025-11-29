import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import 'react-datepicker/dist/react-datepicker.css';

import { Dashboard } from './pages/Dashboard';
import { NewTransaction } from './pages/NewTransaction';
import { Categories } from './pages/Categories';
import { Reports } from './pages/Reports';
import { Budgets } from './pages/Budgets';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { More } from './pages/More';

import { BottomNav } from './components/BottomNav';
import useTheme from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  useTheme(); // Apply theme logic globally

  return (
    <div className="min-h-screen w-full bg-app-bg text-app-text relative">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewTransaction />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/more" element={<More />} />
      </Routes>
      <BottomNav />
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
