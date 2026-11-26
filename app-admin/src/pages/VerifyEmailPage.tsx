import React, { useEffect, useState } from 'react';
import { MailCheck, RefreshCw, CheckCircle2, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function VerifyEmailPage() {
  const { user, resendVerificationEmail, checkEmailVerification, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleCheck = async () => {
    try {
      setChecking(true);
      await checkEmailVerification();
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResending(true);
      await resendVerificationEmail();
      setCooldown(60);
    } catch {
      // Erro já tratado no AuthContext
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white px-4 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 mx-auto shadow-sm">
          <MailCheck size={34} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-carvao">
            Confirme seu e-mail para continuar
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Enviamos um link de confirmação obrigatório para{' '}
            <strong className="text-gray-900">{user?.email || 'seu e-mail'}</strong>.
            Acesse sua caixa de entrada (ou pasta de Spam) e clique no link para liberar o Hive ERP.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-dourado hover:opacity-90 disabled:opacity-60 text-carvao font-bold text-sm rounded-xl shadow-sm transition"
          >
            {checking ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>Já confirmei meu e-mail</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-semibold text-sm rounded-xl transition"
          >
            {resending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span>
              {cooldown > 0
                ? `Reenviar e-mail em ${cooldown}s`
                : 'Reenviar e-mail de confirmação'}
            </span>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition"
          >
            <LogOut size={14} />
            <span>Sair e usar outra conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
