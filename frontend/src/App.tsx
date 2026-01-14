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
        position="top-center" // 'bottom-center' también es bueno en móvil para alcance fácil
        richColors={false}    // Lo ponemos en false para usar nuestros colores custom semánticos
        expand={true}         // Permite ver múltiples notificaciones apiladas (efecto tarjeta)
        gap={8}               // Espacio entre toasts
        closeButton={false}   // En móvil es mejor hacer swipe para descartar
        visibleToasts={3}     // Limita el ruido visual

        toastOptions={{
          // Duration default
          duration: 3500,

          classNames: {
            /* 
               BASE CARD STYLE
               - Rounded-3xl para coincidir con tus Bento Cards.
               - Backdrop-blur fuerte para el efecto glass.
               - Shadow-float custom para profundidad.
            */
            toast: `
        group toast 
        bg-app-surface/95 dark:bg-[#121212]/95
        backdrop-blur-2xl 
        border border-black/5 dark:border-white/10
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
        rounded-[24px] 
        p-4 
        font-sans
        items-start
      `,

            /* 
               TYPOGRAPHY
               - Alineación ajustada y pesos modernos.
            */
            title: 'text-[14px] font-bold text-app-text leading-tight mb-0.5',
            description: 'text-[12px] font-medium text-app-muted leading-snug',

            /* 
               BUTTONS
               - Botones de acción integrados y táctiles.
            */
            actionButton: `
        bg-app-primary text-white 
        text-xs font-bold px-4 py-2 
        rounded-xl active:scale-95 transition-transform 
        shadow-lg shadow-app-primary/20
      `,
            cancelButton: `
        bg-app-subtle text-app-muted 
        text-xs font-bold px-3 py-2 
        rounded-xl hover:text-app-text transition-colors
      `,

            /* 
               STATE VARIANTS (Glass Tints)
               En lugar de bordes duros, usamos un tinte muy sutil en el fondo 
               y coloreamos el texto/icono.
            */
            success: `
        !bg-emerald-50/90 dark:!bg-emerald-950/20 
        !border-emerald-100 dark:!border-emerald-900/50 
        !text-emerald-700 dark:!text-emerald-200
        [&_[data-icon]]:!text-emerald-500
      `,
            error: `
        !bg-rose-50/90 dark:!bg-rose-950/20 
        !border-rose-100 dark:!border-rose-900/50 
        !text-rose-700 dark:!text-rose-200
        [&_[data-icon]]:!text-rose-500
      `,
            warning: `
        !bg-amber-50/90 dark:!bg-amber-950/20 
        !border-amber-100 dark:!border-amber-900/50 
        !text-amber-700 dark:!text-amber-200
        [&_[data-icon]]:!text-amber-500
      `,
            info: `
        !bg-blue-50/90 dark:!bg-blue-950/20 
        !border-blue-100 dark:!border-blue-900/50 
        !text-blue-700 dark:!text-blue-200
        [&_[data-icon]]:!text-blue-500
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