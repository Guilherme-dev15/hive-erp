import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Ticket, Trash2, Plus, Loader2, Tag } from 'lucide-react';
import { getCoupons, createCoupon, deleteCoupon } from '../services/apiService';
import { type Coupon } from '../types';

// --- CORREÇÃO: Nome da função com 'n' e Maiúscula ---
export function CuponsPage() {
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
      toast.error("Erro ao carregar Cupons.");
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
      toast.success("Cupom criado!");
    } catch (error) {
      toast.error("Erro ao criar Cupom. Verifique se já existe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que quer apagar este Cupom?")) return;
    try {
      await deleteCoupon(id);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success("Cupom apagado.");
    } catch (error) {
      toast.error("Erro ao apagar.");
    }
  };

  if (loading) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-dourado" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <Toaster position="top-right" />
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-carvao flex items-center gap-2"
      >
        <Ticket className="text-dourado" /> Campanhas e Cupons
      </motion.h1>

      {/* Cartão de Criação */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-dourado">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Criar Nova Campanha</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código do Cupom</label>
            <div className="relative">
               <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 value={newCode}
                 onChange={e => setNewCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                 className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg uppercase font-bold tracking-widest focus:ring-2 focus:ring-dourado outline-none"
                 placeholder="EX: VERAO10"
               />
            </div>
          </div>
          <div className="w-full md:w-40">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desconto (%)</label>
            <input 
              type="number"
              value={newPercent}
              onChange={e => setNewPercent(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none font-bold"
              placeholder="10"
            />
          </div>
          <button 
            disabled={isSubmitting} 
            className="w-full md:w-auto bg-carvao text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-all"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus size={20} />} Criar Campanha
          </button>
        </form>
      </div>

      {/* Lista de Cupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((coupon, index) => (
          <motion.div 
            key={coupon.id} 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center gap-2">
                 <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase">Ativo</span>
                 <p className="text-sm text-gray-400">{new Date().toLocaleDateString()}</p>
              </div>
              <p className="text-2xl font-bold text-carvao tracking-widest mt-1">{coupon.code}</p>
              <p className="text-sm font-medium text-green-600">Desconto: {coupon.discountPercent}%</p>
            </div>
            <button 
              onClick={() => handleDelete(coupon.id)} 
              className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
              title="Apagar Cupom"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}
        
        {coupons.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <Ticket className="mx-auto h-12 w-12 text-gray-300 mb-2" />
             <p className="text-gray-500">Nenhum Cupom ativo. Crie o primeiro acima!</p>
          </div>
        )}
      </div>
    </div>
  );
}