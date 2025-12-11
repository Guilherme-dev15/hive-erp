import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clipboard, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../services/apiService';

interface ImportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

export function ImportacaoModal({ isOpen, onClose, onSucesso }: ImportacaoModalProps) {
  const [step, setStep] = useState(1); // 1: Colar, 2: Revisar
  const [textData, setTextData] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Função que processa o texto colado (Tab Separated Values)
  const processarTexto = () => {
    if (!textData.trim()) return toast.error("Cole os dados primeiro.");

    // Divide por linhas
    const rows = textData.trim().split('\n');
    
    // Mapeia as colunas (assume ordem: Nome | Custo | Quantidade | Categoria)
    const produtos = rows.map(row => {
      // Divide por TAB (que é o padrão do Excel/Sheets quando copia)
      const cols = row.split('\t');
      
      // Se tiver poucas colunas, tenta dividir por ponto e vírgula ou vírgula
      const finalCols = cols.length > 1 ? cols : row.split(/[;,]/);

      return {
        name: finalCols[0]?.trim() || 'Produto Sem Nome',
        costPrice: finalCols[1]?.replace('R$', '').replace(',', '.').trim(),
        quantity: finalCols[2]?.trim() || '0',
        category: finalCols[3]?.trim() || 'Geral',
        // Opcionais
        code: finalCols[4]?.trim() || '',
      };
    });

    // Filtra linhas vazias ou cabeçalhos acidentais (se o custo não for numero)
    const validos = produtos.filter(p => !isNaN(parseFloat(p.costPrice)));

    if (validos.length === 0) {
      return toast.error("Não consegui ler os dados. Verifique o formato.");
    }

    setParsedData(validos);
    setStep(2);
  };

  const enviarImportacao = async () => {
    setLoading(true);
    try {
      await apiClient.post('/admin/products/bulk', parsedData);
      toast.success(`${parsedData.length} produtos importados!`);
      onSucesso();
      handleClose();
    } catch (error) {
      toast.error("Erro ao salvar produtos.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setTextData('');
    setParsedData([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-carvao p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <Clipboard className="text-dourado" size={24}/> Importação Rápida
            </h3>
            <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={20}/></button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden p-6 bg-gray-50 flex flex-col">
            
            {/* ETAPA 1: COLAR */}
            {step === 1 && (
              <div className="flex flex-col h-full gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                   <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                   <div>
                     <p className="text-sm text-blue-900 font-bold">Como funciona?</p>
                     <p className="text-sm text-blue-800 mt-1">
                       Vá ao seu Excel ou Google Sheets, selecione as colunas na ordem: <br/>
                       <strong>Nome | Custo | Quantidade | Categoria</strong>.
                       Copie (Ctrl+C) e cole abaixo (Ctrl+V).
                     </p>
                   </div>
                </div>

                <textarea
                  value={textData}
                  onChange={e => setTextData(e.target.value)}
                  placeholder={`Exemplo:\nAnel Prata Coração  25.00  10  Anéis\nColar Veneziana     15.50  5   Colares`}
                  className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dourado outline-none font-mono text-sm resize-none"
                />

                <div className="flex justify-end">
                   <button 
                     onClick={processarTexto}
                     disabled={!textData}
                     className="bg-carvao text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                   >
                     Processar Dados <ArrowRight size={18} />
                   </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: REVISAR */}
            {step === 2 && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-700">Revisão ({parsedData.length} produtos)</h3>
                  <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-carvao underline">Voltar e corrigir</button>
                </div>

                <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-3 border-b">Nome</th>
                        <th className="p-3 border-b">Categoria</th>
                        <th className="p-3 border-b text-right">Custo</th>
                        <th className="p-3 border-b text-center">Qtd</th>
                        <th className="p-3 border-b text-right">Venda Sugerida (2x)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3">{prod.name}</td>
                          <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{prod.category}</span></td>
                          <td className="p-3 text-right">R$ {prod.costPrice}</td>
                          <td className="p-3 text-center">{prod.quantity}</td>
                          <td className="p-3 text-right text-green-600 font-bold">
                             R$ {(parseFloat(prod.costPrice) * 2).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                   <button 
                     onClick={enviarImportacao}
                     disabled={loading}
                     className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg flex items-center gap-2"
                   >
                     {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} 
                     Confirmar Importação
                   </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}