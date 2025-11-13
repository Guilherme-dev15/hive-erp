import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Importa as páginas
import { ProdutosPage } from './pages/ProdutosPage.tsx';
import { FornecedoresPage } from './pages/FornecedoresPage.tsx';
import { FinanceiroPage } from './pages/FinanceiroPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { PrecificacaoPage } from './pages/PrecificacaoPage.tsx';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage.tsx';
// 1. IMPORTE A NOVA PÁGINA DE PEDIDOS
import { PedidosPage } from './pages/PedidosPage.tsx'; 

// 2. ADICIONE 'pedidos' AO TIPO
type Pagina = 'dashboard' | 'pedidos' | 'produtos' | 'fornecedores' | 'financeiro' | 'precificacao' | 'configuracoes';

// --- A NAVBAR CORRIGIDA com as suas cores ---
function Navbar({ paginaAtual, onNavigate }: { paginaAtual: Pagina, onNavigate: (p: Pagina) => void }) {
  
  // 3. ADICIONE 'pedidos' AO ARRAY DE PÁGINAS (NA ORDEM QUE QUISER)
  const paginas: Pagina[] = ['dashboard', 'pedidos', 'produtos', 'fornecedores', 'financeiro', 'precificacao', 'configuracoes'];

  return (
    // Aplicando as cores 'carvao' e 'dourado'
    <nav className="bg-carvao shadow-lg mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-dourado">HivePratas ERP</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {paginas.map((p) => (
                <button
                  key={p}
                  onClick={() => onNavigate(p)}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200
                    ${paginaAtual === p
                      // Aplicando 'dourado' e 'off-white' para o item ativo
                      ? 'border-dourado text-off-white'
                      // Aplicando 'prata' para itens inativos
                      : 'border-transparent text-prata hover:border-gray-700 hover:text-off-white'
                    } capitalize`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
// --- FIM DA NAVBAR CORRIGIDA ---


export default function App() {
  const [pagina, setPagina] = useState<Pagina>('dashboard'); // Alterado o default para 'dashboard'

  const renderizarPagina = () => {
    switch (pagina) {
      case 'dashboard':
        return <DashboardPage />;
      
      // 4. ADICIONE O 'case' PARA A NOVA PÁGINA
      case 'pedidos':
        return <PedidosPage />;
        
      case 'produtos':
        return <ProdutosPage />;
      case 'fornecedores':
        return <FornecedoresPage />;
      case 'financeiro':
        return <FinanceiroPage />;
      case 'precificacao':
        return <PrecificacaoPage />;
      case 'configuracoes':
        return <ConfiguracoesPage />;
      default:
        return (

          // Usando 'text-carvao' aqui também
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-carvao">Página em Construção</h2>
            <p className="text-gray-600">A página '{pagina}' ainda está a ser desenvolvida.</p>
          </div>
        );
    }
  };

  return (
    // Usando 'bg-off-white' como fundo
    <div className="min-h-screen bg-off-white">
      <Navbar paginaAtual={pagina} onNavigate={setPagina} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Mantendo as animações */}
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