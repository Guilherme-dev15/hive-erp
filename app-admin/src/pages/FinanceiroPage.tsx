import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Trash2, Edit, Loader2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

// Tipos e Serviços
import { Transacao } from '../types'; // Removido .ts (não necessário no import)
import { getTransacoes, createTransacao, deleteTransacao } from '../services/apiService';

// Componentes
import { TransacaoEditModal } from '../components/TransacaoEditModal';

// --- FUNÇÕES UTILITÁRIAS BLINDADAS (Anti-Erro) ---
const formatMoney = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (date: any) => {
  if (!date) return '-';
  // Se for Timestamp do Firestore
  if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  // Se for string ou Date normal
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// --- COMPONENTE CARD ---
const Card = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`bg-white shadow-lg rounded-xl p-6 border border-gray-100 ${className}`}
  >
    {children}
  </motion.div>
);

// --- FORMULÁRIO DE NOVA TRANSAÇÃO ---
function FormularioNovaTransacao({ onTransacaoCriada }: { onTransacaoCriada: (novaTransacao: Transacao) => void }) {
  const [type, setType] = useState<'venda' | 'despesa'>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      toast.error("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    const amountNumber = parseFloat(amount);
    
    // Regra de Negócio: Venda é positivo, Despesa é negativo
    const finalAmount = type === 'despesa' ? -Math.abs(amountNumber) : Math.abs(amountNumber);

    const novaTransacao: any = { // 'any' temporário para compatibilidade de criação
      type,
      amount: finalAmount,
      description,
      date, 
    };

    try {
      const transacaoSalva = await createTransacao(novaTransacao);
      toast.success(`${type === 'venda' ? 'Receita' : 'Despesa'} registrada!`);
      onTransacaoCriada(transacaoSalva); 
      
      // Limpar formulário
      setDescription('');
      setAmount('');
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-carvao">
      <h2 className="text-lg font-bold mb-4 text-carvao flex items-center gap-2">
        <DollarSign className="text-dourado" size={20} /> Novo Lançamento
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Tipo */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setType('venda')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2
              ${type === 'venda' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <TrendingUp size={16} /> Receita
          </button>
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2
              ${type === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <TrendingDown size={16} /> Despesa
          </button>
        </div>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Descrição (ex: Conta de Luz)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
             <input
              type="number"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm"
            />
             <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm text-gray-600"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2
            ${type === 'venda' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            ${loading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Lançar'}
        </button>
      </form>
    </Card>
  );
}

// --- PÁGINA PRINCIPAL ---
export function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados do Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transacao | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const data = await getTransacoes();
        setTransacoes(data);
      } catch (err) {
        setError("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  const handleTransacaoCriada = (novaTransacao: Transacao) => {
    setTransacoes(prev => [novaTransacao, ...prev]);
  };

  const handleApagarTransacao = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-bold text-gray-800">Apagar "{nome}"?</p>
        <p className="text-xs text-gray-500 mb-3">Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 text-xs font-bold bg-gray-200 rounded hover:bg-gray-300" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
          <button 
            className="px-3 py-1 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700" 
            onClick={() => { toast.dismiss(t.id); executarApagar(id); }}
          >
            Confirmar
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const executarApagar = async (id: string) => {
    try {
      await deleteTransacao(id);
      setTransacoes(prev => prev.filter(t => t.id !== id));
      toast.success("Apagado com sucesso.");
    } catch (e) {
      toast.error("Erro ao apagar.");
    }
  };

  const handleEditar = (transacao: Transacao) => {
    setTransacaoSelecionada(transacao);
    setIsEditModalOpen(true);
  };
  
  const handleTransacaoSalva = (atualizada: Transacao) => {
    setTransacoes(prev => prev.map(t => t.id === atualizada.id ? atualizada : t));
  };

  const saldoTotal = useMemo(() => transacoes.reduce((acc, t) => acc + (t.amount || 0), 0), [transacoes]); 

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-dourado" /></div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
        
        {/* Esquerda: Saldo e Formulário */}
        <div className="lg:col-span-1 space-y-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-carvao"
          >
            Fluxo de Caixa
          </motion.h1>

          <Card className="bg-carvao text-white border-none relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Saldo Atual</h2>
              <p className={`text-4xl font-bold ${saldoTotal >= 0 ? 'text-dourado' : 'text-red-400'}`}>
                {formatMoney(saldoTotal)}
              </p>
            </div>
            {/* Efeito decorativo */}
            <div className="absolute -right-6 -bottom-6 text-white opacity-5">
              <DollarSign size={120} />
            </div>
          </Card>
          
          <FormularioNovaTransacao onTransacaoCriada={handleTransacaoCriada} />
        </div>

        {/* Direita: Lista de Transações */}
        <div className="lg:col-span-2">
          <Card delay={0.1} className="h-full">
            <h2 className="text-xl font-bold mb-6 text-carvao flex items-center gap-2">
              Histórico <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{transacoes.length} registros</span>
            </h2>
            
            {transacoes.length === 0 ? (
              <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
                <DollarSign size={40} className="mx-auto mb-2 opacity-20" />
                <p>Nenhuma transação registrada ainda.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {transacoes.map(t => (
                  <motion.li 
                    key={t.id} 
                    className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded-lg transition-colors group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout 
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.type === 'venda' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'venda' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{t.description || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-400 font-mono">{formatDate(t.date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className={`text-sm font-bold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''} {formatMoney(t.amount)}
                      </p>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditar(t)}
                          className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleApagarTransacao(t.id, t.description)}
                          className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Apagar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <TransacaoEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transacaoParaEditar={transacaoSelecionada}
        onTransacaoSalva={handleTransacaoSalva}
      />
    </>
  );
}