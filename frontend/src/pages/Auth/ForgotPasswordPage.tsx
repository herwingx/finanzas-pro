import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  // Navigate no se usa directamente en este flujo típico, pero lo dejamos por si acaso
  // const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Error desconocido');

      setStatus('success');
      setFeedback('Revisa tu bandeja de entrada (y spam). Hemos enviado las instrucciones.');

    } catch (err: any) {
      setStatus('error');
      setFeedback(err.message || 'No se pudo procesar la solicitud.');
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-app-bg text-app-text selection:bg-app-primary/30 p-4 font-sans">

      {/* --- DECO BG --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-purple-500 opacity-[0.03] blur-[100px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] bg-blue-500 opacity-[0.03] blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      <div className="w-full max-w-[420px] animate-fade-in space-y-8">

        {/* 1. HEADER */}
        <div className="flex flex-col items-center text-center">
          <div className="size-16 mb-6 bg-app-surface border border-app-border rounded-2xl shadow-lg flex items-center justify-center text-app-primary">
            <span className="material-symbols-outlined text-[32px]">lock_reset</span>
          </div>
          <h1 className="text-3xl font-black text-app-text tracking-tight mb-2">¿Olvidaste tu acceso?</h1>
          <p className="text-sm text-app-muted max-w-[280px]">
            Ingresa tu correo y te enviaremos un enlace mágico para entrar.
          </p>
        </div>

        {/* 2. CARD FORM */}
        <div className="bg-app-surface/80 backdrop-blur-xl border border-app-border p-6 md:p-8 rounded-[32px] shadow-2xl shadow-black/5 relative overflow-hidden">

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            {/* Input */}
            <div className="group">
              <label htmlFor="email" className="block text-xs font-bold text-app-muted uppercase tracking-wider mb-2 ml-1">Correo Registrado</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-app-muted group-focus-within:text-app-primary transition-colors text-[20px]">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-app-subtle border-2 border-transparent focus:border-app-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-app-text outline-none transition-all placeholder:text-app-muted/50 font-medium text-sm focus:bg-white dark:focus:bg-black/20"
                  placeholder="ejemplo@correo.com"
                  required
                  autoFocus
                  disabled={status === 'loading' || status === 'success'}
                />
              </div>
            </div>

            {/* Alerts Area */}
            {status === 'success' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 items-start animate-scale-in">
                <span className="material-symbols-outlined text-emerald-500 mt-0.5 shrink-0">mark_email_read</span>
                <div className="text-sm text-emerald-700 dark:text-emerald-300">
                  <p className="font-bold">¡Correo enviado!</p>
                  <p className="opacity-90 mt-0.5 text-xs">{feedback}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 items-start animate-shake">
                <span className="material-symbols-outlined text-rose-500 mt-0.5 shrink-0">error</span>
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">{feedback}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success' || !email}
                className="w-full py-4 bg-app-text text-app-bg rounded-2xl font-bold text-sm shadow-lg shadow-black/10 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Enlace</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-transparent hover:border-app-border text-sm font-bold text-app-muted hover:text-app-text hover:bg-app-subtle transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Regresar al Login
              </Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;