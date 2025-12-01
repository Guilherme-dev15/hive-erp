import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
// 1. Removido 'Menu' e mantidos apenas os ícones usados
import { ShoppingCart, Package, X, Plus, Minus, Send, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// ============================================================================
// 1. Tipos e Interfaces
// ============================================================================

interface ProdutoCatalogo {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  salePrice?: number;
  imageUrl?: string;
  status?: 'ativo' | 'inativo';
}

interface ConfigPublica {
  whatsappNumber: string | null;
}

interface ItemCarrinho {
  produto: ProdutoCatalogo;
  quantidade: number;
}

// ============================================================================
// 2. Configuração da API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ============================================================================
// 3. Funções Utilitárias
// ============================================================================
const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// ============================================================================
// 4. Componente Principal
// ============================================================================
export default function App() {
  // --- Estados ---
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [config, setConfig] = useState<ConfigPublica | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Carrinho
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [categories, setCategories] = useState<string[]>(['Todos']);

  // --- Carregamento de Dados ---
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        
        const [resConfig, resProdutos] = await Promise.all([
          apiClient.get('/config-publica'),
          apiClient.get('/produtos-catalogo')
        ]);

        setConfig(resConfig.data);
        const produtosAtivos = resProdutos.data;
        setProdutos(produtosAtivos);

        // Extrair categorias únicas dinamicamente
        const uniqueCategories = Array.from(new Set(produtosAtivos.map((p: ProdutoCatalogo) => p.category || 'Outros')));
        setCategories(['Todos', ...uniqueCategories.sort() as string[]]);

      } catch (error) {
        console.error("Erro ao carregar catálogo:", error);
        toast.error("Não foi possível carregar os produtos.");
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // --- Lógica do Carrinho ---
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    setCarrinho(prev => {
      const item = prev[produto.id];
      return {
        ...prev,
        [produto.id]: {
          produto,
          quantidade: (item?.quantidade || 0) + 1
        }
      };
    });
    toast.success('Produto adicionado!');
    // setIsCarrinhoAberto(true); // Opcional: abrir carrinho ao adicionar
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => {
      const novoCarrinho = { ...prev };
      if (novoCarrinho[produtoId].quantidade > 1) {
        novoCarrinho[produtoId].quantidade -= 1;
      } else {
        delete novoCarrinho[produtoId];
      }
      return novoCarrinho;
    });
  };

  const itensCarrinho = Object.values(carrinho);
  const totalItens = itensCarrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = itensCarrinho.reduce((acc, item) => acc + ((item.produto.salePrice || 0) * item.quantidade), 0);

  // --- Lógica de Checkout (WhatsApp) ---
  const handleCheckout = () => {
    if (!config?.whatsappNumber) {
      toast.error("Erro: Loja sem número de WhatsApp configurado.");
      return;
    }

    let message = `👋 Olá! Gostaria de fazer um pedido:\n\n`;
    
    itensCarrinho.forEach(item => {
      const totalItem = (item.produto.salePrice || 0) * item.quantidade;
      message += `▪️ *${item.quantidade}x* ${item.produto.name}\n`;
      message += `   Ref: ${item.produto.code || 'N/A'} | ${formatCurrency(totalItem)}\n`;
    });

    message += `\n💰 *Total do Pedido: ${formatCurrency(valorTotal)}*`;
    message += `\n\nAguardo a confirmação de disponibilidade e pagamento.`;

    const link = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  };

  // --- Filtragem de Produtos ---
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory || (selectedCategory === 'Outros' && !p.category);
      
      return matchSearch && matchCategory;
    });
  }, [produtos, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white text-carvao font-sans">
      <Toaster position="top-center" toastOptions={{ style: { background: '#343434', color: '#fff' } }}/>

      {/* --- HEADER --- */}
      <header className="bg-carvao text-white sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-dourado rounded-lg flex items-center justify-center">
              <span className="font-bold text-carvao text-lg">H</span>
            </div>
            <h1 className="text-xl font-bold tracking-wide">Hive<span className="text-dourado">Pratas</span></h1>
          </div>

          <button 
            onClick={() => setIsCarrinhoAberto(true)} 
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-dourado" />
            {totalItens > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white shadow-sm sticky top-16 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          
          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-dourado focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Categorias (Scroll Horizontal) */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat 
                    ? 'bg-carvao text-dourado shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- LISTA DE PRODUTOS --- */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {produtosFiltrados.map((produto) => (
              <motion.div 
                key={produto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col"
              >
                {/* Imagem do Produto */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden group">
                  {produto.imageUrl ? (
                    <img 
                      src={produto.imageUrl} 
                      alt={produto.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={40} />
                    </div>
                  )}
                  
                  {/* Código / SKU */}
                  {produto.code && (
                    <span className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                      {produto.code}
                    </span>
                  )}
                </div>

                {/* Info do Produto */}
                <div className="p-3 flex flex-col flex-grow">
                  <p className="text-xs text-dourado font-semibold uppercase mb-1">
                    {produto.category || 'Geral'}
                  </p>
                  <h3 className="text-sm font-medium text-carvao line-clamp-2 mb-2 flex-grow">
                    {produto.name}
                  </h3>
                  
                  <div className="mt-auto">
                    <p className="text-lg font-bold text-carvao">
                      {formatCurrency(produto.salePrice)}
                    </p>
                    
                    <button 
                      onClick={() => adicionarAoCarrinho(produto)}
                      className="w-full mt-3 bg-carvao text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODAL DO CARRINHO --- */}
      <AnimatePresence>
        {isCarrinhoAberto && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setIsCarrinhoAberto(false)}
            />
            
            {/* Painel Lateral */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Header Carrinho */}
              <div className="p-4 bg-carvao text-white flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="text-dourado" size={20}/> Meu Pedido
                </h2>
                <button onClick={() => setIsCarrinhoAberto(false)} className="p-1 hover:bg-white/20 rounded-full">
                  <X size={24} />
                </button>
              </div>

              {/* Lista de Itens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {itensCarrinho.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p>O seu carrinho está vazio.</p>
                    <button 
                      onClick={() => setIsCarrinhoAberto(false)}
                      className="text-dourado font-medium hover:underline"
                    >
                      Voltar a comprar
                    </button>
                  </div>
                ) : (
                  itensCarrinho.map(item => (
                    <div key={item.produto.id} className="flex gap-3 p-3 border border-gray-100 rounded-lg shadow-sm bg-white">
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.produto.imageUrl ? (
                          <img src={item.produto.imageUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Package size={24} className="text-gray-300" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-carvao line-clamp-1">{item.produto.name}</h4>
                        <p className="text-sm text-dourado font-bold mt-1">
                          {formatCurrency(item.produto.salePrice)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => removerDoCarrinho(item.produto.id)} className="text-gray-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                        
                        <div className="flex items-center bg-gray-100 rounded-lg">
                          <button 
                            onClick={() => removerDoCarrinho(item.produto.id)}
                            className="p-1 hover:bg-gray-200 rounded-l-lg"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 text-xs font-bold">{item.quantidade}</span>
                          <button 
                            // CORREÇÃO AQUI: Passamos o objeto 'item.produto' corretamente
                            onClick={() => adicionarAoCarrinho(item.produto)} 
                            className="p-1 hover:bg-gray-200 rounded-r-lg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Carrinho */}
              {itensCarrinho.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Total Estimado</span>
                    <span className="text-2xl font-bold text-carvao">{formatCurrency(valorTotal)}</span>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    Finalizar no WhatsApp
                  </button>
                  <p className="text-xs text-center text-gray-400 mt-3">
                    O pagamento e entrega serão combinados diretamente no WhatsApp.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}