import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Mock / API Call
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al solicitar recuperación');
      }

      setMessage('Te hemos enviado un correo con las instrucciones.');
      // Opcional: Limpiar email o redirigir tras un tiempo
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text p-4 font-sans">

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[400px] animate-fade-in">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center text-brand-primary shadow-xl shadow-black/5 mb-4">
            <span className="material-symbols-outlined text-[32px]">lock_reset</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-app-text text-center">Recuperar Contraseña</h1>
          <p className="text-sm text-app-muted mt-1 text-center max-w-xs">
            Ingresa tu correo y te enviaremos un enlace de acceso
          </p>
        </div>

        {/* Card */}
        <div className="bg-app-surface border border-app-border rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-brand-primary transition-colors material-symbols-outlined text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                  placeholder="usuario@ejemplo.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Success Alert */}
            {message && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 animate-scale-in">
                <span className="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">check_circle</span>
                <div className="text-sm">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">¡Enviado!</p>
                  <p className="text-emerald-600/80 dark:text-emerald-500/80 text-xs mt-0.5 leading-snug">{message}</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex items-start gap-2.5 animate-scale-in">
                <span className="material-symbols-outlined text-rose-500 text-[18px] mt-0.5">error</span>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold rounded-xl shadow-lg shadow-brand-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Enviar Enlace</span>
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full py-3 flex items-center justify-center gap-2 rounded-xl text-sm font-bold text-app-text hover:bg-app-subtle border-2 border-transparent transition-all"
              >
                Volver al Inicio
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[10px] text-app-muted/50">
          © 2024 Finanzas Pro • Seguridad garantizada
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;