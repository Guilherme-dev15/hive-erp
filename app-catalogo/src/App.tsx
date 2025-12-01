/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, ArrowDownUp, Loader2, Search, ZoomIn } from 'lucide-react';
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

// ATUALIZADO: Adicionado campo 'banners'
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

interface ImageZoomModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

// ============================================================================
// 2. CONFIGURAÇÃO DA API
// ============================================================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ============================================================================
// 3. SERVIÇOS DE API
// ============================================================================
const getProdutosCatalogo = async (): Promise<ProdutoCatalogo[]> => {
  const response = await apiClient.get('/produtos-catalogo');
  return response.data;
};

const getConfigPublica = async (): Promise<ConfigPublica> => {
  const response = await apiClient.get('/config-publica');
  return response.data;
};

const getPublicCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/categories-public');
  return response.data;
};


// ============================================================================
// 4. UTILITÁRIOS
// ============================================================================
const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// ============================================================================
// 5. COMPONENTE CARROSSEL (NOVO)
// ============================================================================
function BannerCarousel({ banners }: { banners: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Troca a cada 5 segundos
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-48 md:h-96 bg-gray-200 overflow-hidden shadow-md">
       <AnimatePresence mode='wait'>
         <motion.img
            key={currentIndex}
            src={banners[currentIndex]}
            alt={`Banner ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full object-cover"
         />
       </AnimatePresence>
       
       {/* Indicadores (Bolinhas) */}
       {banners.length > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
         </div>
       )}
       
       {/* Overlay gradiente subtil para melhorar leitura do header se for transparente (opcional) */}
       <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent pointer-events-none"></div>
    </div>
  );
}

// ============================================================================
// 6. COMPONENTE PRINCIPAL (APP)
// ============================================================================
export default function App() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'Carregando...',
    primaryColor: '#D4AF37',
    secondaryColor: '#343434',
    banners: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  type SortOrder = 'default' | 'priceAsc' | 'priceDesc';
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function carregarCatalogo() {
      try {
        setLoading(true);
        setError(null);

        const [prodRes, confRes, catRes] = await Promise.all([
          getProdutosCatalogo(),
          getConfigPublica(),
          getPublicCategories()
        ]);

        setProdutos(prodRes);
        setCategories(["Todos", ...catRes]);
        
        if (confRes) {
            setConfig({
                whatsappNumber: confRes.whatsappNumber,
                storeName: confRes.storeName || 'Minha Loja',
                primaryColor: confRes.primaryColor || '#D4AF37',
                secondaryColor: confRes.secondaryColor || '#343434',
                banners: confRes.banners || [] // Carrega os banners
            });
            document.title = confRes.storeName || 'Loja Virtual';
        }

      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar a loja.");
      } finally {
        setLoading(false);
      }
    }
    carregarCatalogo();
  }, []);

  // Carrinho
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity || 0;
    if (stockDisponivel <= 0) { toast.error("Produto esgotado!"); return; }

    setCarrinho(prev => {
      const itemExistente = prev[produto.id];
      const qtdAtual = itemExistente ? itemExistente.quantidade : 0;

      if (qtdAtual + 1 > stockDisponivel) {
        toast.error(`Apenas ${stockDisponivel} unidades disponíveis.`);
        return prev;
      }

      toast.success(`${produto.name} adicionado!`);
      setIsCarrinhoAberto(true);

      if (itemExistente) {
        return { ...prev, [produto.id]: { ...itemExistente, quantidade: itemExistente.quantidade + 1 } };
      }
      return { ...prev, [produto.id]: { produto, quantidade: 1 } };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((total, item) => total + item.quantidade, 0);

  // Filtros
  const produtosFiltradosEOrdenados = useMemo(() => {
    let lista = produtos.filter(p => p.status === 'ativo');
    
    if (selectedCategory !== "Todos") {
      if (selectedCategory === "Outros") {
         lista = lista.filter(p => !p.category || p.category === "Sem Categoria");
      } else {
         lista = lista.filter(p => p.category === selectedCategory);
      }
    }
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.code && p.code.toLowerCase().includes(term))
      );
    }

    if (sortOrder === 'priceAsc') lista.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    else if (sortOrder === 'priceDesc') lista.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));

    return lista;
  }, [produtos, selectedCategory, sortOrder, searchTerm]);


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-gray-800" size={48} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-off-white text-gray-800 font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <header 
        className="shadow-lg sticky top-0 z-40 border-b-4 transition-colors duration-300"
        style={{ backgroundColor: config.secondaryColor, borderColor: config.primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold transition-colors duration-300" style={{ color: config.primaryColor }}>
            {config.storeName}
          </h1>
          <button
            onClick={() => setIsCarrinhoAberto(true)}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
            style={{ color: config.primaryColor }}
          >
            <ShoppingCart size={24} />
            {totalItens > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* --- BANNERS (CARROSEL) --- */}
      {/* Agora está fora do container principal para ocupar a largura total se quiser, ou mantemos container */}
      {config.banners && config.banners.length > 0 && (
         <BannerCarousel banners={config.banners} />
      )}

      {/* MENU, BUSCA E ORDENAÇÃO */}
      <nav className="bg-white shadow-sm sticky top-16 z-30 py-3 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                    backgroundColor: selectedCategory === category ? config.secondaryColor : '#f3f4f6',
                    color: selectedCategory === category ? '#ffffff' : config.secondaryColor
                }}
                className="px-4 py-1.5 rounded-full font-medium text-sm transition-colors whitespace-nowrap"
              >
                {category}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar peça..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-48 pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': config.primaryColor } as any}
                />
            </div>
            <div className="relative flex-shrink-0">
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="appearance-none bg-gray-100 border border-gray-200 rounded-full py-1.5 pl-4 pr-8 text-sm font-medium focus:outline-none focus:ring-2"
                    style={{ color: config.secondaryColor, '--tw-ring-color': config.primaryColor } as any}
                >
                    <option value="default">Ordenar</option>
                    <option value="priceAsc">Menor Preço</option>
                    <option value="priceDesc">Maior Preço</option>
                </select>
                <ArrowDownUp size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </nav>

      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <section>
          <div className="flex justify-between items-end border-b-2 pb-2 mb-6" style={{ borderColor: config.primaryColor }}>
             <h2 className="text-3xl font-bold" style={{ color: config.secondaryColor }}>
               {selectedCategory}
             </h2>
             <span className="text-sm text-gray-500 mb-1">
               {produtosFiltradosEOrdenados.length} {produtosFiltradosEOrdenados.length === 1 ? 'item' : 'itens'}
             </span>
          </div>

          {produtosFiltradosEOrdenados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {produtosFiltradosEOrdenados.map(produto => (
                <CardProduto
                  key={produto.id}
                  produto={produto}
                  config={config}
                  onAdicionar={() => adicionarAoCarrinho(produto)}
                  onImageClick={() => setZoomedImageUrl(produto.imageUrl || null)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
            </div>
          )}
        </section>
      </main>

      <ModalCarrinho isOpen={isCarrinhoAberto} onClose={() => setIsCarrinhoAberto(false)} itens={itensDoCarrinho} setCarrinho={setCarrinho} whatsappNumber={config.whatsappNumber} config={config} />
      <ImageZoomModal imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function CardProduto({ produto, config, onAdicionar, onImageClick }: CardProdutoProps) {
  const stock = produto.quantity !== undefined ? produto.quantity : 0;
  const temStock = stock > 0;

  return (
    <motion.div 
      className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 flex flex-col"
      whileHover={{ y: -5 }}
    >
      <div className="relative aspect-square bg-gray-100 cursor-pointer group" onClick={onImageClick}>
        {produto.imageUrl ? (
          <img src={produto.imageUrl} alt={produto.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!temStock && 'grayscale opacity-50'}`} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"><Package size={48} /></div>
        )}
        {/* Overlay Zoom */}
        {temStock && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><ZoomIn className="text-white drop-shadow-md" /></div>}
        {!temStock && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">ESGOTADO</span>}
        {temStock && <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">{produto.code || 'N/A'}</span>}
      </div>

      <div className="p-4 flex-col flex-grow flex justify-between">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1" style={{ color: config.secondaryColor }}>{produto.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{produto.description || 'Sem descrição'}</p>
          {temStock && stock < 3 && <p className="text-xs text-orange-600 font-bold mt-1">Restam apenas {stock}!</p>}
        </div>
        <div>
          <p className="text-xl font-bold mt-2" style={{ color: config.secondaryColor }}>{formatCurrency(produto.salePrice)}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onAdicionar(); }}
            disabled={!temStock}
            style={temStock ? { backgroundColor: config.primaryColor } : {}}
            className={`w-full mt-3 py-2 rounded-lg font-bold text-white transition-colors ${!temStock ? 'bg-gray-300 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {temStock ? <><Plus size={18} className="mr-2 inline" /> Adicionar</> : "Indisponível"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: ModalCarrinhoProps) {
  const [obs] = useState('');
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [loading, setLoading] = useState(false);

  const { subtotal, desconto, total } = useMemo(() => {
    const sub = itens.reduce((acc, i) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);
    const desc = sub >= 300 ? sub * 0.1 : 0;
    return { subtotal: sub, desconto: desc, total: sub - desc };
  }, [itens]);

  const enviarPedido = async () => {
    if (!whatsappNumber) return toast.error("Loja sem WhatsApp configurado.");
    if (!nome || !tel) return toast.error("Preencha seus dados.");
    
    setLoading(true);
    const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001' });
    
    try {
      const itemsPayload = itens.map(i => ({ 
         id: i.produto.id, name: i.produto.name, code: i.produto.code, salePrice: i.produto.salePrice || 0, quantidade: i.quantidade 
      }));
      
      const res = await apiClient.post('/orders', {
        items: itemsPayload, subtotal, desconto, total, observacoes: obs,
        clienteNome: nome, clienteTelefone: tel
      });
      
      const orderId = res.data.id.substring(0, 5).toUpperCase();
      let msg = `🧾 *Pedido #${orderId}*\n👤 ${nome}\n\n`;
      itens.forEach(i => msg += `${i.quantidade}x ${i.produto.name}\n`);
      msg += `\nTotal: ${formatCurrency(total)}`;
      if (obs) msg += `\nObs: ${obs}`;
      
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrinho({}); onClose(); setNome(''); setTel('');

    } catch (e) { toast.error("Erro ao processar pedido."); } finally { setLoading(false); }
  };

  const updateQtd = (id: string, delta: number) => {
    setCarrinho(prev => {
      const item = prev[id];
      if (!item) return prev;
      const novoQtd = item.quantidade + delta;
      if (novoQtd > (item.produto.quantity || 0)) { toast.error("Stock máximo."); return prev; }
      if (novoQtd <= 0) { const copy = {...prev}; delete copy[id]; return copy; }
      return { ...prev, [id]: { ...item, quantidade: novoQtd } };
    });
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
                  <div className="text-xs font-bold uppercase text-gray-500 mb-2">Seus Dados</div>
                  <input placeholder="Nome Completo" className="w-full mb-2 p-2 border rounded text-sm" value={nome} onChange={e => setNome(e.target.value)} />
                  <input placeholder="WhatsApp (com DDD)" className="w-full p-2 border rounded text-sm" value={tel} onChange={e => setTel(e.target.value)} />
               </div>
               {itens.map(item => (
                 <div key={item.produto.id} className="flex justify-between items-center border-b pb-2">
                    <div><p className="font-bold text-sm">{item.produto.name}</p><p className="text-xs text-gray-500">{formatCurrency(item.produto.salePrice)}</p></div>
                    <div className="flex items-center border rounded bg-white">
                      <button onClick={() => updateQtd(item.produto.id, -1)} className="p-1 hover:bg-gray-100"><Minus size={14}/></button>
                      <span className="px-2 text-sm font-bold">{item.quantidade}</span>
                      <button onClick={() => updateQtd(item.produto.id, 1)} className="p-1 hover:bg-gray-100"><Plus size={14}/></button>
                    </div>
                 </div>
               ))}
            </div>
            <div className="p-4 bg-gray-50 border-t">
               <div className="space-y-1 text-sm mb-4">
                 <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                 {desconto > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Desconto:</span><span>-{formatCurrency(desconto)}</span></div>}
                 <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total:</span><span>{formatCurrency(total)}</span></div>
               </div>
               <button onClick={enviarPedido} disabled={itens.length === 0 || loading} className="w-full py-3 text-white font-bold rounded shadow flex justify-center gap-2" style={{ backgroundColor: config.primaryColor }}>
                  {loading ? <Loader2 className="animate-spin"/> : <Send size={18}/>} Finalizar
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