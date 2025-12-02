import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Loader2 } from 'lucide-react'; 
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
import { RelatoriosPage } from './pages/RelatoriosPage'; // Se já tiver criado
import { CuponsPage } from './pages/CuponsPage';

// Tipos de Páginas
type Pagina = 'dashboard' | 'pedidos' | 'produtos' | 'fornecedores' | 'financeiro' | 'campanhas' | 'precificacao' | 'relatorios' | 'configuracoes';

// --- NAVBAR ---
function Navbar({ paginaAtual, onNavigate }: { paginaAtual: Pagina, onNavigate: (p: Pagina) => void }) {
  const { user, logout } = useAuth();
  
  // Lista de menus na ordem desejada
  const paginas: Pagina[] = ['dashboard', 'pedidos', 'produtos', 'fornecedores', 'financeiro', 'campanhas', 'relatorios', 'precificacao', 'configuracoes'];

  return (
    <nav className="bg-carvao shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-dourado hidden sm:block">HivePratas ERP</h1>
              <h1 className="text-2xl font-bold text-dourado sm:hidden">Hive</h1>
            </div>
            <div className="hidden lg:ml-6 lg:flex lg:space-x-4 overflow-x-auto">
              {paginas.map((p) => (
                <button
                  key={p}
                  onClick={() => onNavigate(p)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap
                    ${paginaAtual === p
                      ? 'border-dourado text-off-white'
                      : 'border-transparent text-prata hover:border-gray-700 hover:text-off-white'
                    } capitalize`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center ml-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-prata hidden md:block opacity-70">
                {user?.email}
              </span>
              <button 
                onClick={logout}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-900/30 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu Mobile */}
        <div className="lg:hidden flex overflow-x-auto pb-2 space-x-4 no-scrollbar px-4">
           {paginas.map((p) => (
              <button
                key={p}
                onClick={() => onNavigate(p)}
                className={`text-sm font-medium capitalize whitespace-nowrap px-3 py-1 rounded-md transition-colors
                  ${paginaAtual === p ? 'bg-gray-700 text-dourado' : 'text-gray-400 bg-gray-800/50'}`}
              >
                {p}
              </button>
           ))}
        </div>
      </div>
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
      case 'relatorios': return <RelatoriosPage />; // Se não criou, remova ou comente
      case 'precificacao': return <PrecificacaoPage />;
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