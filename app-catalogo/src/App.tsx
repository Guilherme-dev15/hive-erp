import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// ============================================================================
// Tipos de Dados (para o Catálogo)
// ============================================================================

interface ProdutoCatalogo {
  id: string;
  name: string;
  code?: string;
  category?: string;
  description?: string;
  salePrice?: number;
  status?: 'ativo' | 'inativo';
  imageUrl?: string; // Corrigido de 'any' para 'string?'
}

// O que esperamos da rota /config-publica
interface ConfigPublica {
  whatsappNumber: string | null;
}

// O que guardamos no carrinho
interface ItemCarrinho {
  produto: ProdutoCatalogo;
  quantidade: number;
}

// O URL do nosso Backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
});

// ============================================================================
// Serviço de API
// ============================================================================
const getProdutosCatalogo = async (): Promise<ProdutoCatalogo[]> => {
  const response = await apiClient.get('/produtos-catalogo');
  return response.data;
};

const getConfigPublica = async (): Promise<ConfigPublica> => {
  const response = await apiClient.get('/config-publica');
  return response.data;
};

// 1. ADICIONADA: Função para buscar as categorias públicas
const getPublicCategories = async (): Promise<string[]> => {
  const response = await apiClient.get('/categories-public');
  return response.data;
};

// ============================================================================
// Função Utilitária para formatar Moeda (R$)
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
// Componente Principal
// ============================================================================
export default function App() {
  const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
  const [config, setConfig] = useState<ConfigPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [carrinho, setCarrinho] = useState<Record<string, ItemCarrinho>>({});
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);

  // 2. ADICIONADOS: Estados para o menu de categorias e filtro
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // 3. ATUALIZADO: Carrega todos os dados da API (produtos, config E categorias)
  useEffect(() => {
    async function carregarCatalogo() {
      try {
        setLoading(true);
        setError(null);
        // Busca as 3 rotas em paralelo
        const [produtosData, configData, categoriesData] = await Promise.all([
          getProdutosCatalogo(),
          getConfigPublica(),
          getPublicCategories() // <-- Nova chamada de API
        ]);

        setProdutos(produtosData);
        setConfig(configData);
        // Adiciona "Todos" no início do array de categorias
        setCategories(["Todos", ...categoriesData]);

        if (!configData.whatsappNumber) {
          console.warn("Número de WhatsApp não configurado no ERP Admin.");
          toast.error("Erro: A loja não está a aceitar pedidos de momento.");
        }

      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o catálogo. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }
    carregarCatalogo();
  }, []);

  // --- Lógica do Carrinho ---
  const adicionarAoCarrinho = (produto: ProdutoCatalogo) => {
    setCarrinho(prevCarrinho => {
      const itemExistente = prevCarrinho[produto.id];
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
    toast.success(`${produto.name} adicionado ao pedido!`);
    setIsCarrinhoAberto(true);
  };

  const itensDoCarrinho = useMemo(() => Object.values(carrinho), [carrinho]);
  const totalItens = itensDoCarrinho.reduce((total, item) => total + item.quantidade, 0);

  // 4. ATUALIZADO: Lógica de Agrupamento substituída por Filtragem
  const produtosFiltrados = useMemo(() => {
    // Filtra produtos ativos (a API já deve fazer isso, mas é uma boa garantia)
    const produtosAtivos = produtos.filter(p => p.status === 'ativo');
    
    // Se "Todos" estiver selecionado, retorna todos os ativos
    if (selectedCategory === "Todos") {
      return produtosAtivos;
    }
    
    // Se "Outros" for selecionado (caso a API retorne produtos sem categoria)
    if (selectedCategory === "Outros") {
        return produtosAtivos.filter(p => !p.category);
    }

    // Se uma categoria específica for selecionada
    return produtosAtivos.filter(p => p.category === selectedCategory);
  }, [produtos, selectedCategory]);


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <p className="text-xl text-carvao">A carregar catálogo...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <p className="text-xl text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-off-white text-carvao">
      <Toaster position="top-right" />

      {/* Header Fixo */}
      <header className="bg-carvao shadow-lg sticky top-0 z-40 border-b-4 border-dourado">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold text-dourado">HivePratas</h1>
          <button
            onClick={() => setIsCarrinhoAberto(true)}
            className="relative p-2 rounded-full text-prata hover:bg-gray-700 transition-colors"
          >
            <ShoppingCart size={24} />
            {totalItens > 0 && (
              // 5. CORRIGIDO: Removido 'block' redundante
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalItens}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 6. ADICIONADO: Menu dinâmico de Categorias */}
      <nav className="bg-white shadow-md sticky top-16 z-30 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap
                ${selectedCategory === category
                  ? 'bg-carvao text-white'
                  : 'bg-gray-100 text-carvao hover:bg-gray-200'
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </nav>

      {/* 7. ATUALIZADO: Conteúdo Principal (Produtos Filtrados) */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-carvao border-b-2 border-dourado pb-2 mb-6">
              {selectedCategory}
            </h2>
            {/* Renderiza os produtos filtrados */}
            {produtosFiltrados.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {produtosFiltrados.map(produto => (
                  <CardProduto
                    key={produto.id}
                    produto={produto}
                    onAdicionar={() => adicionarAoCarrinho(produto)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum produto encontrado nesta categoria.</p>
            )}
          </section>
        </div>
      </main>

      {/* Modal do Carrinho */}
      <ModalCarrinho
        isOpen={isCarrinhoAberto}
        onClose={() => setIsCarrinhoAberto(false)}
        itens={itensDoCarrinho}
        setCarrinho={setCarrinho}
        whatsappNumber={config?.whatsappNumber || null}
      />
    </div>
  );
}

// ============================================================================
// Componentes do Catálogo
// ============================================================================

function CardProduto({ produto, onAdicionar }: { produto: ProdutoCatalogo, onAdicionar: () => void }) {
  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }} // Animação de "levantar"
    >
      {/* Imagem ou Placeholder */}
      <div className="relative w-full overflow-hidden">
        <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
          {produto.imageUrl ? (
            <img
              src={produto.imageUrl}
              alt={produto.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package size={48} className="text-prata" />
          )}
        </div>
        {/* Código (SKU) */}
        <span className="absolute top-3 left-3 bg-black bg-opacity-60 text-white text-xs font-mono px-2 py-1 rounded">
          {produto.code || 'N/A'}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-lg text-carvao">{produto.name}</h3>
          <p className="text-sm text-gray-600 mt-1 h-10 overflow-hidden">{produto.description || 'Sem descrição'}</p>
        </div>

        {/* Preço de Venda Final */}
        <p className="text-2xl font-bold text-carvao mt-2">
          {formatCurrency(produto.salePrice)}
        </p>

        {/* Botão */}
        <button
          onClick={onAdicionar}
          className="w-full mt-4 flex items-center justify-center bg-dourado text-carvao px-4 py-2 rounded-lg shadow-md hover:bg-yellow-500 transition-colors duration-200 font-semibold"
        >
          <Plus size={18} className="mr-2" /> Adicionar
        </button>
      </div>
    </motion.div>
  );
}

// Modal do Carrinho
interface ModalCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setCarrinho: React.Dispatch<React.SetStateAction<Record<string, ItemCarrinho>>>;
  whatsappNumber: string | null;
}

function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber }: ModalCarrinhoProps) {
  const [obs, setObs] = useState('');

  // Calcula o total de itens E o valor total do pedido
  const { totalItens, valorTotalPedido } = useMemo(() => {
    return itens.reduce((acc, item) => {
      const precoItem = item.produto.salePrice || 0;
      acc.totalItens += item.quantidade;
      acc.valorTotalPedido += precoItem * item.quantidade;
      return acc;
    }, { totalItens: 0, valorTotalPedido: 0 });
  }, [itens]);


  const atualizarQuantidade = (id: string, novaQuantidade: number) => {
    setCarrinho(prev => {
      const novoCarrinho = { ...prev };
      if (novaQuantidade <= 0) {
        delete novoCarrinho[id];
      } else {
        novoCarrinho[id].quantidade = novaQuantidade;
      }
      return novoCarrinho;
    });
  };

  const handleCheckout = () => {
    if (!whatsappNumber) {
      toast.error("Erro: A loja não está aceitando pedidos no momento.");
      return;
    }

    let message = "🧾 Pedido recebido\n\n"; // Título

    itens.forEach(item => {
      const precoUnitario = item.produto.salePrice || 0;
      const totalLinha = precoUnitario * item.quantidade;

      message += `Produto: ${item.produto.name} (${item.produto.code || 'N/A'})\n`;
      message += `Qtde: ${item.quantidade}\n`;
      message += `Valor unitário: ${formatCurrency(precoUnitario)}\n`;
      message += `Valor total: ${formatCurrency(totalLinha)}\n\n`;
    });

    message += `*Valor Total do Pedido: ${formatCurrency(valorTotalPedido)}*\n\n`;

    if (obs) {
      message += `*Observação:*\n${obs}\n\n`;
    }

    message += "Obrigado! Aguardo confirmação para consultar o fornecedor e enviar prazo.";

    const encodedMessage = encodeURIComponent(message);
    const waLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(waLink, '_blank');

    setCarrinho({});
    setObs('');
    onClose();
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
          {/* O Painel do Carrinho */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="bg-white shadow-2xl w-full max-w-md h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-carvao">Meu Pedido</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Itens do Carrinho */}
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
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
                    {/* Imagem ou Placeholder */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border">
                      {item.produto.imageUrl ? (
                        <img src={item.produto.imageUrl} alt={item.produto.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={24} className="text-prata" />
                      )}
                    </div>

                    <div className="flex-grow">
                      <p className="font-semibold text-carvao">{item.produto.name}</p>
                      <p className="text-sm text-gray-500 font-mono">{item.produto.code}</p>
                      <p className="text-sm text-carvao font-semibold mt-1">
                        {formatCurrency(item.produto.salePrice)}
                      </p>
                    </div>
                    {/* Stepper de Quantidade */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-2 text-carvao font-semibold">{item.quantidade}</span>
                      <button
                        onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)}
                        className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Rodapé do Carrinho (Checkout) */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observações do pedido (opcional)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
              />

              {/* Total do Pedido */}
              <div className="flex justify-between items-center text-xl font-bold text-carvao">
                <span>Total do Pedido:</span>
                <span>{formatCurrency(valorTotalPedido)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={totalItens === 0}
                className="w-full flex items-center justify-center p-3 text-lg rounded-lg text-white font-semibold transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                <Send size={18} className="mr-2" /> Enviar Pedido via WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}