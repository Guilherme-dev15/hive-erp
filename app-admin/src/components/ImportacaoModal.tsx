import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clipboard, ArrowRight, Loader2, Image as ImageIcon, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient, uploadImage, getCategories, getFornecedores } from '../services/apiService';
import type { Category, Fornecedor } from '../types';

interface ImportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

// Tipo temporário para a edição em massa
interface ProdutoDraft {
  tempId: string;
  name: string;
  costPrice: string;
  salePrice: string;
  quantity: string;
  categoryId: string;
  supplierId: string;
  code: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export function ImportacaoModal({ isOpen, onClose, onSucesso }: ImportacaoModalProps) {
  const [step, setStep] = useState(1); // 1: Colar, 2: Enriquecer
  const [textData, setTextData] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Dados auxiliares
  const [categories, setCategories] = useState<Category[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  
  // Lista de produtos sendo editados
  const [drafts, setDrafts] = useState<ProdutoDraft[]>([]);

  // Carregar listas ao abrir
  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, forns]) => {
        setCategories(cats);
        setFornecedores(forns);
      });
    }
  }, [isOpen]);

  // --- LÓGICA DE GERAÇÃO DE SKU ---
  const generateSKU = (catId: string, supId: string) => {
    const cat = categories.find(c => c.id === catId)?.name.substring(0, 3).toUpperCase() || 'GEN';
    const sup = fornecedores.find(f => f.id === supId)?.name.substring(0, 3).toUpperCase() || 'IMP';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${cat}-${random}-${sup}`;
  };

  // --- ETAPA 1: PROCESSAR O TEXTO COLADO ---
  const processarTexto = () => {
    if (!textData.trim()) return toast.error("Cole os dados do Excel.");

    const rows = textData.trim().split('\n');
    const novosDrafts: ProdutoDraft[] = [];

    rows.forEach((row, index) => {
      // Divide por Tab (Excel) ou Ponto e Vírgula
      let cols = row.split('\t');
      if (cols.length < 2) cols = row.split(';');

      // Ignora cabeçalhos
      if (cols[0]?.toLowerCase().includes('nome') || cols[1]?.toLowerCase().includes('custo')) return;

      const name = cols[0]?.trim() || '';
      // Limpeza de valores monetários (R$ 1.200,50 -> 1200.50)
      const cost = cols[1]?.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0';
      const qty = cols[2]?.trim() || '1';
      
      // Se tiver preço de venda na coluna 4, usa, senão calcula 2x (padrão visual)
      let sale = cols[3]?.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      if (!sale) sale = (parseFloat(cost) * 2).toFixed(2);

      if (name) {
        novosDrafts.push({
          tempId: `row_${Date.now()}_${index}`,
          name,
          costPrice: cost,
          salePrice: sale,
          quantity: qty,
          categoryId: '',
          supplierId: '',
          code: '', // Será gerado ao escolher categoria/fornecedor
          imageFile: null,
          imagePreview: null
        });
      }
    });

    if (novosDrafts.length === 0) return toast.error("Nenhum dado válido encontrado.");
    
    setDrafts(novosDrafts);
    setStep(2);
  };

  // --- ETAPA 2: ATUALIZAR DADOS NA TABELA ---
  const updateDraft = (id: string, field: keyof ProdutoDraft, value: any) => {
    setDrafts(prev => prev.map(item => {
      if (item.tempId !== id) return item;

      const updated = { ...item, [field]: value };

      // Se mudou Categoria ou Fornecedor, regenera o SKU
      if (field === 'categoryId' || field === 'supplierId') {
        if (updated.categoryId && updated.supplierId) {
          updated.code = generateSKU(updated.categoryId, updated.supplierId);
        }
      }
      
      // Se mudou Custo, recalcula sugestão de venda (opcional, regra de negócio simples x2)
      if (field === 'costPrice') {
         // updated.salePrice = (parseFloat(value) * 2).toFixed(2);
      }

      return updated;
    }));
  };

  const handleImageUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateDraft(id, 'imagePreview', url);
    updateDraft(id, 'imageFile', file);
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(i => i.tempId !== id));
  };

  // --- ETAPA 3: SALVAR TUDO ---
  const salvarTodos = async () => {
    // Validação
    const invalidos = drafts.filter(d => !d.categoryId || !d.supplierId);
    if (invalidos.length > 0) {
      return toast.error(`Faltam Categoria ou Fornecedor em ${invalidos.length} itens.`);
    }

    setLoading(true);
    let successCount = 0;

    try {
      // Processa um por um para garantir upload de imagem correto
      // (Poderia ser Promise.all, mas sequencial é mais seguro para não travar upload)
      const payloadFinal = [];

      for (const draft of drafts) {
        let imageUrl = '';
        
        if (draft.imageFile) {
          try {
            imageUrl = await uploadImage(draft.imageFile, 'produtos');
          } catch (e) {
            console.error("Erro upload imagem", draft.name);
          }
        }

        payloadFinal.push({
          name: draft.name,
          costPrice: parseFloat(draft.costPrice),
          salePrice: parseFloat(draft.salePrice),
          quantity: parseInt(draft.quantity),
          categoryId: categories.find(c => c.id === draft.categoryId)?.name || 'Geral',
          // Envia o ID do fornecedor para relacionamento correto
          supplierId: draft.supplierId, 
          code: draft.code,
          imageUrl,
          status: 'ativo',
          description: `Produto importado: ${draft.name}`
        });

        successCount++;
        setProgress(Math.round((successCount / drafts.length) * 100));
      }

      // Envia Batch para API
      await apiClient.post('/admin/products/bulk', payloadFinal);
      
      toast.success("Importação concluída com sucesso!");
      onSucesso();
      handleClose();

    } catch (error) {
      toast.error("Erro ao salvar produtos.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    setStep(1);
    setTextData('');
    setDrafts([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-carvao p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <Clipboard className="text-dourado" size={24}/> 
              {step === 1 ? 'Importação Rápida (Copiar e Colar)' : 'Enriquecer Dados'}
            </h3>
            <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={20}/></button>
          </div>

          <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
            
            {/* --- PASSO 1: COLAR --- */}
            {step === 1 && (
              <div className="p-8 flex flex-col h-full gap-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm">
                   <h4 className="font-bold text-blue-900 flex items-center gap-2"><AlertCircle size={18}/> Instruções Simples</h4>
                   <p className="text-sm text-blue-800 mt-1">
                     1. No seu Excel, selecione apenas as colunas: <strong>Nome | Custo | Quantidade</strong> (nessa ordem).<br/>
                     2. Copie (Ctrl+C) e cole abaixo (Ctrl+V).<br/>
                     3. Na próxima tela, você adicionará as fotos, categorias e fornecedores visualmente.
                   </p>
                </div>

                <textarea
                  value={textData}
                  onChange={e => setTextData(e.target.value)}
                  placeholder={`Exemplo:\nAnel Solitário Prata   25,00   10\nColar Veneziana        15,50   5`}
                  className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dourado outline-none font-mono text-sm resize-none shadow-inner"
                />

                <div className="flex justify-end">
                   <button 
                     onClick={processarTexto}
                     disabled={!textData}
                     className="bg-carvao text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                   >
                     Processar Dados <ArrowRight size={18} />
                   </button>
                </div>
              </div>
            )}

            {/* --- PASSO 2: TABELA DE EDIÇÃO EM MASSA --- */}
            {step === 2 && (
              <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
                  <div>
                    <h3 className="font-bold text-gray-800">Revisão ({drafts.length} itens)</h3>
                    <p className="text-xs text-gray-500">Adicione as fotos e classifique os produtos para gerar os códigos.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">Voltar</button>
                    <button 
                      onClick={salvarTodos}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} 
                      Finalizar Importação
                    </button>
                  </div>
                </div>

                {/* Progress Bar (Upload) */}
                {loading && (
                  <div className="w-full bg-gray-200 h-1">
                    <div className="bg-green-500 h-1 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                )}

                {/* Tabela Interativa */}
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b-2 border-gray-200">
                        <th className="p-3 w-16">Foto</th>
                        <th className="p-3">Nome do Produto</th>
                        <th className="p-3 w-32">Categoria *</th>
                        <th className="p-3 w-32">Fornecedor *</th>
                        <th className="p-3 w-24 text-right">Custo</th>
                        <th className="p-3 w-24 text-right">Venda</th>
                        <th className="p-3 w-20 text-center">Qtd</th>
                        <th className="p-3 w-32">Código (Auto)</th>
                        <th className="p-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {drafts.map((item) => (
                        <tr key={item.tempId} className="hover:bg-gray-50 group transition-colors">
                          {/* Imagem */}
                          <td className="p-2">
                            <label className="block w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-dourado cursor-pointer overflow-hidden relative bg-gray-50">
                              {item.imagePreview ? (
                                <img src={item.imagePreview} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <ImageIcon size={16} />
                                </div>
                              )}
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(item.tempId, e.target.files[0])} />
                            </label>
                          </td>

                          {/* Nome */}
                          <td className="p-2">
                            <input 
                              value={item.name} 
                              onChange={e => updateDraft(item.tempId, 'name', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded focus:ring-1 focus:ring-dourado text-sm font-medium"
                            />
                          </td>

                          {/* Categoria */}
                          <td className="p-2">
                            <select 
                              value={item.categoryId} 
                              onChange={e => updateDraft(item.tempId, 'categoryId', e.target.value)}
                              className={`w-full p-2 border rounded text-xs ${!item.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Selecione...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>

                          {/* Fornecedor */}
                          <td className="p-2">
                            <select 
                              value={item.supplierId} 
                              onChange={e => updateDraft(item.tempId, 'supplierId', e.target.value)}
                              className={`w-full p-2 border rounded text-xs ${!item.supplierId ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Selecione...</option>
                              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                          </td>

                          {/* Custo */}
                          <td className="p-2">
                            <input 
                              type="number" step="0.01"
                              value={item.costPrice} 
                              onChange={e => updateDraft(item.tempId, 'costPrice', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded text-right text-sm"
                            />
                          </td>

                          {/* Venda */}
                          <td className="p-2">
                            <input 
                              type="number" step="0.01"
                              value={item.salePrice} 
                              onChange={e => updateDraft(item.tempId, 'salePrice', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded text-right text-sm font-bold text-green-700 bg-green-50"
                            />
                          </td>

                          {/* Qtd */}
                          <td className="p-2">
                            <input 
                              type="number"
                              value={item.quantity} 
                              onChange={e => updateDraft(item.tempId, 'quantity', e.target.value)}
                              className="w-full p-2 border border-gray-200 rounded text-center text-sm"
                            />
                          </td>

                          {/* Código (Auto) */}
                          <td className="p-2">
                            <div className="px-2 py-1.5 bg-gray-100 rounded text-xs font-mono text-center text-gray-600 border border-gray-200 truncate">
                              {item.code || '-'}
                            </div>
                          </td>

                          {/* Remover */}
                          <td className="p-2 text-center">
                            <button onClick={() => removeDraft(item.tempId)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}