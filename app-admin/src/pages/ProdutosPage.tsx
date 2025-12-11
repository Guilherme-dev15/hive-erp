import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ProdutoAdmin, Fornecedor, Category } from '../types';
import { type ConfigFormData } from '../types/schemas';
import { 
  getAdminProdutos, 
  deleteAdminProduto, 
  getFornecedores, 
  getCategories,
  getConfig 
} from '../services/apiService';
import { Trash2, Edit, Package, ExternalLink, Box, Search, Printer, CheckSquare, Square, FileText, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { ProdutoFormModal } from '../components/ProdutoFormModal';
import { useReactToPrint } from 'react-to-print';
import { EtiquetaImpressao } from '../components/EtiquetaImpressao';
import { CatalogoImpressao } from '../components/CatalogoImpressao';

// ============================================================================
// COMPONENTE: CARD DE PRODUTO (Refatorado com Alerta de Stock)
// ============================================================================
interface ProdutoAdminCardProps {
  produto: ProdutoAdmin;
  fornecedorNome: string;
  onEditar: () => void;
  onApagar: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  lowStockLimit: number; // NOVO: Limite vindo da config
}

const ProdutoAdminCard: React.FC<ProdutoAdminCardProps> = ({ 
  produto, fornecedorNome, onEditar, onApagar, isSelected, onToggleSelect, lowStockLimit 
}) => {
  const custo = produto.costPrice || 0;
  const venda = produto.salePrice || 0;
  const lucro = venda > 0 ? venda - custo : 0;
  const quantity = produto.quantity || 0;
  
  // Lógica de Estado do Stock
  const isZeroStock = quantity === 0;
  const isLowStock = !isZeroStock && quantity <= lowStockLimit;

  // Definição de Cores da Borda
  let borderClass = 'border-gray-200';
  if (isSelected) borderClass = 'border-dourado ring-2 ring-dourado ring-opacity-50';
  else if (isZeroStock) borderClass = 'border-red-500 ring-1 ring-red-500 bg-red-50/10';
  else if (isLowStock) borderClass = 'border-yellow-400 ring-1 ring-yellow-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white shadow-lg rounded-xl border flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-xl relative group ${borderClass}`}
    >
      {/* Seleção */}
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="absolute top-2 left-2 z-20 cursor-pointer bg-white/90 rounded-md p-1 hover:bg-white transition-colors shadow-sm"
      >
        {isSelected 
          ? <CheckSquare className="text-dourado" size={24} /> 
          : <Square className="text-gray-400 hover:text-gray-600" size={24} />
        }
      </div>

      {/* Imagem e Badges */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <div className="w-full h-full flex items-center justify-center">
          {produto.imageUrl ? (
            <img src={produto.imageUrl} alt={produto.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isZeroStock ? 'grayscale opacity-70' : ''}`} loading="lazy" />
          ) : (
            <Package size={48} className="text-prata opacity-50" />
          )}
        </div>
        
        {/* Etiqueta de Status (Ativo/Inativo) */}
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
          {produto.status}
        </span>

        {/* Badges de Stock (Topo Direito) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
           {isZeroStock && (
             <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 animate-pulse">
               <AlertTriangle size={12}/> ESGOTADO
             </span>
           )}
           {isLowStock && (
             <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
               <AlertTriangle size={12}/> REPOR
             </span>
           )}
           
           <div className={`flex items-center gap-1 px-2 py-1 rounded shadow-sm text-[10px] font-bold ${
             quantity > 0 ? 'bg-white text-carvao' : 'bg-red-100 text-red-700'
           }`}>
             <Box size={12} />
             <span>{quantity} un.</span>
           </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
             <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
               {produto.category || 'Geral'}
             </p>
             {produto.supplierProductUrl && (
               <a href={produto.supplierProductUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Link Fornecedor">
                 <ExternalLink size={14} />
               </a>
             )}
          </div>
          <h3 className="font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{produto.name}</h3>
          <p className="text-xs text-gray-400 font-mono mb-3">SKU: {produto.code || 'S/N'}</p>
          
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

      {/* Ações */}
      <div className="flex border-t border-gray-100 bg-gray-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onEditar} className="flex-1 py-3 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1 border-r border-gray-200">
          <Edit size={14} /> Editar
        </button>
        <button onClick={onApagar} className="flex-1 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-1">
          <Trash2 size={14} /> Apagar
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================
export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<ConfigFormData | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- FILTROS ---
  const [filterMode, setFilterMode] = useState<'todos' | 'stockBaixo'>('todos'); // Estado do Filtro de Stock
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const catalogoRef = useRef<HTMLDivElement>(null);

  const handlePrintEtiquetas = useReactToPrint({ contentRef: etiquetaRef, documentTitle: 'Etiquetas_Stock' });
  const handlePrintCatalogo = useReactToPrint({ contentRef: catalogoRef, documentTitle: 'Catalogo_Produtos' });

  useEffect(() => {
    async function carregarDadosPagina() {
      try {
        setLoading(true);
        const [produtosData, fornecedoresData, categoriesData, configData] = await Promise.all([
          getAdminProdutos(), getFornecedores(), getCategories(), getConfig()
        ]);
        setProdutos(produtosData);
        setFornecedores(fornecedoresData);
        setCategories(categoriesData);
        setConfig(configData);
      } catch (err) {
        toast.error("Falha ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosPagina();
  }, []);

  // --- LÓGICA DE FILTRAGEM ---
  const produtosFiltrados = useMemo(() => {
    let lista = produtos;
    const stockLimit = config?.lowStockThreshold || 5; // Pega o limite da config ou usa 5

    // 1. Filtro de Stock Baixo
    if (filterMode === 'stockBaixo') {
      lista = lista.filter(p => (p.quantity || 0) <= stockLimit);
    }

    // 2. Filtro de Categoria
    if (categoryFilter !== "Todos") {
      lista = lista.filter(p => categoryFilter === "Sem Categoria" ? !p.category : p.category === categoryFilter);
    }

    // 3. Busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      lista = lista.filter(p => p.name.toLowerCase().includes(term) || (p.code && p.code.toLowerCase().includes(term)));
    }
    return lista;
  }, [produtos, filterMode, categoryFilter, searchTerm, config]);

  const getFornecedorNome = (id: string) => fornecedores.find(f => f.id === id)?.name || 'N/A';

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedIds(newSelection);
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === produtosFiltrados.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(produtosFiltrados.map(p => p.id)));
  };

  const getSelectedProducts = () => produtos.filter(p => selectedIds.has(p.id));

  const handleApagarProduto = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar?")) return;
    try {
        await deleteAdminProduto(id);
        setProdutos(prev => prev.filter(p => p.id !== id));
        toast.success("Apagado!");
    } catch (e) { toast.error("Erro ao apagar."); }
  };
  
  const handleProdutoSalvo = (produtoSalvo: ProdutoAdmin) => {
    setProdutos(prev => {
        const existe = prev.find(p => p.id === produtoSalvo.id);
        return existe ? prev.map(p => p.id === produtoSalvo.id ? produtoSalvo : p) : [produtoSalvo, ...prev];
    });
  };

  if (loading) return <div>A carregar...</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        
        {/* BARRA DE CONTROLE */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-carvao hidden sm:block">Produtos</h1>
            
            {/* --- SELETOR DE MODO DE VISUALIZAÇÃO --- */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => setFilterMode('todos')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterMode === 'todos' ? 'bg-white shadow text-carvao' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setFilterMode('stockBaixo')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filterMode === 'stockBaixo' ? 'bg-red-100 text-red-700 shadow' : 'text-gray-500 hover:text-red-600'}`}
                >
                    <AlertTriangle size={14} /> Stock Baixo
                </button>
            </div>

            <button onClick={selectAllFiltered} className="text-sm font-medium text-gray-600 flex items-center gap-2 hover:text-carvao ml-2">
               {selectedIds.size > 0 && selectedIds.size === produtosFiltrados.length 
                 ? <CheckSquare size={20} className="text-dourado" /> 
                 : <Square size={20} />
               }
               <span className="hidden sm:inline">{selectedIds.size > 0 ? `${selectedIds.size} selecionados` : 'Todos'}</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 flex-grow lg:flex-grow-0">
             {selectedIds.size > 0 && (
               <div className="flex gap-2 animate-in fade-in slide-in-from-left-4">
                 <button onClick={() => handlePrintEtiquetas()} className="bg-indigo-600 text-white px-3 py-2 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2 text-sm font-bold"><Printer size={16}/> Etiquetas</button>
                 <button onClick={() => handlePrintCatalogo()} className="bg-carvao text-dourado px-3 py-2 rounded-lg shadow hover:bg-gray-800 flex items-center gap-2 text-sm font-bold"><FileText size={16}/> Catálogo PDF</button>
               </div>
             )}

            <div className="relative flex-grow sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm"
              />
            </div>

            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado bg-white text-sm">
              <option value="Todos">Todas as Categorias</option>
              {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
              <option value="Sem Categoria">Sem Categoria</option>
            </select>

            <button onClick={() => {setProdutoSelecionado(null); setIsModalOpen(true);}} className="bg-carvao text-white px-4 py-2 rounded-lg shadow hover:bg-gray-800 font-bold flex items-center gap-2 whitespace-nowrap text-sm">
              + Novo
            </button>
          </div>
        </div>

        {/* GRID DE PRODUTOS */}
        {produtosFiltrados.length === 0 ? (
          <div className="text-center text-gray-500 py-20 bg-white rounded-xl border border-dashed border-gray-200">
             <Package size={48} className="mx-auto mb-2 opacity-20" />
             <p>Nenhum produto encontrado.</p>
             {filterMode === 'stockBaixo' && <p className="text-sm text-green-600 font-medium mt-1">Seu stock está saudável!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map(produto => (
              <ProdutoAdminCard
                key={produto.id}
                produto={produto}
                fornecedorNome={getFornecedorNome(produto.supplierId)}
                onEditar={() => { setProdutoSelecionado(produto); setIsModalOpen(true); }}
                onApagar={() => handleApagarProduto(produto.id)}
                isSelected={selectedIds.has(produto.id)}
                onToggleSelect={() => toggleSelection(produto.id)}
                lowStockLimit={config?.lowStockThreshold || 5} // Passando o limite da config
              />
            ))}
          </div>
        )}
      </div>

      <ProdutoFormModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        fornecedores={fornecedores} categories={categories} setCategories={setCategories} 
        produtoParaEditar={produtoSelecionado} onProdutoSalvo={handleProdutoSalvo} 
        configGlobal={config} 
      />
      
      <EtiquetaImpressao ref={etiquetaRef} produtos={getSelectedProducts()} />
      <CatalogoImpressao ref={catalogoRef} produtos={getSelectedProducts()} config={config} />
    </>
  );
}