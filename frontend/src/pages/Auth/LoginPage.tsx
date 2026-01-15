import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Assets & Utils
import { toastSuccess, toastError } from '../../utils/toast';
import { AppLogo } from '../../components/AppLogo';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Reemplaza esto con tu llamada real a la API (Axios o Fetch)
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Credenciales incorrectas');
            }

            const data = await response.json();

            // Secure storage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            toastSuccess(`Bienvenido, ${data.user.name.split(' ')[0]}`);
            navigate('/', { replace: true });

        } catch (err: any) {
            toastError(err.message || 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text selection:bg-app-primary/30 p-4">

            {/* --- DECORATIVE BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-app-primary opacity-[0.03] blur-[100px] rounded-full mix-blend-multiply animate-blob" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-500 opacity-[0.03] blur-[100px] rounded-full mix-blend-multiply animate-blob animation-delay-2000" />
            </div>

            <div className="w-full max-w-[420px] animate-fade-in space-y-8">

                {/* 1. BRAND HEADER */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 p-4 bg-app-surface border border-app-border rounded-3xl shadow-xl shadow-app-primary/5">
                        <AppLogo size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-app-text tracking-tight mb-2">¡Hola de nuevo!</h1>
                    <p className="text-sm text-app-muted max-w-[280px]">
                        Ingresa tus credenciales para acceder a tu control financiero.
                    </p>
                </div>

                {/* 2. LOGIN CARD */}
                <div className="bento-card p-6 md:p-8 shadow-2xl shadow-black/5 relative overflow-hidden bg-app-surface/80 backdrop-blur-xl">

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">

                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-app-muted uppercase tracking-wider ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted/70 group-focus-within:text-app-primary transition-colors text-[22px]">alternate_email</span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-app-subtle border border-app-border/50 focus:border-app-primary/50 focus:bg-app-surface rounded-2xl py-4 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/40 font-bold text-sm"
                                    placeholder="nombre@ejemplo.com"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold text-app-muted uppercase tracking-wider">Contraseña</label>
                                <Link to="/forgot-password" className="text-[11px] font-bold text-app-primary hover:text-app-primary-dark transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted/70 group-focus-within:text-app-primary transition-colors text-[22px]">lock</span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-app-subtle border border-app-border/50 focus:border-app-primary/50 focus:bg-app-surface rounded-2xl py-4 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/40 font-bold text-sm tracking-wider"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {/* Submit Action */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-app-text text-app-bg hover:scale-[1.01] active:scale-[0.98] transition-all rounded-2xl font-black text-sm shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2.5 mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Accediendo...</span>
                                </>
                            ) : (
                                <>
                                    <span>Entrar a mi cuenta</span>
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </>
                            )}
                        </button>

                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-app-border"></div></div>
                        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-app-muted/60 bg-app-surface px-4">
                            O crea una cuenta
                        </div>
                    </div>

                    {/* Register Action */}
                    <Link to="/register" className="w-full block text-center py-4 border-2 border-app-border hover:bg-app-subtle hover:border-app-text/10 rounded-2xl font-bold text-sm text-app-text transition-all active:scale-[0.98]">
                        Registrarse Gratis
                    </Link>

                </div>

                <div className="text-center text-[10px] text-app-muted/60">
                    &copy; 2026 Finanzas Pro. Secure SSL Encrypted.
                </div>

            </div>
        </div>
    );
};

export default LoginPage;