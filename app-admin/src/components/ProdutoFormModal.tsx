import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ProdutoAdmin, Fornecedor, Category } from '../types';
// Importamos o tipo ConfigFormData e a função getConfig
import { type ConfigFormData } from '../types/schemas';
import { 
  getAdminProdutos, 
  deleteAdminProduto, 
  getFornecedores, 
  getCategories,
  getConfig 
} from '../services/apiService';

import { Trash2, Edit, Package, ExternalLink, Box, Search, Printer, CheckSquare, Square } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { EtiquetaImpressao } from '../components/EtiquetaImpressao';
import { ProdutoFormModal } from '../pages/ProdutosPage';

// Componente Card de Produto
interface ProdutoAdminCardProps {
  produto: ProdutoAdmin;
  fornecedorNome: string;
  onEditar: () => void;
  onApagar: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const ProdutoAdminCard: React.FC<ProdutoAdminCardProps> = ({ 
  produto, fornecedorNome, onEditar, onApagar, isSelected, onToggleSelect 
}) => {
  const custo = produto.costPrice || 0;
  const venda = produto.salePrice || 0;
  const lucro = venda > 0 ? venda - custo : 0;
  const quantity = produto.quantity || 0;
  const statusCor = produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <motion.div
      className={`bg-white shadow-lg rounded-xl border flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-xl relative
        ${isSelected ? 'border-dourado ring-2 ring-dourado ring-opacity-50' : 'border-gray-200'}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="absolute top-2 left-2 z-20 cursor-pointer bg-white/90 rounded-md p-1 hover:bg-white transition-colors shadow-sm"
      >
        {isSelected 
          ? <CheckSquare className="text-dourado" size={24} /> 
          : <Square className="text-gray-400 hover:text-gray-600" size={24} />
        }
      </div>

      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          {produto.imageUrl ? (
            <img src={produto.imageUrl} alt={produto.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <Package size={48} className="text-prata opacity-50" />
          )}
        </div>
        
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${statusCor}`}>
          {produto.status}
        </span>

        <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded shadow-sm text-[10px] font-bold ${
          quantity > 0 ? 'bg-white text-carvao' : 'bg-red-600 text-white'
        }`}>
          <Box size={12} />
          <span>{quantity} un.</span>
        </div>
      </div>

      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
               {produto.category || 'Sem Categoria'}
             </p>
             {produto.supplierProductUrl && (
               <a href={produto.supplierProductUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Link Fornecedor">
                 <ExternalLink size={14} />
               </a>
             )}
          </div>
          <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{produto.name}</h3>
          <p className="text-xs text-gray-400 font-mono mb-3">SKU: {produto.code || 'N/A'}</p>
          
          <div className="flex items-center gap-1 mb-3">
            <span className="text-xs text-gray-500">Forn:</span>
            <span className="text-xs font-semibold text-carvao truncate max-w-[150px]">{fornecedorNome}</span>
          </div>
        </div>

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

      <div className="flex border-t border-gray-100 bg-gray-50">
        <button onClick={onEditar} className="flex-1 py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1">
          <Edit size={14} /> Editar
        </button>
        <div className="w-px bg-gray-200"></div>
        <button onClick={onApagar} className="flex-1 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1">
          <Trash2 size={14} /> Apagar
        </button>
      </div>
    </motion.div>
  );
};

// Página Principal (COM O EXPORT)
export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Novo estado para a configuração global (Taxas, etc.)
  const [config, setConfig] = useState<ConfigFormData | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Etiquetas_HivePratas',
  });

  useEffect(() => {
    async function carregarDadosPagina() {
      try {
        setLoading(true);
        setError(null);
        // Carrega tudo em paralelo: Produtos, Fornecedores, Categorias E Configuração
        const [produtosData, fornecedoresData, categoriesData, configData] = await Promise.all([
          getAdminProdutos(),
          getFornecedores(),
          getCategories(),
          getConfig()
        ]);
        setProdutos(produtosData);
        setFornecedores(fornecedoresData);
        setCategories(categoriesData);
        setConfig(configData); // Salva a config para passar ao modal
      } catch (err) {
        setError("Falha ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosPagina();
  }, []);

  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    if (categoryFilter !== "Todos") {
      if (categoryFilter === "Sem Categoria") {
        lista = lista.filter(p => !p.category);
      } else {
        lista = lista.filter(p => p.category === categoryFilter);
      }
    }
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term)));
    }
    return lista;
  }, [produtos, categoryFilter, searchTerm]);

  const getFornecedorNome = (id: string) => fornecedores.find(f => f.id === id)?.name || 'N/A';

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === produtosFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(produtosFiltrados.map(p => p.id));
      setSelectedIds(allIds);
    }
  };

  const getSelectedProducts = () => {
    return produtos.filter(p => selectedIds.has(p.id));
  };

  const handleApagarProduto = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Confirmar exclusão?</p>
        <p className="text-sm text-gray-600 mb-3">Produto: "{nome}"</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-sm bg-gray-200 rounded" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button className="px-3 py-1 text-sm bg-red-600 text-white rounded" onClick={() => { toast.dismiss(t.id); executarApagar(id); }}>Apagar</button>
        </div>
      </div>
    ));
  };
  
  const executarApagar = async (id: string) => {
    const promise = deleteAdminProduto(id);
    toast.promise(promise, {
      loading: 'A apagar...',
      success: () => {
        setProdutos(prev => prev.filter(p => p.id !== id));
        return 'Apagado com sucesso!';
      },
      error: 'Erro ao apagar.',
    });
  };
  
  const handleAdicionar = () => { setProdutoSelecionado(null); setIsModalOpen(true); };
  const handleEditar = (produto: ProdutoAdmin) => { setProdutoSelecionado(produto); setIsModalOpen(true); };
  const handleProdutoSalvo = (produtoSalvo: ProdutoAdmin) => {
    const produtoExiste = produtos.find(p => p.id === produtoSalvo.id);
    if (produtoExiste) {
      setProdutos(prev => prev.map(p => (p.id === produtoSalvo.id ? produtoSalvo : p)));
    } else {
      setProdutos(prev => [produtoSalvo, ...prev]);
    }
  };

  if (loading) return <div>A carregar...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-carvao hidden sm:block">Produtos</h1>
            
            <button onClick={selectAllFiltered} className="text-sm font-medium text-gray-600 flex items-center gap-2 hover:text-carvao">
               {selectedIds.size > 0 && selectedIds.size === produtosFiltrados.length 
                 ? <CheckSquare size={20} className="text-dourado" /> 
                 : <Square size={20} />
               }
               {selectedIds.size > 0 ? `${selectedIds.size} selecionados` : 'Selecionar Todos'}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-grow lg:flex-grow-0">
             
             {selectedIds.size > 0 && (
               <button 
                 onClick={() => handlePrint()} 
                 className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-all font-medium flex items-center justify-center gap-2 animate-in fade-in"
               >
                 <Printer size={18} />
                 Imprimir Etiquetas ({selectedIds.size})
               </button>
             )}

            <div className="relative flex-grow sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado bg-white"
            >
              <option value="Todos">Todas as Categorias</option>
              {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
              <option value="Sem Categoria">Sem Categoria</option>
            </select>

            <button onClick={handleAdicionar} className="bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition-all font-medium flex items-center justify-center gap-2 whitespace-nowrap">
              + Novo
            </button>
          </div>
        </div>

        {produtosFiltrados.length === 0 ? (
          <div className="text-center text-gray-500 py-20">Nenhum produto encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map(produto => (
              <ProdutoAdminCard
                key={produto.id}
                produto={produto}
                fornecedorNome={getFornecedorNome(produto.supplierId)}
                onEditar={() => handleEditar(produto)}
                onApagar={() => handleApagarProduto(produto.id, produto.name)}
                isSelected={selectedIds.has(produto.id)}
                onToggleSelect={() => toggleSelection(produto.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ProdutoFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fornecedores={fornecedores} 
        categories={categories} 
        setCategories={setCategories} 
        produtoParaEditar={produtoSelecionado} 
        onProdutoSalvo={handleProdutoSalvo} 
        // AQUI PASSAMOS A CONFIGURAÇÃO PARA O MODAL
        configGlobal={config} 
      />
      
      <EtiquetaImpressao ref={printRef} produtos={getSelectedProducts()} />
    </>
  );
}

export { ProdutoFormModal };
