import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { type Order, type OrderLineItem } from '../types';

// Função Utilitária para formatar Moeda (R$)
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

interface DetalhePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Order | null;
}

export function DetalhePedidoModal({ isOpen, onClose, pedido }: DetalhePedidoModalProps) {
  if (!pedido) return null;

  const dataPedido = pedido.createdAt?.seconds 
    ? new Date(pedido.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
    : 'Data indisponível';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold text-carvao">
                  Detalhes do Pedido #{pedido.id.substring(0, 5).toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">Recebido em: {dataPedido}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Itens do Pedido */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-carvao mb-2">Itens do Pedido</h3>
                <ul className="divide-y divide-gray-200">
                  {pedido.items.map((item: OrderLineItem) => (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantidade} un. x {formatCurrency(item.salePrice)}
                        </p>
                      </div>
                      <p className="font-semibold text-carvao">
                        {formatCurrency(item.salePrice * item.quantidade)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Observações */}
              {pedido.observacoes && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-carvao mb-2">Observações do Cliente</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">{pedido.observacoes}</p>
                </div>
              )}

              {/* Financeiro */}
              <div>
                <h3 className="text-lg font-semibold text-carvao mb-2">Resumo Financeiro</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(pedido.subtotal)}</span>
                  </div>
                  {pedido.desconto > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto (10%):</span>
                      <span className="font-medium">- {formatCurrency(pedido.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-carvao pt-2 border-t mt-2">
                    <span>Total do Pedido:</span>
                    <span>{formatCurrency(pedido.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}