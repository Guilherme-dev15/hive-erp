import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  X,
  Plus,
  Minus,
  Send,
  User,
  Phone,
  FileText,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { ItemCarrinho, ConfigPublica } from '../types';
import { formatCurrency } from '../utils/format';
import { buildOrderWhatsAppMessage, formatWhatsAppUrl } from '../utils/whatsapp';

interface ModalCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setCarrinho: React.Dispatch<
    React.SetStateAction<Record<string, ItemCarrinho>>
  >;
  whatsappNumber: string | null;
  config: ConfigPublica;
}

export function ModalCarrinho({
  isOpen,
  onClose,
  itens,
  setCarrinho,
  whatsappNumber,
  config,
}: ModalCarrinhoProps) {
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [obs, setObs] = useState('');

  const { subtotal, total } = useMemo(() => {
    const sub = itens.reduce(
      (acc, item) => acc + (item.produto.salePrice || 0) * item.quantidade,
      0
    );
    return {
      subtotal: sub,
      total: sub,
    };
  }, [itens]);

  const updateQtd = (id: string, delta: number) => {
    setCarrinho((prev) => {
      const item = prev[id];
      if (!item) return prev;

      const novaQtd = item.quantidade + delta;
      const estoqueDisponivel = item.produto.quantity ?? 999;

      if (delta > 0 && novaQtd > estoqueDisponivel) {
        toast.error('Estoque máximo atingido para este item.', { id: `est-${id}` });
        return prev;
      }

      if (novaQtd <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }

      return {
        ...prev,
        [id]: { ...item, quantidade: novaQtd },
      };
    });
  };

  const removeItem = (id: string) => {
    setCarrinho((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    toast.success('Item removido do carrinho.', { id: `rem-${id}` });
  };

  const finalizarWhatsApp = () => {
    const targetWhatsapp = whatsappNumber || config.whatsappNumber;

    if (!targetWhatsapp || !targetWhatsapp.trim()) {
      toast.error('Esta loja ainda não configurou um número de WhatsApp para receber pedidos.');
      return;
    }

    if (!nome.trim() || !tel.trim()) {
      toast.error('Por favor, informe seu Nome e WhatsApp antes de finalizar o pedido.');
      return;
    }

    if (itens.length === 0) {
      toast.error('Seu carrinho está vazio.');
      return;
    }

    const orderItems = itens.map((item) => ({
      name: item.produto.name,
      quantity: item.quantidade,
      salePrice: item.produto.salePrice,
      code: item.produto.code,
    }));

    const message = buildOrderWhatsAppMessage({
      storeName: config.storeName || 'Loja Virtual',
      customerName: nome,
      customerPhone: tel,
      items: orderItems,
      total,
      notes: obs,
    });

    const linkZap = formatWhatsAppUrl(targetWhatsapp, message);
    window.open(linkZap, '_blank');

    setCarrinho({});
    setNome('');
    setTel('');
    setObs('');
    onClose();
    toast.success('Pedido encaminhado para o WhatsApp!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* HEADER */}
            <div className="p-4 sm:p-5 flex justify-between items-center bg-gray-50/90 border-b border-gray-100 backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={22} style={{ color: config.primaryColor || '#D4AF37' }} />
                Meu Carrinho
              </h2>
              <button
                onClick={onClose}
                aria-label="Fechar carrinho"
                className="p-2 hover:bg-gray-200/80 rounded-full transition-colors text-gray-500"
              >
                <X size={22} />
              </button>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <ShoppingCart size={32} className="opacity-40" />
                  </div>
                  <p className="font-semibold text-gray-600">Seu carrinho está vazio.</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Adicione itens do catálogo para montar o seu pedido.
                  </p>
                </div>
              ) : (
                <>
                  {/* LISTA DE ITENS */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Itens Selecionados ({itens.reduce((acc, i) => acc + i.quantidade, 0)})
                    </p>
                    {itens.map((item) => (
                      <div
                        key={item.produto.id}
                        className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                          {item.produto.imageUrl ? (
                            <img
                              src={item.produto.imageUrl}
                              className="w-full h-full object-cover"
                              alt={item.produto.name}
                            />
                          ) : (
                            <Package size={22} className="text-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 pr-6 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {item.produto.name}
                          </p>
                          {item.produto.code && (
                            <p className="text-[10px] text-gray-400">Ref: {item.produto.code}</p>
                          )}
                          <p className="text-xs font-semibold text-gray-600 my-1">
                            {formatCurrency(item.produto.salePrice)}
                          </p>

                          <div className="flex items-center bg-gray-50 rounded-lg h-7 px-1 w-max border border-gray-200">
                            <button
                              onClick={() => updateQtd(item.produto.id, -1)}
                              aria-label={`Diminuir quantidade de ${item.produto.name}`}
                              className="w-6 h-full flex justify-center items-center text-gray-600 hover:text-black"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-gray-800">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => updateQtd(item.produto.id, 1)}
                              aria-label={`Aumentar quantidade de ${item.produto.name}`}
                              className="w-6 h-full flex justify-center items-center text-gray-600 hover:text-black"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => removeItem(item.produto.id)}
                          aria-label={`Remover ${item.produto.name}`}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* FORMULÁRIO DE CONTATO DO CLIENTE */}
                  <div className="bg-gray-50/70 p-4 rounded-2xl space-y-3 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} /> Seus Dados para Pedido
                    </p>

                    <div>
                      <label htmlFor="customer-name" className="text-[11px] font-semibold text-gray-500 mb-1 block">
                        Nome Completo *
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        placeholder="Ex: Maria da Silva"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="customer-phone" className="text-[11px] font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                        <Phone size={12} /> WhatsApp (com DDD) *
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        placeholder="Ex: 11999998888"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        value={tel}
                        onChange={(e) => setTel(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="customer-notes" className="text-[11px] font-semibold text-gray-500 mb-1 block flex items-center gap-1">
                        <FileText size={12} /> Observações (Opcional)
                      </label>
                      <textarea
                        id="customer-notes"
                        rows={2}
                        placeholder="Ex: Gostaria de embrulho para presente..."
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FOOTER COM TOTAIS E BOTÃO WHATSAPP */}
            {itens.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shadow-lg space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Estimado</span>
                    <span style={{ color: config.secondaryColor || '#111827' }}>
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={finalizarWhatsApp}
                  disabled={itens.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <Send size={18} />
                  Finalizar no WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
