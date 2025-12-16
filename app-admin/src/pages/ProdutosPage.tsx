import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit, Trash2, Package, Loader2, 
  RefreshCw, Filter, FolderTree, FileSpreadsheet, FileDown,
  CheckSquare, Square, X, Tag
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useReactToPrint } from 'react-to-print'; // IMPORTANTE: Instale npm install react-to-print

// --- SERVIÇOS ---
import { 
  getAdminProdutos, 
  deleteAdminProduto, 
  getFornecedores, 
  getCategories,
  getConfig 
} from '../services/apiService';

// --- COMPONENTES ---
import { ImportModal } from '../components/ImportModal';
import { ProdutoFormModal } from '../components/ProdutoFormModal';
import { CategoryModal } from '../components/CategoryModal';
import { CatalogPDF } from '../components/CatologPDF'; 
import { EtiquetaImpressao } from '../components/EtiquetaImpressao'; // <--- IMPORT NOVO

// --- TIPOS ---
import type { ProdutoAdmin, Category, Fornecedor } from '../types';

export function ProdutosPage() {
  // 1. DADOS
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [storeConfig, setStoreConfig] = useState<{ storeName: string } | null>(null);
  
  // 2. CONTROLE
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');

  // 3. SELEÇÃO & PDF
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // 4. REF E LÓGICA DE IMPRESSÃO (NOVO)
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const handlePrintEtiquetas = useReactToPrint({
    contentRef: etiquetaRef,
    documentTitle: 'Etiquetas_Produtos',
    onAfterPrint: () => toast.success("Impressão enviada!")
  });

  // 5. MODAIS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoAdmin | null>(null);

  // ============================================================================
  // CARREGAMENTO
  // ============================================================================
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData, fornsData, configData] = await Promise.all([
        getAdminProdutos(),
        getCategories(),
        getFornecedores(),
        getConfig()
      ]);

      setProdutos(prodsData);
      setCategories(catsData);
      setFornecedores(fornsData);
      setStoreConfig(configData);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  // ============================================================================
  // LÓGICA DE FILTRAGEM
  // ============================================================================
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const termo = searchTerm.toLowerCase();
      const matchTexto = (p.name && p.name.toLowerCase().includes(termo)) || (p.code && p.code.toLowerCase().includes(termo));
      const matchCategoria = filterCategory === 'Todas' || p.category === filterCategory;
      return matchTexto && matchCategoria;
    });
  }, [produtos, searchTerm, filterCategory]);

  // ============================================================================
  // LÓGICA DE SELEÇÃO (PDF E ETIQUETAS)
  // ============================================================================
  const produtosSelecionados = useMemo(() => {
    if (selectedIds.length > 0) {
      return produtos.filter(p => selectedIds.includes(p.id));
    }
    // Se nada selecionado, retorna vazio (para etiquetas, não queremos imprimir tudo sem querer)
    return []; 
  }, [selectedIds, produtos]);

  // Produtos para o PDF (Pode ser todos se nada selecionado, conforme lógica anterior)
  const produtosParaPdf = useMemo(() => {
    if (selectedIds.length > 0) return produtosSelecionados;
    return produtosFiltrados; 
  }, [selectedIds, produtosSelecionados, produtosFiltrados]);

  
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
    setIsGeneratingPdf(false);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === produtosFiltrados.length) {
      setSelectedIds([]); 
    } else {
      setSelectedIds(produtosFiltrados.map(p => p.id)); 
    }
    setIsGeneratingPdf(false);
  };

  const handlePreparePdf = () => {
    if (selectedIds.length === 0 && !confirm("Nenhum produto selecionado. Deseja gerar o catálogo com TODOS os produtos filtrados?")) {
      return;
    }
    setIsGeneratingPdf(true); 
  };

  // Wrapper para imprimir etiquetas com validação
  const onPrintClick = () => {
    if (selectedIds.length === 0) {
      return toast.error("Selecione pelo menos um produto para imprimir a etiqueta.");
    }
    handlePrintEtiquetas();
  };

  // ============================================================================
  // CRUD
  // ============================================================================
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await deleteAdminProduto(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success("Excluído!");
    } catch (e) { toast.error("Erro ao excluir."); }
  };

  const handleEdit = (prod: ProdutoAdmin) => {
    setProdutoEditando(prod);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setProdutoEditando(null);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = (prodSalvo: ProdutoAdmin) => {
    if (produtoEditando) {
      setProdutos(prev => prev.map(p => p.id === prodSalvo.id ? prodSalvo : p));
    } else {
      setProdutos(prev => [prodSalvo, ...prev]);
    }
    setIsModalOpen(false);
  };

  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-dourado" size={48} /></div>;

  return (
    <div className="space-y-6 pb-20 p-4 md:p-0">
      <Toaster position="top-right"/>
      
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-dourado" /> Produtos
            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{produtos.length}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedIds.length > 0 
              ? <span className="text-blue-600 font-bold">{selectedIds.length} produtos selecionados</span>
              : "Gerencie, filtre e imprima seus produtos."
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
           
           {/* BOTÃO ETIQUETAS (NOVO) */}
           <button 
             onClick={onPrintClick}
             className={`p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 flex items-center gap-2 transition-colors ${selectedIds.length > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}`}
             title="Imprimir Etiquetas Selecionadas"
           >
             <Tag size={18}/> <span className="hidden sm:inline font-medium">Etiquetas</span>
           </button>

           {/* BOTÃO PDF */}
           {isGeneratingPdf ? (
             <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-2 rounded-xl animate-pulse">
                <PDFDownloadLink
                  document={
                    <CatalogPDF 
                      produtos={produtosParaPdf} 
                      storeName={storeConfig?.storeName || "Catálogo"} 
                    />
                  }
                  fileName="catalogo.pdf"
                  className="flex items-center gap-2 text-red-600 font-bold text-sm"
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (loading ? 'Gerando...' : 'Baixar PDF')}
                </PDFDownloadLink>
                <button onClick={() => setIsGeneratingPdf(false)}><X size={14} className="text-red-400"/></button>
             </div>
           ) : (
             <button 
               onClick={handlePreparePdf}
               className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
               title="Gerar Catálogo PDF"
             >
                <FileDown size={18} />
             </button>
           )}

          <div className="h-6 w-px bg-gray-300 mx-1 hidden lg:block"></div>

          <button onClick={() => setIsCategoryModalOpen(true)} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50" title="Categorias">
            <FolderTree size={18}/>
          </button>

          <button onClick={() => setIsImportModalOpen(true)} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50" title="Importar Excel">
             <FileSpreadsheet size={18} className="text-green-600"/>
          </button>

          <button onClick={handleNew} className="px-5 py-2 bg-carvao text-white rounded-xl hover:bg-gray-800 flex items-center gap-2 font-bold shadow-lg">
            <Plus size={20}/> <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* --- FILTROS E SELEÇÃO --- */}
      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={handleSelectAll}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 font-bold text-sm min-w-[140px]"
        >
          {selectedIds.length > 0 && selectedIds.length === produtosFiltrados.length ? (
             <><CheckSquare size={18} className="text-blue-600"/> Todos</>
          ) : (
             <><Square size={18}/> Selecionar</>
          )}
        </button>

        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" placeholder="Buscar nome ou código..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-dourado outline-none"
          />
        </div>

        <div className="min-w-[200px] relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-dourado outline-none appearance-none cursor-pointer"
          >
            <option value="Todas">Todas as Categorias</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        
        <button onClick={carregarDados} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"><RefreshCw size={20}/></button>
      </div>

      {/* --- GRID --- */}
      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed">Nada encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {produtosFiltrados.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <motion.div 
                  layout key={p.id} 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`group bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 relative ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-100 hover:shadow-xl'}`}
                  onClick={(e) => {
                     if ((e.target as HTMLElement).closest('button')) return;
                     toggleSelection(p.id);
                  }}
                >
                  <div className="absolute top-3 right-3 z-20">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/80 backdrop-blur text-gray-300 border border-gray-200'}`}>
                       {isSelected ? <CheckSquare size={14}/> : <Square size={14}/>}
                    </div>
                  </div>

                  <div className="h-56 relative bg-gray-100">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={40}/></div>}
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-3 bg-white text-blue-600 rounded-full hover:scale-110 transition-all"><Edit size={20}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-3 bg-white text-red-600 rounded-full hover:scale-110 transition-all"><Trash2 size={20}/></button>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">{p.category || 'Geral'}</p>
                        <p className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">{p.code}</p>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight line-clamp-2 mb-2">{p.name}</h3>
                    </div>
                    <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                      <div><p className="text-xs text-gray-400">Preço</p><p className="text-xl font-extrabold text-dourado">R$ {Number(p.salePrice || 0).toFixed(2)}</p></div>
                      <div className="text-right"><p className="text-xs text-gray-400">Qtd</p><p className="font-bold text-gray-700">{p.quantity || 0}</p></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* --- COMPONENTE OCULTO DE IMPRESSÃO DE ETIQUETAS --- */}
      <EtiquetaImpressao 
        ref={etiquetaRef} 
        produtos={produtosSelecionados} 
        config={{ storeName: storeConfig?.storeName }} 
      />

      {/* MODAIS */}
      <ProdutoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} fornecedores={fornecedores} categories={categories} setCategories={setCategories} produtoParaEditar={produtoEditando} onProdutoSalvo={handleSaveSuccess} configGlobal={undefined} />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} onCategoryCreated={(newCat) => setCategories(prev => [...prev, newCat])} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={carregarDados} />
    </div>
  );
}