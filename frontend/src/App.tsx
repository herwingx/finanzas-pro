import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProtectedRoute from './layouts/ProtectedRoute';
import MainApp from './layouts/MainApp';
import { ScrollToTop } from './components/ScrollToTop';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop />
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<MainApp />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;