import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Trash2, Plus, Search, 
  Wallet, ArrowUpRight, ArrowDownRight, Filter, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

import { apiClient } from '../services/apiService';
import { formatCurrency } from '../utils/format';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa' | 'venda';
  date: string;
  category: string;
}

// Variantes de animação (Padrão Cascata)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado do Formulário
  const [newTrans, setNewTrans] = useState({ 
    description: '', 
    amount: '', 
    type: 'despesa', 
    category: 'Geral' 
  });

  // --- CARREGAMENTO ---
  const carregar = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/transactions');
      setTransactions(res.data);
    } catch (e) {
      toast.error("Erro ao carregar finanças");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  // --- CÁLCULOS EM TEMPO REAL ---
  const stats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const val = Number(t.amount);
      const isEntrada = t.type === 'receita' || t.type === 'venda';
      
      if (isEntrada) {
        acc.entradas += val;
      } else {
        acc.saidas += Math.abs(val);
      }
      acc.saldo = acc.entradas - acc.saidas;
      return acc;
    }, { entradas: 0, saidas: 0, saldo: 0 });
  }, [transactions]);

  // --- DADOS PARA O GRÁFICO (Top 5 Categorias ou Simplificado) ---
  const chartData = useMemo(() => {
    return [
      { name: 'Entradas', value: stats.entradas, color: '#10b981' },
      { name: 'Saídas', value: stats.saidas, color: '#f43f5e' },
      { name: 'Saldo', value: stats.saldo, color: '#6366f1' },
    ];
  }, [stats]);

  // --- FILTRO DE BUSCA ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // --- AÇÕES ---
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTrans.description || !newTrans.amount) {
      toast.error("Preencha descrição e valor");
      return;
    }

    try {
      const payload = {
        ...newTrans,
        amount: parseFloat(newTrans.amount.replace(',', '.')), // Garante formato number
        date: new Date().toISOString()
      };
      
      const res = await apiClient.post('/admin/transactions', payload);
      
      // Atualização Otimista
      setTransactions(prev => [{ id: res.data.id, ...payload } as Transaction, ...prev]);
      setNewTrans({ description: '', amount: '', type: 'despesa', category: 'Geral' });
      toast.success("Lançamento registrado!");
    } catch(e) { 
      toast.error("Erro ao salvar"); 
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Excluir este lançamento?")) return;
    try {
      await apiClient.delete(`/admin/transactions/${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success("Excluído com sucesso");
    } catch(e) { toast.error("Erro ao excluir"); }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-400 font-medium text-sm animate-pulse">Carregando financeiro...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster position="top-right"/>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie entradas e saídas manualmente.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
           <Download size={16} /> Exportar Extrato
        </button>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatsCard 
          title="Saldo Atual" 
          value={stats.saldo} 
          icon={<Wallet size={24} className="text-white"/>}
          bgClass="bg-indigo-600"
          textClass="text-white"
          subTextClass="text-indigo-200"
        />
        <StatsCard 
          title="Total Receitas" 
          value={stats.entradas} 
          icon={<ArrowUpRight size={24} className="text-emerald-600"/>}
          bgClass="bg-white"
          textClass="text-gray-900"
          subTextClass="text-gray-400"
          borderClass="border-emerald-100"
          iconBg="bg-emerald-50"
        />
        <StatsCard 
          title="Total Despesas" 
          value={stats.saidas} 
          icon={<ArrowDownRight size={24} className="text-rose-600"/>}
          bgClass="bg-white"
          textClass="text-gray-900"
          subTextClass="text-gray-400"
          borderClass="border-rose-100"
          iconBg="bg-rose-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO + GRÁFICO */}
        <div className="space-y-6">
          {/* FORMULÁRIO "QUICK ADD" */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Novo Lançamento
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descrição</label>
                <input 
                  value={newTrans.description} 
                  onChange={e => setNewTrans({...newTrans, description: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium"
                  placeholder="Ex: Conta de Luz, Venda Balcão..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Valor (R$)</label>
                  <input 
                    type="number"
                    value={newTrans.amount} 
                    onChange={e => setNewTrans({...newTrans, amount: e.target.value})}
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
                  <select 
                    value={newTrans.type} 
                    onChange={e => setNewTrans({...newTrans, type: e.target.value as any})}
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="despesa">Saída (-)</option>
                    <option value="receita">Entrada (+)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </motion.div>

          {/* MINI GRÁFICO DE BALANÇO */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hidden lg:block">
             <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Resumo Financeiro</h3>
             <div className="h-40 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0"/>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} width={60}/>
                    <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </motion.div>
        </div>

        {/* COLUNA DIREITA: LISTA DE TRANSAÇÕES */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-fit min-h-[500px]">
          {/* Barra de Filtro */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-3">
             <div className="relative flex-grow">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Buscar lançamentos..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
               />
             </div>
             <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
               <Filter size={18} />
             </button>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence>
                  {filteredTransactions.map((t) => {
                    const isEntrada = t.type === 'receita' || t.type === 'venda';
                    return (
                      <motion.tr 
                        key={t.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="group hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isEntrada ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {isEntrada ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">{t.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                           {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                           <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">
                             {t.category}
                           </span>
                        </td>
                        <td className={`p-4 text-right font-bold text-sm ${isEntrada ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isEntrada ? '+' : '-'} {formatCurrency(Number(t.amount))}
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => handleDelete(t.id)} 
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Excluir lançamento"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Componente de Card Reutilizável com Design System
function StatsCard({ title, value, icon, bgClass, textClass, subTextClass, borderClass, iconBg }: any) {
  return (
    <motion.div 
      variants={itemVariants} 
      className={`p-6 rounded-2xl shadow-sm border ${borderClass || 'border-transparent'} ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${iconBg || 'bg-white/20'}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-3xl font-bold tracking-tight ${textClass}`}>
          {formatCurrency(value)}
        </h3>
        <p className={`text-sm font-medium mt-1 ${subTextClass}`}>
          {title}
        </p>
      </div>
    </motion.div>
  );
}