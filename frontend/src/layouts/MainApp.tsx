import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import History from '../pages/History';
import NewTransaction from '../pages/NewTransaction';
import Settings from '../pages/Settings';
import BottomNav from '../components/BottomNav';

const MainApp: React.FC = () => {
    const location = useLocation();
    const showBottomNav = !['/new'].includes(location.pathname);
  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      <main className="pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/new" element={<NewTransaction />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default MainApp;