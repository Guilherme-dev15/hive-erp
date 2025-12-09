import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MessageCircle, Printer } from 'lucide-react';
import { type Order, type OrderLineItem } from '../types';
import { useReactToPrint } from 'react-to-print';

// Função Utilitária Blindada
const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface DetalhePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Order | null;
}

export const DetalhePedidoModal: React.FC<DetalhePedidoModalProps> = ({ isOpen, onClose, pedido }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  // Hook de Impressão (Correto: definido fora do render condicional)
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: pedido ? `Pedido_${pedido.id.substring(0, 5)}` : 'Pedido',
  });

  if (!isOpen || !pedido) return null;

  const dataPedido = pedido.createdAt?.seconds 
    ? new Date(pedido.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
    : 'Data indisponível';

  const linkWhatsAppCliente = pedido.clienteTelefone 
    ? `https://wa.me/55${pedido.clienteTelefone.replace(/\D/g, '')}` 
    : null;

  const orderIdShort = pedido.id ? pedido.id.substring(0, 5).toUpperCase() : '???';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Pedido #{orderIdShort}</h2>
              <p className="text-xs text-gray-500">{dataPedido}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrint()}
                className="p-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-sm"
                title="Imprimir Pedido"
              >
                <Printer size={18} />
                <span className="text-sm font-medium hidden sm:inline">Imprimir</span>
              </button>
              <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Corpo (Scrollável) */}
          <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
            
            {/* Dados Cliente */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <p className="text-xs text-blue-500 uppercase font-bold mb-1">Cliente</p>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-700" />
                  <p className="font-bold text-gray-900">{pedido.clienteNome || 'Sem Nome'}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={14} className="text-blue-400" />
                  <p className="text-sm text-gray-600">{pedido.clienteTelefone || '-'}</p>
                </div>
              </div>
              
              {linkWhatsAppCliente && (
                <a 
                  href={linkWhatsAppCliente} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
                >
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
            </div>

            {/* Lista de Itens */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Itens</h3>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                {pedido.items && pedido.items.map((item: OrderLineItem, idx) => (
                  <li key={item.id || idx} className="p-3 bg-white flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {item.code || 'S/C'} • {item.quantidade}x {formatCurrency(item.salePrice)}
                      </p>
                    </div>
                    <p className="font-bold text-gray-700">
                      {formatCurrency((item.salePrice || 0) * (item.quantidade || 0))}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Observações */}
            {pedido.observacoes && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Observações</h3>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-100 text-sm text-gray-700 italic">
                  "{pedido.observacoes}"
                </div>
              </div>
            )}

            {/* Totais */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="w-full sm:w-1/2 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(pedido.subtotal)}</span>
                </div>
                {pedido.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Desconto</span>
                    <span>- {formatCurrency(pedido.desconto)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(pedido.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* --- ÁREA DE IMPRESSÃO (Escondida) --- */}
          <div style={{ display: 'none' }}>
            <div ref={componentRef} className="p-10 bg-white text-black font-sans">
              <div className="text-center border-b-2 border-black pb-6 mb-8">
                <h1 className="text-3xl font-bold uppercase tracking-widest">HivePratas</h1>
                <p className="text-sm text-gray-500 mt-2">Comprovante de Pedido #{orderIdShort}</p>
              </div>

              <div className="mb-8 p-4 border border-gray-300 rounded">
                <p className="font-bold text-lg mb-1">{pedido.clienteNome}</p>
                <p className="text-gray-600">{pedido.clienteTelefone}</p>
                <p className="text-xs text-gray-400 mt-2">Data: {dataPedido}</p>
              </div>

              <table className="w-full mb-8 text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qtd</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.items && pedido.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="py-3 pr-2">
                        <p className="font-bold">{item.name}</p>
                        <span className="text-xs text-gray-500">{item.code}</span>
                      </td>
                      <td className="py-3 text-center">{item.quantidade}</td>
                      <td className="py-3 text-right">{formatCurrency((item.salePrice || 0) * (item.quantidade || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-1/2 text-right">
                  <p className="mb-1">Subtotal: {formatCurrency(pedido.subtotal)}</p>
                  {pedido.desconto > 0 && <p className="mb-1 text-gray-600">Desconto: -{formatCurrency(pedido.desconto)}</p>}
                  <p className="text-xl font-bold mt-2 pt-2 border-t border-black">Total: {formatCurrency(pedido.total)}</p>
                </div>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};