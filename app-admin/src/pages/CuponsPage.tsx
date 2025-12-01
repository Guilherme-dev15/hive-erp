import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Ticket, Trash2, Plus, Loader2 } from 'lucide-react';
import { getCoupons, createCoupon, deleteCoupon } from '../services/apiService';
import { type Coupon } from '../types';

export function cupomsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      const data = await getCoupons();
      setCoupons(data);
    } catch (error) {
      toast.error("Erro ao carregar cupões.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newPercent) return toast.error("Preencha todos os campos.");
    
    setIsSubmitting(true);
    try {
      const created = await createCoupon({ code: newCode, discountPercent: Number(newPercent) });
      setCoupons([created, ...coupons]);
      setNewCode('');
      setNewPercent('');
      toast.success("cupom criado!");
    } catch (error) {
      toast.error("Erro ao criar cupom.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await deleteCoupon(id);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Apagado.");
    } catch (error) {
      toast.error("Erro ao apagar.");
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-carvao flex items-center gap-2">
        <Ticket className="text-dourado" /> Gestão de Cupões
      </h1>

      {/* Formulário */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Código (ex: NATAL10)</label>
            <input 
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border rounded-lg uppercase font-bold tracking-wider focus:ring-2 focus:ring-dourado outline-none"
              placeholder="CÓDIGO"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
            <input 
              type="number"
              value={newPercent}
              onChange={e => setNewPercent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-dourado outline-none"
              placeholder="10"
            />
          </div>
          <button disabled={isSubmitting} className="bg-carvao text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Criar
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <motion.div 
            key={coupon.id} 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 rounded-lg shadow border-l-4 border-dourado flex justify-between items-center"
          >
            <div>
              <p className="text-xl font-bold text-carvao tracking-widest">{coupon.code}</p>
              <p className="text-sm text-green-600 font-bold">{coupon.discountPercent}% OFF</p>
            </div>
            <button onClick={() => handleDelete(coupon.id)} className="text-gray-400 hover:text-red-600 p-2">
              <Trash2 size={18} />
            </button>
          </motion.div>
        ))}
        {coupons.length === 0 && <p className="text-gray-500 col-span-full text-center py-8">Nenhum cupom ativo.</p>}
      </div>
    </div>
  );
}