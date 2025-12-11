import React, { useState } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileSpreadsheet, Loader2, CheckCircle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../services/apiService'; // Certifique-se que exporta apiClient de lá ou use axios direto

interface ImportacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

export function ImportacaoModal({ isOpen, onClose, onSucesso }: ImportacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // 1. Função para Baixar o Modelo CSV
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,Codigo,Categoria,Custo,Venda,Estoque,Descricao\n" +
      "Anel Prata Solitário,AN001,Anéis,25.00,89.90,10,Anel lindo em prata 925\n" +
      "Corrente Veneziana,CR050,Colares,15.50,49.90,20,Corrente fina 45cm";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_importacao_hive.csv");
    document.body.appendChild(link);
    link.click();
  };

  // 2. Processar o Arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const dadosFormatados = results.data.map((row: any) => ({
            name: row['Nome'],
            code: row['Codigo'],
            category: row['Categoria'],
            costPrice: row['Custo'], // O Backend converte para float
            salePrice: row['Venda'],
            quantity: row['Estoque'],
            description: row['Descricao']
          }));

          // Validação Simples
          if (dadosFormatados.length === 0) throw new Error("Arquivo vazio ou formato inválido.");
          if (!dadosFormatados[0].name) throw new Error("Coluna 'Nome' não encontrada. Use o modelo.");

          // Enviar para API
          await apiClient.post('/admin/products/bulk', dadosFormatados);
          
          toast.success(`${dadosFormatados.length} produtos importados!`);
          onSucesso();
          onClose();
        } catch (error: any) {
          toast.error("Erro na importação: " + (error.message || "Verifique o arquivo."));
          console.error(error);
        } finally {
          setLoading(false);
          setFileName(null);
        }
      },
      error: (_error) => {
        toast.error("Erro ao ler CSV.");
        setLoading(false);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-carvao p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2"><FileSpreadsheet size={20}/> Importar Produtos</h3>
            <button onClick={onClose}><X size={20}/></button>
          </div>

          <div className="p-8 text-center space-y-6">
            
            {/* Passo 1: Baixar Modelo */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left">
              <p className="text-sm text-blue-800 font-bold mb-2">1º Passo: Baixe a planilha modelo</p>
              <p className="text-xs text-blue-600 mb-3">Preencha os dados mantendo o cabeçalho. Salve como CSV.</p>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 text-xs bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Download size={14}/> Download Modelo.csv
              </button>
            </div>

            {/* Passo 2: Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 transition-colors hover:border-dourado hover:bg-gray-50 relative">
              {loading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="animate-spin text-dourado mb-2" size={40} />
                  <p className="text-sm text-gray-500">A processar produtos...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="font-bold text-gray-700">Clique para selecionar o CSV</p>
                  <p className="text-xs text-gray-400 mt-1">ou arraste o arquivo aqui</p>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>

            {fileName && !loading && (
              <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm">
                <CheckCircle size={16} /> Arquivo selecionado: {fileName}
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}