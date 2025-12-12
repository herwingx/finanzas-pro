import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to login');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to dashboard or home page after login
            navigate('/');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <span className="material-symbols-outlined text-white text-3xl">account_balance_wallet</span>
                    </div>
                    <h1 className="text-3xl font-bold text-app-text mb-2">Finanzas Pro</h1>
                    <p className="text-app-muted">Gestiona tus finanzas de forma inteligente</p>
                </div>

                {/* Login Card */}
                <div className="bg-app-card border border-app-border rounded-3xl p-8 shadow-premium-xl card-gradient">
                    <h2 className="text-2xl font-bold text-app-text mb-6">Iniciar Sesión</h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-2 group">
                            <label htmlFor="email" className="block text-sm font-bold text-app-text tracking-wide transition-colors group-focus-within:text-app-primary">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-app-muted text-xl transition-colors group-focus-within:text-app-primary">
                                    mail
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-app-bg/50 border border-app-border rounded-xl text-app-text placeholder-app-muted/50 focus:outline-none focus:ring-2 focus:ring-app-primary/50 focus:border-app-primary focus:bg-app-elevated transition-all duration-300"
                                    placeholder="ejemplo@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 group">
                            <label htmlFor="password" className="block text-sm font-bold text-app-text tracking-wide transition-colors group-focus-within:text-app-primary">
                                Contraseña
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
                                />
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-sm text-app-primary hover:text-app-secondary font-bold transition-colors cursor-pointer"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-app-danger/10 border border-app-danger/20 rounded-xl animate-scale-in">
                                <span className="material-symbols-outlined text-app-danger text-lg shrink-0">error</span>
                                <p className="text-sm text-app-danger font-bold">{error}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-app-primary via-app-primary to-app-secondary text-white font-bold text-lg rounded-xl shadow-lg shadow-app-primary/25 hover:shadow-xl hover:shadow-app-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Iniciando sesión...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">login</span>
                                    <span>Iniciar Sesión</span>
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

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-app-muted text-sm mb-3">
                            ¿No tienes una cuenta?
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="w-full py-3.5 bg-app-elevated border border-app-border text-app-text font-semibold rounded-xl hover:bg-app-bg hover:border-app-primary/50 transition-all duration-300"
                        >
                            Crear Cuenta
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

export default LoginPage;