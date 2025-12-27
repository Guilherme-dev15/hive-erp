/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

import { ProdutoCatalogo, ConfigPublica, ItemCarrinho } from './types';
import { fetchCatalogData } from './services/api';
import { BannerCarousel } from './components/BannerCarousel';
import { CardProduto } from './components/CardProduto';
import { ModalCarrinho } from './components/ModalCarrinho';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CategoryFilter } from './components/CategoryFilter';

export default function App() {
  // --- ESTADOS DE DADOS ---
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null, 
    storeName: 'Carregando...', 
    primaryColor: '#D4AF37', 
    secondaryColor: '#343434', 
    banners: []
  });

  // --- ESTADOS DE UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  
  // Produto selecionado para o Modal de Detalhes
  const [selectedProduct, setSelectedProduct] = useState<ProdutoCatalogo | null>(null);
  
  // FILTROS
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await fetchCatalogData();
        
        // Sanitização de preços
        const safeProducts = (data.produtos || []).map((p: any) => ({ 
          ...p, 
          salePrice: Number(p.salePrice) || 0 
        }));
        
        setProdutos(safeProducts);
        
        if (data.config) {
          setConfig({
            whatsappNumber: data.config.whatsappNumber,
            storeName: data.config.storeName || 'Loja Virtual',
            primaryColor: data.config.primaryColor || '#D4AF37',
            secondaryColor: data.config.secondaryColor || '#343434',
            banners: data.config.banners || []
          });
          document.title = data.config.storeName || 'Loja Virtual';
        }
      } catch (err) { 
        console.error(err); 
        setError("Erro ao carregar loja."); 
      } finally { 
        setLoading(false); 
      }
    }
    init();
  }, []);

  // --- LÓGICA DO CARRINHO (CORRIGIDA) ---
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stock = produto.quantity ?? 0;
    
    // 1. Verificações Iniciais (Antes de mexer no estado)
    if (stock <= 0) {
      toast.error("Esgotado!", { id: `esgotado-${produto.id}` });
      return;
    }

    // Pega a quantidade atual direto do estado 'carrinho'
    const qtdAtual = carrinho[produto.id]?.quantidade || 0;
    
    if (qtdAtual + 1 > stock) { 
       toast.error("Estoque limite atingido.", { id: `limit-${produto.id}` }); 
       return; 
    }
    
    // 2. Atualiza o Estado (Agora é uma função pura, sem side-effects)
    setCarrinho((prev) => ({ 
        ...prev, 
        [produto.id]: { produto, quantidade: qtdAtual + 1 } 
    }));

    // 3. Efeitos Colaterais (Toasts e Abrir Modal) executados fora do setCarrinho
    toast.success("Adicionado ao carrinho!", { id: `add-${produto.id}` });
    setIsCarrinhoAberto(true);
  };

  // --- CÁLCULOS E FILTROS ---
  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const produtosFiltrados = useMemo(() => {
    // 1. Filtra por status primeiro
    let lista = produtos.filter(p => p.status === 'ativo' || !p.status);
    
    // 2. Filtro de Busca
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      lista = lista.filter(p => 
        p.name.toLowerCase().includes(t) || 
        p.code?.toLowerCase().includes(t)
      );
    }

    // 3. Filtro de Categoria
    if (selectedCategory) {
       lista = lista.filter(p => p.category === selectedCategory);
    }

    // 4. Filtro de Subcategoria
    if (selectedSubcategory) {
       lista = lista.filter(p => p.subcategory === selectedSubcategory);
    }
    
    // 5. Ordenação
    if (sortOrder === 'priceAsc') lista.sort((a, b) => a.salePrice - b.salePrice);
    if (sortOrder === 'priceDesc') lista.sort((a, b) => b.salePrice - a.salePrice);
    
    return lista;
  }, [produtos, selectedCategory, selectedSubcategory, searchTerm, sortOrder]);

  // --- RENDERIZAÇÃO ---
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-20">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between backdrop-blur-xl bg-white/80 border-b border-gray-100/50 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight truncate max-w-[70%]" style={{ color: config.secondaryColor }}>
          {config.storeName}
        </h1>
        <button onClick={() => setIsCarrinhoAberto(true)} className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors" style={{ color: config.secondaryColor }}>
          <ShoppingCart size={22} strokeWidth={2.5} />
          {totalItens > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
              {totalItens}
            </motion.span>
          )}
        </button>
      </header>

      {/* BANNER */}
      {config.banners && config.banners.length > 0 ? (
        <BannerCarousel banners={config.banners} />
      ) : (
        <div className="mt-20"></div>
      )}

      {/* ÁREA DE FILTROS E BUSCA */}
      <div className="sticky top-16 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-3 pb-1">
        <div className="max-w-7xl mx-auto">
          
          {/* BUSCA E BOTÃO DE ORDENAÇÃO */}
          <div className="px-4 mb-3 flex gap-2">
            <div className="relative flex-grow shadow-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white text-sm focus:ring-2 ring-opacity-20 outline-none" 
                style={{ '--tw-ring-color': config.primaryColor } as any} 
              />
            </div>
            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="p-3 rounded-2xl shadow-sm bg-white text-gray-500">
              <SlidersHorizontal size={20} />
            </button>
          </div>
          
          {/* PAINEL DE ORDENAÇÃO */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 mb-2">
                <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar">
                  {['default', 'priceAsc', 'priceDesc'].map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => setSortOrder(opt as any)} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold border ${sortOrder === opt ? 'bg-gray-800 text-white' : 'bg-white'}`}
                    >
                      {opt === 'default' ? 'Relevância' : opt === 'priceAsc' ? 'Menor Preço' : 'Maior Preço'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FILTRO DE CATEGORIA E SUBCATEGORIA */}
          <div className="px-4 pb-2">
             <CategoryFilter 
               products={produtos} 
               selectedCategory={selectedCategory}
               selectedSubcategory={selectedSubcategory}
               onSelectCategory={setSelectedCategory}
               onSelectSubcategory={setSelectedSubcategory}
               config={config}
             />
          </div>
        </div>
      </div>

      {/* LISTAGEM DE PRODUTOS */}
      <main className="max-w-7xl mx-auto p-4 min-h-[60vh]">
        <div className="mb-5 px-1 flex items-end justify-between border-b border-gray-100 pb-2">
            <div className="flex flex-col">
               <h2 className="text-xl font-bold text-gray-800">
                 {selectedCategory || 'Todos os Produtos'}
               </h2>
               {selectedSubcategory && (
                 <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                   ▶ {selectedSubcategory}
                 </span>
               )}
            </div>
            <span className="text-xs text-gray-400 font-medium mb-1">{produtosFiltrados.length} itens</span>
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {produtosFiltrados.map(prod => (
              <CardProduto 
                key={prod.id} 
                produto={prod} 
                config={config} 
                onAdicionar={() => adicionarAoCarrinho(prod)} 
                onImageClick={() => setSelectedProduct(prod)} 
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center text-gray-400">
             <Search size={48} className="mb-4 opacity-20" />
             <p>Nenhum produto encontrado nesta categoria.</p>
             {(selectedCategory || searchTerm) && (
               <button 
                 onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSearchTerm(''); }}
                 className="mt-4 text-blue-500 text-sm font-bold hover:underline"
               >
                 Limpar Filtros
               </button>
             )}
          </div>
        )}
      </main>

      {/* MODAL CARRINHO */}
      <ModalCarrinho 
        isOpen={isCarrinhoAberto} 
        onClose={() => setIsCarrinhoAberto(false)} 
        itens={itensDoCarrinho} 
        setCarrinho={setCarrinho} 
        whatsappNumber={config.whatsappNumber} 
        config={config} 
      />
      
      {/* MODAL DETALHES DO PRODUTO */}
      <ProductDetailsModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
        onAddToCart={adicionarAoCarrinho} 
        config={config} 
      />
    </div>
  );
}