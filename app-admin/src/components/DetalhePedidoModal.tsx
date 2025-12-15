import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Package, Calendar, FileText } from 'lucide-react';
import { type Order } from '../types';

interface DetalhePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Order | null;
}

// Utilitários de Formatação
const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (timestamp: any) => {
  if (!timestamp || !timestamp.seconds) return '-';
  return new Date(timestamp.seconds * 1000).toLocaleString('pt-BR');
};

export function DetalhePedidoModal({ isOpen, onClose, pedido }: DetalhePedidoModalProps) {
  if (!pedido) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-50 border-b p-5 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  Pedido #{pedido.id.substring(0, 5).toUpperCase()}
                </h2>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={12}/> {formatDate(pedido.createdAt)}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Status e Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                    <User size={16}/> Cliente
                  </h3>
                  <div className="space-y-1">
                    {/* CAMPO CORRIGIDO: customerName */}
                    <p className="text-gray-900 font-bold text-lg">{pedido.customerName || 'Nome não informado'}</p>
                    {/* CAMPO CORRIGIDO: customerPhone */}
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Phone size={14}/> 
                      {pedido.customerPhone ? (
                        <a href={`https://wa.me/${pedido.customerPhone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-600">
                          {pedido.customerPhone}
                        </a>
                      ) : '-'}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 flex items-center gap-2">
                    <FileText size={16}/> Observações
                  </h3>
                  {/* CAMPO CORRIGIDO: notes */}
                  <p className="text-sm text-gray-600 italic">
                    {pedido.notes || "Nenhuma observação feita pelo cliente."}
                  </p>
                </div>
              </div>

              {/* Lista de Itens */}
              <div>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Package size={18} className="text-dourado"/> Itens do Pedido
                </h3>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3 text-center">Qtd</th>
                        <th className="px-4 py-3 text-right">Unitário</th>
                        <th className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedido.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{item.code || '-'}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-bold">{item.quantidade}</td>
                          <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.salePrice)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">
                            {formatCurrency(item.salePrice * item.quantidade)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais Financeiros */}
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                  <div className="flex justify-between text-gray-500 text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(pedido.subtotal || 0)}</span>
                  </div>
                  
                  {/* CAMPO CORRIGIDO: discount */}
                  {(pedido.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600 text-sm font-medium">
                      <span>Desconto</span>
                      <span>- {formatCurrency(pedido.discount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-gray-900 text-xl font-extrabold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(pedido.total || 0)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t flex justify-end">
              <button 
                onClick={onClose} 
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}