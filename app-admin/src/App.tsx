import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Loader2, Menu, X, Shield, LayoutDashboard, ShoppingBag, 
  Package, Users, DollarSign, Percent, Ticket, BarChart3, 
  Settings, Calculator, Briefcase 
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Imports de Autenticação
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';

// Importa as páginas
import { ProdutosPage } from './pages/ProdutosPage';
import { FornecedoresPage } from './pages/FornecedoresPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrecificacaoPage } from './pages/PrecificacaoPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { PedidosPage } from './pages/PedidosPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { CuponsPage } from './pages/CuponsPage';
import { EquipePage } from './pages/EquipePage';
import { CampanhasPage } from './pages/CampanhasPage'; // <--- NOVA PÁGINA GLOBAL

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
  | 'cupons'    // Códigos de Desconto
  | 'precificacao' 
  | 'relatorios' 
  | 'equipe' 
  | 'configuracoes';

// --- NAVBAR RESPONSIVA ---
function Navbar({ paginaAtual, onNavigate }: { paginaAtual: Pagina, onNavigate: (p: Pagina) => void }) {
  const { user, userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Configuração do Menu com Ícones e Labels
  const menuItems: { id: Pagina, label: string, icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'campanhas', label: 'Promoções', icon: Percent }, // Novo Painel Global
    { id: 'cupons', label: 'Cupons', icon: Ticket },        // Antigo Cupons
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
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
              <div className="w-8 h-8 bg-dourado rounded-lg flex items-center justify-center text-carvao font-bold">H</div>
              <h1 className="text-xl font-bold text-dourado hidden sm:block">HIVE ERP</h1>
            </div>

            {/* Menu Desktop (Hidden em Mobile) */}
            <div className="hidden xl:ml-6 xl:flex xl:space-x-1 overflow-x-auto no-scrollbar items-center">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-1.5
                    ${paginaAtual === item.id
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
                {userData?.role === 'owner' && <Shield size={12} className="text-dourado" />}
                <span className="text-xs text-prata font-bold">{userData?.name || user?.email?.split('@')[0]}</span>
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
                  className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium flex items-center gap-3
                    ${paginaAtual === item.id
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
                      {userData?.role === 'owner' && <Shield size={14} className="text-dourado" />}
                    </div>
                    <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user?.email}</div>
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
      case 'dashboard': return <DashboardPage />;
      case 'pedidos': return <PedidosPage />;
      case 'produtos': return <ProdutosPage />;
      case 'fornecedores': return <FornecedoresPage />;
      case 'financeiro': return <FinanceiroPage />;
      
      // Separação de Campanhas (Global) e Cupons (Individual)
      case 'campanhas': return <CampanhasPage />; 
      case 'cupons': return <CuponsPage />;
      
      case 'precificacao': return <PrecificacaoPage />;
      case 'relatorios': return <RelatoriosPage />;
      case 'equipe': return <EquipePage />;
      case 'configuracoes': return <ConfiguracoesPage />;
      default: return <div className="text-center py-20 text-gray-500">Página não encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar paginaAtual={pagina} onNavigate={setPagina} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <ErrorBoundary key={pagina}>
          <div className="animate-in fade-in duration-300 slide-in-from-bottom-2">
            {renderizarPagina()}
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