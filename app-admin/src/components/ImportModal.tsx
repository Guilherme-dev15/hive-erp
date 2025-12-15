import { useState, useEffect } from 'react'; // Removido useRef
import { motion, AnimatePresence } from 'framer-motion';
// Removido CheckCircle
import { Upload, X, FileSpreadsheet, Download, Image as ImageIcon, Loader2, Save, Trash2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { importProductsBulk, uploadImage, getCategories, getFornecedores } from '../services/apiService';
import type { Category, Fornecedor } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Tipo para os dados na área de preparação
interface PreviewProduct {
  tempId: string;
  name: string;
  code: string;
  categoryId: string;
  supplierId: string;
  salePrice: number;
  costPrice: number;
  quantity: number;
  description: string;
  imageUrl: string;
  isUploading: boolean;
}

export function ImportModal({ isOpen, onClose, onSuccess }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewProduct[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);

  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups);
      });
      setStep('upload');
      setPreviewData([]);
    }
  }, [isOpen]);

  const generateCode = (catId: string, supId: string, currentCode: string) => {
    if (currentCode && currentCode.length > 3) return currentCode;

    const cat = categories.find(c => c.id === catId)?.name?.substring(0, 3).toUpperCase() || 'GEN';
    const sup = suppliers.find(s => s.id === supId)?.name?.substring(0, 3).toUpperCase() || 'GER';
    const random = Math.floor(100 + Math.random() * 900);
    return `${cat}-${sup}-${random}`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);

      const processed = data.map((row: any, index) => {
        const catName = row['Categoria'] || row['category'] || '';
        const foundCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        
        const supName = row['Fornecedor'] || row['supplier'] || '';
        const foundSup = suppliers.find(s => s.name.toLowerCase() === supName.toLowerCase());

        const catId = foundCat?.id || '';
        const supId = foundSup?.id || '';
        const initialCode = row['Código'] || row['code'] || '';

        return {
          tempId: `row-${index}-${Date.now()}`,
          name: row['Nome'] || row['Produto'] || 'Sem Nome',
          categoryId: catId,
          supplierId: supId,
          code: initialCode || generateCode(catId, supId, ''),
          salePrice: Number(row['Preço Venda'] || row['salePrice'] || 0),
          costPrice: Number(row['Custo'] || row['costPrice'] || 0),
          quantity: Number(row['Estoque'] || row['quantity'] || 0),
          description: row['Descrição'] || '',
          imageUrl: row['Imagem URL'] || '',
          isUploading: false
        };
      });

      setPreviewData(processed);
      setStep('review');
    };
    reader.readAsBinaryString(file);
  };

  const updateRow = (id: string, field: keyof PreviewProduct, value: any) => {
    setPreviewData(prev => prev.map(item => {
      if (item.tempId !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'categoryId' || field === 'supplierId') {
        updated.code = generateCode(updated.categoryId, updated.supplierId, ''); 
      }

      return updated;
    }));
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (!file) return;

    setPreviewData(prev => prev.map(p => p.tempId === id ? { ...p, isUploading: true } : p));

    try {
      const url = await uploadImage(file);
      setPreviewData(prev => prev.map(p => p.tempId === id ? { ...p, imageUrl: url, isUploading: false } : p));
      toast.success("Imagem anexada!");
    } catch (error) {
      toast.error("Erro ao subir imagem.");
      setPreviewData(prev => prev.map(p => p.tempId === id ? { ...p, isUploading: false } : p));
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const payload = previewData.map(({ tempId, isUploading, ...rest }) => ({
         ...rest,
         category: categories.find(c => c.id === rest.categoryId)?.name || 'Geral',
         supplierId: rest.supplierId
      }));

      await importProductsBulk(payload);
      toast.success(`${payload.length} produtos cadastrados!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar lote.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ "Nome": "Exemplo", "Código": "AUTO", "Categoria": "Anéis", "Fornecedor": "PrataPura", "Preço Venda": 90, "Custo": 30, "Estoque": 10 }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Modelo_HiveERP.xlsx");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-import-adv"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className={`bg-white rounded-2xl shadow-xl w-full ${step === 'review' ? 'max-w-6xl h-[90vh]' : 'max-w-lg'} overflow-hidden flex flex-col`}
          >
            {/* HEADER */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="text-green-600" /> 
                {step === 'upload' ? 'Importar Excel' : `Revisar ${previewData.length} Produtos`}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-auto p-6">
              
              {/* STEP 1: UPLOAD */}
              {step === 'upload' && (
                <div className="space-y-6">
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 mb-2 font-bold">1. Baixe o modelo:</p>
                    <button onClick={downloadTemplate} className="flex items-center gap-2 text-xs font-bold bg-white text-blue-600 px-3 py-2 rounded-lg border border-blue-200">
                      <Download size={14}/> DOWNLOAD MODELO .XLSX
                    </button>
                  </div>
                  <div>
                     <p className="text-sm text-gray-600 mb-2 font-bold">2. Envie o arquivo:</p>
                     <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all">
                        <Upload className="text-gray-400 mb-2" size={32}/>
                        <p className="text-sm text-gray-500">Clique para selecionar Excel</p>
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
                     </label>
                  </div>
                </div>
              )}

              {/* STEP 2: REVIEW TABLE */}
              {step === 'review' && (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                      <tr>
                        <th className="px-3 py-2">Imagem</th>
                        <th className="px-3 py-2">Nome / Código</th>
                        <th className="px-3 py-2">Categoria</th>
                        <th className="px-3 py-2">Fornecedor</th>
                        <th className="px-3 py-2 w-24">Venda (R$)</th>
                        <th className="px-3 py-2 w-20">Estoque</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map((item) => (
                        <tr key={item.tempId} className="hover:bg-gray-50">
                          {/* Coluna Imagem */}
                          <td className="px-3 py-2">
                            <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                              {item.isUploading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80"><Loader2 className="animate-spin" size={16}/></div>
                              ) : item.imageUrl ? (
                                <img src={item.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20}/></div>
                              )}
                              
                              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                <Upload className="text-white" size={16}/>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(item.tempId, e.target.files[0])} />
                              </label>
                            </div>
                          </td>

                          {/* Nome e Código */}
                          <td className="px-3 py-2">
                            <input 
                              value={item.name} 
                              onChange={e => updateRow(item.tempId, 'name', e.target.value)}
                              className="w-full text-xs font-bold bg-transparent border-b border-transparent focus:border-blue-500 outline-none mb-1"
                              placeholder="Nome do Produto"
                            />
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <span className="font-mono">{item.code}</span>
                              {/* CORREÇÃO AQUI: RefreshCw agora dentro de um botão para aceitar o title e o onClick corretamente */}
                              <button 
                                type="button"
                                title="Regerar Código"
                                onClick={() => updateRow(item.tempId, 'code', generateCode(item.categoryId, item.supplierId, ''))}
                                className="text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <RefreshCw size={10} />
                              </button>
                            </div>
                          </td>

                          {/* Categoria */}
                          <td className="px-3 py-2">
                            <select 
                              value={item.categoryId} 
                              onChange={e => updateRow(item.tempId, 'categoryId', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="">Selecione...</option>
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>

                          {/* Fornecedor */}
                          <td className="px-3 py-2">
                             <select 
                              value={item.supplierId} 
                              onChange={e => updateRow(item.tempId, 'supplierId', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                              <option value="">Selecione...</option>
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </td>

                          {/* Preço */}
                          <td className="px-3 py-2">
                            <input 
                              type="number" step="0.01"
                              value={item.salePrice} 
                              onChange={e => updateRow(item.tempId, 'salePrice', parseFloat(e.target.value))}
                              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-right font-mono"
                            />
                          </td>

                           {/* Estoque */}
                           <td className="px-3 py-2">
                            <input 
                              type="number"
                              value={item.quantity} 
                              onChange={e => updateRow(item.tempId, 'quantity', parseInt(e.target.value))}
                              className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-center"
                            />
                          </td>

                          {/* Excluir Linha */}
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => setPreviewData(prev => prev.filter(p => p.tempId !== item.tempId))} className="text-gray-400 hover:text-red-500">
                              <Trash2 size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              {step === 'review' ? (
                <>
                  <button onClick={() => setStep('upload')} className="text-sm font-bold text-gray-500 hover:text-gray-800">Voltar</button>
                  <div className="flex gap-3">
                     <span className="text-xs text-gray-500 self-center hidden sm:block">Certifique-se de que todas as fotos foram carregadas.</span>
                     <button 
                      onClick={handleFinalSave} 
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold shadow-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                      SALVAR {previewData.length} PRODUTOS
                    </button>
                  </div>
                </>
              ) : (
                 <button onClick={onClose} className="ml-auto px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
              )}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}