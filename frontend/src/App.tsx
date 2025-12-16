import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
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

      {/* 
        🎨 TOASTER GLOBAL (Sonner)
        Estilos premium aplicados via classNames 
      */}
      <Toaster
        position="top-center"
        richColors={false}
        expand={false}
        closeButton
        toastOptions={{
          classNames: {
            toast: 'bg-app-surface dark:bg-[#1C1C1E] border border-app-border rounded-2xl shadow-lg backdrop-blur-xl',
            title: 'text-app-text font-bold text-sm',
            description: 'text-app-muted text-xs mt-0.5',
            actionButton: 'bg-app-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity',
            cancelButton: 'bg-app-subtle text-app-text text-xs font-medium px-3 py-1.5 rounded-lg',
            error: '!border-l-4 !border-l-rose-500',
            success: '!border-l-4 !border-l-emerald-500',
            warning: '!border-l-4 !border-l-amber-500',
            info: '!border-l-4 !border-l-blue-500',
          }
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<MainApp />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;