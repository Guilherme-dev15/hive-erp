import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2, Menu, X } from 'lucide-react'; // Adicionei Menu e X
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

type Pagina = 'dashboard' | 'pedidos' | 'produtos' | 'fornecedores' | 'financeiro' | 'campanhas' | 'precificacao' | 'relatorios' | 'configuracoes';

// --- NAVBAR RESPONSIVA ---
function Navbar({ paginaAtual, onNavigate }: { paginaAtual: Pagina, onNavigate: (p: Pagina) => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado do Menu Mobile
  
  const paginas: Pagina[] = ['dashboard', 'pedidos', 'produtos', 'fornecedores', 'financeiro', 'campanhas', 'relatorios', 'precificacao', 'configuracoes'];

  // Função para navegar e fechar o menu mobile
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
            <div className="flex-shrink-0 flex items-center">
              {/* Logo Texto */}
              <h1 className="text-xl font-bold text-dourado hidden sm:block">HivePratas ERP</h1>
              <h1 className="text-xl font-bold text-dourado sm:hidden">Hive</h1>
            </div>
            
            {/* Menu Desktop (Hidden em Mobile) */}
            <div className="hidden lg:ml-6 lg:flex lg:space-x-1 overflow-x-auto no-scrollbar items-center">
              {paginas.map((p) => (
                <button
                  key={p}
                  onClick={() => onNavigate(p)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap capitalize
                    ${paginaAtual === p
                      ? 'bg-gray-800 text-dourado'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          {/* LADO DIREITO: Usuário e Toggle Mobile */}
          <div className="flex items-center ml-4 gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
               <span className="text-xs text-gray-400">Logado como</span>
               <span className="text-xs text-prata font-bold">{user?.email?.split('@')[0]}</span>
            </div>
            
            <button 
              onClick={logout}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-900/30 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>

            {/* Botão Hambúrguer (Só aparece em Mobile) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE DROPDOWN (AnimatePresence) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-carvao border-t border-gray-700 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {paginas.map((p) => (
                <button
                  key={p}
                  onClick={() => handleMobileNavigate(p)}
                  className={`block w-full text-left px-3 py-3 rounded-md text-base font-medium capitalize
                    ${paginaAtual === p
                      ? 'bg-gray-900 text-dourado border-l-4 border-dourado'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  {p}
                </button>
              ))}
              {/* Info do Usuário no Mobile */}
              <div className="border-t border-gray-700 mt-4 pt-4 px-3 pb-2">
                 <div className="flex items-center">
                    <div className="ml-3">
                      <div className="text-base font-medium leading-none text-white">Conta Ativa</div>
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
      case 'campanhas': return <CuponsPage />;
      case 'precificacao': return <PrecificacaoPage />;
      case 'relatorios': return <RelatoriosPage />;
      case 'configuracoes': return <ConfiguracoesPage />;
      default: return <div className="text-center py-20 text-gray-500">Página não encontrada</div>;
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <Navbar paginaAtual={pagina} onNavigate={setPagina} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={pagina}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderizarPagina()}
          </motion.div>
        </AnimatePresence>
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