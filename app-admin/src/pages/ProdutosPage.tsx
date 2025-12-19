import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit, Trash2, Package, Loader2,
  RefreshCw, Filter, FolderTree, FileSpreadsheet, FileDown,
  CheckSquare, Square, X, Tag, History, Sparkles, ChevronRight, QrCode
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useReactToPrint } from 'react-to-print';

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
import { EtiquetaImpressao } from '../components/EtiquetaImpressao';
import { StockModal } from '../components/StockModal';
import { NeonStudio } from '../components/NeonStudio';

// --- TIPOS ---
import type { ProdutoAdmin, Category, Fornecedor } from '../types';

// Tipo Estendido
type ExtendedProdutoAdmin = Omit<ProdutoAdmin, 'subcategory' | 'weight' | 'gramPrice'> & {
  subcategory?: string;
  weight?: number;
  gramPrice?: number;
};

export function ProdutosPage() {
  // 1. DADOS
  const [produtos, setProdutos] = useState<ExtendedProdutoAdmin[]>([]);
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

  // 4. IMPRESSÃO
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
  const [isNeonOpen, setIsNeonOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoAdmin | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [produtoEstoque, setProdutoEstoque] = useState<ProdutoAdmin | null>(null);

  // ============================================================================
  // 🔥 LÓGICA DE QR CODE (A MÁGICA ACONTECE AQUI)
  // ============================================================================
 useEffect(() => {
    // 1. Tenta pegar o código da URL (vinda direta do QR Code)
    const params = new URLSearchParams(window.location.search);
    const qrFromUrl = params.get('q');

    // 2. Tenta pegar o código do Cache (caso o sistema tenha te jogado no Dashboard antes)
    const qrFromCache = localStorage.getItem('pending_qr_scan');

    const finalQuery = qrFromUrl || qrFromCache;

    if (finalQuery) {
      setSearchTerm(finalQuery);
      
      toast('Produto localizado via QR Code', {
        icon: '📷',
        style: {
          borderRadius: '10px',
          background: '#4a4a4a',
          color: '#d19900',
          fontWeight: 'bold',
          border: '1px solid #d19900'
        },
      });

      // Limpa os rastros para não filtrar eternamente
      window.history.replaceState({}, '', window.location.pathname);
      localStorage.removeItem('pending_qr_scan');
    }
    
    // Listener para capturar o link mesmo se o usuário estiver no Dashboard
    // Se o QR Code bater no App.tsx e salvar no localStorage, 
    // a ProdutosPage pegará na próxima montagem.
  }, []);
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

      setProdutos(prodsData as unknown as ExtendedProdutoAdmin[]);
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
  // FILTROS
  // ============================================================================
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const termo = searchTerm.toLowerCase().trim(); // Remove espaços extras
      const sub = p.subcategory ? p.subcategory.toLowerCase() : '';
      const code = p.code ? p.code.toLowerCase() : '';
      const name = p.name ? p.name.toLowerCase() : '';
      
      // Lógica de busca robusta (Nome, SKU ou Subcategoria)
      const matchTexto = name.includes(termo) || code.includes(termo) || sub.includes(termo);

      const matchCategoria = filterCategory === 'Todas' || p.category === filterCategory;
      return matchTexto && matchCategoria;
    });
  }, [produtos, searchTerm, filterCategory]);

  // ============================================================================
  // SELEÇÃO
  // ============================================================================
  const produtosSelecionados = useMemo(() => {
    if (selectedIds.length > 0) {
      return produtos.filter(p => selectedIds.includes(p.id));
    }
    return [];
  }, [selectedIds, produtos]);

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
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteAdminProduto(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success("Produto excluído com sucesso!");
    } catch (e) { toast.error("Erro ao excluir produto."); }
  };

  const handleEdit = (prod: ExtendedProdutoAdmin) => {
    setProdutoEditando(prod as unknown as ProdutoAdmin);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setProdutoEditando(null);
    setIsModalOpen(true);
  };

  const handleStock = (prod: ExtendedProdutoAdmin) => {
    setProdutoEstoque(prod as unknown as ProdutoAdmin);
    setIsStockModalOpen(true);
  };

  const handleSaveSuccess = (prodSalvo: ProdutoAdmin) => {
    const prodExt = prodSalvo as unknown as ExtendedProdutoAdmin;
    if (produtoEditando) {
      setProdutos(prev => prev.map(p => p.id === prodExt.id ? prodExt : p));
    } else {
      setProdutos(prev => [prodExt, ...prev]);
    }
    setIsModalOpen(false);
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin text-[#d19900]" size={48} /></div>;

  return (
    <div className="space-y-8 pb-20 p-6 md:p-8 bg-gray-50/50 min-h-screen">
      <Toaster position="top-right" />

      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-[#4a4a4a] flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-[#d19900]/10 rounded-xl text-[#d19900]">
                <Package size={24} />
            </div>
            Gestão de Produtos
            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{produtos.length} items</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium ml-1">
            {selectedIds.length > 0
              ? <span className="text-[#d19900] font-bold bg-[#d19900]/10 px-2 py-0.5 rounded">{selectedIds.length} selecionados</span>
              : "Gerencie seu inventário, preços e catálogo digital."
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
          
          {/* Grupo de Ações em Massa */}
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 gap-1">
              <button
                onClick={onPrintClick}
                className={`p-2.5 rounded-lg text-gray-500 hover:text-[#d19900] hover:bg-white hover:shadow-sm transition-all ${selectedIds.length > 0 ? 'text-[#d19900] bg-white shadow-sm' : ''}`}
                title="Imprimir Etiquetas"
              >
                <Tag size={18} />
              </button>

              {isGeneratingPdf ? (
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                  <PDFDownloadLink
                    document={<CatalogPDF produtos={produtosParaPdf as unknown as ProdutoAdmin[]} storeName={storeConfig?.storeName || "Catálogo"} />}
                    fileName="catalogo_produtos.pdf"
                    className="flex items-center gap-2 text-[#d19900] font-bold text-xs"
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (loading ? 'Gerando...' : 'Baixar PDF')}
                  </PDFDownloadLink>
                  <button onClick={() => setIsGeneratingPdf(false)} className="hover:bg-red-50 p-1 rounded-full"><X size={12} className="text-red-400" /></button>
                </div>
              ) : (
                <button onClick={handlePreparePdf} className="p-2.5 rounded-lg text-gray-500 hover:text-[#d19900] hover:bg-white hover:shadow-sm transition-all" title="Gerar Catálogo PDF">
                  <FileDown size={18} />
                </button>
              )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block"></div>

          {/* Grupo de Ferramentas */}
          <div className="flex gap-2">
              <button onClick={() => setIsCategoryModalOpen(true)} className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-[#d19900]/50 hover:text-[#d19900] transition-colors shadow-sm" title="Categorias">
                  <FolderTree size={18} />
              </button>
              
              <button onClick={() => setIsImportModalOpen(true)} className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-green-200 hover:text-green-600 transition-colors shadow-sm" title="Importar Excel">
                  <FileSpreadsheet size={18} />
              </button>
          </div>

          {/* NEON STUDIO */}
          <button 
            onClick={() => setIsNeonOpen(true)} 
            className="group flex items-center gap-2 px-5 py-3 bg-[#ffffff] text-[#d19900] rounded-xl hover:bg-black hover:shadow-[0_0_20px_rgba(209,153,0,0.2)] transition-all font-bold ml-2 border"
          >
             <Sparkles size={18} className="group-hover:text-white transition-colors" /> 
             <span className="hidden sm:inline group-hover:text-white transition-colors">Neon Studio</span>
          </button>

          {/* Botão Novo */}
          <button onClick={handleNew} className="px-6 py-3 bg-[#d19900] text-white rounded-xl hover:bg-[#b88600] hover:shadow-lg hover:shadow-[#d19900]/30 flex items-center gap-2 font-bold transition-all active:scale-95">
            <Plus size={20} /> <span className="hidden sm:inline">Novo Produto</span>
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <button 
            onClick={handleSelectAll} 
            className={`
                flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all
                ${selectedIds.length > 0 && selectedIds.length === produtosFiltrados.length 
                    ? 'bg-[#d19900]/10 text-[#d19900] border border-[#d19900]/20' 
                    : 'bg-white hover:bg-gray-50 text-gray-600 border border-transparent'
                }
            `}
        >
          {selectedIds.length > 0 && selectedIds.length === produtosFiltrados.length ? <><CheckSquare size={18} /> Todos</> : <><Square size={18} /> Selecionar</>}
        </button>
        
        <div className="flex-grow relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d19900] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, código SKU ou subcategoria..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#d19900]/50 focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-[#4a4a4a]" 
          />
        </div>
        
        <div className="min-w-[220px] relative group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d19900] transition-colors" size={18} />
          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value)} 
            className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#d19900]/50 focus:ring-4 focus:ring-[#d19900]/10 outline-none appearance-none cursor-pointer text-sm font-medium text-[#4a4a4a]"
          >
            <option value="Todas">Todas as Categorias</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
        
        <button onClick={carregarDados} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-[#d19900] transition-colors" title="Recarregar">
            <RefreshCw size={20} />
        </button>
      </div>

      {/* GRID DE PRODUTOS */}
      {produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            {/* Se tem termo de busca, mas não achou nada */}
            {searchTerm ? (
               <>
                 <div className="bg-red-50 p-6 rounded-full mb-4">
                    <QrCode size={48} className="text-red-300" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-800">Produto não encontrado</h3>
                 <p className="text-gray-400 text-sm mt-1">O código "{searchTerm}" não retornou resultados.</p>
                 <button onClick={() => setSearchTerm('')} className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">Limpar Busca</button>
               </>
            ) : (
               <>
                 <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Package size={48} className="text-gray-300" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-800">Nenhum produto cadastrado</h3>
                 <p className="text-gray-400 text-sm mt-1">Comece adicionando novos itens ao estoque.</p>
               </>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <AnimatePresence>
            {produtosFiltrados.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              return (
                <motion.div
                  layout key={p.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    group bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col relative transition-all duration-300
                    ${isSelected ? 'ring-2 ring-[#d19900] shadow-xl shadow-[#d19900]/10' : 'border border-gray-100 hover:shadow-xl hover:border-gray-200'}
                  `}
                  onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; toggleSelection(p.id); }}
                >
                  {/* Checkbox */}
                  <div className="absolute top-4 right-4 z-20 transition-transform duration-200 group-hover:scale-110">
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm
                        ${isSelected ? 'bg-[#d19900] text-white' : 'bg-white/90 backdrop-blur text-gray-300 border border-gray-100 hover:border-[#d19900]'}
                    `}>
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                  </div>

                  {/* Imagem */}
                  <div className="h-64 relative bg-gray-50 overflow-hidden">
                    {p.imageUrl ? (
                        <img src={p.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                            <Package size={40} />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sem Imagem</span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start max-w-[80%]">
                        <span className="bg-white/90 backdrop-blur-md text-[#4a4a4a] text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm border border-white/20">
                            {p.category || 'Geral'}
                        </span>
                        {p.subcategory && (
                            <span className="bg-[#4a4a4a]/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <span className="opacity-70 text-[8px] text-[#d19900]">▶</span> {p.subcategory}
                            </span>
                        )}
                    </div>

                    {/* Overlay Ações */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-[#d19900] transition-all shadow-lg" title="Editar"><Edit size={20} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleStock(p); }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-amber-600 transition-all shadow-lg" title="Estoque"><History size={20} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-red-600 transition-all shadow-lg" title="Excluir"><Trash2 size={20} /></button>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 font-mono tracking-wide">
                            {p.code || 'SEM SKU'}
                         </span>
                         {p.weight && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                               <span className="w-1.5 h-1.5 rounded-full bg-[#d19900]"></span> {p.weight}g
                            </span>
                         )}
                      </div>
                      
                      <h3 className="font-bold text-[#4a4a4a] text-base leading-tight line-clamp-2 mb-1 group-hover:text-[#d19900] transition-colors" title={p.name}>
                        {p.name}
                      </h3>
                    </div>
                    
                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Preço Venda</span>
                         <span className="text-xl font-black text-[#d19900] tracking-tight">
                            R$ {Number(p.salePrice || 0).toFixed(2)}
                         </span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Estoque</span>
                         <span className={`font-bold text-sm px-2 py-0.5 rounded-lg ${p.quantity > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {p.quantity || 0} un
                         </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <EtiquetaImpressao ref={etiquetaRef} produtos={produtosSelecionados as unknown as ProdutoAdmin[]} config={{ storeName: storeConfig?.storeName }} />

      <ProdutoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} fornecedores={fornecedores} categories={categories} setCategories={setCategories} produtoParaEditar={produtoEditando} onProdutoSalvo={handleSaveSuccess} configGlobal={undefined} />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} onCategoryCreated={(newCat) => setCategories(prev => [...prev, newCat])} />
      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={carregarDados} />
      
      <NeonStudio isOpen={isNeonOpen} onClose={() => setIsNeonOpen(false)} onSuccess={carregarDados} />
      <StockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} product={produtoEstoque} onSuccess={carregarDados} />
    </div>
  );
}