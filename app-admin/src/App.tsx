import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. Novos Imports de Autenticação
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
// --- CORREÇÃO AQUI: Adicionado 'Loader2' ---
import { LogOut, Loader2 } from 'lucide-react'; // Ícones

// Importa as páginas
import { ProdutosPage } from './pages/ProdutosPage.tsx';
import { FornecedoresPage } from './pages/FornecedoresPage.tsx';
import { FinanceiroPage } from './pages/FinanceiroPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { PrecificacaoPage } from './pages/PrecificacaoPage.tsx';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage.tsx';
import { PedidosPage } from './pages/PedidosPage.tsx'; // Página de Pedidos

// 2. Adicionado 'pedidos' ao tipo de página
type Pagina = 'dashboard' | 'pedidos' | 'produtos' | 'fornecedores' | 'financeiro' | 'precificacao' | 'configuracoes';

// --- NAVBAR (Atualizada com botão de Logout) ---
function Navbar({ paginaAtual, onNavigate }: { paginaAtual: Pagina, onNavigate: (p: Pagina) => void }) {
  const { logout, user } = useAuth(); // Hook de autenticação
  
  // 3. Adicionado 'pedidos' ao array de páginas
  const paginas: Pagina[] = ['dashboard', 'pedidos', 'produtos', 'fornecedores', 'financeiro', 'precificacao', 'configuracoes'];

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
          
          {/* Área do Utilizador */}
          <div className="flex items-center ml-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-prata hidden md:block">
                {user?.email}
              </span>
              <button 
                onClick={logout}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Menu Mobile (simplificado para tablets/mobile) */}
        <div className="lg:hidden flex overflow-x-auto pb-2 space-x-4 no-scrollbar">
           {paginas.map((p) => (
              <button
                key={p}
                onClick={() => onNavigate(p)}
                className={`text-sm font-medium capitalize whitespace-nowrap px-2 py-1 rounded-md
                  ${paginaAtual === p ? 'bg-gray-700 text-dourado' : 'text-gray-400'}`}
              >
                {p}
              </button>
           ))}
        </div>
      </div>
    </nav>
  );
}

// --- COMPONENTE DE CONTEÚDO PROTEGIDO ---
function ProtectedContent() {
  const { user, loading } = useAuth(); // Usamos 'loading'
  const [pagina, setPagina] = useState<Pagina>('dashboard');

  // 4. Se estiver a carregar, mostra um ecrã de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        {/* Agora o 'Loader2' é encontrado */}
        <Loader2 className="animate-spin text-carvao" size={48} />
      </div>
    );
  }

  // 5. Se não houver utilizador, mostra o Login
  if (!user) {
    return <LoginPage />;
  }

  // 6. Se houver utilizador, mostra o Painel
  const renderizarPagina = () => {
    switch (pagina) {
      case 'dashboard': return <DashboardPage />;
      case 'pedidos': return <PedidosPage />;
      case 'produtos': return <ProdutosPage />;
      case 'fornecedores': return <FornecedoresPage />;
      case 'financeiro': return <FinanceiroPage />;
      case 'precificacao': return <PrecificacaoPage />;
      case 'configuracoes': return <ConfiguracoesPage />;
      default: return <div>Página não encontrada</div>;
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

// --- APP PRINCIPAL ---
// 7. Envolve a aplicação com o AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <ProtectedContent />
    </AuthProvider>
  );
}