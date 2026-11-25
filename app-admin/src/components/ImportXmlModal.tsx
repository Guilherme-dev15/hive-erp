import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  X,
  Upload,
  Building2,
  PackageCheck,
  Loader2,
  Save,
  Trash2,
  DollarSign,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import {
  importProductsBulk,
  getFornecedores,
  createAdminProduto,
  apiClient,
} from '../services/apiService';
import { Fornecedor } from '../types';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

interface ImportXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemXml {
  tempId: string;
  code: string;
  name: string;
  ncm: string;
  unit: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  markup: number;
}

export function ImportXmlModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportXmlModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);

  // Dados extraídos do XML
  const [nfeNumber, setNfeNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCnpj, setSupplierCnpj] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [totalNfe, setTotalNfe] = useState(0);
  const [items, setItems] = useState<ItemXml[]>([]);
  const [globalMarkup, setGlobalMarkup] = useState<number>(100); // 100% markup default
  const [createPayable, setCreatePayable] = useState(true);

  useEffect(() => {
    if (isOpen) {
      getFornecedores().then(setSuppliers).catch(console.error);
      setStep('upload');
      setItems([]);
      setNfeNumber('');
      setSupplierName('');
      setSupplierCnpj('');
      setSelectedSupplierId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleXmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Validação básica se é uma NF-e
        const isNfe = xmlDoc.getElementsByTagName('NFe').length > 0 || xmlDoc.getElementsByTagName('nfeProc').length > 0;
        if (!isNfe) {
          toast.error('O arquivo selecionado não parece ser um XML de NF-e válido.');
          return;
        }

        // Dados de Identificação da NF-e
        const nNF = xmlDoc.getElementsByTagName('nNF')[0]?.textContent || '';
        setNfeNumber(nNF);

        // Dados do Emitente (Fornecedor)
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        const emitNome = emit?.getElementsByTagName('xNome')[0]?.textContent || '';
        const emitCnpj = emit?.getElementsByTagName('CNPJ')[0]?.textContent || '';
        setSupplierName(emitNome);
        setSupplierCnpj(emitCnpj);

        // Tenta achar fornecedor correspondente na base
        const matchedSup = suppliers.find(
          (s) =>
            (s.name && emitNome.toLowerCase().includes(s.name.toLowerCase())) ||
            (s.pixKey && s.pixKey.includes(emitCnpj))
        );
        if (matchedSup) setSelectedSupplierId(matchedSup.id);

        // Itens da Nota
        const detList = xmlDoc.getElementsByTagName('det');
        const parsedItems: ItemXml[] = [];
        let totalNota = 0;

        for (let i = 0; i < detList.length; i++) {
          const prod = detList[i].getElementsByTagName('prod')[0];
          if (!prod) continue;

          const code = prod.getElementsByTagName('cProd')[0]?.textContent || `ITEM-${i + 1}`;
          const name = prod.getElementsByTagName('xProd')[0]?.textContent || 'Produto Importado';
          const ncm = prod.getElementsByTagName('NCM')[0]?.textContent || '';
          const unit = prod.getElementsByTagName('uCom')[0]?.textContent || 'UN';
          const qty = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '1');
          const cost = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0');
          const vProd = parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0');

          totalNota += vProd;

          // Preço de venda sugerido com markup inicial de 100%
          const sale = parseFloat((cost * (1 + globalMarkup / 100)).toFixed(2));

          parsedItems.push({
            tempId: `xml-item-${i}-${Date.now()}`,
            code,
            name,
            ncm,
            unit,
            quantity: qty,
            costPrice: cost,
            salePrice: sale,
            markup: globalMarkup,
          });
        }

        setTotalNfe(totalNota);
        setItems(parsedItems);
        setStep('review');
        toast.success(`NF-e #${nNF} carregada: ${parsedItems.length} itens identificados!`);
      } catch (err) {
        console.error('Erro ao ler XML:', err);
        toast.error('Erro ao processar o arquivo XML da NF-e.');
      }
    };
    reader.readAsText(file);
  };

  const applyGlobalMarkup = (mk: number) => {
    setGlobalMarkup(mk);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        markup: mk,
        salePrice: parseFloat((item.costPrice * (1 + mk / 100)).toFixed(2)),
      }))
    );
  };

  const updateItem = (tempId: string, field: keyof ItemXml, val: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.tempId !== tempId) return i;
        const updated = { ...i, [field]: val };
        if (field === 'salePrice') {
          const sale = parseFloat(val) || 0;
          if (updated.costPrice > 0) {
            updated.markup = parseFloat((((sale - updated.costPrice) / updated.costPrice) * 100).toFixed(1));
          }
        }
        return updated;
      })
    );
  };

  const handleFinalSave = async () => {
    if (items.length === 0) return;

    try {
      setLoading(true);

      // Prepara payload de produtos
      const payload = items.map((item) => ({
        code: item.code,
        name: item.name,
        costPrice: item.costPrice,
        salePrice: item.salePrice,
        quantity: item.quantity,
        supplierId: selectedSupplierId || undefined,
        status: 'ativo' as const,
      }));

      // Salva ou atualiza os produtos no catálogo
      const res = await importProductsBulk(payload);

      // Se solicitado, registra automaticamente a Conta a Pagar correspondente à NF-e
      if (createPayable && totalNfe > 0) {
        try {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30); // 30 dias padrão

          await apiClient.post('/api/v2/transactions', {
            type: 'DESPESA',
            date: new Date().toISOString(),
            dueDate: dueDate.toISOString(),
            amount: totalNfe,
            description: `NF-e #${nfeNumber || 'S/N'} - Fornecedor: ${supplierName || 'Fornecedor XML'}`,
            category: 'Mercadoria / Fornecedores',
            status: 'PENDENTE',
          });
        } catch (txErr) {
          console.error('Erro ao gerar conta a pagar:', txErr);
        }
      }

      toast.success(`Entrada de estoque concluída! ${res.count} produtos atualizados.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro na entrada de estoque por XML:', err);
      toast.error('Erro ao efetuar entrada no estoque.');
    } finally {
      setLoading(false);
    }
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
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                <FileCode size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Entrada de Estoque por XML (NF-e)
                </h2>
                <p className="text-xs text-gray-500">
                  Importe notas fiscais de fornecedores com atualização automática de saldo e custo
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

          <div className="p-6 overflow-y-auto flex-1">
            {step === 'upload' ? (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 sm:p-14 text-center hover:border-indigo-500 transition-colors bg-gray-50/50">
                  <Upload className="mx-auto text-indigo-600 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Selecione o arquivo XML da Nota Fiscal Eletrônica
                  </h3>
                  <p className="text-xs text-gray-500 mb-6 max-w-md mx-auto">
                    O Hive ERP lê os produtos, quantidades e preços de custo direto do arquivo da SEFAZ
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all">
                    <FileCode size={18} />
                    Selecionar Arquivo .XML
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleXmlUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo da NF-e */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                  <div>
                    <span className="font-bold text-gray-500 uppercase block text-[10px]">Nota Fiscal</span>
                    <span className="font-black text-gray-900 text-sm">#{nfeNumber || 'Sem número'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 uppercase block text-[10px]">Fornecedor</span>
                    <span className="font-bold text-gray-800 truncate block">{supplierName || 'Identificado no XML'}</span>
                    <span className="text-gray-400 text-[10px]">{supplierCnpj}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-500 uppercase block text-[10px]">Total da NF-e</span>
                    <span className="font-black text-indigo-600 text-sm">{formatCurrency(totalNfe)}</span>
                  </div>
                </div>

                {/* Controles de Markup em Massa */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Percent size={16} /> Markup Sugerido Geral (%):
                    <input
                      type="number"
                      value={globalMarkup}
                      onChange={(e) => applyGlobalMarkup(parseFloat(e.target.value) || 0)}
                      className="w-20 bg-white border border-amber-300 rounded-lg px-2 py-1 text-center font-bold text-gray-800"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={createPayable}
                      onChange={(e) => setCreatePayable(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    Lançar Conta a Pagar automática no Financeiro ({formatCurrency(totalNfe)})
                  </label>
                </div>

                {/* Tabela de Produtos do XML */}
                <div className="overflow-x-auto border border-gray-100 rounded-2xl max-h-[40vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="p-3">Código</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-center">Entrada (Qtd)</th>
                        <th className="p-3 text-right">Custo Unit.</th>
                        <th className="p-3 text-right">Markup</th>
                        <th className="p-3 text-right">Preço de Venda</th>
                        <th className="p-3 text-center">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((it) => (
                        <tr key={it.tempId} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono text-gray-600">{it.code}</td>
                          <td className="p-3 font-bold text-gray-800 max-w-xs truncate">{it.name}</td>
                          <td className="p-3 text-center font-bold text-indigo-600">+{it.quantity}</td>
                          <td className="p-3 text-right text-gray-600">{formatCurrency(it.costPrice)}</td>
                          <td className="p-3 text-right">
                            <span className="px-2 py-0.5 bg-gray-100 rounded font-semibold text-gray-700">
                              {it.markup}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={it.salePrice}
                              onChange={(e) => updateItem(it.tempId, 'salePrice', e.target.value)}
                              className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-right font-bold text-gray-900"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setItems(items.filter((x) => x.tempId !== it.tempId))}
                              className="text-gray-400 hover:text-rose-600"
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
                disabled={loading || items.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <PackageCheck size={18} />
                )}
                Efetivar Entrada ({items.length} Itens)
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
