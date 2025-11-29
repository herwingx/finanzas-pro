import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { NewTransaction } from './pages/NewTransaction';
import { Categories } from './pages/Categories';
import { Reports } from './pages/Reports';
import { Budgets } from './pages/Budgets';
import { History } from './pages/History';
import { BottomNav } from './components/BottomNav';

const AppContent = () => {
  return (
    <div className="min-h-screen w-full bg-app-bg text-white relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewTransaction />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/history" element={<History />} />
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