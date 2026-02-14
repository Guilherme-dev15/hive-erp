/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Loader2, Search, SlidersHorizontal, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

import { ProdutoCatalogo, ConfigPublica, ItemCarrinho } from './types';
import { fetchCatalogData, fetchStoreBySlug } from './services/api'; // Certifique-se de ter o fetchStoreBySlug no api.ts
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
    banners: [],
    lowStockThreshold: 5 
  });

  // --- ESTADOS DE UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutoCatalogo | null>(null);
  
  // FILTROS
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- CARREGAMENTO INICIAL INTELIGENTE (SAAS) ---
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);

        // 1. DETECÇÃO DE URL (LOCALHOST VS SUBDOMÍNIO)
        let currentSlug = '';
        let currentStoreId = '';

        const hostname = window.location.hostname;
        const params = new URLSearchParams(window.location.search);

        // A. Se estiver em Localhost, usa query params (?loja=... ou ?storeId=...)
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
          currentSlug = params.get('loja') || '';
          currentStoreId = params.get('storeId') || '';
        } 
        // B. Se estiver em Produção (Vercel), tenta pegar o subdomínio
        else {
          const parts = hostname.split('.');
          // Ex: "joias.hiveerp.com" -> partes[0] = "joias" (assumindo que não é www)
          if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app') {
            currentSlug = parts[0];
          } else {
            // Fallback para query params mesmo em produção (útil para testes)
            currentSlug = params.get('loja') || '';
            currentStoreId = params.get('storeId') || '';
          }
        }

        // 2. RESOLUÇÃO DA LOJA
        let finalStoreId = currentStoreId;

        // Se temos um SLUG (nome da loja), buscamos o ID real no backend
        if (currentSlug && !finalStoreId) {
          try {
            const storeData = await fetchStoreBySlug(currentSlug);
            finalStoreId = storeData.storeId;
            
            // Já carrega a config para evitar delay visual
            setConfig({
              storeId: storeData.storeId,
              whatsappNumber: storeData.whatsappNumber,
              storeName: storeData.storeName || 'Loja Virtual',
              primaryColor: storeData.primaryColor || '#D4AF37',
              secondaryColor: storeData.secondaryColor || '#343434',
              banners: storeData.banners || [],
              lowStockThreshold: Number(storeData.lowStockThreshold) || 5
            });
            document.title = storeData.storeName || 'Loja Virtual';
          } catch (err) {
            console.error("Loja não encontrada pelo nome:", currentSlug);
            setError("Loja não encontrada. Verifique o endereço.");
            setLoading(false);
            return;
          }
        }

        if (!finalStoreId) {
          setError("Loja não identificada. Verifique o link fornecido.");
          setLoading(false);
          return;
        }

        // 3. BUSCA DO CATÁLOGO (PRODUTOS)
        const data = await fetchCatalogData(finalStoreId);
        
        const safeProducts = (data.produtos || []).map((p: any) => ({ 
          ...p, 
          salePrice: Number(p.salePrice) || 0,
          promotionalPrice: Number(p.promotionalPrice) || 0 
        }));
        
        setProdutos(safeProducts);
        
        // Se a config não veio pelo slug (caso de uso por ID direto), carrega aqui
        if (data.config && !currentSlug) {
          setConfig({
            whatsappNumber: data.config.whatsappNumber,
            storeName: data.config.storeName || 'Loja Virtual',
            primaryColor: data.config.primaryColor || '#D4AF37',
            secondaryColor: data.config.secondaryColor || '#343434',
            banners: data.config.banners || [],
            lowStockThreshold: Number(data.config.lowStockThreshold) || 5
          });
          document.title = data.config.storeName || 'Loja Virtual';
        }

      } catch (err) { 
        console.error("Erro no carregamento:", err); 
        setError("Erro ao carregar loja."); 
      } finally { 
        setLoading(false); 
      }
    }
    init();
  }, []);

  // --- LÓGICA DO CARRINHO ---
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stock = produto.quantity ?? 0;
    if (stock <= 0) {
      toast.error("Esgotado!", { id: `esgotado-${produto.id}` });
      return;
    }

    const qtdAtual = carrinho[produto.id]?.quantidade || 0;
    if (qtdAtual + 1 > stock) { 
       toast.error("Estoque limite atingido.", { id: `limit-${produto.id}` }); 
       return; 
    }
    
    const finalPrice = (produto.isOnSale && produto.promotionalPrice && produto.promotionalPrice < produto.salePrice)
        ? produto.promotionalPrice
        : produto.salePrice;

    const produtoParaCarrinho = { ...produto, salePrice: finalPrice };

    setCarrinho((prev) => ({ 
        ...prev, 
        [produto.id]: { produto: produtoParaCarrinho, quantidade: qtdAtual + 1 } 
    }));

    toast.success("Adicionado ao carrinho!", { id: `add-${produto.id}` });
    setIsCarrinhoAberto(true);
  };

  // --- CÁLCULOS E FILTROS ---
  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const produtosFiltrados = useMemo(() => {
    let lista = produtos.filter(p => p.status === 'ativo' || !p.status);
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t));
    }
    if (selectedCategory) lista = lista.filter(p => p.category === selectedCategory);
    if (selectedSubcategory) lista = lista.filter(p => p.subcategory === selectedSubcategory);
    
    const getEffectivePrice = (p: ProdutoCatalogo) => (p.isOnSale && p.promotionalPrice) ? p.promotionalPrice : p.salePrice;

    if (sortOrder === 'priceAsc') lista.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    if (sortOrder === 'priceDesc') lista.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    
    return lista;
  }, [produtos, selectedCategory, selectedSubcategory, searchTerm, sortOrder]);

  // --- TELAS DE ESTADO ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-gray-400" size={32} />
      <p className="text-gray-500 font-medium">Carregando loja...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Store size={48} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Loja não encontrada</h2>
      <p className="text-gray-500 max-w-xs">{error}</p>
    </div>
  );

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
          <div className="px-4 mb-3 flex gap-2">
            <div className="relative flex-grow shadow-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
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
          
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 mb-2">
                <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar">
                  {['default', 'priceAsc', 'priceDesc'].map(opt => (
                    <button 
                      key={opt} 
                      onClick={() => setSortOrder(opt as any)} 
                      className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${sortOrder === opt ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}
                    >
                      {opt === 'default' ? 'Relevância' : opt === 'priceAsc' ? 'Menor Preço' : 'Maior Preço'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                 {selectedCategory || 'Destaques'}
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
             <p>Nenhum produto encontrado.</p>
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

      {/* MODAIS */}
      <ModalCarrinho 
        isOpen={isCarrinhoAberto} 
        onClose={() => setIsCarrinhoAberto(false)} 
        itens={itensDoCarrinho} 
        setCarrinho={setCarrinho} 
        whatsappNumber={config.whatsappNumber} 
        config={config} 
      />
      
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