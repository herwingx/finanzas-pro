import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Form State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Get token from URL query params
    const token = searchParams.get('token');

    // Pre-validate Token presence
    useEffect(() => {
        if (!token) setError('Enlace de recuperación inválido o caducado.');
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Local Validation
        if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
        if (password.length < 6) return setError('La contraseña debe ser más segura (+6 caracteres).');

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Fallo al restablecer contraseña.');

            setSuccess(true);
            // Auto-redirect for smooth UX
            setTimeout(() => navigate('/login'), 2500);

        } catch (err: any) {
            setError(err.message || 'Error desconocido.');
        } finally {
            setIsLoading(false);
        }
    };

    /* SUCCESS VIEW STATE */
    if (success) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-app-bg p-4 font-sans">
                <div className="w-full max-w-[380px] bg-app-surface border border-app-border rounded-[32px] p-8 text-center shadow-xl animate-scale-in">
                    <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <span className="material-symbols-outlined text-[40px]">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-black text-app-text tracking-tight mb-2">¡Todo listo!</h2>
                    <p className="text-sm text-app-muted leading-relaxed mb-8">
                        Tu contraseña ha sido actualizada correctamente. Ya puedes acceder a tu cuenta.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all hover:bg-emerald-600"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        );
    }

    /* FORM VIEW STATE */
    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text selection:bg-app-primary/30 p-4 font-sans">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 left-0 w-full h-[60vh] bg-linear-to-b from-app-primary/5 to-transparent" />
            </div>

            <div className="w-full max-w-[420px] animate-fade-in space-y-8">

                {/* 1. Header */}
                <div className="text-center flex flex-col items-center">
                    <div className="size-16 mb-6 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center text-app-primary shadow-lg">
                        <span className="material-symbols-outlined text-[32px]">vpn_key</span>
                    </div>
                    <h1 className="text-2xl font-black text-app-text tracking-tight">Nueva Contraseña</h1>
                    <p className="text-sm text-app-muted mt-2 max-w-[260px]">
                        Ingresa tus nuevas credenciales para recuperar el acceso seguro.
                    </p>
                </div>

                {/* 2. Main Card */}
                <div className="bg-app-surface/90 backdrop-blur-xl border border-app-border rounded-[32px] p-6 md:p-8 shadow-2xl shadow-black/5 relative">

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* New Password */}
                        <div className="group">
                            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Contraseña</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted transition-colors text-[20px] group-focus-within:text-app-primary">
                                    lock
                                </span>
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                                    disabled={isLoading || !!error}
                                />
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="group">
                            <label className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Confirmar</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted transition-colors text-[20px] group-focus-within:text-app-primary">
                                    lock_reset
                                </span>
                                <input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                                    disabled={isLoading || !!error}
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 flex gap-3 items-center animate-shake">
                                <span className="material-symbols-outlined text-rose-500 shrink-0">error</span>
                                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="space-y-4 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="w-full py-4 bg-app-text text-app-bg font-bold rounded-2xl text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        <span>Actualizando...</span>
                                    </>
                                ) : (
                                    <span>Guardar Cambios</span>
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-xs font-bold text-app-muted hover:text-app-text hover:underline transition-all">
                                    Cancelar operación
                                </Link>
                            </div>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
};

export default ResetPasswordPage;