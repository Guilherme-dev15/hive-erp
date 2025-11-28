/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, ArrowDownUp, Loader2, Search } from 'lucide-react';
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

const saveOrder = async (payload: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> => {
  const response = await apiClient.post('/orders', payload);
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
// 5. COMPONENTE PRINCIPAL (APP)
// ============================================================================
export default function App() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  
  // Estado inicial (Fallbacks)
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'A Carregar Loja...',
    primaryColor: '#D4AF37', // Dourado Default
    secondaryColor: '#343434' // Carvão Default
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

        // 1. Busca Produtos
        const produtosData = await getProdutosCatalogo();
        setProdutos(produtosData);

        // 2. Busca Categorias
        const categoriesData = await getPublicCategories();
        setCategories(["Todos", ...categoriesData]);

        // 3. Busca Configuração (Cores e Nome)
        const configData = await getConfigPublica();
        
        console.log("🎨 CORES RECEBIDAS DA API:", configData); // DIAGNÓSTICO

        if (configData) {
            setConfig({
                whatsappNumber: configData.whatsappNumber,
                storeName: configData.storeName || 'Minha Loja',
                primaryColor: configData.primaryColor || '#D4AF37',
                secondaryColor: configData.secondaryColor || '#343434'
            });
            document.title = configData.storeName || 'Loja Virtual';
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

  // Lógica do Carrinho
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity || 0;
    if (stockDisponivel <= 0) {
      toast.error("Produto esgotado!");
      return;
    }
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho[produto.id];
      const qtdAtual = itemExistente ? itemExistente.quantidade : 0;
      if (qtdAtual + 1 > stockDisponivel) {
        toast.error(`Apenas ${stockDisponivel} unidades disponíveis.`);
        return prevCarrinho;
      }
      toast.success(`${produto.name} adicionado!`);
      setIsCarrinhoAberto(true);
      if (itemExistente) {
        return { ...prevCarrinho, [produto.id]: { ...itemExistente, quantidade: itemExistente.quantidade + 1 } };
      }
      return { ...prevCarrinho, [produto.id]: { produto, quantidade: 1 } };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((total, item) => total + item.quantidade, 0);

  // Filtros e Ordenação
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
        p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term))
      );
    }
    if (sortOrder === 'priceAsc') {
      lista.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    } else if (sortOrder === 'priceDesc') {
      lista.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    }
    return lista;
  }, [produtos, selectedCategory, sortOrder, searchTerm]);


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
       <Loader2 className="animate-spin text-gray-800" size={48} />
    </div>
  );

  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Toaster position="top-right" />

      {/* HEADER DINÂMICO */}
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

      {/* MENU DINÂMICO */}
      <nav className="bg-white shadow-md sticky top-16 z-30 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                // Estilo inline agressivo para garantir a cor
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
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
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
          <div 
            className="flex justify-between items-end border-b-2 pb-2 mb-6" 
            style={{ borderColor: config.primaryColor }}
          >
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

      <ModalCarrinho
        isOpen={isCarrinhoAberto}
        onClose={() => setIsCarrinhoAberto(false)}
        itens={itensDoCarrinho}
        setCarrinho={setCarrinho}
        whatsappNumber={config.whatsappNumber}
        config={config}
      />
      
      <ImageZoomModal 
        imageUrl={zoomedImageUrl} 
        onClose={() => setZoomedImageUrl(null)} 
      />
    </div>
  );
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function CardProduto({ produto, onAdicionar, onImageClick, config }: CardProdutoProps) {
  const stock = produto.quantity !== undefined ? produto.quantity : 0;
  const temStock = stock > 0;

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden hover:shadow-xl transition-all"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ y: -5 }}
    >
      <div className="relative w-full overflow-hidden">
        <div 
          className="aspect-square w-full bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={onImageClick}
        >
          {produto.imageUrl ? (
            <img src={produto.imageUrl} alt={produto.name} className={`w-full h-full object-cover ${!temStock ? 'opacity-50 grayscale' : ''}`} />
          ) : (
            <Package size={48} className="text-gray-300" />
          )}
        </div>
        {!temStock && <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">ESGOTADO</span>}
        {temStock && <span className="absolute top-3 left-3 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">{produto.code || 'N/A'}</span>}
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg" style={{ color: config.secondaryColor }}>{produto.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{produto.description || 'Sem descrição'}</p>
          {temStock && stock < 3 && <p className="text-xs text-orange-600 font-bold mt-1">Restam apenas {stock}!</p>}
        </div>

        <p className="text-2xl font-bold mt-2" style={{ color: config.secondaryColor }}>
          {formatCurrency(produto.salePrice)}
        </p>

        <button
          onClick={onAdicionar}
          disabled={!temStock}
          style={temStock ? { backgroundColor: config.primaryColor, color: '#ffffff' } : {}}
          className={`w-full mt-4 flex items-center justify-center px-4 py-2 rounded-lg shadow-md font-bold transition-all
            ${temStock ? 'hover:brightness-110' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
        >
          {temStock ? <><Plus size={18} className="mr-2" /> Adicionar</> : "Indisponível"}
        </button>
      </div>
    </motion.div>
  );
}

function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: ModalCarrinhoProps) {
   
  const [obs] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { subtotal, desconto, valorTotalPedido } = useMemo(() => {
    const sub = itens.reduce((acc, item) => acc + ((item.produto.salePrice || 0) * item.quantidade), 0);
    const desc = sub >= 300 ? sub * 0.10 : 0;
    return { subtotal: sub, desconto: desc, valorTotalPedido: sub - desc };
  }, [itens]);

  const atualizarQuantidade = (id: string, novaQtd: number) => {
     setCarrinho(prev => {
        const item = prev[id];
        if (!item) return prev;
        if (novaQtd > (item.produto.quantity || 0)) {
           toast.error(`Máximo de ${item.produto.quantity} unidades.`);
           return prev;
        }
        const novo = { ...prev };
        if (novaQtd <= 0) delete novo[id];
        else novo[id].quantidade = novaQtd;
        return novo;
     });
  };

  const handleCheckout = async () => {
    if (!whatsappNumber) { toast.error("Loja sem WhatsApp configurado."); return; }
    if (!clienteNome.trim() || !clienteTelefone.trim()) { toast.error("Preencha seus dados."); return; }
    
    setIsSubmitting(true);
    const itemsPayload = itens.map(i => ({ id: i.produto.id, name: i.produto.name, code: i.produto.code, salePrice: i.produto.salePrice || 0, quantidade: i.quantidade }));
    
    try {
      const novoPedido = await saveOrder({ items: itemsPayload, subtotal, desconto, total: valorTotalPedido, observacoes: obs, clienteNome, clienteTelefone, status: 'Aguardando Pagamento' } as any);
      const orderId = novoPedido.id.substring(0, 5).toUpperCase();
      
      let msg = `🧾 *Pedido #${orderId}*\n👤 ${clienteNome}\n\n`;
      itens.forEach(i => msg += `${i.quantidade}x ${i.produto.name}\n`);
      msg += `\nTotal: ${formatCurrency(valorTotalPedido)}`;
      if (obs) msg += `\nObs: ${obs}`;
      
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrinho({}); onClose();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) { toast.error("Erro ao criar pedido."); } finally { setIsSubmitting(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
             <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold" style={{ color: config.secondaryColor }}>Carrinho</h2>
                <button onClick={onClose}><X size={24} /></button>
             </div>
             <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {/* Inputs Cliente */}
                <div className="bg-gray-50 p-3 rounded border">
                   <h4 className="text-sm font-bold mb-2" style={{ color: config.secondaryColor }}>Seus Dados</h4>
                   <input placeholder="Nome" value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="w-full mb-2 p-2 border rounded text-sm" />
                   <input placeholder="WhatsApp" value={clienteTelefone} onChange={e => setClienteTelefone(e.target.value)} className="w-full p-2 border rounded text-sm" />
                </div>
                {/* Itens */}
                {itens.map(item => (
                   <div key={item.produto.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                         <p className="font-bold text-sm">{item.produto.name}</p>
                         <p className="text-xs text-gray-500">{formatCurrency(item.produto.salePrice)}</p>
                      </div>
                      <div className="flex items-center border rounded">
                         <button onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)} className="p-1"><Minus size={14}/></button>
                         <span className="px-2 text-sm">{item.quantidade}</span>
                         <button onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)} className="p-1"><Plus size={14}/></button>
                      </div>
                   </div>
                ))}
             </div>
             <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between font-bold text-lg mb-4" style={{ color: config.secondaryColor }}>
                   <span>Total:</span><span>{formatCurrency(valorTotalPedido)}</span>
                </div>
                <button onClick={handleCheckout} disabled={itens.length === 0 || isSubmitting} className="w-full py-3 rounded text-white font-bold disabled:opacity-50" style={{ backgroundColor: config.primaryColor }}>
                   {isSubmitting ? "Enviando..." : "Finalizar no WhatsApp"}
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
        <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.img src={imageUrl} className="max-w-[90vw] max-h-[90vh] rounded shadow-xl" onClick={e => e.stopPropagation()} initial={{ scale: 0.5 }} animate={{ scale: 1 }} />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"><X size={24} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}