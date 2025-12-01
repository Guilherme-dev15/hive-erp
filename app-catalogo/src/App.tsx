/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, ArrowDownUp, Loader2, User, Search, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
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

export type OrderStatus = 'Aguardando Pagamento' | 'Em Produção' | 'Em Separação' | 'Enviado' | 'Cancelado';

export interface OrderLineItem {
  id: string;
  name: string;
  code?: string;
  salePrice: number;
  quantidade: number;
}

export interface Order {
  id: string;
  createdAt: any;
  items: OrderLineItem[];
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string;
  status: OrderStatus;
  clienteNome: string;
  clienteTelefone: string;
}

interface CardProdutoProps {
  produto: ProdutoCatalogo;
  onAdicionar: () => void;
  onImageClick: () => void;
  config: ConfigPublica;
}

interface ModalCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setCarrinho: React.Dispatch<React.SetStateAction<Record<string, ItemCarrinho>>>;
  whatsappNumber: string | null;
  config: ConfigPublica;
}

// Adicionada a interface que faltava
interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

// ============================================================================
// 2. CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const apiClient = axios.create({ baseURL: API_URL });

// ============================================================================
// 3. SERVIÇOS
// ============================================================================
const formatCurrency = (value?: number) => 
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const saveOrder = async (payload: any) => {
  const response = await apiClient.post('/orders', payload);
  return response.data;
};

const checkCoupon = async (code: string) => {
  const response = await apiClient.post('/validate-coupon', { code });
  return response.data; 
};

// ============================================================================
// 4. COMPONENTES AUXILIARES (Carrossel)
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

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full h-48 md:h-96 bg-gray-200 overflow-hidden shadow-md group">
       <AnimatePresence mode='wait'>
         <motion.img
            key={currentIndex}
            src={banners[currentIndex]}
            alt={`Banner ${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
         />
       </AnimatePresence>
       
       {banners.length > 1 && (
         <>
           <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
             <ChevronLeft size={24} />
           </button>
           <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50">
             <ChevronRight size={24} />
           </button>
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
                />
              ))}
           </div>
         </>
       )}
    </div>
  );
}

// ============================================================================
// 5. COMPONENTE PRINCIPAL (APP)
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

  // Carregamento Inicial
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
        setError("Erro ao conectar à loja.");
      } finally {
        setLoading(false);
      }
    }
    carregarLoja();
  }, []);

  // --- LÓGICA DE STOCK (ADICIONAR) ---
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity !== undefined ? produto.quantity : 0;

    if (stockDisponivel <= 0) {
      toast.error("Produto esgotado!");
      return;
    }

    setCarrinho(prev => {
      const itemExistente = prev[produto.id];
      const qtdAtual = itemExistente ? itemExistente.quantidade : 0;

      if (qtdAtual + 1 > stockDisponivel) {
        toast.error(`Apenas ${stockDisponivel} unidades disponíveis.`);
        return prev;
      }

      toast.success("Adicionado!");
      setIsCarrinhoAberto(true);
      return { ...prev, [produto.id]: { produto, quantidade: qtdAtual + 1 } };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // Filtros
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="shadow-md sticky top-0 z-40 border-b-4 transition-colors" style={{ backgroundColor: config.secondaryColor, borderColor: config.primaryColor }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold transition-colors" style={{ color: config.primaryColor }}>{config.storeName}</h1>
          <button onClick={() => setIsCarrinhoAberto(true)} className="relative p-2 rounded-full hover:bg-white/10 transition-colors" style={{ color: config.primaryColor }}>
            <ShoppingCart />
            {totalItens > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{totalItens}</span>}
          </button>
        </div>
      </header>

      {/* Banners */}
      {config.banners && config.banners.length > 0 && <BannerCarousel banners={config.banners} />}

      {/* Nav & Filtros */}
      <nav className="bg-white shadow-sm sticky top-16 z-30 py-3 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all" style={{ backgroundColor: selectedCategory === cat ? config.secondaryColor : '#f3f4f6', color: selectedCategory === cat ? '#ffffff' : config.secondaryColor }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-1.5 rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2" style={{ '--tw-ring-color': config.primaryColor } as any} />
            </div>
            <div className="relative">
               <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="appearance-none bg-gray-100 border border-gray-200 rounded-full py-1.5 pl-4 pr-8 text-sm font-medium focus:outline-none focus:ring-2" style={{ color: config.secondaryColor, '--tw-ring-color': config.primaryColor } as any}>
                 <option value="default">Ordenar</option>
                 <option value="priceAsc">Menor Preço</option>
                 <option value="priceDesc">Maior Preço</option>
               </select>
               <ArrowDownUp size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      {/* Listagem */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-end border-b-2 pb-2 mb-6" style={{ borderColor: config.primaryColor }}>
           <h2 className="text-2xl font-bold" style={{ color: config.secondaryColor }}>{selectedCategory}</h2>
           <span className="text-sm text-gray-500">{produtosFiltrados.length} itens</span>
        </div>

        {produtosFiltrados.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtosFiltrados.map(prod => (
              <CardProduto 
                key={prod.id} produto={prod} config={config} 
                onAdicionar={() => adicionarAoCarrinho(prod)} 
                onImageClick={() => setZoomedImageUrl(prod.imageUrl || null)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
             <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
             <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
          </div>
        )}
      </main>

      {/* Modal Carrinho */}
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

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function CardProduto({ produto, config, onAdicionar, onImageClick }: CardProdutoProps) {
  const stock = produto.quantity !== undefined ? produto.quantity : 0;
  const temStock = stock > 0;

  return (
    <motion.div className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 flex flex-col" whileHover={{ y: -5 }}>
      <div className="relative aspect-square bg-gray-100 cursor-pointer group" onClick={onImageClick}>
        {produto.imageUrl ? (
          <img src={produto.imageUrl} alt={produto.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!temStock && 'grayscale opacity-50'}`} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"><Package size={48} /></div>
        )}
        {!temStock ? (
           <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">ESGOTADO</span>
        ) : (
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><ZoomIn className="text-white drop-shadow-md" /></div>
        )}
      </div>
      <div className="p-4 flex-col flex-grow flex justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 line-clamp-1" style={{ color: config.secondaryColor }}>{produto.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{produto.description}</p>
          {temStock && stock < 3 && <p className="text-xs text-orange-600 font-bold mt-1">Restam apenas {stock}!</p>}
        </div>
        <div>
          <p className="text-xl font-bold mt-2" style={{ color: config.secondaryColor }}>{formatCurrency(produto.salePrice)}</p>
          <button onClick={(e) => { e.stopPropagation(); onAdicionar(); }} disabled={!temStock} style={temStock ? { backgroundColor: config.primaryColor } : {}} className={`w-full mt-3 py-2 rounded-lg font-bold text-white transition-colors ${!temStock ? 'bg-gray-300 cursor-not-allowed' : 'hover:opacity-90'}`}>
            {temStock ? <><Plus size={18} className="mr-2 inline" /> Adicionar</> : "Indisponível"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: ModalCarrinhoProps) {
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- CUPÕES ---
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const { subtotal, desconto, total } = useMemo(() => {
    const sub = itens.reduce((acc, i) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);
    
    let desc = 0;
    // Prioridade: Cupão > Automático
    if (appliedCoupon) {
      desc = sub * (appliedCoupon.percent / 100);
    } else if (sub >= 300) {
      desc = sub * 0.10; // 10% automático
    }
    
    return { subtotal: sub, desconto: desc, total: sub - desc };
  }, [itens, appliedCoupon]);

  const handleAplicarCupom = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const res = await checkCoupon(couponCode);
      setAppliedCoupon({ code: res.code, percent: res.discountPercent });
      toast.success(`Cupão ${res.code} aplicado!`);
    } catch (e) {
      setAppliedCoupon(null);
      toast.error("Cupão inválido.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const updateQtd = (id: string, delta: number) => {
    setCarrinho(prev => {
      const item = prev[id];
      if (!item) return prev;
      const nova = item.quantidade + delta;
      // Trava de Stock no Modal
      const stock = item.produto.quantity !== undefined ? item.produto.quantity : 0;
      if (delta > 0 && nova > stock) { toast.error("Stock máximo."); return prev; }
      
      if (nova <= 0) { const c = {...prev}; delete c[id]; return c; }
      return { ...prev, [id]: { ...item, quantidade: nova } };
    });
  };

  const finalizar = async () => {
    if (!whatsappNumber) return toast.error("Loja sem WhatsApp");
    if (!nome || !tel) return toast.error("Preencha seus dados");
    setLoading(true);
    try {
      const itemsPayload = itens.map(i => ({ id: i.produto.id, name: i.produto.name, code: i.produto.code, salePrice: i.produto.salePrice, quantidade: i.quantidade }));
      const res = await saveOrder({ items: itemsPayload, subtotal, desconto, total, observacoes: obs, clienteNome: nome, clienteTelefone: tel, status: 'Aguardando Pagamento' } as any);
      
      const orderId = res.id.substring(0, 5).toUpperCase();
      let msg = `🧾 *Pedido #${orderId}*\n👤 ${nome}\n\n` +
                  itens.map(i => `${i.quantidade}x ${i.produto.name}`).join('\n') +
                  `\n\nSubtotal: ${formatCurrency(subtotal)}` +
                  (desconto > 0 ? `\nDesconto (${appliedCoupon ? 'Cupão' : 'Auto'}): -${formatCurrency(desconto)}` : '') +
                  `\n*Total: ${formatCurrency(total)}*` + 
                  (obs ? `\nObs: ${obs}` : '');
                  
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrinho({}); onClose(); setNome(''); setTel(''); setAppliedCoupon(null); setCouponCode('');
    } catch (e) { toast.error("Erro ao enviar"); } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
             <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: config.secondaryColor }}>
                <h2 className="text-xl font-bold text-white">Carrinho</h2>
                <button onClick={onClose} className="text-white"><X /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-gray-50 p-3 rounded border">
                   <div className="text-xs font-bold uppercase text-gray-500 mb-2 flex gap-2"><User size={14}/> Seus Dados</div>
                   <input placeholder="Nome" className="w-full mb-2 p-2 border rounded text-sm" value={nome} onChange={e => setNome(e.target.value)} />
                   <input placeholder="WhatsApp (com DDD)" className="w-full p-2 border rounded text-sm" value={tel} onChange={e => setTel(e.target.value)} />
                </div>
                {itens.map(item => (
                  <div key={item.produto.id} className="flex justify-between items-center border-b pb-2">
                     <div><p className="font-bold text-sm">{item.produto.name}</p><p className="text-xs text-gray-500">{formatCurrency(item.produto.salePrice)}</p></div>
                     <div className="flex items-center border rounded bg-white">
                        <button onClick={() => updateQtd(item.produto.id, -1)} className="p-1 px-2 hover:bg-gray-100"><Minus size={14}/></button>
                        <span className="px-2 text-sm font-bold">{item.quantidade}</span>
                        <button onClick={() => updateQtd(item.produto.id, 1)} className="p-1 px-2 hover:bg-gray-100"><Plus size={14}/></button>
                     </div>
                  </div>
                ))}
             </div>
             <div className="p-4 bg-gray-50 border-t">
                {/* INPUT DE CUPÃO */}
                <div className="flex gap-2 mb-3">
                   <input 
                      placeholder="Código do Cupão" 
                      className="flex-1 p-2 border rounded text-sm uppercase font-bold" 
                      value={couponCode} 
                      onChange={e => setCouponCode(e.target.value.toUpperCase())} 
                      disabled={!!appliedCoupon}
                   />
                   {appliedCoupon ? (
                      <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-100 text-red-600 px-3 rounded text-sm font-bold">X</button>
                   ) : (
                      <button onClick={handleAplicarCupom} disabled={!couponCode || validatingCoupon} className="bg-gray-800 text-white px-3 rounded text-sm font-bold">{validatingCoupon ? "..." : "OK"}</button>
                   )}
                </div>

                <textarea className="w-full p-2 text-sm border rounded mb-2 outline-none focus:ring-1" placeholder="Obs..." value={obs} onChange={e => setObs(e.target.value)} style={{'--tw-ring-color': config.primaryColor} as any} />
                
                <div className="space-y-1 text-sm mb-4">
                   <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                   {desconto > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                         <span>Desconto {appliedCoupon ? `(${appliedCoupon.code})` : ''}:</span>
                         <span>-{formatCurrency(desconto)}</span>
                      </div>
                   )}
                   <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span>{formatCurrency(total)}</span></div>
                </div>
                <button onClick={finalizar} disabled={itens.length === 0 || loading} className="w-full py-3 text-white font-bold rounded shadow flex justify-center gap-2" style={{ backgroundColor: config.primaryColor }}>
                   {loading ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Finalizar no WhatsApp
                </button>
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <img src={imageUrl} className="max-w-full max-h-full rounded shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          <button onClick={onClose} className="absolute top-5 right-5 text-white bg-white/20 p-2 rounded-full"><X /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}