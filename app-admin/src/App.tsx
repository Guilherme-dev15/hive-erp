import { lazy, Suspense, useState, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Loader2,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  Percent,
  Ticket,
  BarChart3,
  Settings,
  Calculator,
  Briefcase,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Imports de Autenticação
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage.tsx';

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

// Definição das Rotas
type Pagina =
  | 'dashboard'
  | 'pedidos'
  | 'produtos'
  | 'fornecedores'
  | 'financeiro'
  | 'campanhas' // Descontos Globais
  | 'cupons' // Códigos de Desconto
  | 'precificacao'
  | 'relatorios'
  | 'equipe'
  | 'configuracoes';

// --- NAVBAR RESPONSIVA ---
function Navbar({
  paginaAtual,
  onNavigate,
}: {
  paginaAtual: Pagina;
  onNavigate: (p: Pagina) => void;
}) {
  const { user, userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Configuração do Menu com Ícones e Labels
  const menuItems: { id: Pagina; label: string; icon: ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'campanhas', label: 'Promoções', icon: Percent }, // Novo Painel Global
    { id: 'cupons', label: 'Cupons', icon: Ticket }, // Antigo Cupons
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'fornecedores', label: 'Fornecedores', icon: Users },
    { id: 'equipe', label: 'Equipe', icon: Briefcase },
    { id: 'precificacao', label: 'Calc. Preço', icon: Calculator },
    { id: 'configuracoes', label: 'Config', icon: Settings },
  ];

  const handleMobileNavigate = (p: Pagina) => {
    onNavigate(p);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-carvao shadow-lg mb-8 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* LADO ESQUERDO: Logo e Menu Desktop */}
          <div className="flex">
            <div
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
              onClick={() => onNavigate('dashboard')}
            >
              <div className="w-8 h-8 bg-dourado rounded-lg flex items-center justify-center text-carvao font-bold">
                H
              </div>
              <h1 className="text-xl font-bold text-dourado hidden sm:block">
                HIVE ERP
              </h1>
            </div>

            {/* Menu Desktop (Hidden em Mobile) */}
            <div className="hidden xl:ml-6 xl:flex xl:space-x-1 overflow-x-auto no-scrollbar items-center">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5
                    ${
                      paginaAtual === item.id
                        ? 'bg-gray-800 text-dourado border-b-2 border-dourado rounded-none h-full'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* LADO DIREITO: Usuário e Toggle Mobile */}
          <div className="flex items-center ml-4 gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-gray-400">Logado como</span>
              <div className="flex items-center gap-1">
                {userData?.role === 'owner' && (
                  <Shield size={12} className="text-dourado" />
                )}
                <span className="text-xs text-prata font-bold">
                  {userData?.name || user?.email?.split('@')[0]}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-900/30 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>

            {/* Botão Hambúrguer (Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE DROPDOWN --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="xl:hidden bg-carvao border-t border-gray-700 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNavigate(item.id)}
                  className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium items-center gap-3
                    ${
                      paginaAtual === item.id
                        ? 'bg-gray-900 text-dourado border-l-4 border-dourado'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}

              <div className="border-t border-gray-700 mt-4 pt-4 px-3 pb-2">
                <div className="flex items-center">
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-white flex items-center gap-2">
                      {userData?.name || 'Usuário'}
                      {userData?.role === 'owner' && (
                        <Shield size={14} className="text-dourado" />
                      )}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400 mt-1">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

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
  const { user, loading } = useAuth();
  const [pagina, setPagina] = useState<Pagina>('dashboard');

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
    <div className="min-h-screen bg-off-white">
      <Navbar paginaAtual={pagina} onNavigate={setPagina} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ErrorBoundary key={pagina}>
          <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
            <Suspense fallback={<PageLoadingFallback />}>
              {renderizarPagina()}
            </Suspense>
          </div>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <ProtectedLayout />
    </AuthProvider>
  );
}
