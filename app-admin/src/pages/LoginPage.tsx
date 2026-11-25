import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Chrome, Sparkles } from 'lucide-react';
import { CadastroPage } from './CadastroPage';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isCadastro, setIsCadastro] = useState(
    window.location.pathname.includes('/cadastro') ||
    window.location.search.includes('cadastro') ||
    window.location.search.includes('nome')
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsCadastro(window.location.pathname.includes('/cadastro'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (isCadastro) {
    return <CadastroPage onGoToLogin={() => setIsCadastro(false)} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-3xl shadow-xl border border-gray-100 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-dourado rounded-2xl flex items-center justify-center text-carvao font-bold text-3xl mb-4 shadow-md">
            H
          </div>
          <h1 className="text-2xl font-black text-carvao">
            HIVE ERP
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Gestão na nuvem com nota fiscal, estoque e financeiro
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-carvao hover:bg-gray-800 text-white font-bold rounded-xl shadow-md transition-all duration-200"
        >
          <Chrome size={20} />
          Entrar com Google
        </button>

        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setIsCadastro(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl transition-all duration-200 text-sm"
          >
            <Sparkles size={16} className="text-amber-600" />
            Criar Conta Grátis (14 Dias de Teste)
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Sem cartão de crédito. Sem fidelidade. Cancele quando quiser.
        </p>
      </div>
    </div>
  );
}
