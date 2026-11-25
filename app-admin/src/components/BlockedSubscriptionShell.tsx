import { ReactNode } from 'react';
import { Globe, Lock, LogOut, ShieldCheck, MessageCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { getCatalogUrl } from '../utils/catalogUrl';

interface BlockedSubscriptionShellProps {
  children: ReactNode;
}

export function BlockedSubscriptionShell({ children }: BlockedSubscriptionShellProps) {
  const { user, userData, logout } = useAuth();
  const { theme } = useTheme();
  const storeName = userData?.store?.storeName || theme.storeName || 'Sua Loja';
  const slug = userData?.store?.slug || theme.slug;
  const catalogUrl = getCatalogUrl(slug);

  const whatsappSupportUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(
    `Olá! Sou da loja "${storeName}" e gostaria de regularizar meu acesso ao Hive ERP.`
  )}`;

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
      {/* Header */}
      <header className="bg-carvao text-white border-b border-gray-800 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-dourado text-carvao flex items-center justify-center font-bold">
            <Lock size={18} />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase">HIVE ERP</h1>
            <p className="text-xs text-gray-300 truncate max-w-[220px]">{storeName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {catalogUrl && (
            <a
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition"
            >
              <Globe size={14} />
              <span>Vitrine Pública Online</span>
            </a>
          )}
          <span className="text-xs text-gray-400 hidden md:inline">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-xs font-semibold text-gray-100 hover:text-red-200 transition"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Banner de Tranquilização e Transparência */}
      <div className="bg-emerald-950/90 text-emerald-100 border-b border-emerald-800/60 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-extrabold text-emerald-300 mr-1.5">
                ✨ Sua Vitrine Pública Continua 100% Online:
              </span>
              <span>
                Seus clientes continuam acessando seus produtos e fazendo pedidos normalmente. Apenas o painel administrativo foi pausado aguardando ativação do plano.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <MessageCircle size={14} />
              <span>Suporte WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
