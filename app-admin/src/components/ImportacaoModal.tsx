import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import stringSimilarity from 'string-similarity';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle, Image as ImageIcon, AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient, uploadImage } from '../services/apiService'; // Reaproveitando sua função de upload existente

// --- CONFIGURAÇÕES DE INTELIGÊNCIA ---
const IMPORT_CONFIG = {
  markups: {
    'aneis': 3.5,
    'colares': 3.2,
    'brincos': 3.5,
    'default': 3.0
  },
  thresholdImagem: 0.5 // 0 a 1 (0.5 = 50% de semelhança no nome aceitável)
};

interface ImportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

interface ProdutoProcessado {
  tempId: string;
  name: string;
  code: string;
  category: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  description: string;
  status: 'ativo' | 'inativo';
  imageFile: File | null; // O arquivo real para upload
  imageMatchName: string | null; // Nome do arquivo encontrado
  confidence: number; // Nível de certeza do match
}

export function ImportacaoModal({ isOpen, onClose, onSucesso }: ImportacaoModalProps) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Revisão, 3: Uploading
  const [loading, setLoading] = useState(false);
  
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [produtosProcessados, setProdutosProcessados] = useState<ProdutoProcessado[]>([]);
  const [progress, setProgress] = useState(0);

  // --- 1. LÓGICA DE PROCESSAMENTO (O CÉREBRO) ---
  const processarArquivos = () => {
    if (!csvFile) return toast.error("Selecione o CSV");
    setLoading(true);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      encoding: "ISO-8859-1", // Tenta forçar leitura correta de acentos do Excel antigo
      complete: (results) => {
        const imageNames = imageFiles.map(f => f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        
        const dados: ProdutoProcessado[] = results.data.map((row: any, index) => {
          // A. Normalização de Dados
          const rawName = row['Nome'] || 'Produto Sem Nome';
          const cleanName = rawName.trim();
          const cleanCategory = row['Categoria'] || 'Geral';
          const cleanCode = row['Codigo'] || `GEN-${Math.floor(Math.random()*10000)}`;
          
          // B. Cálculo de Preço Inteligente
          const custo = parseFloat(row['Custo']?.replace(',', '.') || 0);
          let venda = parseFloat(row['Venda']?.replace(',', '.') || 0);

          if (venda === 0 && custo > 0) {
            // Aplica Markup baseado na categoria (normalizada para lower case)
            const catKey = cleanCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const markup = (IMPORT_CONFIG.markups as any)[catKey] || IMPORT_CONFIG.markups.default;
            venda = custo * markup;
            // Arredondamento comercial (ex: 49.90)
            venda = Math.ceil(venda) - 0.10; 
          }

          // C. Matching de Imagem (Hierárquico)
          let matchedFile = null;
          let matchName = null;
          let confidence = 0;

          // 1. Tenta pelo Código exato (Alta confiança)
          const fileByCode = imageFiles.find(f => f.name.toLowerCase().includes(cleanCode.toLowerCase()));
          
          if (fileByCode) {
            matchedFile = fileByCode;
            matchName = fileByCode.name;
            confidence = 1.0;
          } else if (imageNames.length > 0) {
            // 2. Tenta pelo Nome (Fuzzy Matching)
            const normalizedProdName = cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
            const match = stringSimilarity.findBestMatch(normalizedProdName, imageNames);
            
            if (match.bestMatch.rating > IMPORT_CONFIG.thresholdImagem) {
              matchedFile = imageFiles[match.bestMatchIndex];
              matchName = matchedFile.name;
              confidence = match.bestMatch.rating;
            }
          }

          return {
            tempId: `tmp_${index}`,
            name: cleanName,
            code: cleanCode,
            category: cleanCategory,
            costPrice: custo,
            salePrice: venda,
            quantity: parseInt(row['Estoque'] || 0),
            description: row['Descricao'] || `Lindo(a) ${cleanName}.`,
            status: 'ativo',
            imageFile: matchedFile,
            imageMatchName: matchName,
            confidence
          };
        });

        setProdutosProcessados(dados);
        setLoading(false);
        setStep(2);
      },
      error: () => {
        toast.error("Erro ao ler CSV");
        setLoading(false);
      }
    });
  };

  // --- 2. UPLOAD FINAL E SALVAMENTO ---
  const handleFinalizarImportacao = async () => {
    setLoading(true);
    let successCount = 0;
    const total = produtosProcessados.length;

    // Prepara o lote final
    const loteFinal = [];

    for (let i = 0; i < total; i++) {
      const prod = produtosProcessados[i];
      let finalImageUrl = '';

      // Upload da Imagem (se houver match)
      if (prod.imageFile) {
        try {
          // Usa a função uploadImage já existente no seu apiService
          // Se não tiver, criamos uma simples com FormData
          finalImageUrl = await uploadImage(prod.imageFile, 'produtos');
        } catch (e) {
          console.error(`Erro upload imagem ${prod.name}`);
        }
      }

      loteFinal.push({
        name: prod.name,
        code: prod.code,
        category: prod.category,
        costPrice: prod.costPrice,
        salePrice: prod.salePrice,
        quantity: prod.quantity,
        description: prod.description,
        status: prod.status,
        imageUrl: finalImageUrl // URL do Firebase
      });

      successCount++;
      setProgress(Math.round((successCount / total) * 100));
    }

    // Enviar dados para API (Batch)
    try {
      await apiClient.post('/admin/products/bulk', loteFinal);
      toast.success("Importação Concluída!");
      onSucesso();
      onClose();
    } catch (e) {
      toast.error("Erro ao salvar no banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-carvao p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <FileSpreadsheet className="text-dourado" size={24}/> 
              AutoImport Pro
            </h3>
            <button onClick={onClose} className="hover:bg-white/20 p-1 rounded"><X size={20}/></button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            
            {/* ETAPA 1: UPLOAD */}
            {step === 1 && (
              <div className="h-full flex flex-col justify-center space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CSV Drop */}
                  <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${csvFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-dourado'}`}>
                    <FileSpreadsheet size={48} className={csvFile ? 'text-green-600' : 'text-gray-400'} />
                    <p className="mt-4 font-bold text-gray-700">{csvFile ? csvFile.name : "1. Arraste o CSV aqui"}</p>
                    <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer w-1/2" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                    {!csvFile && <p className="text-xs text-gray-400 mt-2">Deve conter colunas: Nome, Custo, etc.</p>}
                  </div>

                  {/* Imagens Drop */}
                  <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${imageFiles.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
                    <ImageIcon size={48} className={imageFiles.length > 0 ? 'text-blue-600' : 'text-gray-400'} />
                    <p className="mt-4 font-bold text-gray-700">{imageFiles.length > 0 ? `${imageFiles.length} imagens selecionadas` : "2. Selecione a Pasta de Imagens"}</p>
                    <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-1/2 ml-[50%]" onChange={e => setImageFiles(Array.from(e.target.files || []))} />
                    <p className="text-xs text-gray-400 mt-2">O sistema fará o match automático.</p>
                  </div>
                </div>

                <button 
                  onClick={processarArquivos}
                  disabled={!csvFile || loading}
                  className="mx-auto bg-carvao text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin"/> : <ArrowRight />} Processar Inteligência
                </button>
              </div>
            )}

            {/* ETAPA 2: REVISÃO */}
            {step === 2 && (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Revisão Inteligente</h2>
                    <p className="text-sm text-gray-500">{produtosProcessados.length} produtos processados. Verifique os matches.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Voltar</button>
                    <button onClick={handleFinalizarImportacao} disabled={loading} className="px-6 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 shadow flex items-center gap-2">
                      {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Confirmar Importação
                    </button>
                  </div>
                </div>

                {loading && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-center mt-1 text-gray-500">Enviando... {progress}%</p>
                  </div>
                )}

                <div className="flex-1 overflow-auto border rounded-lg">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Status Imagem</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Custo / Venda (Calc)</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Imagem Encontrada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {produtosProcessados.map((prod) => (
                        <tr key={prod.tempId} className="hover:bg-gray-50">
                          <td className="p-3">
                            {prod.imageFile ? (
                              <span className={`flex items-center gap-1 font-bold ${prod.confidence === 1 ? 'text-green-600' : 'text-orange-500'}`}>
                                {prod.confidence === 1 ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                                {prod.confidence === 1 ? 'Exato' : 'Fuzzy'}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Sem Imagem</span>
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-gray-800">{prod.name}</p>
                            <p className="text-xs text-gray-500">{prod.category}</p>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">C: R$ {prod.costPrice.toFixed(2)}</span>
                              <span className="font-bold text-green-700">V: R$ {prod.salePrice.toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs">{prod.code}</td>
                          <td className="p-3 text-xs text-blue-600 truncate max-w-[200px]">
                            {prod.imageMatchName || '-'}
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