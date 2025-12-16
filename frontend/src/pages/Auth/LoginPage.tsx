import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Error de credenciales');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            toastSuccess(`Bienvenido de nuevo, ${data.user.name.split(' ')[0]}`);
            navigate('/');

        } catch (err: any) {
            toastError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text p-4">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-app-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-[400px] animate-fade-in">

                {/* Header Brand */}
                <div className="flex flex-col items-center mb-8">
                    <AppLogo size={64} className="shadow-xl shadow-app-primary/20 mb-4 rounded-2xl" />
                    <h1 className="text-2xl font-bold tracking-tight text-app-text">Finanzas Pro</h1>
                    <p className="text-sm text-app-muted mt-1">Tu control financiero inteligente</p>
                </div>

                {/* Login Form Card */}
                <div className="bg-app-surface border border-app-border rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">
                    <form onSubmit={handleLogin} className="space-y-5">

                        <div>
                            <label className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">Email</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors material-symbols-outlined text-[20px]">
                                    mail
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-app-primary/30 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">Contraseña</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors material-symbols-outlined text-[20px]">
                                    lock
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-app-primary/30 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                                />
                            </div>
                            <div className="text-right mt-2">
                                <Link to="/forgot-password" className="text-xs font-bold text-app-primary hover:text-app-primary-dark transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-app-primary hover:bg-app-primary-dark text-white font-bold rounded-xl shadow-lg shadow-app-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Iniciar Sesión'}
                        </button>

                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-app-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest text-app-muted/50">
                            <span className="bg-app-surface px-4">O</span>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/register"
                            className="block w-full py-3 border-2 border-app-border rounded-xl font-bold text-app-text hover:bg-app-subtle hover:border-app-border-strong transition-all"
                        >
                            Crear cuenta nueva
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;