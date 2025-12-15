/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Imports Refatorados
import { ProdutoCatalogo, ConfigPublica, ItemCarrinho } from './types';
import { fetchCatalogData } from './services/api';
import { BannerCarousel } from './components/BannerCarousel';
import { CardProduto } from './components/CardProduto';
import { ModalCarrinho } from './components/ModalCarrinho';
import { ImageZoomModal } from './components/ImageZoomModal';

export default function App() {
  // Dados
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'Carregando...',
    primaryColor: '#D4AF37',
    secondaryColor: '#343434',
    banners: []
  });

  // Estado UI
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  
  // Filtros
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 1. Carregamento Inicial
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await fetchCatalogData();
        
        // Sanitização dos preços
        const safeProducts = (data.produtos || []).map((p: any) => ({
          ...p,
          salePrice: Number(p.salePrice) || 0
        }));

        setProdutos(safeProducts);
        setCategories(["Todos", ...(data.categorias || [])]);

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
        setError("Não foi possível carregar a loja no momento.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Lógica do Carrinho
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity ?? 0;
    if (stockDisponivel <= 0) return toast.error("Produto esgotado!");

    setCarrinho((prev) => {
      const qtd = prev[produto.id]?.quantidade || 0;
      if (qtd + 1 > stockDisponivel) {
        toast.error(`Máximo de ${stockDisponivel} unidades disponíveis.`);
        return prev;
      }
      toast.success("Adicionado ao carrinho!");
      setIsCarrinhoAberto(true);
      return { ...prev, [produto.id]: { produto, quantidade: qtd + 1 } };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // 3. Lógica de Filtragem
  const produtosFiltrados = useMemo(() => {
    let lista = produtos.filter(p => p.status === 'ativo' || !p.status);
    
    if (selectedCategory !== "Todos") {
      lista = lista.filter(p => selectedCategory === "Outros" ? !p.category : p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t));
    }
    if (sortOrder === 'priceAsc') lista.sort((a, b) => a.salePrice - b.salePrice);
    if (sortOrder === 'priceDesc') lista.sort((a, b) => b.salePrice - a.salePrice);
    
    return lista;
  }, [produtos, selectedCategory, searchTerm, sortOrder]);

  // 4. Renderização
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-20 selection:bg-gray-200">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between backdrop-blur-xl bg-white/80 border-b border-gray-100/50 shadow-sm transition-all">
        <h1 className="text-lg font-bold tracking-tight truncate max-w-[70%]" style={{ color: config.secondaryColor }}>
          {config.storeName}
        </h1>
        
        <button onClick={() => setIsCarrinhoAberto(true)} className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors" style={{ color: config.secondaryColor }}>
          <ShoppingCart size={22} strokeWidth={2.5} />
          {totalItens > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm border-2 border-white">
              {totalItens}
            </motion.span>
          )}
        </button>
      </header>

      {/* Banner */}
      {config.banners && config.banners.length > 0 ? (
        <BannerCarousel banners={config.banners} />
      ) : (
        <div className="mt-20"></div>
      )}

      {/* Filtros e Busca */}
      <div className="sticky top-16 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-3 pb-1">
        <div className="max-w-7xl mx-auto">
          
          <div className="px-4 mb-3 flex gap-2">
            <div className="relative flex-grow shadow-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="O que procura hoje?" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white text-sm focus:ring-2 ring-opacity-20 transition-all placeholder:text-gray-400 font-medium"
                style={{ '--tw-ring-color': config.primaryColor, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' } as any}
              />
            </div>
            
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center ${isFilterOpen ? 'bg-white text-gray-800 ring-2' : 'bg-white text-gray-500'}`}
              style={isFilterOpen ? { '--tw-ring-color': config.primaryColor } as any : {}}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 mb-2">
                <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                  {['default', 'priceAsc', 'priceDesc'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSortOrder(opt as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap ${
                        sortOrder === opt ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {opt === 'default' ? 'Relevância' : opt === 'priceAsc' ? 'Menor Preço' : 'Maior Preço'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-1 no-scrollbar items-center">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className="relative px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all z-10"
                  style={{ color: isActive ? '#fff' : '#666' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 rounded-full -z-10 shadow-md"
                      style={{ backgroundColor: config.primaryColor }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Listagem de Produtos */}
      <main className="max-w-7xl mx-auto p-4 min-h-[60vh]">
        <div className="mb-5 px-1 flex items-end justify-between border-b border-gray-100 pb-2">
           <h2 className="text-xl font-bold text-gray-800">{selectedCategory}</h2>
           <span className="text-xs text-gray-400 font-medium mb-1">{produtosFiltrados.length} resultados</span>
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {produtosFiltrados.map(prod => (
              <CardProduto 
                key={prod.id} 
                produto={prod} 
                config={config} 
                onAdicionar={() => adicionarAoCarrinho(prod)} 
                onImageClick={() => setZoomedImageUrl(prod.imageUrl || null)} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-40" />
             </div>
             <p className="font-bold text-lg text-gray-600">Nada encontrado</p>
             <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}} className="mt-4 px-6 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
               Ver Tudo
             </button>
          </div>
        )}
      </main>

      <ModalCarrinho 
        isOpen={isCarrinhoAberto} 
        onClose={() => setIsCarrinhoAberto(false)} 
        itens={itensDoCarrinho} 
        setCarrinho={setCarrinho} 
        whatsappNumber={config.whatsappNumber} 
        config={config} 
      />
      
      <ImageZoomModal imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
    </div>
  );
}