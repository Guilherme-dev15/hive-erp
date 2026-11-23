import { ReactNode } from 'react';
import { Globe, Lock, LogOut } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-off-white flex flex-col">
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

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
