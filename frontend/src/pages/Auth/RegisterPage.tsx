import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Utils
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
            // Reemplaza con fetch a tu backend real
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Error registrando usuario');
            }

            toastSuccess('¡Cuenta creada! Inicia sesión para continuar.');
            setTimeout(() => navigate('/login'), 1200);

        } catch (err: any) {
            toastError(err.message || 'Falló la conexión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text selection:bg-app-primary/30 p-4 font-sans">

            {/* --- DECORATIVE BACKGROUND --- */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500 opacity-[0.03] blur-[120px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-app-primary opacity-[0.03] blur-[120px] rounded-full mix-blend-multiply" />
            </div>

            <div className="w-full max-w-[420px] animate-fade-in space-y-8">

                {/* 1. HEADER */}
                <div className="flex flex-col items-center text-center">
                    <div className="size-16 mb-6 bg-app-surface border border-app-border rounded-2xl shadow-xl flex items-center justify-center text-app-primary">
                        <span className="material-symbols-outlined text-[32px]">person_add</span>
                    </div>
                    <h1 className="text-3xl font-black text-app-text tracking-tight mb-2">Comenzar Ahora</h1>
                    <p className="text-sm text-app-muted max-w-[280px]">
                        Crea tu perfil y toma el control de tus finanzas en segundos.
                    </p>
                </div>

                {/* 2. FORM CARD */}
                <div className="bg-app-surface/80 backdrop-blur-xl border border-app-border p-6 md:p-8 rounded-[32px] shadow-2xl shadow-black/5">

                    <form onSubmit={handleRegister} className="space-y-5">

                        {/* Name Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Nombre</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors text-[20px]">
                                    badge
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu Nombre"
                                    className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Correo</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors text-[20px]">
                                    mail
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hola@ejemplo.com"
                                    className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="group">
                            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors text-[20px]">
                                    lock_outline
                                </span>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-app-primary hover:bg-app-primary-dark text-white rounded-2xl font-bold text-sm shadow-lg shadow-app-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 active:scale-[0.98] transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creando Cuenta...</span>
                                </>
                            ) : (
                                <span>Registrarse</span>
                            )}
                        </button>

                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-app-border text-center">
                        <p className="text-xs text-app-muted font-medium mb-3">¿Ya eres miembro?</p>
                        <Link to="/login" className="inline-block px-6 py-2.5 bg-app-subtle hover:bg-app-border text-app-text rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                            Iniciar Sesión
                        </Link>
                    </div>

                </div>

                <div className="text-center px-8">
                    <p className="text-[10px] text-app-muted/60 leading-relaxed">
                        Al continuar, confirmas que has leído y aceptas nuestros Términos de Servicio y Política de Privacidad.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RegisterPage;