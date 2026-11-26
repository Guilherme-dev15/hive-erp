import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Chrome, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { registerUser } from '../services/apiService';
import toast from 'react-hot-toast';

interface CadastroPageProps {
  onGoToLogin?: () => void;
}

export function CadastroPage({ onGoToLogin }: CadastroPageProps) {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  // Lê parâmetros da URL caso o formulário venha da landing page (ex: ?nome=...&email=...&whatsapp=...)
  const params = new URLSearchParams(window.location.search);
  const [nome, setNome] = useState(params.get('nome') || '');
  const [email, setEmail] = useState(params.get('email') || '');
  const [whatsapp, setWhatsapp] = useState(params.get('whatsapp') || '');
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    // Se o usuário veio de um submit POST da landing page, os params podem estar no search ou hash
    const initialName = params.get('nome') || params.get('n');
    const initialEmail = params.get('email') || params.get('e');
    const initialWhatsapp = params.get('whatsapp') || params.get('w');
    if (initialName) setNome(initialName);
    if (initialEmail) setEmail(initialEmail);
    if (initialWhatsapp) setWhatsapp(initialWhatsapp);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email) {
      toast.error('Por favor, informe ao menos nome e e-mail.');
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        name: nome,
        email,
        phone: whatsapp,
        storeName: storeName || `Loja de ${nome}`,
      });
      toast.success('Conta pré-cadastrada! Agora conclua o login com Google.');
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      toast.error(err?.response?.data?.message || 'Erro ao criar conta. Tente entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1B1E] text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-[#26262A] border border-[#3A3A40] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow e badge de trial */}
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-[#F2A900]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#F2A900] text-[#1D1D20] font-black text-2xl rounded-2xl flex items-center justify-center shadow-lg">
            H
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              HIVE ERP
              <span className="bg-[#F2A900]/20 text-[#F2A900] text-xs px-2.5 py-0.5 rounded-full font-bold border border-[#F2A900]/30">
                14 DIAS GRÁTIS
              </span>
            </h1>
            <p className="text-xs text-gray-400">Catálogo no WhatsApp, estoque com grade e financeiro em um painel só</p>
          </div>
        </div>

        {/* Promessa de valor */}
        <div className="bg-[#1D1D20] p-4 rounded-2xl border border-gray-800 mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <CheckCircle2 size={16} className="text-[#F2A900]" /> Sem cartão de crédito
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <CheckCircle2 size={16} className="text-[#F2A900]" /> Acesso completo liberado em 2 minutos
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <CheckCircle2 size={16} className="text-[#F2A900]" /> Suporte em português e sem fidelidade
          </div>
        </div>

        {/* Botão Rápido Google */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl shadow-lg transition-all duration-200 mb-6"
        >
          <Chrome size={20} className="text-red-500" />
          Ativar com Google em 1 Clique
        </button>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-gray-700 w-full" />
          <span className="bg-[#26262A] px-3 text-xs text-gray-400 uppercase tracking-widest font-semibold">
            ou preencha os dados
          </span>
          <div className="border-t border-gray-700 w-full" />
        </div>

        {/* Formulário detalhado */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Seu Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-[#1B1B1E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F2A900] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nome da sua Empresa / Loja</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Minha Empresa Ltda"
              className="w-full bg-[#1B1B1E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F2A900] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail de Trabalho</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com"
                className="w-full bg-[#1B1B1E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F2A900] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 90000-0000"
                className="w-full bg-[#1B1B1E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F2A900] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 px-4 bg-[#F2A900] hover:bg-[#d99700] text-[#1D1D20] font-black rounded-xl shadow-lg transition-all duration-200"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Sparkles size={18} />
                Iniciar Meus 14 Dias Grátis
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Já possui conta?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-[#F2A900] font-bold hover:underline"
          >
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
}
