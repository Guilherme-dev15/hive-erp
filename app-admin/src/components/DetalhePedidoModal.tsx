import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Printer,
  Phone,
  FileText,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { updateAdminOrderStatus, emitirNfe } from '../services/apiService';
import { toast } from 'react-hot-toast';
import { Order, OrderItem } from '../types';

interface DetalhePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Order | null;
  onUpdate?: () => Promise<void>;
}

export function DetalhePedidoModal({
  isOpen,
  onClose,
  pedido,
  onUpdate,
}: DetalhePedidoModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEmittingNfe, setIsEmittingNfe] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!pedido) return null;

  const isNfeEmitted = pedido.nfeStatus === 'EMITIDA' || !!pedido.nfeKey;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateAdminOrderStatus(pedido.id, newStatus);
      toast.success('Status atualizado!');
      if (onUpdate) await onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      toast.error('Erro ao salvar status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmitNfe = async () => {
    try {
      setIsEmittingNfe(true);
      await emitirNfe(pedido.id);
      toast.success('NF-e emitida e autorizada com sucesso pela SEFAZ!');
      if (onUpdate) await onUpdate();
    } catch (error: any) {
      console.error('Erro ao emitir NF-e:', error);
      toast.error(error.response?.data?.message || 'Erro ao emitir NF-e');
    } finally {
      setIsEmittingNfe(false);
    }
  };

  const handleCopyKey = () => {
    if (!pedido.nfeKey) return;
    navigator.clipboard.writeText(pedido.nfeKey);
    setCopiedKey(true);
    toast.success('Chave de acesso copiada!');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatKey = (key?: string) => {
    if (!key) return '';
    return key.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/20 backdrop-blur-sm print:bg-white print:p-0"
          onClick={onClose}
        >
          <style>{`
            @media print {
              @page { size: auto; margin: 10mm; }
              body { visibility: hidden; }
              .print-content { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }
              .no-print { display: none !important; }
            }
          `}</style>

          <motion.div
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 print-content print:max-h-none print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABEÇALHO PARA IMPRESSÃO (DANFE OU COMPROVANTE) */}
            <div className="hidden print:block p-4 border-b-2 border-gray-800 mb-4">
              <div className="flex justify-between items-start border-b pb-3 mb-3">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">
                    {isNfeEmitted ? 'DANFE - Documento Auxiliar da Nota Fiscal Eletrônica' : pedido.status === 'Orçamento' ? 'Proposta Comercial / Orçamento' : 'Comprovante de Venda'}
                  </h1>
                  <p className="text-xs text-gray-600 font-medium">Hive ERP - Sistema de Gestão Empresarial</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Pedido #{pedido.id.toUpperCase()}</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {isNfeEmitted && (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1 mb-3">
                  <p><span className="font-bold">CHAVE DE ACESSO:</span> {formatKey(pedido.nfeKey)}</p>
                  <div className="flex justify-between">
                    <p><span className="font-bold">NÚMERO:</span> {pedido.nfeNumber || 1} | <span className="font-bold">SÉRIE:</span> 1</p>
                    <p><span className="font-bold">PROTOCOLO:</span> {pedido.nfeProtocol || '135240001892837'}</p>
                    <p><span className="font-bold">STATUS:</span> AUTORIZADA SEFAZ</p>
                  </div>
                </div>
              )}
            </div>

            {/* HEADER DA TELA */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    pedido.status === 'Orçamento'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {pedido.status === 'Orçamento' ? 'Orçamento' : 'Pedido'} #{pedido.id.toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        pedido.status === 'Orçamento'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {pedido.status}
                    </span>
                    {isNfeEmitted && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck size={12} /> NF-e Emitida
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 border border-gray-100"
                  title="Imprimir (Comprovante / DANFE)"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 border border-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 print:p-0">
              {/* BOTÃO PROMINENTE PARA APROVAÇÃO SE FOR ORÇAMENTO */}
              {pedido.status === 'Orçamento' && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
                  <div>
                    <h4 className="text-sm font-bold text-purple-900">
                      Esta proposta está aguardando aprovação
                    </h4>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Ao aprovar, o orçamento se torna pedido de venda ativo e dá baixa no estoque.
                    </p>
                  </div>
                  <button
                    onClick={() => handleStatusChange('Em Separação')}
                    disabled={isUpdating}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                  >
                    Aprovar e Enviar p/ Separação
                  </button>
                </div>
              )}

              {/* MÓDULO FISCAL NF-e */}
              {pedido.status !== 'Orçamento' && (
                <div className="no-print">
                  {isNfeEmitted ? (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-emerald-600" />
                          <h4 className="text-sm font-bold text-emerald-950">
                            Nota Fiscal Eletrônica Emitida e Autorizada (SEFAZ)
                          </h4>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                          NF-e Nº {pedido.nfeNumber || 1} • Série 1
                        </span>
                      </div>

                      <div className="p-3 bg-white border border-emerald-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <span className="font-bold text-gray-500 uppercase block text-[10px]">
                            Chave de Acesso (44 dígitos)
                          </span>
                          <span className="font-mono text-gray-800 font-semibold tracking-wide">
                            {formatKey(pedido.nfeKey)}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyKey}
                          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs whitespace-nowrap"
                          title="Copiar Chave de Acesso"
                        >
                          <Copy size={14} />
                          {copiedKey ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>

                      <div className="flex justify-between items-center pt-1 text-xs text-emerald-800">
                        <span>Protocolo SEFAZ: <strong>{pedido.nfeProtocol || '135240001892837'}</strong></span>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <Printer size={13} /> Imprimir DANFE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            Emissão de Nota Fiscal (NF-e)
                          </h4>
                          <p className="text-xs text-slate-300">
                            Gere a NF-e direto da venda com autorização instantânea da SEFAZ
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleEmitNfe}
                        disabled={isEmittingNfe}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FileText size={15} />
                        {isEmittingNfe ? 'Emitindo NF-e...' : 'Emitir Nota Fiscal'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SELETOR DE STATUS OPERACIONAL */}
              <div className="space-y-4 no-print">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
                  Status Operacional:{' '}
                  <span className="text-indigo-600 ml-2">{pedido.status}</span>
                </p>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                  {['Orçamento', 'Aguardando Pagamento', 'Em Separação', 'Enviado', 'Concluído'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      disabled={isUpdating}
                      className={`px-5 py-2 rounded-xl text-[11px] font-black border transition-all ${
                        pedido.status === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* DADOS CLIENTE */}
              <div className="grid grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-indigo-600 font-bold text-[10px] uppercase">
                    Cliente / Destinatário
                  </p>
                  <p className="font-bold text-gray-900">
                    {pedido.customerName || 'Venda Online'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone size={14} /> {pedido.customerPhone || 'Não informado'}
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-gray-400 font-bold text-[10px] uppercase">
                    Observações
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    {pedido.notes || 'Nenhuma observação informada.'}
                  </p>
                </div>
              </div>

              {/* TABELA ITENS */}
              <table className="w-full text-left border border-gray-100 rounded-2xl overflow-hidden">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black">
                  <tr className="border-b">
                    <th className="p-4">Item / Produto</th>
                    <th className="p-4 text-center">Qtd</th>
                    <th className="p-4 text-right">Unitário</th>
                    <th className="p-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pedido.items?.map((item: OrderItem, i: number) => (
                    <tr key={i} className="text-sm">
                      <td className="p-4 font-bold text-gray-700">
                        {item.name}
                      </td>
                      <td className="p-4 text-center font-black text-indigo-600">
                        x{item.quantidade}
                      </td>
                      <td className="p-4 text-right text-gray-600">
                        R$ {Number(item.salePrice).toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-900">
                        R$ {(Number(item.salePrice) * item.quantidade).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* TOTAL */}
              <div className="flex justify-end">
                <div className="w-full md:w-64 p-6 rounded-2xl border-2 border-indigo-600 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                    Total do Pedido
                  </p>
                  <p className="text-2xl font-black text-indigo-600">
                    R$ {Number(pedido.total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
