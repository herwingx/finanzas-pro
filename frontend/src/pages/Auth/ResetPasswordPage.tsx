import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Token de reseteo no válido');
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
        throw new Error(data.message || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-app-success/20 mb-6 animate-scale-in">
            <span className="material-symbols-outlined text-app-success text-5xl">check_circle</span>
          </div>
          <h1 className="text-3xl font-bold text-app-text mb-2">¡Contraseña Actualizada!</h1>
          <p className="text-app-muted mb-4">Tu contraseña ha sido cambiada exitosamente.</p>
          <p className="text-sm text-app-muted">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-app-primary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-app-secondary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-app-primary to-app-secondary shadow-premium mb-4">
            <span className="material-symbols-outlined text-white text-3xl">vpn_key</span>
          </div>
          <h1 className="text-3xl font-bold text-app-text mb-2">Nueva Contraseña</h1>
          <p className="text-app-muted">Ingresa tu nueva contraseña</p>
        </div>

        {/* Reset Card */}
        <div className="bg-app-card border border-app-border rounded-3xl p-8 shadow-premium-xl card-gradient">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password Input */}
            <div className="space-y-2 group">
              <label htmlFor="password" className="block text-sm font-bold text-app-text tracking-wide transition-colors group-focus-within:text-app-primary">
                Nueva Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-app-muted text-xl transition-colors group-focus-within:text-app-primary">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-app-bg/50 border border-app-border rounded-xl text-app-text placeholder-app-muted/50 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary focus:bg-app-elevated transition-all duration-300"
                  placeholder="••••••••"
                  required
                  disabled={!token}
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2 group">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-app-text tracking-wide transition-colors group-focus-within:text-app-primary">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-app-muted text-xl transition-colors group-focus-within:text-app-primary">
                  lock_check
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-app-bg/50 border border-app-border rounded-xl text-app-text placeholder-app-muted/50 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary focus:bg-app-elevated transition-all duration-300"
                  placeholder="••••••••"
                  required
                  disabled={!token}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-app-danger/10 border border-app-danger/20 rounded-xl animate-scale-in">
                <span className="material-symbols-outlined text-app-danger text-sm">error</span>
                <p className="text-sm text-app-danger font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full py-4 bg-gradient-to-r from-app-primary to-app-secondary text-white font-bold rounded-xl shadow-lg shadow-app-primary/25 hover:shadow-xl hover:shadow-app-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">check</span>
                  <span>Cambiar Contraseña</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-divider"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-app-card text-app-muted">o</span>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-app-elevated border border-app-border text-app-text font-semibold rounded-xl hover:bg-app-bg hover:border-app-primary/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span>Volver al Login</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-app-muted">
          <p>© 2024 Finanzas Pro. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
