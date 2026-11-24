import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Chrome } from 'lucide-react';

interface LoginPageProps {
  onNavigate?: (path: '/termos' | '/privacidade' | '/landing') => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white px-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg text-center border border-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-dourado rounded-2xl flex items-center justify-center text-carvao font-extrabold text-3xl mb-3 shadow-md">
            H
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-2">
            Joias • Semijoias • Prata 925
          </span>
          <h1 className="text-2xl font-bold text-carvao">
            HIVE ERP
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-xs">
            Gestão inteligente, vitrine virtual e fotos profissionais para sua marca de joias.
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-carvao hover:bg-gray-800 text-white font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dourado transition-all duration-300"
        >
          <Chrome size={20} />
          <span>Continuar com Google</span>
        </button>

        <p className="text-xs text-gray-500 pt-1 leading-relaxed">
          Novo por aqui? Ao entrar com sua conta Google, você ganha <strong>14 dias de teste grátis</strong> com acesso a todas as ferramentas.
        </p>

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
