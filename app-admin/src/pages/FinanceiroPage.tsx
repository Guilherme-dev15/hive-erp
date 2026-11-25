import { useState, useEffect, useMemo, ReactNode } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Plus,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import {
  createTransacao,
  deleteTransacao,
  getTransacoes,
  updateTransactionStatus,
} from '../services/apiService';
import { formatCurrency } from '../utils/format';
import type { Transacao } from '../types';

type TabType = 'todos' | 'pagar' | 'receber';
type StatusFilter = 'todos' | 'PENDENTE' | 'PAGO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [newTrans, setNewTrans] = useState({
    description: '',
    amount: '',
    type: 'despesa' as 'receita' | 'despesa',
    category: 'Geral',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PENDENTE' as 'PENDENTE' | 'PAGO',
  });

  const carregar = async () => {
    try {
      setLoading(true);
      const data = await getTransacoes();
      setTransactions(
        data.map((transaction) => ({
          ...transaction,
          date: String(transaction.date),
          category: transaction.category ?? 'Geral',
          type: transaction.type === 'capital' ? 'venda' : transaction.type,
        }))
      );
    } catch (e) {
      console.error('Erro ao carregar finanças:', e);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const stats = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        const val = Number(t.amount) || 0;
        const isEntrada = t.type === 'receita' || t.type === 'venda';
        const isPago = t.status === 'PAGO';
        const isPendente = t.status === 'PENDENTE' || !t.status;

        if (isEntrada) {
          if (isPago) acc.recebido += val;
          if (isPendente) acc.aReceber += val;
        } else {
          if (isPago) acc.pago += Math.abs(val);
          if (isPendente) acc.aPagar += Math.abs(val);
        }

        acc.saldoRealizado = acc.recebido - acc.pago;
        acc.saldoPrevisto = acc.saldoRealizado + acc.aReceber - acc.aPagar;
        return acc;
      },
      { recebido: 0, pago: 0, aReceber: 0, aPagar: 0, saldoRealizado: 0, saldoPrevisto: 0 }
    );
  }, [transactions]);

  const chartData = useMemo(() => {
    return [
      { name: 'Recebido', value: stats.recebido, color: '#10b981' },
      { name: 'Pago', value: stats.pago, color: '#f43f5e' },
      { name: 'A Receber', value: stats.aReceber, color: '#3b82f6' },
      { name: 'A Pagar', value: stats.aPagar, color: '#f59e0b' },
    ];
  }, [stats]);

  const filteredTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === 'pagar' && (t.type === 'receita' || t.type === 'venda')) return false;
      if (activeTab === 'receber' && t.type === 'despesa') return false;

      // Status filter
      if (statusFilter !== 'todos') {
        const itemStatus = t.status || 'PENDENTE';
        if (itemStatus !== statusFilter) return false;
      }

      // Search term
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [transactions, activeTab, statusFilter, searchTerm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrans.description || !newTrans.amount) {
      toast.error('Preencha a descrição e o valor');
      return;
    }

    try {
      const payload: Omit<Transacao, 'id'> = {
        description: newTrans.description,
        amount: parseFloat(newTrans.amount.replace(',', '.')),
        type: newTrans.type,
        category: newTrans.category,
        date: new Date().toISOString(),
        dueDate: newTrans.dueDate ? new Date(newTrans.dueDate).toISOString() : undefined,
        status: newTrans.status,
      };

      const transacaoSalva = await createTransacao(payload);

      setTransactions((prev) => [
        {
          ...transacaoSalva,
          date: String(transacaoSalva.date),
          category: transacaoSalva.category ?? 'Geral',
          type: transacaoSalva.type === 'capital' ? 'venda' : transacaoSalva.type,
        },
        ...prev,
      ]);
      setShowModal(false);
      setNewTrans({
        description: '',
        amount: '',
        type: 'despesa',
        category: 'Geral',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'PENDENTE',
      });
      toast.success('Lançamento cadastrado com sucesso!');
    } catch (e) {
      console.error('Erro ao salvar transação:', e);
      toast.error('Erro ao registrar lançamento');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
    try {
      await updateTransactionStatus(id, nextStatus);
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      toast.success(nextStatus === 'PAGO' ? 'Baixa realizada! Marcado como Pago.' : 'Lançamento reaberto como Pendente.');
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    try {
      await deleteTransacao(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Lançamento excluído com sucesso');
    } catch (e) {
      console.error('Erro ao excluir transação:', e);
      toast.error('Erro ao excluir');
    }
  };

  const isOverdue = (dueDate?: any, status?: string) => {
    if (status === 'PAGO' || !dueDate) return false;
    const dStr = typeof dueDate === 'string' ? dueDate : dueDate.seconds ? new Date(dueDate.seconds * 1000).toISOString() : '';
    if (!dStr) return false;
    return new Date(dStr).setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  };

  const formatDueDate = (dueDate?: any) => {
    if (!dueDate) return '-';
    try {
      if (typeof dueDate === 'string') return new Date(dueDate).toLocaleDateString('pt-BR');
      if (dueDate.seconds) return new Date(dueDate.seconds * 1000).toLocaleDateString('pt-BR');
      return new Date(dueDate).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-amber-500 border-t-transparent"></div>
          <p className="text-gray-400 font-medium text-sm animate-pulse">
            Carregando controle financeiro...
          </p>
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
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Financeiro & Contas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Contas a Pagar, Contas a Receber, Vencimentos e Fluxo de Caixa Integrado
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* CARDS DE KPI FINANCEIRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Saldo em Caixa (Realizado)"
          value={stats.saldoRealizado}
          icon={<Wallet size={22} className="text-white" />}
          bgClass="bg-slate-900"
          textClass="text-amber-400"
          subTextClass="text-gray-400"
        />
        <StatsCard
          title="Contas a Receber (Pendente)"
          value={stats.aReceber}
          icon={<ArrowUpRight size={22} className="text-emerald-600" />}
          bgClass="bg-white"
          textClass="text-emerald-600"
          subTextClass="text-gray-400"
          borderClass="border-emerald-100"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          title="Contas a Pagar (Pendente)"
          value={stats.aPagar}
          icon={<ArrowDownRight size={22} className="text-amber-600" />}
          bgClass="bg-white"
          textClass="text-amber-600"
          subTextClass="text-gray-400"
          borderClass="border-amber-100"
          iconBg="bg-amber-50"
        />
        <StatsCard
          title="Saldo Projetado (Futuro)"
          value={stats.saldoPrevisto}
          icon={<TrendingUp size={22} className="text-indigo-600" />}
          bgClass="bg-white"
          textClass={stats.saldoPrevisto >= 0 ? 'text-indigo-600' : 'text-rose-600'}
          subTextClass="text-gray-400"
          borderClass="border-indigo-100"
          iconBg="bg-indigo-50"
        />
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'todos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Fluxo Completo ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('pagar')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pagar'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <TrendingDown size={16} /> Contas a Pagar
          </button>
          <button
            onClick={() => setActiveTab('receber')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'receber'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <TrendingUp size={16} /> Contas a Receber
          </button>
        </div>

        {/* FILTRO DE STATUS */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
          {(['todos', 'PENDENTE', 'PAGO'] as StatusFilter[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {st === 'todos' ? 'Todos' : st === 'PENDENTE' ? 'Pendentes' : 'Pagos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MINI GRÁFICO */}
        <motion.div
          variants={itemVariants}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-1">
              Balanço Financeiro
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Realizado vs. A Vencer
            </p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    width={70}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Taxa de Quitação:</span>
              <span className="font-bold text-gray-800">
                {stats.recebido + stats.pago > 0
                  ? `${Math.round(((stats.recebido + stats.pago) / (stats.recebido + stats.pago + stats.aReceber + stats.aPagar || 1)) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Previsão Liquidez:</span>
              <span className={`font-bold ${stats.saldoPrevisto >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(stats.saldoPrevisto)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* LISTAGEM DE LANÇAMENTOS */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-h-[460px]"
        >
          {/* Busca */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-3">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Tabela de Lançamentos */}
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                <AnimatePresence>
                  {filteredTransactions.map((t) => {
                    const isEntrada = t.type === 'receita' || t.type === 'venda';
                    const isPaid = t.status === 'PAGO';
                    const overdue = isOverdue(t.dueDate, t.status);

                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="group hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isEntrada
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {isEntrada ? (
                                <TrendingUp size={16} />
                              ) : (
                                <TrendingDown size={16} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {t.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(t.date as string).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            {overdue && <AlertTriangle size={14} className="text-rose-500" />}
                            <span
                              className={`font-medium ${
                                overdue
                                  ? 'text-rose-600 font-bold'
                                  : isPaid
                                  ? 'text-gray-500'
                                  : 'text-amber-700'
                              }`}
                            >
                              {formatDueDate(t.dueDate)}
                            </span>
                          </div>
                          {overdue && (
                            <span className="text-[10px] text-rose-500 font-bold block">
                              Vencido
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">
                            {t.category || 'Geral'}
                          </span>
                        </td>
                        <td className="p-4">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                              <CheckCircle2 size={12} /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                              <Clock size={12} /> Pendente
                            </span>
                          )}
                        </td>
                        <td
                          className={`p-4 text-right font-bold ${
                            isEntrada ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isEntrada ? '+' : '-'} {formatCurrency(Number(t.amount))}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(t.id, t.status)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                isPaid
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                              }`}
                              title={isPaid ? 'Reabrir como Pendente' : 'Confirmar Pagamento/Baixa'}
                            >
                              {isPaid ? (
                                <>
                                  <RotateCcw size={12} /> Reabrir
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={12} /> Baixar
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Excluir lançamento"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      Nenhum lançamento financeiro encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* MODAL NOVO LANÇAMENTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus size={20} className="text-amber-500" />
                Novo Lançamento Financeiro
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Descrição
                </label>
                <input
                  value={newTrans.description}
                  onChange={(e) =>
                    setNewTrans({ ...newTrans, description: e.target.value })
                  }
                  required
                  placeholder="Ex: Fornecedor Madeiras, Aluguel, Venda Balcão..."
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTrans.amount}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, amount: e.target.value })
                    }
                    required
                    placeholder="0.00"
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Tipo
                  </label>
                  <select
                    value={newTrans.type}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, type: e.target.value as 'receita' | 'despesa' })
                    }
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="despesa">Conta a Pagar (Saída)</option>
                    <option value="receita">Conta a Receber (Entrada)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={newTrans.dueDate}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, dueDate: e.target.value })
                    }
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase">
                    Status Inicial
                  </label>
                  <select
                    value={newTrans.status}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, status: e.target.value as 'PENDENTE' | 'PAGO' })
                    }
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="PAGO">Pago / Liquidado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 uppercase">
                  Categoria
                </label>
                <select
                  value={newTrans.category}
                  onChange={(e) =>
                    setNewTrans({ ...newTrans, category: e.target.value })
                  }
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Geral">Geral</option>
                  <option value="Fornecedores">Fornecedores</option>
                  <option value="Aluguel e Contas">Aluguel e Contas</option>
                  <option value="Salários e Pessoal">Salários e Pessoal</option>
                  <option value="Impostos e Taxas">Impostos e Taxas</option>
                  <option value="Venda Direta">Venda Direta</option>
                  <option value="Serviços">Serviços</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  bgClass: string;
  textClass: string;
  subTextClass: string;
  borderClass?: string;
  iconBg?: string;
}

function StatsCard({
  title,
  value,
  icon,
  bgClass,
  textClass,
  subTextClass,
  borderClass,
  iconBg,
}: StatsCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={`p-5 rounded-2xl shadow-sm border ${borderClass || 'border-transparent'} ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg || 'bg-white/10'}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-bold tracking-tight ${textClass}`}>
          {formatCurrency(value)}
        </h3>
        <p className={`text-xs font-medium mt-1 ${subTextClass}`}>{title}</p>
      </div>
    </motion.div>
  );
}
