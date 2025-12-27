/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, TicketPercent, Loader2, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ItemCarrinho, ConfigPublica, OrderPayload } from '../types';
import { saveOrder, checkCoupon } from '../services/api';
import { formatCurrency } from '../utils/format';

interface ModalCarrinhoProps {
  isOpen: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  setCarrinho: React.Dispatch<React.SetStateAction<Record<string, ItemCarrinho>>>;
  whatsappNumber: string | null;
  config: ConfigPublica;
}

export function ModalCarrinho({ isOpen, onClose, itens, setCarrinho, whatsappNumber, config }: ModalCarrinhoProps) {
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [obs, setObs] = useState('');

  // Cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [checkingCoupon] = useState(false);

  // --- CÁLCULOS ---
  const { subtotal, desconto, total } = useMemo(() => {
    // 1. Soma o subtotal
    const sub = itens.reduce((acc, i) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);

    // 2. Calcula desconto se houver cupom
    let desc = 0;
    if (appliedCoupon && appliedCoupon.percent > 0) {
      desc = sub * (appliedCoupon.percent / 100);
    }

    // 3. Total Final
    return {
      subtotal: sub,
      desconto: desc,
      total: Math.max(0, sub - desc) // Garante que não fica negativo
    };
  }, [itens, appliedCoupon]);

  // --- HANDLER DE CUPOM (CORRIGIDO) ---
  
  const handleCoupon = async () => {
    if (!couponCode) return;
    try {
      // O 'checkCoupon' agora é um POST
      const res = await checkCoupon(couponCode);

      // GARANTIA: O Axios coloca a resposta do servidor dentro de .data
      // Se o seu interceptor já tira o .data, use 'res'. Se não, use 'res.data'.
      const dadosCupom = res.data || res;

      if (dadosCupom && (dadosCupom.discountPercent || dadosCupom.percent)) {
        const pct = Number(dadosCupom.discountPercent || dadosCupom.percent);
        setAppliedCoupon({ code: dadosCupom.code, percent: pct });
        toast.success(`Cupom de ${pct}% aplicado!`);
      } else {
        toast.error("Cupom inválido.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao validar cupom.");
      setAppliedCoupon(null);
    }
  };
  const updateQtd = (id: string, d: number) => {
    setCarrinho((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nova = item.quantidade + d;

      // Validação de Estoque
      if (d > 0 && nova > (item.produto.quantity || 999)) {
        toast.error("Estoque limite atingido");
        return prev;
      }

      if (nova <= 0) { const c = { ...prev }; delete c[id]; return c; }
      return { ...prev, [id]: { ...item, quantidade: nova } };
    });
  };

  const removeItem = (id: string) => {
    setCarrinho((prev) => { const c = { ...prev }; delete c[id]; return c; });
  };

  const finalizar = async () => {
    if (!whatsappNumber) return toast.error("Loja sem WhatsApp configurado");
    if (!nome.trim() || !tel.trim()) return toast.error("Preencha Nome e WhatsApp");

    setLoading(true);
    try {
      const orderPayload: OrderPayload = {
        customerName: nome,
        customerPhone: tel,
        items: itens.map(i => ({
          id: i.produto.id,
          name: i.produto.name,
          code: i.produto.code,
          salePrice: i.produto.salePrice || 0,
          quantidade: i.quantidade
        })),
        subtotal,
        discount: desconto,
        total,
        notes: obs
      };

      const res: any = await saveOrder(orderPayload);
      const resData = res.data || res; // Extração segura também aqui
      const orderId = resData.id || 'NOVO';

      // Montagem da Mensagem do WhatsApp
      const msg = `🧾 *PEDIDO #${String(orderId).substring(0, 5).toUpperCase()}*\n` +
        `👤 ${nome}\n` +
        `📞 ${tel}\n\n` +
        itens.map(i => {
          const variantInfo = i.produto.selectedVariant ? ` (${i.produto.selectedVariant.medida})` : '';
          return `${i.quantidade}x ${i.produto.name}${variantInfo}`;
        }).join('\n') +
        `\n\nSubtotal: ${formatCurrency(subtotal)}` +
        (desconto > 0 ? `\nDesconto (${appliedCoupon?.code}): -${formatCurrency(desconto)}` : '') +
        `\n*Total: ${formatCurrency(total)}*` +
        (obs ? `\nObs: ${obs}` : '');

      const linkZap = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
      window.open(linkZap, '_blank');

      setCarrinho({});
      onClose();
      toast.success("Pedido enviado com sucesso!");

    } catch (e) {
      console.error(e);
      toast.error("Erro ao processar pedido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* HEADER */}
            <div className="p-5 flex justify-between items-center bg-gray-50/80 border-b backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={22} /> Carrinho
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* LISTA DE ITENS */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-white">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {itens.map((item) => (
                      <div key={`${item.produto.id}-${item.produto.selectedVariant?.medida || 'u'}`} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative hover:shadow-md transition-shadow">
                        {/* IMAGEM */}
                        <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                          {item.produto.imageUrl ? (
                            <img src={item.produto.imageUrl} className="w-full h-full object-cover" alt={item.produto.name} />
                          ) : (
                            <Package size={24} className="text-gray-300" />
                          )}
                        </div>

                        {/* INFO */}
                        <div className="flex-1 pr-6">
                          <p className="text-sm font-bold line-clamp-2 text-gray-800 leading-snug">{item.produto.name}</p>

                          {item.produto.selectedVariant && (
                            <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded mt-1 mb-1">
                              {item.produto.selectedVariant.medida}
                            </span>
                          )}

                          <p className="text-xs text-gray-500 mb-2 mt-1 font-medium">
                            {formatCurrency(item.produto.salePrice)}
                          </p>

                          {/* CONTROLE QTD */}
                          <div className="flex items-center bg-gray-50 rounded-lg h-8 px-1 w-max border border-gray-200">
                            <button onClick={() => updateQtd(item.produto.id, -1)} className="w-8 h-full flex justify-center items-center hover:text-red-500 transition-colors"><Minus size={14} /></button>
                            <span className="w-6 text-center text-sm font-bold text-gray-700">{item.quantidade}</span>
                            <button onClick={() => updateQtd(item.produto.id, 1)} className="w-8 h-full flex justify-center items-center hover:text-green-600 transition-colors"><Plus size={14} /></button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.produto.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={16} /></button>
                      </div>
                    ))}
                  </div>

                  {/* DADOS DO CLIENTE */}
                  <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User size={14} /> Seus Dados
                    </p>
                    <input
                      placeholder="Seu Nome Completo"
                      className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                    />
                    <input
                      placeholder="WhatsApp (com DDD)"
                      type="tel"
                      className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      value={tel}
                      onChange={e => setTel(e.target.value)}
                    />
                    <textarea
                      placeholder="Observações (opcional)..."
                      className="w-full p-3.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                      rows={2}
                      value={obs}
                      onChange={e => setObs(e.target.value)}
                    />
                  </div>

                  {/* CUPOM */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TicketPercent size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        placeholder="CUPOM DE DESCONTO"
                        className="w-full pl-10 p-3.5 rounded-xl border border-gray-200 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        disabled={!!appliedCoupon}
                      />
                    </div>
                    <button
                      onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode('') } : handleCoupon}
                      disabled={checkingCoupon}
                      className={`px-5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-2
                               ${appliedCoupon
                          ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                          : 'bg-gray-900 text-white hover:bg-gray-800'}`
                      }
                    >
                      {checkingCoupon ? <Loader2 className="animate-spin" size={16} /> : (appliedCoupon ? 'REMOVER' : 'APLICAR')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* FOOTER / TOTAL */}
            <div className="p-6 border-t bg-white z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {desconto > 0 && (
                  <div className="flex justify-between text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>-{formatCurrency(desconto)}</span>
                  </div>
                )}

                <div className="flex justify-between text-2xl font-black text-gray-900 border-t border-dashed border-gray-200 pt-3 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={finalizar}
                disabled={itens.length === 0 || loading}
                className="w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: config.primaryColor }}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                {loading ? 'Enviando...' : 'Finalizar Pedido no WhatsApp'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}