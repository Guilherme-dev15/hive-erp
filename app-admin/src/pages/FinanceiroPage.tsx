import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, X, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Imports Padronizados (Inglês)
import { getTransacoes, createTransacao, deleteTransacao } from '../services/apiService';
import type { Transacao } from '../types';
import { transacaoSchema, type TransacaoFormData } from '../types/schemas';

// --- UTILITÁRIOS ---
const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (date: any) => {
  if (!date) return '-';
  // Se vier do Firebase (Timestamp)
  if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('pt-BR');
  // Se vier como string ISO
  return new Date(date).toLocaleDateString('pt-BR');
};

// --- COMPONENTE DO MODAL (Nova Transação) ---
function TransacaoModal({ isOpen, onClose, onSuccess }: any) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      type: 'despesa',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0] // Data de hoje YYYY-MM-DD
    }
  });

  const onSubmit = async (data: TransacaoFormData) => {
    try {
      await createTransacao(data);
      toast.success("Lançamento salvo!");
      reset();
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">Novo Lançamento</h3>
              <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-700"/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              
              {/* Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <label className="cursor-pointer">
                  <input type="radio" value="venda" {...register("type")} className="peer sr-only" />
                  <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 transition-all font-bold text-gray-500">
                    Entrada
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" value="despesa" {...register("type")} className="peer sr-only" />
                  <div className="p-3 rounded-lg border-2 border-gray-100 text-center peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 transition-all font-bold text-gray-500">
                    Saída
                  </div>
                </label>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                <input 
                  {...register("description")} 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none" 
                  placeholder="Ex: Compra de Embalagens"
                />
                {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
              </div>

              {/* Valor e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                  <input 
                    type="number" step="0.01" {...register("amount")} 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none" 
                  />
                  {errors.amount && <span className="text-xs text-red-500">{errors.amount.message}</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                  <input 
                    type="date" {...register("date")} 
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none" 
                  />
                  {errors.date && <span className="text-xs text-red-500">{errors.date.message}</span>}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-carvao text-white rounded-lg font-bold hover:bg-gray-800 transition-all flex justify-center items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                Lançar
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- PÁGINA PRINCIPAL ---
export function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const data = await getTransacoes();
      setTransacoes(data);
    } catch (error) {
      toast.error("Erro ao carregar financeiro.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão?")) return;
    try {
      await deleteTransacao(id);
      setTransacoes(prev => prev.filter(t => t.id !== id));
      toast.success("Excluído.");
    } catch { toast.error("Erro ao excluir."); }
  };

  // Cálculos de Resumo
  const resumo = useMemo(() => {
    return transacoes.reduce((acc, t) => {
      const val = Number(t.amount) || 0;
      if (t.type === 'venda') {
        acc.entradas += val;
        acc.saldo += val;
      } else {
        acc.saidas += Math.abs(val); 
        acc.saldo -= Math.abs(val);  
      }
      return acc;
    }, { entradas: 0, saidas: 0, saldo: 0 });
  }, [transacoes]);

  const listaFiltrada = transacoes.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right"/>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-carvao">Financeiro</h1>
          <p className="text-gray-500 text-sm">Controle de caixa.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-carvao text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 shadow-md">
          <Plus size={20}/> Novo Lançamento
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-bold uppercase">Entradas</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
          </div>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(resumo.entradas)}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-bold uppercase">Saídas</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20}/></div>
          </div>
          <span className="text-2xl font-bold text-red-600">{formatCurrency(resumo.saidas)}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-bold uppercase">Saldo Atual</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={20}/></div>
          </div>
          <span className={`text-2xl font-bold ${resumo.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(resumo.saldo)}
          </span>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex gap-3">
           <Search className="text-gray-400" size={20}/>
           <input 
             placeholder="Filtrar lançamentos..." 
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
             className="outline-none w-full text-sm"
           />
        </div>

        {loading ? (
          <div className="p-10 text-center"><Loader2 className="animate-spin text-dourado mx-auto"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listaFiltrada.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.description}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.type === 'venda' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type === 'venda' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${t.type === 'venda' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'despesa' ? '-' : ''}{formatCurrency(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {listaFiltrada.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum lançamento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransacaoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); carregarDados(); }}
      />
    </div>
  );
}

// GARANTE QUE O ARQUIVO FUNCIONE TANTO COMO "import { FinanceiroPage }" QUANTO "import FinanceiroPage"
export default FinanceiroPage;