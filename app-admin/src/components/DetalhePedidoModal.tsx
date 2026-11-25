import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Printer,
  Phone,
  FileText,
  FileCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { updateAdminOrderStatus, emitirNfe } from '../services/apiService';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format';
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
  const [currentPedido, setCurrentPedido] = useState<Order | null>(pedido);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEmittingNfe, setIsEmittingNfe] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [printDocType, setPrintDocType] = useState<'COMPROVANTE' | 'DECLARACAO'>('COMPROVANTE');
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState<'COMPROVANTE' | 'DECLARACAO'>('COMPROVANTE');

  useEffect(() => {
    setCurrentPedido(pedido);
  }, [pedido]);

  const activePedido = currentPedido || pedido;
  if (!activePedido) return null;

  const isNfeEmitted =
    activePedido.nfeStatus === 'EMITIDA' ||
    activePedido.nfeStatus === 'AUTORIZADA' ||
    Boolean(activePedido.nfeKey);

  const handleStatusChange = async (newStatus: string) => {
    if (activePedido.status === newStatus) return;
    try {
      setIsUpdating(true);
      await updateAdminOrderStatus(activePedido.id, newStatus);
      setCurrentPedido((prev) => (prev ? { ...prev, status: newStatus as any } : prev));
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
      const updated = await emitirNfe(activePedido.id);
      if (updated && updated.id) {
        setCurrentPedido(updated);
      }
      toast.success('Comprovante sequencial registrado com sucesso!');
      if (onUpdate) await onUpdate();
    } catch (error: any) {
      console.error('Erro ao registrar comprovante:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar comprovante');
    } finally {
      setIsEmittingNfe(false);
    }
  };

  const handlePrint = (type: 'COMPROVANTE' | 'DECLARACAO') => {
    setPrintDocType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyKey = () => {
    if (!activePedido.nfeKey) return;
    navigator.clipboard.writeText(activePedido.nfeKey);
    setCopiedKey(true);
    toast.success('Código do comprovante copiado!');
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
            {/* CABEÇALHO PARA IMPRESSÃO */}
            <div className="hidden print:block p-4 border-b-2 border-gray-800 mb-4">
              {printDocType === 'DECLARACAO' ? (
                <div>
                  <div className="text-center border-b pb-2 mb-3">
                    <h1 className="text-xl font-black uppercase tracking-tight">
                      DECLARAÇÃO DE CONTEÚDO
                    </h1>
                    <p className="text-[10px] text-gray-500">
                      Conforme regulamentação postal e tributária nacional para transporte de encomendas
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs border p-3 rounded mb-3">
                    <div>
                      <p className="font-bold text-[10px] uppercase text-gray-500 mb-1">1. Remetente</p>
                      <p className="font-bold">Loja Oficial Hive ERP</p>
                      <p className="text-gray-600">Comprovante de Venda Interno</p>
                    </div>
                    <div>
                      <p className="font-bold text-[10px] uppercase text-gray-500 mb-1">2. Destinatário</p>
                      <p className="font-bold">{activePedido.customerName || 'Consumidor Final'}</p>
                      <p className="text-gray-600">{activePedido.customerPhone || 'Telefone não informado'}</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50 border rounded text-[10px] text-gray-600 mb-3 leading-tight">
                    <strong>Declaração do Remetente:</strong> Declaro sob as penas da lei que não me enquadro no conceito de contribuinte do ICMS e que a presente remessa de bens não constitui fato gerador do referido imposto, sendo o transporte destinado ao consumidor final.
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start border-b pb-3 mb-3">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-tight">
                      {activePedido.status === 'Orçamento' ? 'PROPOSTA COMERCIAL / ORÇAMENTO' : 'COMPROVANTE DE VENDA & RECIBO'}
                    </h1>
                    <p className="text-xs text-gray-600 font-medium">Hive ERP - Sistema de Gestão Empresarial</p>
                    {isNfeEmitted && (
                      <p className="text-xs text-indigo-700 font-bold mt-1">
                        Comprovante Registrado Nº {activePedido.nfeNumber || 1} • {activePedido.nfeProtocol || 'AUT'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">Pedido #{activePedido.id.toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* HEADER DA TELA */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    activePedido.status === 'Orçamento'
                      ? 'bg-purple-50 text-purple-700'
                      : 'bg-indigo-50 text-indigo-600'
                  }`}
                >
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {activePedido.status === 'Orçamento' ? 'Orçamento' : 'Pedido'} #{activePedido.id.toUpperCase()}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        activePedido.status === 'Orçamento'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {activePedido.status}
                    </span>
                    {isNfeEmitted && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <ShieldCheck size={12} /> Comprovante Nº {activePedido.nfeNumber || 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint('COMPROVANTE')}
                  className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 border border-gray-100"
                  title="Imprimir Comprovante de Venda"
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
              {activePedido.status === 'Orçamento' && (
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

              {/* MÓDULO DE DOCUMENTOS DE VENDA & ENVIO (SEM CUSTO & OPCIONAL) */}
              {activePedido.status !== 'Orçamento' && (
                <div className="no-print">
                  <div className="p-5 bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-gray-200/80 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">
                              Documentos de Venda & Envio
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                              Sem Custo • Opcional
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {isNfeEmitted
                              ? `Comprovante registrado Nº ${activePedido.nfeNumber || 1} • Código: ${activePedido.nfeProtocol || 'AUT'}`
                              : 'Emita comprovante de venda para o cliente ou declaração para Correios / transportadoras'}
                          </p>
                        </div>
                      </div>

                      {!isNfeEmitted && (
                        <button
                          onClick={handleEmitNfe}
                          disabled={isEmittingNfe}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
                          title="Registrar número sequencial de comprovante para este pedido"
                        >
                          <FileCheck size={14} />
                          {isEmittingNfe ? 'Registrando...' : 'Registrar Comprovante'}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60">
                      <button
                        type="button"
                        onClick={() => handlePrint('COMPROVANTE')}
                        className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Printer size={14} className="text-indigo-600" />
                        Imprimir Comprovante de Venda
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrint('DECLARACAO')}
                        className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Package size={14} className="text-amber-600" />
                        Imprimir Declaração de Conteúdo (Envios)
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="px-3 py-2 text-indigo-600 hover:text-indigo-800 font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye size={14} />
                        {showPreview ? 'Ocultar Prévia' : 'Visualizar na Tela'}
                      </button>
                    </div>

                    {/* PRÉVIA VISUAL NA TELA */}
                    {showPreview && (
                      <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 font-mono text-xs shadow-sm">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewType('COMPROVANTE')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold ${previewType === 'COMPROVANTE' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                              Comprovante
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewType('DECLARACAO')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold ${previewType === 'DECLARACAO' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                              Declaração de Conteúdo
                            </button>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            Prévia do Documento
                          </span>
                        </div>

                        {previewType === 'DECLARACAO' ? (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded text-[11px]">
                              <p className="font-bold text-amber-900">DECLARAÇÃO DE CONTEÚDO (TRANSPORTE POSTAL)</p>
                              <p className="text-[10px] text-amber-800">Modelo oficial regulamentado aceito por Correios, Jadlog, Loggi e transportadoras.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="border p-2 rounded">
                                <span className="text-gray-400 text-[9px] block font-bold uppercase">Remetente</span>
                                <span className="font-bold text-gray-800">Hive ERP / Loja</span>
                              </div>
                              <div className="border p-2 rounded">
                                <span className="text-gray-400 text-[9px] block font-bold uppercase">Destinatário</span>
                                <span className="font-bold text-gray-800">{activePedido.customerName || 'Consumidor Final'}</span>
                                <span className="text-gray-500 block text-[10px]">{activePedido.customerPhone || 'Tel não informado'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-gray-800">Comprovante de Venda #{activePedido.id.toUpperCase()}</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(activePedido.total ?? 0)}</span>
                            </div>
                            <p className="text-[10px] text-gray-500">Recibo detalhado para entrega ao cliente com relação de itens e garantia da loja.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SELETOR DE STATUS OPERACIONAL */}
              <div className="space-y-4 no-print">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">
                  Logística:{' '}
                  <span className="text-indigo-600 ml-2 font-bold">{activePedido.status}</span>
                </p>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                  {[
                    'Orçamento',
                    'Aguardando Pagamento',
                    'Em Produção',
                    'Em Separação',
                    'Enviado',
                    'Concluído',
                    'Cancelado',
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st)}
                      disabled={isUpdating}
                      className={`px-4 py-2 rounded-xl text-[11px] font-black border transition-all ${
                        activePedido.status === st
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
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
                    {activePedido.customerName || 'Venda Online'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone size={14} /> {activePedido.customerPhone || 'Não informado'}
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-gray-400 font-bold text-[10px] uppercase">
                    Observações
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    {activePedido.notes || 'Nenhuma observação informada.'}
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
                  {(Array.isArray(activePedido?.items) ? activePedido.items : []).map((item: any, i: number) => {
                    const qty = Number(item.quantity ?? item.quantidade ?? 1);
                    const price = Number(item.salePrice || 0);
                    const lineTotal = price * qty;
                    return (
                      <tr key={i} className="text-sm">
                        <td className="p-4 font-bold text-gray-700">
                          {item.name}
                        </td>
                        <td className="p-4 text-center font-black text-indigo-600">
                          x{qty}
                        </td>
                        <td className="p-4 text-right text-gray-600">
                          {formatCurrency(price)}
                        </td>
                        <td className="p-4 text-right font-bold text-gray-900">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* TOTAL */}
              <div className="flex justify-end">
                <div className="w-full md:w-64 p-6 rounded-2xl border-2 border-indigo-600 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                    Total do Pedido
                  </p>
                  <p className="text-2xl font-black text-indigo-600">
                    {formatCurrency(activePedido.total ?? 0)}
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
