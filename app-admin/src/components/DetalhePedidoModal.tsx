import { useRef } from 'react'; // Removido 'React' desnecessário
import { motion, AnimatePresence } from 'framer-motion';
// Removido 'MapPin' que não estava a ser usado
import { X, User, Phone, MessageCircle, Printer } from 'lucide-react';
import { type Order, type OrderLineItem } from '../types';
import { useReactToPrint } from 'react-to-print';

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
  // Referência para o componente que será impresso
  const componentRef = useRef<HTMLDivElement>(null);

  // --- CORREÇÃO AQUI ---
  // Na versão mais recente do react-to-print, usamos 'contentRef'
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // Mudança de 'content' para 'contentRef'
    documentTitle: pedido ? `Pedido_${pedido.id.substring(0, 5).toUpperCase()}` : 'Pedido',
  });

  if (!pedido) return null;

  const dataPedido = pedido.createdAt?.seconds 
    ? new Date(pedido.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
    : 'Data indisponível';

  const linkWhatsAppCliente = pedido.clienteTelefone 
    ? `https://wa.me/55${pedido.clienteTelefone.replace(/\D/g, '')}` 
    : null;

  const orderIdShort = pedido.id.substring(0, 5).toUpperCase();

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
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal (Visualização na Tela) */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-carvao">
                  Pedido #{orderIdShort}
                </h2>
                <p className="text-sm text-gray-500">Recebido em: {dataPedido}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Botão de Imprimir */}
                <button
                  onClick={() => handlePrint()}
                  className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 px-3"
                  title="Imprimir Pedido"
                >
                  <Printer size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Imprimir</span>
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corpo do Modal (Visualização na Tela com Scroll) */}
            <div className="p-6 overflow-y-auto flex-grow">
              
              {/* Dados do Cliente */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Dados do Cliente</p>
                  <div className="flex items-center gap-2 mb-1">
                    <User size={16} className="text-blue-600" />
                    <p className="text-gray-900 font-bold text-lg">{pedido.clienteNome || 'Nome não informado'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-500" />
                    <p className="text-gray-600 text-sm">{pedido.clienteTelefone || 'Telefone não informado'}</p>
                  </div>
                </div>
                
                {linkWhatsAppCliente && (
                  <a 
                    href={linkWhatsAppCliente} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
                  >
                    <MessageCircle size={18} /> 
                    Chamar no Zap
                  </a>
                )}
              </div>

              {/* Itens do Pedido */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-carvao mb-2">Itens do Pedido</h3>
                <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200 px-4">
                  {pedido.items.map((item: OrderLineItem) => (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500 font-mono">
                          {item.code || 'S/C'} • {item.quantidade} un. x {formatCurrency(item.salePrice)}
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
                  <h3 className="text-lg font-semibold text-carvao mb-2">Observações</h3>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm italic">
                    "{pedido.observacoes}"
                  </p>
                </div>
              )}

              {/* Financeiro */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex justify-between w-full sm:w-1/2 text-gray-600 text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(pedido.subtotal)}</span>
                  </div>
                  {pedido.desconto > 0 && (
                    <div className="flex justify-between w-full sm:w-1/2 text-green-600 text-sm">
                      <span>Desconto:</span>
                      <span>- {formatCurrency(pedido.desconto)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-full sm:w-1/2 text-xl font-bold text-carvao mt-2 pt-2 border-t border-gray-100">
                    <span>Total:</span>
                    <span>{formatCurrency(pedido.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 4. LAYOUT DE IMPRESSÃO (INVISÍVEL NA TELA, VISÍVEL NO PDF) */}
            {/* ============================================================ */}
            <div style={{ display: 'none' }}>
              <div ref={componentRef} className="p-8 bg-white text-black font-sans print-container">
                {/* Cabeçalho da Impressão */}
                <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                  <div>
                    <h1 className="text-3xl font-bold uppercase tracking-wider">HivePratas</h1>
                    <p className="text-sm text-gray-600 mt-1">Comprovante de Pedido</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold">#{orderIdShort}</h2>
                    <p className="text-sm text-gray-500">{dataPedido}</p>
                  </div>
                </div>

                {/* Dados do Cliente */}
                <div className="mb-8 border border-gray-300 rounded p-4">
                  <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Cliente</h3>
                  <p className="text-lg font-bold">{pedido.clienteNome}</p>
                  <p className="text-gray-700">{pedido.clienteTelefone}</p>
                </div>

                {/* Tabela de Itens */}
                <table className="w-full mb-8 text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="py-2 text-sm uppercase font-bold">Item / Código</th>
                      <th className="py-2 text-sm uppercase font-bold text-center">Qtd</th>
                      <th className="py-2 text-sm uppercase font-bold text-right">Unit.</th>
                      <th className="py-2 text-sm uppercase font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedido.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="py-3">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.code}</p>
                        </td>
                        <td className="py-3 text-center">{item.quantidade}</td>
                        <td className="py-3 text-right text-gray-600">{formatCurrency(item.salePrice)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.salePrice * item.quantidade)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totais */}
                <div className="flex justify-end mb-8">
                  <div className="w-1/2">
                    <div className="flex justify-between py-1 text-gray-600">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(pedido.subtotal)}</span>
                    </div>
                    {pedido.desconto > 0 && (
                      <div className="flex justify-between py-1 text-gray-600">
                        <span>Desconto:</span>
                        <span>- {formatCurrency(pedido.desconto)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 mt-2 border-t-2 border-black text-xl font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(pedido.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {pedido.observacoes && (
                  <div className="mb-8 p-4 bg-gray-100 rounded border border-gray-300">
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Observações:</h3>
                    <p className="text-sm italic">{pedido.observacoes}</p>
                  </div>
                )}

                {/* Rodapé */}
                <div className="text-center text-xs text-gray-400 mt-12 border-t border-gray-200 pt-4">
                  <p>Obrigado pela preferência!</p>
                  <p>HivePratas - Joias em Prata 925</p>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}