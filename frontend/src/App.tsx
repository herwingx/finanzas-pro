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
    <Router>
      <ScrollToTop />

      {/* 
        🎨 TOASTER GLOBAL (Sonner)
        Estilos premium aplicados via classNames 
      */}
      <Toaster
        position="top-center"
        richColors={false}
        expand={true}
        gap={8}
        closeButton={false}
        visibleToasts={3}
        toastOptions={{
          duration: 4000, // Un poco más de tiempo para leer
          classNames: {
            /* 
               BASE CARD STYLE
            */
            toast: `
        group toast 
        bg-app-surface/95 dark:bg-[#18181b]
        backdrop-blur-2xl 
        border border-black/5 dark:border-white/10
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
        rounded-[24px] 
        p-4 
        font-sans 
        items-start
      `,

            /* 
               TYPOGRAPHY REFACTOR
               Eliminé los colores hardcodeados aquí para que hereden 
               el alto contraste de las variantes de abajo.
            */
            title: 'text-[14px] font-bold mb-0.5 !leading-snug',
            description: 'text-[13px] font-medium !opacity-90 leading-snug',

            actionButton: `
        bg-current/10 hover:bg-current/20 
        !text-current 
        text-xs font-bold px-4 py-2 
        rounded-xl active:scale-95 transition-transform 
      `,
            cancelButton: `
        bg-app-subtle hover:bg-app-border
        text-app-text 
        text-xs font-medium px-3 py-2 
        rounded-xl transition-colors
      `,

            /* 
               HIGH CONTRAST VARIANTS
               Light: Fondo Pastel + Borde Sutil + Texto Muy Oscuro
               Dark:  Fondo Oscuro Tintado + Borde Sutil + Texto Casi Blanco
            */
            success: `
        /* Light Mode */
        !bg-emerald-50 !border-emerald-200 !text-emerald-950
        /* Dark Mode: Fondo casi negro con tinte verde, Texto Blanco Verdoso */
        dark:!bg-emerald-950/30 dark:!border-emerald-800/50 dark:!text-emerald-50
        /* Icon Color */
        [&_[data-icon]]:!text-emerald-600 dark:[&_[data-icon]]:!text-emerald-400
      `,

            error: `
        /* Light Mode */
        !bg-rose-50 !border-rose-200 !text-rose-950
        /* Dark Mode */
        dark:!bg-rose-950/30 dark:!border-rose-800/50 dark:!text-rose-50
        /* Icon */
        [&_[data-icon]]:!text-rose-600 dark:[&_[data-icon]]:!text-rose-400
      `,

            warning: `
        /* Light Mode */
        !bg-amber-50 !border-amber-200 !text-amber-950
        /* Dark Mode */
        dark:!bg-amber-950/30 dark:!border-amber-800/50 dark:!text-amber-50
        /* Icon */
        [&_[data-icon]]:!text-amber-600 dark:[&_[data-icon]]:!text-amber-400
      `,

            info: `
        /* Light Mode */
        !bg-blue-50 !border-blue-200 !text-blue-950
        /* Dark Mode */
        dark:!bg-blue-950/30 dark:!border-blue-800/50 dark:!text-blue-50
        /* Icon */
        [&_[data-icon]]:!text-blue-600 dark:[&_[data-icon]]:!text-blue-400
      `,
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