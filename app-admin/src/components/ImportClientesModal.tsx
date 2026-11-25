import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileSpreadsheet,
  Download,
  Loader2,
  Save,
  Trash2,
  UserCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { importCustomersBulk } from '../services/apiService';

interface ImportClientesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewCustomer {
  tempId: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city: string;
  state: string;
}

export function ImportClientesModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportClientesModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewCustomer[]>([]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        if (data.length === 0) {
          toast.error('A planilha está vazia.');
          return;
        }

        const processed: PreviewCustomer[] = data.map((row, index) => ({
          tempId: `cli-${index}-${Date.now()}`,
          name: row['Nome'] || row['Cliente'] || row['nome'] || row['Razão Social'] || `Cliente ${index + 1}`,
          email: row['Email'] || row['E-mail'] || row['email'] || '',
          phone: String(row['Telefone'] || row['WhatsApp'] || row['Celular'] || row['phone'] || ''),
          document: String(row['CPF'] || row['CNPJ'] || row['Documento'] || row['document'] || ''),
          city: row['Cidade'] || row['city'] || '',
          state: row['Estado'] || row['UF'] || row['state'] || '',
        }));

        setPreviewData(processed);
        setStep('review');
      } catch (err) {
        console.error('Erro ao ler planilha:', err);
        toast.error('Erro ao processar planilha Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Nome: 'Exemplo Cliente Silva',
        Email: 'cliente@exemplo.com',
        Telefone: '(11) 98765-4321',
        CPF: '123.456.789-00',
        Cidade: 'São Paulo',
        Estado: 'SP',
      },
      {
        Nome: 'Empresa Comercial Ltda',
        Email: 'contato@comercial.com',
        Telefone: '(21) 99999-8888',
        CPF: '12.345.678/0001-90',
        Cidade: 'Rio de Janeiro',
        Estado: 'RJ',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo_Clientes');
    XLSX.writeFile(wb, 'Modelo_Importacao_Clientes_HiveERP.xlsx');
  };

  const handleFinalSave = async () => {
    if (previewData.length === 0) return;

    try {
      setLoading(true);
      const res = await importCustomersBulk(previewData);
      toast.success(`${res.count} clientes importados com sucesso!`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao importar clientes:', err);
      toast.error('Erro ao salvar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const removeRow = (tempId: string) => {
    setPreviewData((prev) => prev.filter((c) => c.tempId !== tempId));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Importação de Clientes em Massa
                </h2>
                <p className="text-xs text-gray-500">
                  Suba sua base de clientes existente via Excel (.xlsx ou .csv)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {step === 'upload' ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 sm:p-12 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
                  <Upload className="mx-auto text-emerald-600 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Arraste ou selecione sua planilha
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Formatos suportados: .XLSX, .XLS ou .CSV
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
                    <FileSpreadsheet size={18} />
                    Selecionar Arquivo
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Download className="text-gray-400" size={20} />
                    <span className="text-xs font-semibold text-gray-700">
                      Não tem a planilha no padrão? Baixe nosso modelo pré-formatado
                    </span>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Baixar Modelo .XLSX
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">
                    {previewData.length} clientes identificados para importação
                  </span>
                  <button
                    onClick={() => setStep('upload')}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 underline"
                  >
                    Subir outro arquivo
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-2xl max-h-[50vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="p-3">Nome</th>
                        <th className="p-3">WhatsApp/Tel</th>
                        <th className="p-3">E-mail</th>
                        <th className="p-3">CPF/CNPJ</th>
                        <th className="p-3">Cidade/UF</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.map((item) => (
                        <tr key={item.tempId} className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-900">{item.name}</td>
                          <td className="p-3 text-gray-600">{item.phone || '-'}</td>
                          <td className="p-3 text-gray-600">{item.email || '-'}</td>
                          <td className="p-3 text-gray-600">{item.document || '-'}</td>
                          <td className="p-3 text-gray-600">
                            {item.city ? `${item.city}/${item.state}` : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeRow(item.tempId)}
                              className="text-gray-400 hover:text-rose-500"
                            >
                              <Trash2 size={15} />
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

          {/* Footer */}
          {step === 'review' && (
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <button
                onClick={() => setStep('upload')}
                className="text-sm font-bold text-gray-600 hover:text-gray-900"
              >
                Voltar
              </button>
              <button
                onClick={handleFinalSave}
                disabled={loading || previewData.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <UserCheck size={18} />
                )}
                Concluir Importação ({previewData.length})
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
