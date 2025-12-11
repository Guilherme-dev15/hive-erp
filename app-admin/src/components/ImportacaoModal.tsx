import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clipboard, ArrowRight, Loader2, CheckCircle, Download, FileSpreadsheet } from 'lucide-react';
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

  // --- NOVO: GERAR MODELO PARA O CLIENTE ---
  const downloadModelo = () => {
    // Cabeçalho + 2 Exemplos para o cliente entender
    const csvContent = 
      "Nome\tCusto\tQuantidade\tCategoria\tCodigo (Opcional)\n" + 
      "Anel Solitário Prata\t25,00\t10\tAnéis\tAN001\n" +
      "Corrente Veneziana\t15,50\t5\tColares\t\n" + 
      "Brinco Zircônia\t8,90\t20\tBrincos\tBR050";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_hive.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função que processa o texto colado
  const processarTexto = () => {
    if (!textData.trim()) return toast.error("Cole os dados primeiro.");

    const rows = textData.trim().split('\n');
    
    const produtos = rows.map(row => {
      // Tenta dividir por TAB (Excel) ou Ponto e Vírgula (CSV)
      let cols = row.split('\t');
      if (cols.length < 2) cols = row.split(';'); 
      if (cols.length < 2) cols = row.split(',');

      // Se for a linha de cabeçalho (contém "Nome" ou "Custo"), ignora
      if (cols[0]?.toLowerCase().includes('nome') || cols[1]?.toLowerCase().includes('custo')) {
          return null;
      }

      return {
        name: cols[0]?.trim() || 'Produto Sem Nome',
        costPrice: cols[1]?.replace('R$', '').replace(',', '.').trim(),
        quantity: cols[2]?.trim() || '0',
        category: cols[3]?.trim() || 'Geral',
        code: cols[4]?.trim() || '',
      };
    }).filter(Boolean); // Remove os nulos (cabeçalhos)

    // Filtra linhas inválidas onde o custo não é número
    const validos = produtos.filter(p => p && !isNaN(parseFloat(p.costPrice)));

    if (validos.length === 0) {
      return toast.error("Formato não reconhecido. Use o modelo.");
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-carvao p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <Clipboard className="text-dourado" size={24}/> Importação em Massa
            </h3>
            <button onClick={handleClose} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={20}/></button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-hidden p-6 bg-gray-50 flex flex-col">
            
            {/* ETAPA 1: COLAR */}
            {step === 1 && (
              <div className="flex flex-col h-full gap-4">
                
                {/* Instruções e Download */}
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-700 h-fit"><FileSpreadsheet size={24}/></div>
                        <div>
                          <h4 className="font-bold text-gray-800">Como importar?</h4>
                          <ol className="text-sm text-gray-600 list-decimal list-inside mt-1 space-y-1">
                            <li>Baixe a planilha de exemplo.</li>
                            <li>Preencha seus produtos no Excel ou Google Sheets.</li>
                            <li>Selecione as linhas, copie (Ctrl+C) e cole abaixo.</li>
                          </ol>
                        </div>
                      </div>
                      <button 
                        onClick={downloadModelo}
                        className="flex items-center gap-2 text-xs font-bold text-dourado border border-dourado px-4 py-2 rounded-lg hover:bg-yellow-50 transition-colors"
                      >
                        <Download size={14}/> Baixar Modelo
                      </button>
                   </div>
                </div>

                <div className="flex-1 relative group">
                  <textarea
                    value={textData}
                    onChange={e => setTextData(e.target.value)}
                    placeholder={`Cole seus dados aqui (Ctrl+V)...\n\nExemplo esperado:\nAnel Prata   25,00   10   Anéis`}
                    className="w-full h-full p-4 border-2 border-dashed border-gray-300 rounded-xl focus:border-dourado focus:ring-0 outline-none font-mono text-sm resize-none bg-white transition-all"
                  />
                  {!textData && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-400">
                       <span className="bg-white px-2 text-sm">Área de Colagem</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                   <button 
                     onClick={processarTexto}
                     disabled={!textData}
                     className="bg-carvao text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                   >
                     Analisar Dados <ArrowRight size={18} />
                   </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: REVISAR */}
            {step === 2 && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">Revisão</h3>
                    <p className="text-sm text-gray-500">{parsedData.length} produtos identificados.</p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-carvao underline">Voltar e corrigir</button>
                </div>

                <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white shadow-sm custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 border-b">Nome</th>
                        <th className="p-3 border-b">Categoria</th>
                        <th className="p-3 border-b text-right">Custo</th>
                        <th className="p-3 border-b text-center">Qtd</th>
                        <th className="p-3 border-b text-right bg-green-50 text-green-800">Venda (Sugerida)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.map((prod, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-medium text-gray-800">{prod.name}</td>
                          <td className="p-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-600">{prod.category}</span></td>
                          <td className="p-3 text-right text-gray-600">R$ {prod.costPrice}</td>
                          <td className="p-3 text-center font-mono">{prod.quantity}</td>
                          <td className="p-3 text-right font-bold text-green-600 bg-green-50/30">
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
                     className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                   >
                     {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} 
                     Confirmar e Importar
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