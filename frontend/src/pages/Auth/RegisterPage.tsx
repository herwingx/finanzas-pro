import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toastSuccess, toastError } from '../../utils/toast';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Nota: Aquí se debería apuntar a tu backend real
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Error en el registro');
            }

            toastSuccess('¡Cuenta creada! Por favor inicia sesión');

            // Redirect to login page after successful registration
            // Pequeño delay para que el usuario lea el toast
            setTimeout(() => navigate('/login'), 1000);

        } catch (err: any) {
            toastError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text p-4 font-sans">

            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-app-primary/5 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-[400px] animate-fade-in">
                {/* Header Brand */}
                <div className="flex flex-col items-center mb-8">
                    <div className="size-14 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center text-app-primary shadow-lg mb-3">
                        <span className="material-symbols-outlined text-[28px]">person_add</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-app-text">Crear Cuenta</h1>
                    <p className="text-sm text-app-muted mt-1 text-center px-4">
                        Únete para controlar tus gastos de forma inteligente
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-app-surface border border-app-border rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/5 dark:shadow-black/20">
                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-app-muted tracking-wider mb-1.5 ml-1">Nombre Completo</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors material-symbols-outlined text-[20px]">
                                    badge
                                </span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu Nombre"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-app-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
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
                                    placeholder="hola@ejemplo.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-app-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
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
                                    placeholder="Min. 8 caracteres"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3 bg-app-bg border-2 border-transparent focus:border-app-primary/20 rounded-xl outline-none transition-all placeholder:text-app-muted/40 font-medium focus:bg-app-surface"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-app-primary hover:bg-app-primary-dark text-white font-bold rounded-xl shadow-lg shadow-app-primary/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <span>Registrarse</span>
                            )}
                        </button>
                    </form>

                    {/* Footer / Login Link */}
                    <div className="mt-8 pt-6 border-t border-app-border text-center">
                        <p className="text-sm text-app-muted mb-3">
                            ¿Ya tienes una cuenta?
                        </p>
                        <Link
                            to="/login"
                            className="inline-block px-6 py-2.5 rounded-xl font-bold text-sm bg-app-subtle hover:bg-app-border text-app-text transition-all"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>

                {/* Legal / Copyright */}
                <p className="mt-8 text-center text-[10px] text-app-muted/60">
                    Al registrarte aceptas nuestros Términos y Política de Privacidad. <br />
                    © 2024 Finanzas Pro
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;