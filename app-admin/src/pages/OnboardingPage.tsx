import React, { useState, useId } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Store, Globe, ArrowRight, Loader2, LogOut, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function OnboardingPage() {
  const { user, completeOnboard, logout } = useAuth();
  const storeNameId = useId();
  const ownerNameId = useId();
  const slugId = useId();

  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState(user?.displayName || '');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreName(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedStore = storeName.trim();
    if (!trimmedStore) {
      toast.error('Informe o nome da sua loja.');
      return;
    }

    const trimmedSlug = slug.trim();
    if (trimmedSlug && trimmedSlug.length < 3) {
      toast.error('O slug da vitrine deve ter pelo menos 3 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await completeOnboard(trimmedStore, trimmedSlug || undefined);
    } catch (err: any) {
      console.error('Erro no onboarding:', err);
      const msg = err?.response?.data?.message || err?.message || 'Erro ao criar loja.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-off-white px-4 py-8">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-dourado rounded-2xl flex items-center justify-center text-carvao font-bold text-3xl mb-4 shadow-md">
            H
          </div>
          <h1 className="text-2xl font-bold text-carvao">
            Configure sua Nova Loja
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Você está a um passo de gerenciar estoque, vendas e catálogo online no HiveERP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" aria-label="form-onboarding">
          <div>
            <label htmlFor={storeNameId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nome da Loja *
            </label>
            <div className="relative">
              <input
                id={storeNameId}
                type="text"
                required
                value={storeName}
                onChange={handleStoreNameChange}
                placeholder="Ex: Pratas do Brasil, Joalheria Moderna"
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
              />
              <Store className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div>
            <label htmlFor={ownerNameId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Nome do Responsável
            </label>
            <input
              id={ownerNameId}
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor={slugId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Link da sua Vitrine Pública (Slug)
            </label>
            <div className="relative">
              <input
                id={slugId}
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="minha-loja"
                className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition"
              />
              <Globe className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Sua vitrine será: <span className="font-semibold text-carvao">hiveerp-catalogo.vercel.app/{slug || 'sua-loja'}</span>
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-carvao hover:bg-gray-800 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dourado transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Criando loja...</span>
                </>
              ) : (
                <>
                  <span>Criar Loja & Acessar ERP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Conectado como <strong className="text-gray-700">{user?.email}</strong></span>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
