import { lazy, Suspense, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Imports de Autenticação e Tema
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage.tsx';
import { OnboardingPage } from './pages/OnboardingPage.tsx';

// Navegação Moderna SaaS (Sidebar + Topbar)
import { Sidebar, Pagina } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Importa as páginas sob demanda para manter o shell inicial enxuto.
const ProdutosPage = lazy(() =>
  import('./pages/ProdutosPage').then(({ ProdutosPage }) => ({ default: ProdutosPage }))
);
const FornecedoresPage = lazy(() =>
  import('./pages/FornecedoresPage').then(({ FornecedoresPage }) => ({ default: FornecedoresPage }))
);
const FinanceiroPage = lazy(() =>
  import('./pages/FinanceiroPage').then(({ FinanceiroPage }) => ({ default: FinanceiroPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(({ DashboardPage }) => ({ default: DashboardPage }))
);
const PrecificacaoPage = lazy(() =>
  import('./pages/PrecificacaoPage').then(({ PrecificacaoPage }) => ({ default: PrecificacaoPage }))
);
const ConfiguracoesPage = lazy(() =>
  import('./pages/ConfiguracoesPage').then(({ ConfiguracoesPage }) => ({ default: ConfiguracoesPage }))
);
const PedidosPage = lazy(() =>
  import('./pages/PedidosPage').then(({ PedidosPage }) => ({ default: PedidosPage }))
);
const RelatoriosPage = lazy(() =>
  import('./pages/RelatoriosPage').then(({ RelatoriosPage }) => ({ default: RelatoriosPage }))
);
const CuponsPage = lazy(() =>
  import('./pages/CuponsPage').then(({ CuponsPage }) => ({ default: CuponsPage }))
);
const EquipePage = lazy(() =>
  import('./pages/EquipePage').then(({ EquipePage }) => ({ default: EquipePage }))
);
const CampanhasPage = lazy(() =>
  import('./pages/CampanhasPage').then(({ CampanhasPage }) => ({ default: CampanhasPage }))
);

// Importar a Proteção contra Tela Branca
import { ErrorBoundary } from './components/ErrorBoundary';

function PageLoadingFallback() {
  return (
    <div
      className="min-h-[50vh] flex items-center justify-center bg-off-white"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <Loader2 className="animate-spin text-carvao" size={40} />
        <span className="text-sm font-medium">Carregando página...</span>
      </div>
    </div>
  );
}

// --- CONTEÚDO PROTEGIDO ---
function ProtectedLayout() {
  const { user, needsOnboarding, loading } = useAuth();
  const [pagina, setPagina] = useState<Pagina>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tratamento de QR Code
  const params = new URLSearchParams(window.location.search);
  if (params.get('q')) {
    localStorage.setItem('pending_qr_scan', params.get('q') || '');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <Loader2 className="animate-spin text-carvao" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (needsOnboarding) {
    return <OnboardingPage />;
  }

  const renderizarPagina = () => {
    switch (pagina) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pedidos':
        return <PedidosPage />;
      case 'produtos':
        return <ProdutosPage />;
      case 'fornecedores':
        return <FornecedoresPage />;
      case 'financeiro':
        return <FinanceiroPage />;

      // Separação de Campanhas (Global) e Cupons (Individual)
      case 'campanhas':
        return <CampanhasPage />;
      case 'cupons':
        return <CuponsPage />;

      case 'precificacao':
        return <PrecificacaoPage />;
      case 'relatorios':
        return <RelatoriosPage />;
      case 'equipe':
        return <EquipePage />;
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return (
          <div className="text-center py-20 text-gray-500">
            Página não encontrada
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex">
      {/* Sidebar Lateral Moderna */}
      <Sidebar
        paginaAtual={pagina}
        onNavigate={setPagina}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Conteúdo Principal + Topbar */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 transition-all">
        <Topbar
          paginaAtual={pagina}
          onOpenMobile={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary key={pagina}>
            <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
              <Suspense fallback={<PageLoadingFallback />}>
                {renderizarPagina()}
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-right" />
        <ProtectedLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}
