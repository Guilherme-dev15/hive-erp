import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Chrome,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Loader2,
  ArrowLeft,
  Phone,
  KeyRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  normalizeBrazilPhoneToE164,
  validateRegistrationEmail,
} from '../utils/authValidation';

interface LoginPageProps {
  onNavigate?: (path: '/termos' | '/privacidade' | '/landing') => void;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'phone';

export function LoginPage({ onNavigate }: LoginPageProps) {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    sendPhoneCode,
    confirmPhoneCode,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Informe seu e-mail.');
      return;
    }

    if (mode === 'forgot') {
      try {
        setLoading(true);
        await resetPassword(email.trim());
        setMode('login');
      } catch {
        // Erro já tratado no AuthContext
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      toast.error('Digite sua senha.');
      return;
    }

    if (mode === 'register') {
      const emailCheck = validateRegistrationEmail(email.trim());
      if (!emailCheck.valid) {
        toast.error(emailCheck.reason || 'Informe um e-mail válido.');
        return;
      }
      if (password.length < 6) {
        toast.error('A senha deve conter no mínimo 6 dígitos.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem.');
        return;
      }
      try {
        setLoading(true);
        await signUpWithEmail(email.trim(), password);
      } catch {
        // Erro já tratado no AuthContext
      } finally {
        setLoading(false);
      }
      return;
    }

    // mode === 'login'
    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
    } catch {
      // Erro já tratado no AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!smsSent) {
      if (!normalizeBrazilPhoneToE164(phone)) {
        toast.error('Informe um telefone válido com DDD. Ex: (11) 99999-8888');
        return;
      }
      try {
        setLoading(true);
        await sendPhoneCode(phone, 'recaptcha-phone-container');
        setSmsSent(true);
      } catch {
        // Erro já tratado no AuthContext
      } finally {
        setLoading(false);
      }
      return;
    }

    if (smsCode.replace(/\D/g, '').length !== 6) {
      toast.error('Digite o código de 6 dígitos enviado por SMS.');
      return;
    }

    try {
      setLoading(true);
      await confirmPhoneCode(smsCode);
    } catch {
      // Erro já tratado no AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white px-4 py-8">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-2xl shadow-xl text-center border border-gray-100">
        {/* Header / Brand */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 bg-dourado rounded-2xl flex items-center justify-center text-carvao font-extrabold text-2xl mb-3 shadow-md">
            H
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-2">
            Joias • Semijoias • Prata 925
          </span>
          <h1 className="text-2xl font-bold text-carvao">
            HIVE ERP
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            {mode === 'login' && 'Gestão inteligente, vitrine virtual e fotos profissionais para sua marca.'}
            {mode === 'register' && 'Crie sua conta com e-mail válido (confirmação obrigatória) e ganhe 14 dias grátis.'}
            {mode === 'forgot' && 'Digite seu e-mail para receber as instruções de recuperação.'}
            {mode === 'phone' && 'Entre ou crie sua conta com verificação via código SMS no seu celular.'}
          </p>
        </div>

        {/* Botão Google + opção Telefone */}
        {mode !== 'forgot' && (
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-carvao hover:bg-gray-800 disabled:opacity-60 text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dourado transition-all duration-200"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin text-dourado" />
              ) : (
                <Chrome size={18} className="text-dourado" />
              )}
              <span className="text-sm">
                {mode === 'register' ? 'Criar com Google (1 clique)' : 'Continuar com Google'}
              </span>
            </button>

            {mode !== 'phone' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('phone');
                  setSmsSent(false);
                  setSmsCode('');
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                <Phone size={15} className="text-emerald-600" />
                <span>Entrar ou criar conta com Telefone (SMS)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setSmsSent(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs transition"
              >
                <Mail size={15} className="text-amber-700" />
                <span>Entrar com E-mail e Senha</span>
              </button>
            )}

            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold absolute">
                {mode === 'phone' ? 'verificação por SMS' : 'ou com e-mail e senha'}
              </span>
            </div>
          </div>
        )}

        {/* Formulário Telefone SMS */}
        {mode === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="mt-5 space-y-3 text-left">
            <div id="recaptcha-phone-container" />
            {!smsSent ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Telefone / WhatsApp (com DDD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Código SMS de 6 dígitos
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyRound size={16} />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm tracking-widest font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSmsSent(false);
                    setSmsCode('');
                  }}
                  className="text-[11px] font-semibold text-amber-800 hover:underline"
                >
                  Alterar número ({phone})
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-dourado hover:opacity-90 disabled:opacity-60 text-carvao font-bold text-sm rounded-xl shadow-sm transition-all"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : smsSent ? (
                <span>Confirmar código e entrar</span>
              ) : (
                <span>Enviar código por SMS</span>
              )}
            </button>
          </form>
        ) : (
          /* Formulário Tradicional de E-mail / Senha */
          <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
                />
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-amber-800 mt-1">
                  Enviaremos um link de confirmação obrigatório para este e-mail.
                </p>
              )}
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Senha
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 transition"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirme sua Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-dourado hover:opacity-90 disabled:opacity-60 text-carvao font-bold text-sm rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-dourado transition-all"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight size={16} />
                </>
              ) : mode === 'register' ? (
                <>
                  <Sparkles size={16} />
                  <span>Criar Conta e Começar Grátis</span>
                </>
              ) : (
                <span>Enviar Link de Recuperação</span>
              )}
            </button>
          </form>
        )}

        {/* Alternador de Modo */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
          {mode === 'login' && (
            <p className="text-gray-600">
              Ainda não tem cadastro?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-amber-800 hover:text-amber-900 underline underline-offset-2"
              >
                Criar conta grátis (14 dias)
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="text-gray-600">
              Já tem uma conta cadastrada?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-bold text-amber-800 hover:text-amber-900 underline underline-offset-2"
              >
                Fazer login
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="inline-flex items-center gap-1.5 font-bold text-gray-600 hover:text-carvao transition"
            >
              <ArrowLeft size={14} />
              <span>Voltar para tela de login</span>
            </button>
          )}
        </div>

        {/* Garantias & Links Institucionais */}
        {onNavigate && (
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <button
              type="button"
              onClick={() => onNavigate('/landing')}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 transition flex items-center justify-center gap-1 mx-auto"
            >
              <span>Conhecer recursos e planos da plataforma</span>
              <span>→</span>
            </button>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-gray-400">
              <button
                type="button"
                onClick={() => onNavigate('/termos')}
                className="hover:text-carvao underline underline-offset-2 transition"
              >
                Termos de Uso
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onNavigate('/privacidade')}
                className="hover:text-carvao underline underline-offset-2 transition"
              >
                Privacidade
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
