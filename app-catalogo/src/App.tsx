/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, Search, SlidersHorizontal, TicketPercent, Loader2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// ============================================================================
// 1. TIPOS DE DADOS
// ============================================================================

interface ProdutoCatalogo {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  salePrice?: number;
  status?: 'ativo' | 'inativo';
  imageUrl?: string;
  quantity?: number;
}

interface ConfigPublica {
  whatsappNumber: string | null;
  storeName: string;
  primaryColor: string;
  secondaryColor: string;
  banners?: string[];
}

interface ItemCarrinho {
  produto: ProdutoCatalogo;
  quantidade: number;
}

// ============================================================================
// 2. CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const apiClient = axios.create({ baseURL: API_URL });

// ============================================================================
// 3. SERVIÇOS
// ============================================================================
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const saveOrder = async (payload: any) => {
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

const checkCoupon = async (code: string) => {
  const response = await apiClient.post('/validate-coupon', { code });
  return response.data; 
};

// ============================================================================
// 4. COMPONENTE CARROSSEL (MODERNO)
// ============================================================================
function BannerCarousel({ banners }: { banners: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full aspect-[21/9] md:h-96 bg-gray-100 overflow-hidden shadow-sm group mt-16">
       <AnimatePresence mode='wait'>
         <motion.img
            key={currentIndex}
            src={banners[currentIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
         />
       </AnimatePresence>
       
       {banners.length > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'}`}
              />
            ))}
         </div>
       )}
    </div>
  );
}

// ============================================================================
// 5. APP PRINCIPAL
// ============================================================================
export default function App() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'Carregando...',
    primaryColor: '#D4AF37', 
    secondaryColor: '#343434',
    banners: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados UI
  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    async function carregarLoja() {
      try {
        setLoading(true);
        const [prodRes, confRes, catRes] = await Promise.all([
          apiClient.get('/produtos-catalogo').catch(() => ({ data: [] })),
          apiClient.get('/config-publica').catch(() => ({ data: null })),
          apiClient.get('/categories-public').catch(() => ({ data: [] }))
        ]);

        setProdutos(prodRes.data || []);
        setCategories(["Todos", ...(catRes.data || [])]);

        if (confRes.data) {
          setConfig({
            whatsappNumber: confRes.data.whatsappNumber,
            storeName: confRes.data.storeName || 'Minha Loja',
            primaryColor: confRes.data.primaryColor || '#D4AF37',
            secondaryColor: confRes.data.secondaryColor || '#343434',
            banners: confRes.data.banners || []
          });
          document.title = confRes.data.storeName || 'Loja Virtual';
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar loja.");
      } finally {
        setLoading(false);
      }
    }
    carregarLoja();
  }, []);

  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity !== undefined ? produto.quantity : 0;
    if (stockDisponivel <= 0) return toast.error("Esgotado!");

    setCarrinho(prev => {
      const qtd = prev[produto.id]?.quantidade || 0;
      if (qtd + 1 > stockDisponivel) {
        toast.error(`Máximo de ${stockDisponivel} un.`);
        return prev;
      }
      toast.success("Adicionado!");
      setIsCarrinhoAberto(true);
      return { ...prev, [produto.id]: { produto, quantidade: qtd + 1 } };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const produtosFiltrados = useMemo(() => {
    let lista = produtos.filter(p => p.status === 'ativo');
    if (selectedCategory !== "Todos") {
      lista = lista.filter(p => selectedCategory === "Outros" ? !p.category : p.category === selectedCategory);
    }
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(t) || p.code?.toLowerCase().includes(t));
    }
    if (sortOrder === 'priceAsc') lista.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    if (sortOrder === 'priceDesc') lista.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    return lista;
  }, [produtos, selectedCategory, searchTerm, sortOrder]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-400" size={32} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-20 selection:bg-gray-200">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />

      {/* --- HEADER (App Style Glassmorphism) --- */}
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

      {/* --- BANNER --- */}
      {config.banners && config.banners.length > 0 ? (
        <BannerCarousel banners={config.banners} />
      ) : (
        <div className="mt-20"></div>
      )}

      {/* --- NAVEGAÇÃO E FILTROS (Sticky) --- */}
      <div className="sticky top-16 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-3 pb-1">
        <div className="max-w-7xl mx-auto">
          
          {/* Busca e Filtro */}
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

          {/* Filtro Expansível */}
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

          {/* Menu Categorias (Pílulas Animadas) */}
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

      {/* --- LISTAGEM DE PRODUTOS --- */}
      <main className="max-w-7xl mx-auto p-4 min-h-[60vh]">
        <div className="mb-5 px-1 flex items-end justify-between border-b border-gray-100 pb-2">
           <h2 className="text-xl font-bold text-gray-800">{selectedCategory}</h2>
           <span className="text-xs text-gray-400 font-medium mb-1">{produtosFiltrados.length} resultados</span>
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {produtosFiltrados.map(prod => (
              <CardProduto 
                key={prod.id} produto={prod} config={config} 
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
             <p className="text-sm">Tente buscar por outro termo.</p>
             <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}} className="mt-4 px-6 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
               Ver Tudo
             </button>
          </div>
        )}
      </main>

      <ModalCarrinho isOpen={isCarrinhoAberto} onClose={() => setIsCarrinhoAberto(false)} itens={itensDoCarrinho} setCarrinho={setCarrinho} whatsappNumber={config.whatsappNumber} config={config} />
      <ImageZoomModal imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES (COM CORREÇÃO DE DESCRIÇÃO)
// ============================================================================

function CardProduto({ produto, config, onAdicionar, onImageClick }: any) {
  const stock = produto.quantity !== undefined ? produto.quantity : 0;
  const temStock = stock > 0;
  
  // --- NOVO: Estado para expandir descrição ---
  const [expandDesc, setExpandDesc] = useState(false);
  const desc = produto.description || '';
  const isLongDesc = desc.length > 60; // Define o que é "longo"

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-50 flex flex-col h-full relative group hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[1/1.1] bg-gray-100 cursor-pointer overflow-hidden" onClick={onImageClick}>
        {produto.imageUrl ? (
          <img src={produto.imageUrl} alt={produto.name} loading="lazy" className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!temStock && 'grayscale opacity-70'}`} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"><Package size={40} strokeWidth={1.5} /></div>
        )}
        
        {!temStock && (
           <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border border-white/10">ESGOTADO</span>
        )}
        {temStock && stock <= 3 && (
           <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg border border-red-400">Últimos {stock}</span>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-relaxed min-h-[2.5em] tracking-tight">{produto.name}</h3>
          <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-wide">{produto.code || ''}</p>
          
          {/* --- NOVA DESCRIÇÃO EXPANSÍVEL --- */}
          {desc && (
            <div className="mt-2 text-xs text-gray-500 relative">
              <motion.div 
                animate={{ height: expandDesc ? 'auto' : '2.4em' }} // Altura aproximada de 2 linhas
                className="overflow-hidden leading-relaxed"
              >
                {desc}
              </motion.div>
              
              {isLongDesc && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setExpandDesc(!expandDesc); }}
                  className="mt-1 text-[10px] font-bold flex items-center gap-1 hover:underline transition-all"
                  style={{ color: config.primaryColor }}
                >
                  {expandDesc ? (
                    <>Ver menos <ChevronUp size={10} /></>
                  ) : (
                    <>Ver mais <ChevronDown size={10} /></>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-3 flex items-end justify-between">
          <p className="text-lg font-extrabold tracking-tight" style={{ color: config.secondaryColor }}>{formatCurrency(produto.salePrice)}</p>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onAdicionar(); }} 
            disabled={!temStock} 
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 hover:brightness-110
              ${temStock ? 'text-white shadow-lg shadow-black/10' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            style={temStock ? { backgroundColor: config.primaryColor } : {}}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ... (MANTENHA OS OUTROS COMPONENTES: ModalCarrinho e ImageZoomModal IGUAIS) ...
function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: any) {
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [obs, setObs] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const { subtotal, desconto, total } = useMemo(() => {
    const sub = itens.reduce((acc: number, i: any) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);
    const desc = appliedCoupon ? sub * (appliedCoupon.percent / 100) : 0;
    return { subtotal: sub, desconto: desc, total: sub - desc };
  }, [itens, appliedCoupon]);

  const handleCoupon = async () => {
    if(!couponCode) return;
    try {
      const res = await checkCoupon(couponCode);
      setAppliedCoupon({ code: res.code, percent: res.discountPercent });
      toast.success("Cupom aplicado!");
    } catch { toast.error("Inválido"); setAppliedCoupon(null); }
  };

  const updateQtd = (id: string, d: number) => {
    setCarrinho((prev: any) => {
      const item = prev[id];
      if (!item) return prev;
      const nova = item.quantidade + d;
      if (d > 0 && nova > (item.produto.quantity || 0)) { toast.error("Stock limite"); return prev; }
      if (nova <= 0) { const c = {...prev}; delete c[id]; return c; }
      return { ...prev, [id]: { ...item, quantidade: nova } };
    });
  };

  const removeItem = (id: string) => {
    setCarrinho((prev: any) => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const finalizar = async () => {
    if (!whatsappNumber) return toast.error("Loja sem WhatsApp");
    if (!nome || !tel) return toast.error("Informe seus dados");
    setLoading(true);
    try {
      const itemsPayload = itens.map((i: any) => ({ id: i.produto.id, name: i.produto.name, code: i.produto.code, salePrice: i.produto.salePrice, quantidade: i.quantidade }));
      const res = await saveOrder({ items: itemsPayload, subtotal, desconto, total, observacoes: obs, clienteNome: nome, clienteTelefone: tel, status: 'Aguardando Pagamento' } as any);
      
      const msg = `🧾 *Pedido #${res.id.substring(0,5).toUpperCase()}*\n👤 ${nome}\n\n` +
                  itens.map((i: any) => `${i.quantidade}x ${i.produto.name}`).join('\n') +
                  `\n\nSubtotal: ${formatCurrency(subtotal)}` +
                  (desconto > 0 ? `\nDesconto (${appliedCoupon?.code}): -${formatCurrency(desconto)}` : '') +
                  `\n*Total: ${formatCurrency(total)}*` + (obs ? `\nObs: ${obs}` : '');
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrinho({}); onClose();
    } catch { toast.error("Erro ao enviar"); } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div 
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
             <div className="p-5 flex justify-between items-center bg-gray-50/50 border-b backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={22} className="text-gray-400"/> Seu Carrinho</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-500" /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {itens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p className="font-medium">Seu carrinho está vazio.</p>
                    <button onClick={onClose} className="mt-4 text-sm font-bold text-blue-600">Voltar a comprar</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {itens.map((item: any) => (
                        <div key={item.produto.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                           <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                             {item.produto.imageUrl ? <img src={item.produto.imageUrl} className="w-full h-full object-cover"/> : <Package size={24} className="text-gray-300"/>}
                           </div>
                           <div className="flex-1 pr-6">
                             <p className="text-sm font-bold text-gray-800 line-clamp-1 mb-1">{item.produto.name}</p>
                             <p className="text-xs text-gray-500 mb-3">{formatCurrency(item.produto.salePrice)}</p>
                             <div className="flex items-center gap-3">
                                <div className="flex items-center bg-gray-100 rounded-lg h-8 px-1">
                                  <button onClick={() => updateQtd(item.produto.id, -1)} className="w-8 h-full flex items-center justify-center hover:text-red-500 transition-colors"><Minus size={14} strokeWidth={3}/></button>
                                  <span className="w-6 text-center text-sm font-bold text-gray-700">{item.quantidade}</span>
                                  <button onClick={() => updateQtd(item.produto.id, 1)} className="w-8 h-full flex items-center justify-center hover:text-green-600 transition-colors"><Plus size={14} strokeWidth={3}/></button>
                                </div>
                             </div>
                           </div>
                           <button onClick={() => removeItem(item.produto.id)} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><X size={16}/></button>
                           <div className="absolute bottom-3 right-3 text-sm font-bold text-gray-800">{formatCurrency(item.produto.salePrice * item.quantidade)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><User size={14}/> Entrega</p>
                       <input placeholder="Seu Nome Completo" className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" value={nome} onChange={e => setNome(e.target.value)} />
                       <input placeholder="WhatsApp (com DDD)" className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all" value={tel} onChange={e => setTel(e.target.value)} />
                       <textarea placeholder="Observações (opcional)..." className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-black/5 outline-none resize-none transition-all" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                       <div className="relative flex-1 group">
                         <TicketPercent size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors"/>
                         <input placeholder="CUPOM DE DESCONTO" className="w-full pl-10 p-3.5 rounded-xl border border-gray-200 text-sm uppercase font-bold outline-none focus:ring-2 focus:ring-black/5 transition-all tracking-wide" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon}/>
                       </div>
                       <button onClick={appliedCoupon ? () => {setAppliedCoupon(null); setCouponCode('')} : handleCoupon} className={`px-5 rounded-xl font-bold text-xs shadow-sm transition-all ${appliedCoupon ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-gray-900 text-white hover:bg-black'}`}>
                         {appliedCoupon ? 'REMOVER' : 'APLICAR'}
                       </button>
                    </div>
                  </>
                )}
             </div>

             <div className="p-5 border-t bg-white safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
                <div className="space-y-2 mb-5 text-sm">
                   <div className="flex justify-between text-gray-500 font-medium"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                   {desconto > 0 && <div className="flex justify-between text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg"><span>Desconto Cupom</span><span>-{formatCurrency(desconto)}</span></div>}
                   <div className="flex justify-between text-2xl font-extrabold text-gray-900 pt-2 mt-2 border-t border-dashed"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                <button 
                  onClick={finalizar} disabled={itens.length === 0 || loading} 
                  className="w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-black/10 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: config.primaryColor }}
                >
                   {loading ? <Loader2 className="animate-spin"/> : <Send size={20} strokeWidth={2.5} />} Finalizar Compra
                </button>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ImageZoomModal({ imageUrl, onClose }: { imageUrl: string | null, onClose: () => void }) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}
        >
          <motion.img 
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            src={imageUrl} className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" 
          />
          <button className="absolute top-6 right-6 text-white p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"><X /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}