import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ProdutoAdmin, Fornecedor, Category } from '../types';
import { getAdminProdutos, deleteAdminProduto, getFornecedores, getCategories } from '../services/apiService';
// Adicionei 'ExternalLink' e 'Box' aos ícones
import { Trash2, Edit, Package, ExternalLink, Box, Search } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { ProdutoFormModal } from '../components/ProdutoFormModal';

// ============================================================================
// Componente Card de Produto (Refatorado com Stock e Link)
// ============================================================================
interface ProdutoAdminCardProps {
  produto: ProdutoAdmin;
  fornecedorNome: string;
  onEditar: () => void;
  onApagar: () => void;
}

const ProdutoAdminCard: React.FC<ProdutoAdminCardProps> = ({ produto, fornecedorNome, onEditar, onApagar }) => {
  const custo = produto.costPrice || 0;
  const venda = produto.salePrice || 0;
  const lucro = venda > 0 ? venda - custo : 0;
  const statusCor = produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  const quantity = produto.quantity || 0; // Garante 0 se indefinido

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        {/* Imagem ou Placeholder */}
        <div className="w-full h-full flex items-center justify-center">
          {produto.imageUrl ? (
            <img 
              src={produto.imageUrl} 
              alt={produto.name} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package size={48} className="text-prata opacity-50" />
          )}
        </div>
        
        {/* Badge de Status (Esquerda) */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${statusCor}`}>
          {produto.status}
        </span>

        {/* Badge de Stock (Direita) - NOVO */}
        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded shadow-sm text-[10px] font-bold ${
          quantity > 0 ? 'bg-white text-carvao' : 'bg-red-600 text-white'
        }`}>
          <Box size={12} />
          <span>{quantity} un.</span>
        </div>
      </div>

      {/* Corpo do Cartão */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
               {produto.category || 'Sem Categoria'}
             </p>
             {/* Link para o Fornecedor - NOVO */}
             {produto.supplierProductUrl && (
               <a 
                 href={produto.supplierProductUrl} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-blue-600 hover:text-blue-800 transition-colors"
                 title="Ver no site do fornecedor"
               >
                 <ExternalLink size={14} />
               </a>
             )}
          </div>
          
          <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2" title={produto.name}>
            {produto.name}
          </h3>
          
          <p className="text-xs text-gray-400 font-mono mb-3">
            SKU: {produto.code || 'N/A'}
          </p>
          
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-gray-500">Fornecedor:</span>
            <span className="text-xs font-semibold text-carvao truncate max-w-[150px]" title={fornecedorNome}>
              {fornecedorNome}
            </span>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="mt-2 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Custo</p>
            <p className="text-sm font-semibold text-red-600">R$ {custo.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Venda</p>
            <p className="text-sm font-bold text-green-600">R$ {venda.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase">Lucro</p>
            <p className="text-sm font-bold text-carvao">R$ {lucro.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex border-t border-gray-100 bg-gray-50">
        <button
          onClick={onEditar}
          className="flex-1 py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
        >
          <Edit size={14} /> Editar
        </button>
        <div className="w-px bg-gray-200"></div>
        <button
          onClick={onApagar}
          className="flex-1 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 size={14} /> Apagar
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Página Principal
// ============================================================================
export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAdmin | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Carregar Dados
  useEffect(() => {
    async function carregarDadosPagina() {
      try {
        setLoading(true);
        setError(null);
        const [produtosData, fornecedoresData, categoriesData] = await Promise.all([
          getAdminProdutos(),
          getFornecedores(),
          getCategories()
        ]);
        setProdutos(produtosData);
        setFornecedores(fornecedoresData);
        setCategories(categoriesData);
      } catch (err) {
        setError("Falha ao carregar dados da página.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosPagina();
  }, []);

  // Lógica de Filtragem (Categoria + Busca por Nome/SKU)
  const produtosFiltrados = useMemo(() => {
    let lista = produtos;

    // 1. Filtro de Categoria
    if (categoryFilter !== "Todos") {
      if (categoryFilter === "Sem Categoria") {
        lista = lista.filter(p => !p.category);
      } else {
        lista = lista.filter(p => p.category === categoryFilter);
      }
    }

    // 2. Filtro de Busca (Nome ou Código)
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.code && p.code.toLowerCase().includes(term))
      );
    }

    return lista;
  }, [produtos, categoryFilter, searchTerm]);

  const getFornecedorNome = (id: string) => {
    return fornecedores.find(f => f.id === id)?.name || 'N/A';
  };

  // --- Ações ---

  const handleApagarProduto = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Tem a certeza?</p>
        <p className="text-sm text-gray-600 mb-3">Quer mesmo apagar o produto "{nome}"?</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              toast.dismiss(t.id);
              executarApagar(id);
            }}
          >
            Apagar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const executarApagar = async (id: string) => {
    const promise = deleteAdminProduto(id);
    toast.promise(promise, {
      loading: 'A apagar produto...',
      success: () => {
        setProdutos(prev => prev.filter(p => p.id !== id));
        return 'Produto apagado com sucesso!';
      },
      error: 'Erro ao apagar o produto.',
    });
  };

  const handleAdicionar = () => {
    setProdutoSelecionado(null);
    setIsModalOpen(true);
  };

  const handleEditar = (produto: ProdutoAdmin) => {
    setProdutoSelecionado(produto);
    setIsModalOpen(true);
  };

  const handleProdutoSalvo = (produtoSalvo: ProdutoAdmin) => {
    const produtoExiste = produtos.find(p => p.id === produtoSalvo.id);
    if (produtoExiste) {
      setProdutos(prev => prev.map(p => (p.id === produtoSalvo.id ? produtoSalvo : p)));
    } else {
      setProdutos(prev => [produtoSalvo, ...prev]);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dourado"></div>
    </div>
  );
  
  if (error) return <div className="text-red-500 text-center mt-10">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Cabeçalho e Filtros */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-carvao">Gestão de Produtos</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-grow lg:flex-grow-0">
            {/* Barra de Busca */}
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar nome ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
              />
            </div>

            {/* Filtro Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado bg-white"
            >
              <option value="Todos">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="Sem Categoria">Sem Categoria</option>
            </select>

            {/* Botão Adicionar */}
            <button
              onClick={handleAdicionar}
              className="bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 whitespace-nowrap"
            >
              + Novo Produto
            </button>
          </div>
        </div>

        {/* Listagem */}
        {produtosFiltrados.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Nenhum produto encontrado.</p>
            <p className="text-sm">Tente mudar os filtros ou adicionar um novo produto.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map(produto => (
              <ProdutoAdminCard
                key={produto.id}
                produto={produto}
                fornecedorNome={getFornecedorNome(produto.supplierId)}
                onEditar={() => handleEditar(produto)}
                onApagar={() => handleApagarProduto(produto.id, produto.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ProdutoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fornecedores={fornecedores}
        categories={categories}
        setCategories={setCategories}
        produtoParaEditar={produtoSelecionado}
        onProdutoSalvo={handleProdutoSalvo}
      />
    </>
  );
}