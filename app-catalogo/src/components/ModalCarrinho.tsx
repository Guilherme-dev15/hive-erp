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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, percent: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const { subtotal, desconto, total } = useMemo(() => {
    const sub = itens.reduce((acc, i) => acc + (i.produto.salePrice || 0) * i.quantidade, 0);
    const desc = appliedCoupon ? sub * (appliedCoupon.percent / 100) : 0;
    return { subtotal: sub, desconto: desc, total: sub - desc };
  }, [itens, appliedCoupon]);

  const handleCoupon = async () => {
    if(!couponCode) return;
    try {
      const res = await checkCoupon(couponCode);
      if (res && res.discountPercent) {
        setAppliedCoupon({ code: res.code, percent: res.discountPercent });
        toast.success(`Cupom de ${res.discountPercent}% aplicado!`);
      } else {
        toast.error("Cupom inválido.");
      }
    } catch { 
      toast.error("Erro no cupom."); 
      setAppliedCoupon(null); 
    }
  };

  const updateQtd = (id: string, d: number) => {
    setCarrinho((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nova = item.quantidade + d;
      
      if (d > 0 && nova > (item.produto.quantity || 0)) { 
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

      const res = await saveOrder(orderPayload);
      
      const msg = `🧾 *Pedido #${res.id ? res.id.substring(0,5).toUpperCase() : 'NOVO'}*\n` +
                  `👤 ${nome}\n` +
                  `📞 ${tel}\n\n` +
                  itens.map(i => `${i.quantidade}x ${i.produto.name}`).join('\n') +
                  `\n\nSubtotal: ${formatCurrency(subtotal)}` +
                  (desconto > 0 ? `\nDesconto (${appliedCoupon?.code}): -${formatCurrency(desconto)}` : '') +
                  `\n*Total: ${formatCurrency(total)}*` + 
                  (obs ? `\nObs: ${obs}` : '');
      
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      setCarrinho({}); onClose(); toast.success("Enviado!");
    } catch (e) { 
      console.error(e);
      toast.error("Erro ao processar."); 
    } finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col h-full" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
             <div className="p-5 flex justify-between items-center bg-gray-50/50 border-b backdrop-blur-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={22}/> Carrinho</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {itens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                    <p>Carrinho vazio.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {itens.map((item) => (
                        <div key={item.produto.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative">
                           <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                             {item.produto.imageUrl ? <img src={item.produto.imageUrl} className="w-full h-full object-cover"/> : <Package size={24}/>}
                           </div>
                           <div className="flex-1 pr-6">
                             <p className="text-sm font-bold line-clamp-1">{item.produto.name}</p>
                             <p className="text-xs text-gray-500 mb-3">{formatCurrency(item.produto.salePrice)}</p>
                             <div className="flex items-center bg-gray-100 rounded-lg h-8 px-1 w-max">
                                <button onClick={() => updateQtd(item.produto.id, -1)} className="w-8 h-full flex justify-center items-center hover:text-red-500"><Minus size={14}/></button>
                                <span className="w-6 text-center text-sm font-bold">{item.quantidade}</span>
                                <button onClick={() => updateQtd(item.produto.id, 1)} className="w-8 h-full flex justify-center items-center hover:text-green-600"><Plus size={14}/></button>
                             </div>
                           </div>
                           <button onClick={() => removeItem(item.produto.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><X size={16}/></button>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100">
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><User size={14}/> Entrega</p>
                       <input placeholder="Seu Nome" className="w-full p-3.5 rounded-xl border text-sm" value={nome} onChange={e => setNome(e.target.value)} />
                       <input placeholder="WhatsApp" className="w-full p-3.5 rounded-xl border text-sm" value={tel} onChange={e => setTel(e.target.value)} />
                       <textarea placeholder="Observações..." className="w-full p-3.5 rounded-xl border text-sm" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                       <div className="relative flex-1"><TicketPercent size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/><input placeholder="CUPOM" className="w-full pl-10 p-3.5 rounded-xl border text-sm uppercase" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} disabled={!!appliedCoupon}/></div>
                       <button onClick={appliedCoupon ? () => {setAppliedCoupon(null); setCouponCode('')} : handleCoupon} className={`px-5 rounded-xl font-bold text-xs ${appliedCoupon ? 'bg-red-100 text-red-600' : 'bg-gray-900 text-white'}`}>{appliedCoupon ? 'REMOVER' : 'APLICAR'}</button>
                    </div>
                  </>
                )}
             </div>
             <div className="p-5 border-t bg-white z-20">
                <div className="space-y-2 mb-5 text-sm">
                   <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                   {desconto > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Desconto</span><span>-{formatCurrency(desconto)}</span></div>}
                   <div className="flex justify-between text-2xl font-extrabold border-t pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                <button onClick={finalizar} disabled={itens.length === 0 || loading} className="w-full py-4 rounded-2xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50" style={{ backgroundColor: config.primaryColor }}>
                   {loading ? <Loader2 className="animate-spin"/> : <Send size={20}/>} Finalizar Compra
                </button>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}