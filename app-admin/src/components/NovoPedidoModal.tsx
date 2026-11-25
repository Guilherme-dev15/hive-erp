import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  FileText,
  User,
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Percent,
} from 'lucide-react';
import { getAdminProdutos, getCustomers, apiClient } from '../services/apiService';
import { ProdutoAdmin, Customer } from '../types';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

interface NovoPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemSelecionado {
  productId: string;
  name: string;
  code?: string;
  salePrice: number;
  quantity: number;
  maxStock: number;
}

export function NovoPedidoModal({
  isOpen,
  onClose,
  onSuccess,
}: NovoPedidoModalProps) {
  const [tipo, setTipo] = useState<'VENDA' | 'ORCAMENTO'>('VENDA');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ProdutoAdmin[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [items, setItems] = useState<ItemSelecionado[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      Promise.all([getCustomers(), getAdminProdutos()])
        .then(([custs, prods]) => {
          const custList = Array.isArray(custs)
            ? custs
            : Array.isArray((custs as any)?.data)
            ? (custs as any).data
            : [];
          setCustomers(custList);

          const prodList = Array.isArray(prods)
            ? prods
            : Array.isArray((prods as any)?.data)
            ? (prods as any).data
            : [];
          setProducts(prodList.filter((p: any) => p && p.status === 'ativo'));
        })
        .catch((err) => {
          console.error('Erro ao carregar dados:', err);
          setCustomers([]);
          setProducts([]);
        })
        .finally(() => setLoadingData(false));

      // Reset
      setTipo('VENDA');
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setSelectedProductId('');
      setItems([]);
      setDiscount(0);
      setNotes('');
    }
  }, [isOpen]);

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const found = (customers || []).find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
    }
  };

  const addItem = () => {
    if (!selectedProductId) return;
    const prod = (products || []).find((p) => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          name: prod.name,
          code: prod.code,
          salePrice: Number(prod.salePrice || 0),
          quantity: 1,
          maxStock: prod.quantity || 0,
        },
      ]);
    }
    setSelectedProductId('');
  };

  const updateItemQty = (index: number, qty: number) => {
    if (qty <= 0) return;
    const updated = [...items];
    updated[index].quantity = qty;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + item.salePrice * item.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    try {
      setSubmitting(true);
      const status = tipo === 'ORCAMENTO' ? 'ORCAMENTO' : 'AGUARDANDO_PAGAMENTO';

      const payload = {
        customerId: selectedCustomerId || undefined,
        customerName,
        customerPhone: customerPhone || undefined,
        status,
        subtotal,
        discount: Number(discount) || 0,
        total,
        notes: notes || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          code: i.code,
          salePrice: i.salePrice,
          quantity: i.quantity,
        })),
      };

      await apiClient.post('/api/v2/orders', payload);
      toast.success(
        tipo === 'ORCAMENTO'
          ? 'Orçamento criado com sucesso!'
          : 'Pedido de venda registrado!'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar pedido:', err);
      toast.error(err?.response?.data?.message || 'Erro ao registrar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  tipo === 'ORCAMENTO'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {tipo === 'ORCAMENTO' ? <FileText size={22} /> : <ShoppingBag size={22} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {tipo === 'ORCAMENTO' ? 'Novo Orçamento / Proposta' : 'Nova Venda Balcão (PDV)'}
                </h2>
                <p className="text-xs text-gray-500">
                  {tipo === 'ORCAMENTO'
                    ? 'Gere propostas comerciais sem baixar estoque antes da aprovação'
                    : 'Venda rápida com baixa automática de estoque'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* SELETOR TIPO: VENDA OU ORÇAMENTO */}
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setTipo('VENDA')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  tipo === 'VENDA'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShoppingBag size={14} /> Venda Direta / Balcão
              </button>
              <button
                type="button"
                onClick={() => setTipo('ORCAMENTO')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  tipo === 'ORCAMENTO'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <FileText size={14} /> Orçamento / Proposta
              </button>
            </div>

            {/* DADOS DO CLIENTE */}
            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <User size={14} /> Dados do Cliente
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Selecionar da Base
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Cliente avulso...</option>
                    {(customers || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SELEÇÃO DE PRODUTOS */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={14} /> Itens do Pedido
                </h3>
                <span className="text-xs text-gray-400">
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">Selecione um produto do catálogo para adicionar...</option>
                  {(products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''} — {formatCurrency(p.salePrice)} (Estoque: {p.quantity})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!selectedProductId}
                  className="px-4 py-2 bg-carvao hover:bg-gray-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              {/* Tabela de itens */}
              {items.length > 0 ? (
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-right">Preço Unit.</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Total</th>
                        <th className="p-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(items || []).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-800">
                            {item.name}
                            {item.code && (
                              <span className="text-[10px] text-gray-400 block">{item.code}</span>
                            )}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            {formatCurrency(item.salePrice)}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItemQty(index, parseInt(e.target.value) || 1)}
                              className="w-16 bg-white border border-gray-200 rounded-lg text-center py-1 text-xs font-bold"
                            />
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            {formatCurrency(item.salePrice * item.quantity)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-gray-400 hover:text-rose-500"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                  Nenhum item adicionado ainda. Escolha os produtos acima.
                </div>
              )}
            </div>

            {/* DESCONTO E OBSERVAÇÕES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Observações / Condições Comerciais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Validade da proposta 7 dias, forma de pagamento, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Desconto (R$):</span>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1 text-right text-xs font-bold"
                  />
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Final:</span>
                  <span className="text-lg text-emerald-600 font-black">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className={`px-6 py-2.5 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all ${
                  tipo === 'ORCAMENTO'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-carvao hover:bg-gray-800'
                }`}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : tipo === 'ORCAMENTO' ? (
                  <>
                    <FileText size={18} /> Gerar Orçamento
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Concluir Venda Balcão
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
