/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Loader2, Search, SlidersHorizontal, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

import { ProdutoCatalogo, ConfigPublica, ItemCarrinho } from './types';
import { fetchCatalogData, fetchStoreBySlug } from './services/api';
import { BannerCarousel } from './components/BannerCarousel';
import { CardProduto } from './components/CardProduto';
import { ModalCarrinho } from './components/ModalCarrinho';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CategoryFilter } from './components/CategoryFilter';

// ============================================================================
// 1. HOOK: IDENTIFICAÇÃO DA LOJA (Lógica de URL e Slug)
// ============================================================================
const useStoreIdentity = () => {
  const [identity, setIdentity] = useState<{ slug: string | null; storeId: string | null }>({
    slug: null,
    storeId: null
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Prioridade 1: ?loja=nome (Amigável) ou ?slug=nome (Técnico)
    let currentSlug = params.get('loja') || params.get('slug');
    const directStoreId = params.get('storeId');

    // Prioridade 2: Subdomínio
    if (!currentSlug) {
      const host = window.location.hostname;
      if (!host.includes('localhost') && !host.includes('vercel.app')) {
        currentSlug = host.split('.')[0];
      }
    }

    setIdentity({ slug: currentSlug, storeId: directStoreId });
  }, []);

  return identity;
};

// ============================================================================
// 2. HOOK: DADOS DA LOJA (Busca API)
// ============================================================================
const useStoreData = (slug: string | null, directStoreId: string | null) => {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'Carregando...',
    primaryColor: '#D4AF37',
    secondaryColor: '#343434',
    banners: [],
    lowStockThreshold: 5
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug && !directStoreId) return; // Aguarda identificação

    async function loadData() {
      try {
        setLoading(true);
        let finalStoreId = directStoreId;

        // Passo A: Se temos slug mas não ID, busca o ID
        if (slug && !finalStoreId) {
          try {
            const storeData = await fetchStoreBySlug(slug);
            finalStoreId = storeData.storeId;
            
            // Pré-carrega config básica
            setConfig(prev => ({
              ...prev,
              ...storeData,
              storeName: storeData.storeName || 'Loja Virtual',
              slug: storeData.slug
            }));
            document.title = storeData.storeName || 'Loja Virtual';
          } catch (err) {
            throw new Error("Loja não encontrada. Verifique o endereço.");
          }
        }

        if (!finalStoreId) throw new Error("ID da loja não identificado.");

        // Passo B: Busca Catálogo Completo
        const data = await fetchCatalogData(finalStoreId);
        
        // Tratamento de preços (Numbers)
        const safeProducts = (data.produtos || []).map((p: any) => ({
          ...p,
          salePrice: Number(p.salePrice) || 0,
          promotionalPrice: Number(p.promotionalPrice) || 0
        }));

        setProdutos(safeProducts);

        // Atualiza config com dados mais recentes do catálogo
        if (data.config) {
          setConfig(prev => ({
            ...prev,
            storeId: finalStoreId,
            ...data.config,
            storeName: data.config.storeName || prev.storeName
          }));
        }

      } catch (err: any) {
        console.error("Erro carrega loja:", err);
        setError(err.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, directStoreId]);

  return { produtos, config, loading, error };
};

// ============================================================================
// 3. HOOK: CARRINHO DE COMPRAS
// ============================================================================
const useCart = () => {
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isAberto, setIsAberto] = useState(false);

  const adicionar = useCallback((produto: ProdutoCatalogo) => {
    const stock = produto.quantity ?? 0;
    
    if (stock <= 0) {
      toast.error("Esgotado!", { id: `esg-${produto.id}` });
      return;
    }

    setCarrinho((prev) => {
      const qtdAtual = prev[produto.id]?.quantidade || 0;
      
      if (qtdAtual + 1 > stock) {
        toast.error("Estoque limite atingido.", { id: `lim-${produto.id}` });
        return prev;
      }

      const finalPrice = (produto.isOnSale && produto.promotionalPrice && produto.promotionalPrice < produto.salePrice)
        ? produto.promotionalPrice
        : produto.salePrice;

      toast.success("Adicionado ao carrinho!", { id: `add-${produto.id}` });
      setIsAberto(true);

      return {
        ...prev,
        [produto.id]: { 
          produto: { ...produto, salePrice: finalPrice }, 
          quantidade: qtdAtual + 1 
        }
      };
    });
  }, []);

  const itens = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return { carrinho, setCarrinho, adicionar, itens, totalItens, isAberto, setIsAberto };
};

// ============================================================================
// 4. HOOK: FILTROS E BUSCA
// ============================================================================
const useProductFilter = (produtos: ProdutoCatalogo[]) => {
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    let lista = produtos.filter(p => p.status === 'ativo' || !p.status);

    if (term.trim()) {
      const t = term.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t));
    }

    if (category) lista = lista.filter(p => p.category === category);
    if (subcategory) lista = lista.filter(p => p.subcategory === subcategory);

    const getPrice = (p: ProdutoCatalogo) => (p.isOnSale && p.promotionalPrice) ? p.promotionalPrice : p.salePrice;

    if (sortOrder === 'priceAsc') lista.sort((a, b) => getPrice(a) - getPrice(b));
    if (sortOrder === 'priceDesc') lista.sort((a, b) => getPrice(b) - getPrice(a));

    return lista;
  }, [produtos, term, category, subcategory, sortOrder]);

  return { 
    filtered, term, setTerm, 
    category, setCategory, 
    subcategory, setSubcategory, 
    sortOrder, setSortOrder, 
    isOpen, setIsOpen 
  };
};

// ============================================================================
// COMPONENTE PRINCIPAL (Limpo e Organizado)
// ============================================================================
export default function App() {
  // 1. Identidade e Dados
  const { slug, storeId } = useStoreIdentity();
  const { produtos, config, loading, error } = useStoreData(slug, storeId);
  
  // 2. Lógica de Negócio
  const cart = useCart();
  const filter = useProductFilter(produtos);
  const [selectedProduct, setSelectedProduct] = useState<ProdutoCatalogo | null>(null);

  // --- RENDERS DE ESTADO ---
  if (loading && !config.storeName) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-gray-400" size={32} />
      <p className="text-gray-500 font-medium">Carregando loja...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Store size={48} className="text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Loja indisponível</h2>
      <p className="text-gray-500 max-w-xs">{error}</p>
      <p className="text-xs text-gray-400 mt-4">Tente usar ?loja=nome-da-loja</p>
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
        <button onClick={() => cart.setIsAberto(true)} className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors" style={{ color: config.secondaryColor }}>
          <ShoppingCart size={22} strokeWidth={2.5} />
          {cart.totalItens > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
              {cart.totalItens}
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

      {/* FILTROS E BUSCA */}
      <div className="sticky top-16 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-3 pb-1">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 mb-3 flex gap-2">
            <div className="relative flex-grow shadow-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={filter.term}
                onChange={e => filter.setTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white text-sm focus:ring-2 ring-opacity-20 outline-none"
                style={{ '--tw-ring-color': config.primaryColor } as any}
              />
            </div>
            <button onClick={() => filter.setIsOpen(!filter.isOpen)} className="p-3 rounded-2xl shadow-sm bg-white text-gray-500">
              <SlidersHorizontal size={20} />
            </button>
          </div>

          <AnimatePresence>
            {filter.isOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 mb-2">
                <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar">
                  {['default', 'priceAsc', 'priceDesc'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => filter.setSortOrder(opt as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${filter.sortOrder === opt ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}
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
              selectedCategory={filter.category}
              selectedSubcategory={filter.subcategory}
              onSelectCategory={filter.setCategory}
              onSelectSubcategory={filter.setSubcategory}
              config={config}
            />
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <main className="max-w-7xl mx-auto p-4 min-h-[60vh]">
        <div className="mb-5 px-1 flex items-end justify-between border-b border-gray-100 pb-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">
              {filter.category || 'Destaques'}
            </h2>
            {filter.subcategory && (
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                ▶ {filter.subcategory}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 font-medium mb-1">{filter.filtered.length} itens</span>
        </div>

        {filter.filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filter.filtered.map(prod => (
              <CardProduto
                key={prod.id}
                produto={prod}
                config={config}
                onAdicionar={() => cart.adicionar(prod)}
                onImageClick={() => setSelectedProduct(prod)}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center justify-center text-gray-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Nenhum produto encontrado.</p>
            {(filter.category || filter.term) && (
              <button
                onClick={() => { filter.setCategory(null); filter.setSubcategory(null); filter.setTerm(''); }}
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
        isOpen={cart.isAberto}
        onClose={() => cart.setIsAberto(false)}
        itens={cart.itens}
        setCarrinho={cart.setCarrinho}
        whatsappNumber={config.whatsappNumber}
        config={config}
      />

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onAddToCart={cart.adicionar}
        config={config}
      />
    </div>
  );
}