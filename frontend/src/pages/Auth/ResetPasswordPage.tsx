import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Validate Token existence immediately
  useEffect(() => {
    if (!token) {
      setError('El enlace de recuperación no es válido o ha expirado.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al restablecer la contraseña');
      }

      setSuccess(true);
      // Auto-redirect removed to let user see success message clearly, 
      // or handled inside the success view.
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-dvh bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center animate-fade-in bg-app-surface border border-app-border rounded-3xl p-8 shadow-xl">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 mb-6 animate-scale-in">
            <span className="material-symbols-outlined text-5xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold text-app-text mb-2 tracking-tight">¡Contraseña Actualizada!</h1>
          <p className="text-app-muted text-sm mb-6">
            Has recuperado el acceso a tu cuenta exitosamente.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={() => navigate('/login')} className="btn btn-primary w-full py-3 rounded-xl shadow-lg">
              Iniciar Sesión
            </button>
            <p className="text-xs text-app-muted animate-pulse">Redirigiendo automáticamente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text p-4 font-sans">

      {/* Decoration */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[400px] animate-fade-in">

        <div className="flex flex-col items-center mb-8">
          <div className="size-16 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center text-brand-primary shadow-xl shadow-black/5 mb-4">
            <span className="material-symbols-outlined text-[32px]">vpn_key</span>
          </div>
          <h1 className="text-2xl font-bold text-app-text text-center tracking-tight">Nueva Contraseña</h1>
          <p className="text-sm text-app-muted mt-1 text-center">
            Crea una contraseña segura para tu cuenta
          </p>
        </div>

        <div className="bg-app-surface border border-app-border rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">
                Contraseña Nueva
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-brand-primary transition-colors material-symbols-outlined text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token || isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface disabled:opacity-50"
                />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">
                Confirmar
              </label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-brand-primary transition-colors material-symbols-outlined text-[20px]">
                  lock_reset
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token || isLoading}
                  className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-brand-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface disabled:opacity-50"
                />
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl animate-scale-in">
                <span className="material-symbols-outlined text-rose-500 text-[20px]">error</span>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            {/* Action */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold rounded-xl shadow-lg shadow-brand-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Actualizar Contraseña</span>
                )}
              </button>

              <div className="flex justify-center pt-2">
                <Link to="/login" className="text-xs font-bold text-app-muted hover:text-app-text transition-colors">
                  Cancelar
                </Link>
              </div>
            </div>

          </form>
        </div>

        <p className="mt-8 text-center text-[10px] text-app-muted/50">
          Finanzas Pro Security
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;