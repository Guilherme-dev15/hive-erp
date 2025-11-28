/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, ArrowDownUp, Loader2, User, Search } from 'lucide-react';
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

// ATUALIZADO: Configuração agora tem cores
interface ConfigPublica {
  whatsappNumber: string | null;
  storeName: string;
  primaryColor: string;   // Cor Principal (Destaques)
  secondaryColor: string; // Cor Secundária (Fundo/Texto Forte)
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
  config: ConfigPublica; // Passamos a config para o card
}

interface ModalCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setCarrinho: React.Dispatch<React.SetStateAction<Record<string, ItemCarrinho>>>;
  whatsappNumber: string | null;
  config: ConfigPublica; // Passamos a config
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
  if (value === undefined || value === null) {
    return 'R$ 0,00';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// ============================================================================
// 5. COMPONENTE PRINCIPAL (APP)
// ============================================================================
export default function App() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  
  // Configuração com Fallbacks (Valores Padrão)
  const [config, setConfig] = useState<ConfigPublica>({
    whatsappNumber: null,
    storeName: 'Carregando...',
    primaryColor: '#D4AF37', // Dourado
    secondaryColor: '#343434' // Carvão
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
        const [produtosData, configData, categoriesData] = await Promise.all([
          getProdutosCatalogo(),
          getConfigPublica(),
          getPublicCategories()
        ]);

        setProdutos(produtosData);
        
        // Aplica a configuração vinda da API
        setConfig({
            whatsappNumber: configData.whatsappNumber,
            storeName: configData.storeName || 'Loja Virtual',
            primaryColor: configData.primaryColor || '#D4AF37',
            secondaryColor: configData.secondaryColor || '#343434'
        });
        
        // Muda o título da aba do navegador
        document.title = configData.storeName || 'Loja Virtual';

        setCategories(["Todos", ...categoriesData]);

      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o catálogo. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    carregarCatalogo();
  }, []);

  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    const stockDisponivel = produto.quantity || 0;

    if (stockDisponivel <= 0) {
      toast.error("Produto esgotado!");
      return;
    }

    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho[produto.id];
      const quantidadeAtualNoCarrinho = itemExistente ? itemExistente.quantidade : 0;

      if (quantidadeAtualNoCarrinho + 1 > stockDisponivel) {
        toast.error(`Apenas ${stockDisponivel} unidades disponíveis.`);
        return prevCarrinho;
      }

      toast.success(`${produto.name} adicionado!`);
      setIsCarrinhoAberto(true);

      if (itemExistente) {
        return {
          ...prevCarrinho,
          [produto.id]: { ...itemExistente, quantidade: itemExistente.quantidade + 1 }
        };
      }
      return {
        ...prevCarrinho,
        [produto.id]: { produto, quantidade: 1 }
      };
    });
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((total, item) => total + item.quantidade, 0);

  const produtosFiltradosEOrdenados = useMemo(() => {
    let produtosProcessados = produtos.filter(p => p.status === 'ativo');
    
    if (selectedCategory !== "Todos") {
      if (selectedCategory === "Outros") {
         produtosProcessados = produtosProcessados.filter(p => !p.category || p.category === "Sem Categoria");
      } else {
         produtosProcessados = produtosProcessados.filter(p => p.category === selectedCategory);
      }
    }
    
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      produtosProcessados = produtosProcessados.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.code && p.code.toLowerCase().includes(term))
      );
    }

    if (sortOrder === 'priceAsc') {
      produtosProcessados.sort((a, b) => (a.salePrice || 0) - (b.salePrice || 0));
    } else if (sortOrder === 'priceDesc') {
      produtosProcessados.sort((a, b) => (b.salePrice || 0) - (a.salePrice || 0));
    }

    return produtosProcessados;
  }, [produtos, selectedCategory, sortOrder, searchTerm]);


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <Loader2 className="animate-spin" size={48} style={{ color: config.secondaryColor }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <p className="text-xl text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white text-gray-800 font-sans">
      <Toaster position="top-right" />

      {/* HEADER DINÂMICO */}
      <header 
        className="shadow-lg sticky top-0 z-40 border-b-4"
        style={{ backgroundColor: config.secondaryColor, borderColor: config.primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold" style={{ color: config.primaryColor }}>
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

      {/* MENU CATEGORIAS */}
      <nav className="bg-white shadow-md sticky top-16 z-30 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                // Estilo Condicional
                style={selectedCategory === category 
                   ? { backgroundColor: config.secondaryColor, color: 'white' } 
                   : { backgroundColor: '#f3f4f6', color: config.secondaryColor }
                }
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
                    className="w-full sm:w-48 pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-opacity-50"
                    style={{ '--tw-ring-color': config.primaryColor } as any} // Hack para Tailwind dynamic ring
                />
            </div>
            <div className="relative flex-shrink-0">
                <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="appearance-none bg-gray-100 border border-gray-200 rounded-full py-1.5 pl-4 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50"
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

      {/* CONTEÚDO PRINCIPAL */}
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
                  config={config} // Passa as cores para o card
                  onAdicionar={() => adicionarAoCarrinho(produto)}
                  onImageClick={() => setZoomedImageUrl(produto.imageUrl || null)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
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
        whatsappNumber={config?.whatsappNumber || null}
        config={config} // Passa as cores para o modal
      />
      
      <ImageZoomModal 
        imageUrl={zoomedImageUrl} 
        onClose={() => setZoomedImageUrl(null)} 
      />
    </div>
  );
}

// ============================================================================
// 6. COMPONENTES AUXILIARES
// ============================================================================

function CardProduto({ produto, onAdicionar, onImageClick, config }: CardProdutoProps) {
  const stock = produto.quantity !== undefined ? produto.quantity : 0;
  const temStock = stock > 0;

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
    >
      <div className="relative w-full overflow-hidden">
        <div 
          className="aspect-square w-full bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={onImageClick}
        >
          {produto.imageUrl ? (
            <img
              src={produto.imageUrl}
              alt={produto.name}
              className={`w-full h-full object-cover ${!temStock ? 'opacity-50 grayscale' : ''}`} 
            />
          ) : (
            <Package size={48} className="text-prata" />
          )}
        </div>
        
        {!temStock ? (
           <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
             ESGOTADO
           </span>
        ) : (
           <span className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs font-mono px-2 py-1 rounded">
             {produto.code || 'N/A'}
           </span>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          {/* Título com a cor secundária da loja */}
          <h3 className="font-semibold text-lg" style={{ color: config.secondaryColor }}>{produto.name}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {produto.description || 'Sem descrição'}
          </p>
          {temStock && stock < 3 && (
             <p className="text-xs text-orange-600 font-bold mt-1">Restam apenas {stock}!</p>
          )}
        </div>

        <p className="text-2xl font-bold mt-2" style={{ color: config.secondaryColor }}>
          {formatCurrency(produto.salePrice)}
        </p>

        {/* Botão com a cor primária da loja */}
        <button
          onClick={onAdicionar}
          disabled={!temStock}
          style={temStock ? { backgroundColor: config.primaryColor } : {}}
          className={`w-full mt-4 flex items-center justify-center px-4 py-2 rounded-lg shadow-md transition-colors duration-200 font-semibold text-white
            ${temStock 
              ? 'hover:brightness-110' 
              : 'bg-gray-300 cursor-not-allowed'}`}
        >
          {temStock ? (
            <> <Plus size={18} className="mr-2" /> Adicionar </>
          ) : (
            "Indisponível"
          )}
        </button>
      </div>
    </motion.div>
  );
}

function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: ModalCarrinhoProps) {
  const [obs, setObs] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { totalItens, subtotal, desconto, valorTotalPedido } = useMemo(() => {
    const subTotalCalc = itens.reduce((acc, item) => {
      const precoItem = item.produto.salePrice || 0;
      return acc + (precoItem * item.quantidade);
    }, 0);
    
    let descontoCalc = 0;
    if (subTotalCalc >= 300) {
      descontoCalc = subTotalCalc * 0.10;
    }
    
    const totalFinal = subTotalCalc - descontoCalc;
    
    return {
      totalItens: itens.reduce((total, item) => total + item.quantidade, 0),
      subtotal: subTotalCalc,
      desconto: descontoCalc,
      valorTotalPedido: totalFinal
    };
  }, [itens]);

  const atualizarQuantidade = (id: string, novaQuantidade: number) => {
    setCarrinho(prev => {
      const item = prev[id];
      if (!item) return prev;

      const stockDisponivel = item.produto.quantity || 0;

      if (novaQuantidade > item.quantidade && novaQuantidade > stockDisponivel) {
        toast.error(`Máximo de ${stockDisponivel} unidades.`);
        return prev;
      }

      const novoCarrinho = { ...prev };
      if (novaQuantidade <= 0) {
        delete novoCarrinho[id];
      } else {
        novoCarrinho[id].quantidade = novaQuantidade;
      }
      return novoCarrinho;
    });
  };

  const handleCheckout = async () => {
    if (!whatsappNumber) {
      toast.error("Erro: A loja não está aceitando pedidos no momento.");
      return;
    }

    if (!clienteNome.trim()) {
      toast.error("Por favor, digite o seu nome.");
      return;
    }
    if (!clienteTelefone.trim() || clienteTelefone.length < 8) {
      toast.error("Por favor, digite um telefone válido.");
      return;
    }

    setIsSubmitting(true);
    toast.loading('A registar o seu pedido...');

    const itemsPayload: OrderLineItem[] = itens.map(item => ({
      id: item.produto.id,
      name: item.produto.name,
      code: item.produto.code,
      salePrice: item.produto.salePrice || 0,
      quantidade: item.quantidade
    }));

    const orderPayload = {
      items: itemsPayload,
      subtotal: subtotal,
      desconto: desconto,
      total: valorTotalPedido,
      observacoes: obs || '',
      clienteNome: clienteNome,
      clienteTelefone: clienteTelefone
    };

    try {
      const novoPedido = await saveOrder(orderPayload as Omit<Order, 'id' | 'createdAt' | 'status'>);
      const orderId = novoPedido.id.substring(0, 5).toUpperCase();

      toast.dismiss();
      toast.success(`Pedido #${orderId} registado! A abrir WhatsApp...`);

      let message = `🧾 *Novo Pedido: #${orderId}*\n`;
      message += `👤 Cliente: ${clienteNome}\n\n`;

      itens.forEach(item => {
        message += `▪️ ${item.quantidade}x ${item.produto.name} (${item.produto.code || 'N/A'})\n`;
      });

      message += `\n*Subtotal: ${formatCurrency(subtotal)}*\n`;
      if (desconto > 0) {
        message += `*Desconto (10%): ${formatCurrency(-desconto)}*\n`;
      }
      message += `*Total: ${formatCurrency(valorTotalPedido)}*\n`;

      if (obs) {
        message += `\nObs: ${obs}\n`;
      }

      message += "\nAguardo confirmação para pagamento!";

      const encodedMessage = encodeURIComponent(message);
      const waLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      window.open(waLink, '_blank');
      
      setCarrinho({});
      setObs('');
      setClienteNome('');
      setClienteTelefone('');
      onClose();

    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Falha ao registar o pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold" style={{ color: config.secondaryColor }}>Meu Pedido</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
              
              {/* Dados do Cliente */}
              <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: config.secondaryColor }}>
                  <User size={16} style={{ color: config.primaryColor }} /> Seus Dados
                </h4>
                <div>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    placeholder="Seu Nome Completo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm outline-none"
                    style={{ '--tw-ring-color': config.primaryColor } as any}
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                    placeholder="Seu WhatsApp (DDD + Número)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 text-sm outline-none"
                    style={{ '--tw-ring-color': config.primaryColor } as any}
                  />
                </div>
              </div>

              {itens.length === 0 ? (
                <p className="text-gray-500 text-center pt-10">O seu carrinho está vazio.</p>
              ) : (
                itens.map(item => (
                  <motion.div
                    key={item.produto.id}
                    className="flex items-center space-x-3"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border">
                      {item.produto.imageUrl ? (
                        <img src={item.produto.imageUrl} alt={item.produto.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={24} className="text-prata" />
                      )}
                    </div>

                    <div className="flex-grow">
                      <p className="font-semibold" style={{ color: config.secondaryColor }}>{item.produto.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{item.produto.code}</p>
                      <p className="text-sm font-semibold mt-1" style={{ color: config.secondaryColor }}>
                        {formatCurrency(item.produto.salePrice)}
                      </p>
                    </div>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)} className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                        <Minus size={16} />
                      </button>
                      <span className="px-2 text-carvao font-semibold">{item.quantidade}</span>
                      <button onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)} className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observações do pedido (opcional)..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': config.primaryColor } as any}
              />
              
              <div className="space-y-1 text-sm">
                 <div className="flex justify-between text-gray-600">
                   <span>Subtotal:</span>
                   <span>{formatCurrency(subtotal)}</span>
                 </div>
                 {desconto > 0 && (
                   <div className="flex justify-between text-green-600 font-medium">
                     <span>Desconto (10%):</span>
                     <span>- {formatCurrency(desconto)}</span>
                   </div>
                 )}
              </div>

              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t" style={{ color: config.secondaryColor }}>
                <span>Total:</span>
                <span>{formatCurrency(valorTotalPedido)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={totalItens === 0 || isSubmitting}
                style={{ backgroundColor: config.primaryColor }}
                className="w-full flex items-center justify-center p-3 text-lg rounded-lg text-white font-semibold transition-colors hover:brightness-110 disabled:bg-gray-400 disabled:cursor-wait"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                {isSubmitting ? "A registar..." : "Enviar Pedido via WhatsApp"}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            src={imageUrl}
            alt="Zoom do produto"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/40 transition-colors"
          >
            <X size={24} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}