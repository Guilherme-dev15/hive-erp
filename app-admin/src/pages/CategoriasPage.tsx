import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, ShoppingBag, MessageCircle, 
  ChevronRight, ArrowRight, Package, Ruler, Info
} from 'lucide-react';
import { getAdminProdutos, getCategories, getConfig } from '../services/apiService';
import type { ProdutoAdmin, Category } from '../types';

// Interface estendida para ler as variantes
interface ProdutoStore extends ProdutoAdmin {
  variantes?: {
    medida: string;
    valor_ajuste: number;
    estoque: number;
    sob_consulta: boolean;
  }[];
  subcategory?: string;
}

export function CatalogoPage() {
  const [produtos, setProdutos] = useState<ProdutoStore[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Modal de Detalhes
  const [selectedProduct, setSelectedProduct] = useState<ProdutoStore | null>(null);
  
  // Estado da Variante Selecionada (Grade)
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, conf] = await Promise.all([
          getAdminProdutos(), 
          getCategories(),
          getConfig()
        ]);
        // Filtra apenas produtos ativos para o catálogo
        setProdutos(p.filter((i: any) => i.status === 'ativo'));
        setCategories(c);
        setStoreConfig(conf);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Resetar variante ao abrir novo produto
  useEffect(() => {
    if (selectedProduct) {
      // Se tiver variantes, seleciona a primeira automaticamente
      if (selectedProduct.variantes && selectedProduct.variantes.length > 0) {
        setSelectedVariant(selectedProduct.variantes[0]);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [selectedProduct]);

  const filteredProducts = useMemo(() => {
    return produtos.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [produtos, searchTerm, selectedCategory]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleWhatsApp = () => {
    if (!selectedProduct) return;

    const phone = storeConfig?.whatsapp?.replace(/\D/g, '') || '';
    if (!phone) return alert("WhatsApp da loja não configurado.");

    let message = `Olá! Tenho interesse no produto: *${selectedProduct.name}*`;
    
    // Adiciona detalhes da variante na mensagem
    if (selectedVariant) {
      message += `\nOpção: *${selectedVariant.medida}*`;
      if (selectedVariant.sob_consulta) {
        message += ` (Consultar Disponibilidade)`;
      } else {
        message += ` - Preço: ${formatCurrency(selectedVariant.valor_ajuste)}`;
      }
    } else {
      message += ` - Preço: ${formatCurrency(selectedProduct.salePrice)}`;
    }
    
    message += `\nCódigo: ${selectedProduct.code}`;
    
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER DO CATÁLOGO */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-dourado">
                <ShoppingBag size={20} color="#d19900" />
             </div>
             <div>
               <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                 {storeConfig?.storeName || 'CATÁLOGO'}
               </h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coleção Exclusiva</p>
             </div>
          </div>
          
          {/* Busca Simples */}
          <div className="relative hidden md:block w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
               type="text" 
               placeholder="Buscar peças..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#d19900]/20 transition-all"
             />
          </div>
        </div>

        {/* Menu de Categorias (Scroll Horizontal) */}
        <div className="max-w-6xl mx-auto px-4 pb-0 overflow-x-auto scrollbar-hide flex gap-6">
           {['Todas', ...categories.map(c => c.name)].map(cat => (
             <button 
               key={cat}
               onClick={() => setSelectedCategory(cat)}
               className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${selectedCategory === cat ? 'text-[#d19900] border-[#d19900]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Mobile Search */}
        <div className="md:hidden mb-6 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="O que você procura hoje?" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm outline-none focus:border-[#d19900]"
           />
        </div>

        {loading ? (
           <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#d19900] border-t-transparent rounded-full"></div></div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
             {filteredProducts.map(produto => (
               <motion.div 
                 layout
                 key={produto.id}
                 onClick={() => setSelectedProduct(produto)}
                 className="group bg-white rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 overflow-hidden"
               >
                 <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
                   <img 
                     src={produto.imageUrl || 'https://placehold.co/400x500/f3f4f6/a3a3a3?text=Sem+Foto'} 
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                     alt={produto.name}
                   />
                   {/* Badge de Variações */}
                   {produto.variantes && produto.variantes.length > 0 && (
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Ruler size={10} className="text-[#d19900]"/>
                        {produto.variantes.length} Opções
                      </div>
                   )}
                 </div>
                 
                 <div className="p-4">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                     {produto.category}
                   </p>
                   <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                     {produto.name}
                   </h3>
                   <div className="flex items-center justify-between">
                     <span className="text-lg font-black text-[#d19900]">
                       {formatCurrency(produto.salePrice)}
                     </span>
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#d19900] group-hover:text-white transition-colors">
                        <ArrowRight size={16} />
                     </div>
                   </div>
                 </div>
               </motion.div>
             ))}
           </div>
        )}
      </main>

      {/* MODAL DE DETALHES DO PRODUTO (A Mágica das Variantes) */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              
              {/* Coluna Imagem */}
              <div className="w-full md:w-1/2 bg-gray-100 h-64 md:h-auto relative">
                 <img 
                   src={selectedProduct.imageUrl} 
                   className="w-full h-full object-cover"
                 />
                 <button 
                   onClick={() => setSelectedProduct(null)} 
                   className="absolute top-4 left-4 p-2 bg-white/50 backdrop-blur rounded-full text-black hover:bg-white transition-all md:hidden"
                 >
                   <X size={20} />
                 </button>
              </div>

              {/* Coluna Detalhes */}
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white overflow-y-auto">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <span className="text-xs font-bold text-[#d19900] uppercase tracking-widest bg-[#d19900]/10 px-2 py-1 rounded-md">
                         {selectedProduct.category}
                       </span>
                       <h2 className="text-2xl font-black text-gray-900 mt-2 leading-tight">
                         {selectedProduct.name}
                       </h2>
                       <p className="text-xs text-gray-400 font-mono mt-1">REF: {selectedProduct.code}</p>
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="hidden md:block p-2 hover:bg-gray-100 rounded-full text-gray-400">
                       <X size={24} />
                    </button>
                 </div>

                 <div className="my-6 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                       {selectedProduct.description || "Sem descrição disponível."}
                    </p>
                    
                    {/* SELETOR DE VARIANTES / GRADES */}
                    {selectedProduct.variantes && selectedProduct.variantes.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                           <Ruler size={14}/> Selecione a Opção:
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {selectedProduct.variantes.map((variante, idx) => {
                             const isSelected = selectedVariant === variante;
                             return (
                               <button
                                 key={idx}
                                 onClick={() => setSelectedVariant(variante)}
                                 className={`
                                   px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all
                                   ${isSelected 
                                     ? 'border-[#d19900] bg-[#d19900] text-white shadow-lg shadow-[#d19900]/20' 
                                     : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                   }
                                 `}
                               >
                                 {variante.medida}
                               </button>
                             );
                           })}
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-4">
                       <div>
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Preço Final</p>
                          <div className="text-3xl font-black text-gray-900 tracking-tight">
                             {/* Lógica de Preço: Se tiver variante selecionada, usa o preço dela. Se for sob consulta, esconde o preço */}
                             {selectedVariant?.sob_consulta 
                                ? <span className="text-xl text-gray-500">Sob Consulta</span> 
                                : formatCurrency(selectedVariant ? selectedVariant.valor_ajuste : selectedProduct.salePrice)
                             }
                          </div>
                       </div>
                       
                       {/* Status de Estoque */}
                       {(selectedVariant ? selectedVariant.estoque > 0 : selectedProduct.quantity > 0) ? (
                          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold">
                             <Package size={14} /> Em Estoque
                          </div>
                       ) : (
                          <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-xs font-bold">
                             <Info size={14} /> Sob Encomenda
                          </div>
                       )}
                    </div>

                    <button 
                      onClick={handleWhatsApp}
                      className="w-full bg-[#25D366] hover:bg-[#1ebc57] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
                    >
                       <MessageCircle size={24} />
                       {selectedVariant?.sob_consulta ? 'Consultar Disponibilidade' : 'Comprar pelo WhatsApp'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                       Venda assistida via WhatsApp oficial da loja.
                    </p>
                 </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}