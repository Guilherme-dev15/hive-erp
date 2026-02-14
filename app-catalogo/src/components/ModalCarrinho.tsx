 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, X, Plus, Minus, Send, TicketPercent, Loader2, User, CreditCard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

import { ItemCarrinho, ConfigPublica, OrderPayload } from '../types';
import { saveOrder, checkCoupon, createPaymentIntent } from '../services/api';
import { formatCurrency } from '../utils/format';
import { CheckoutForm } from './CheckoutForm'; // <--- Importamos seu componente novo

// Carrega o Stripe usando a chave pública do .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discountValue: number, type: string } | null>(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  // --- STRIPE STATES ---
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // --- CÁLCULOS ---
  const { subtotal, desconto, total } = useMemo(() => {
    const sub = itens.reduce((acc, i) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);
    let desc = 0;

    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage') {
        desc = sub * (appliedCoupon.discountValue / 100);
      } else {
        desc = appliedCoupon.discountValue;
      }
    }

    return {
      subtotal: sub,
      desconto: desc,
      total: Math.max(0, sub - desc)
    };
  }, [itens, appliedCoupon]);

  // --- HANDLER DE CUPOM ---
  const handleCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setCheckingCoupon(true);
      const storeId = config?.storeId || new URLSearchParams(window.location.search).get('storeId');

      if (!storeId) {
        toast.error("Erro técnico: ID da loja não identificado.");
        return;
      }

      const res = await checkCoupon(couponCode, storeId);

      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountValue: res.discountValue,
          type: res.type
        });
        toast.success(`Cupom ${couponCode.toUpperCase()} aplicado!`);
      } else {
        toast.error(res.message || "Cupom inválido.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao validar cupom.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const updateQtd = (id: string, d: number) => {
    setCarrinho((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nova = item.quantidade + d;
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

  // --- INICIAR PAGAMENTO ONLINE (STRIPE) ---
  const handleOnlinePayment = async () => {
    if (!nome.trim() || !tel.trim()) return toast.error("Preencha Nome e WhatsApp antes de pagar.");
    
    setLoading(true);
    try {
      const data = await createPaymentIntent(total, config.storeId || '');
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    } catch (error) {
      console.error("Erro no pagamento:", error); // <--- Usamos a variável error aqui!
      toast.error("Erro ao iniciar pagamento.");
    } finally {
      setLoading(false);
    }
  };

  // --- FINALIZAR PEDIDO (SALVAR NO BANCO) ---
  // Essa função serve tanto para WhatsApp quanto para sucesso do Stripe
  const saveOrderToDb = async (paymentMethod: 'whatsapp' | 'credit_card') => {
    // Correção: Adicionamos a info do pagamento nas observações para não ficar variável inutilizada
    const paymentInfo = paymentMethod === 'credit_card' ? ' [PAGO VIA CARTÃO]' : ' [VIA WHATSAPP]';
    
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
      notes: (obs || '') + paymentInfo, // <--- Usamos o paymentMethod aqui!
      storeId: config.storeId
    };

    const res: any = await saveOrder(orderPayload);
    return res.id || 'NOVO';
  };

  const finalizarWhatsApp = async () => {
    if (!whatsappNumber) return toast.error("Loja sem WhatsApp configurado");
    if (!nome.trim() || !tel.trim()) return toast.error("Preencha Nome e WhatsApp");

    setLoading(true);
    try {
      const orderId = await saveOrderToDb('whatsapp');

      const msg = `🧾 *PEDIDO #${String(orderId).substring(0, 5).toUpperCase()}*\n` +
        `👤 ${nome}\n` +
        `📞 ${tel}\n\n` +
        itens.map(i => `${i.quantidade}x ${i.produto.name}`).join('\n') +
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

  // --- CALLBACK DE SUCESSO DO STRIPE ---
  const onPaymentSuccess = async () => {
    try {
        await saveOrderToDb('credit_card');
        setCarrinho({});
        onClose();
        // Você pode redirecionar para uma página de "Obrigado" aqui se quiser
    } catch (error) {
        console.error("Erro ao salvar pedido pago:", error);
        toast.error("Pagamento aprovado, mas erro ao salvar pedido. Contate a loja.");
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

            {/* CONTEÚDO SCROLLÁVEL */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
              {itens.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Seu carrinho está vazio.</p>
                </div>
              ) : (
                <>
                  {/* SE O PAGAMENTO ESTIVER ATIVO, MOSTRA SÓ O FORMULÁRIO DO STRIPE */}
                  {showPayment && clientSecret ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button onClick={() => setShowPayment(false)} className="text-sm text-gray-500 mb-4 flex items-center gap-1 hover:underline">
                            ← Voltar para resumo
                        </button>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                            <CheckoutForm 
                                amount={total} 
                                storeId={config.storeId || ''}
                                onSuccess={onPaymentSuccess}
                                onCancel={() => setShowPayment(false)}
                            />
                        </Elements>
                    </div>
                  ) : (
                    /* SE NÃO, MOSTRA O CARRINHO NORMAL */
                    <>
                        <div className="space-y-4">
                            {itens.map((item) => (
                            <div key={item.produto.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative">
                                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border">
                                {item.produto.imageUrl ? (
                                    <img src={item.produto.imageUrl} className="w-full h-full object-cover" alt={item.produto.name} />
                                ) : (
                                    <Package size={24} className="text-gray-300" />
                                )}
                                </div>
                                <div className="flex-1 pr-6">
                                <p className="text-sm font-bold line-clamp-2 text-gray-800">{item.produto.name}</p>
                                <p className="text-xs text-gray-500 mb-2 mt-1">{formatCurrency(item.produto.salePrice)}</p>
                                <div className="flex items-center bg-gray-50 rounded-lg h-8 px-1 w-max border">
                                    <button onClick={() => updateQtd(item.produto.id, -1)} className="w-8 h-full flex justify-center items-center"><Minus size={14} /></button>
                                    <span className="w-6 text-center text-sm font-bold">{item.quantidade}</span>
                                    <button onClick={() => updateQtd(item.produto.id, 1)} className="w-8 h-full flex justify-center items-center"><Plus size={14} /></button>
                                </div>
                                </div>
                                <button onClick={() => removeItem(item.produto.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1"><X size={16} /></button>
                            </div>
                            ))}
                        </div>

                        {/* DADOS DO CLIENTE */}
                        <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 mt-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><User size={14} /> Seus Dados</p>
                            <input placeholder="Seu Nome Completo" className="w-full p-3.5 rounded-xl border text-sm" value={nome} onChange={e => setNome(e.target.value)} />
                            <input placeholder="WhatsApp (com DDD)" type="tel" className="w-full p-3.5 rounded-xl border text-sm" value={tel} onChange={e => setTel(e.target.value)} />
                            <textarea placeholder="Observações..." className="w-full p-3.5 rounded-xl border text-sm" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
                        </div>

                        {/* CUPOM */}
                        <div className="flex gap-2 mt-4">
                            <div className="relative flex-1">
                            <TicketPercent size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="CUPOM DE DESCONTO"
                                className="w-full pl-10 p-3.5 rounded-xl border text-sm uppercase"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                disabled={!!appliedCoupon}
                            />
                            </div>
                            <button
                            onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode('') } : handleCoupon}
                            disabled={checkingCoupon}
                            className={`px-5 rounded-xl font-bold text-xs transition-all ${appliedCoupon ? 'bg-red-50 text-red-600' : 'bg-gray-900 text-white'}`}
                            >
                            {checkingCoupon ? <Loader2 className="animate-spin" size={16} /> : (appliedCoupon ? 'REMOVER' : 'APLICAR')}
                            </button>
                        </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* FOOTER (SÓ APARECE SE NÃO ESTIVER PAGANDO) */}
            {!showPayment && (
                <div className="p-6 border-t bg-white">
                <div className="space-y-2 mb-5 text-sm">
                    <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    {desconto > 0 && <div className="flex justify-between text-green-600 font-bold bg-green-50 p-2 rounded-lg"><span>Desconto</span><span>-{formatCurrency(desconto)}</span></div>}
                    <div className="flex justify-between text-2xl font-black text-gray-900 border-t pt-3 mt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* BOTÃO WHATSAPP */}
                    <button
                        onClick={finalizarWhatsApp}
                        disabled={itens.length === 0 || loading}
                        className="w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#25D366' }} // Verde do WhatsApp
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                        Finalizar no WhatsApp
                    </button>

                    {/* BOTÃO CARTÃO DE CRÉDITO */}
                    <button
                        onClick={handleOnlinePayment}
                        disabled={itens.length === 0 || loading}
                        className="w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: config.primaryColor }}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                        Pagar com Cartão
                    </button>
                </div>
                </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}