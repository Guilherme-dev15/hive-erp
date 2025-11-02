import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Transacao } from '../types/index.ts';
import { getTransacoes, createTransacao, deleteTransacao } from '../services/apiService.tsx';
import { toast, Toaster } from 'react-hot-toast'; 
import { Trash2, Edit } from 'lucide-react'; // 1. Importar o ícone de Editar
// 2. Importar o novo Modal de Edição
import { TransacaoEditModal } from '../components/TransacaoEditModal.tsx'; 

// Componente Card
const Card = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent ${className}`}
  >
    {children}
  </motion.div>
);

// Componente FormularioNovaTransacao (O formulário de CRIAR)
function FormularioNovaTransacao({ onTransacaoCriada }: { onTransacaoCriada: (novaTransacao: Transacao) => void }) {
  const [type, setType] = useState<'venda' | 'despesa'>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    const amountNumber = parseFloat(amount);
    
    const novaTransacao: Omit<Transacao, 'id'> = {
      type,
      amount: type === 'despesa' ? -Math.abs(amountNumber) : Math.abs(amountNumber),
      description,
      date, // Enviamos como string "YYYY-MM-DD"
    };

    try {
      const transacaoSalva = await createTransacao(novaTransacao);
      toast.success(`Transação de ${type} registada!`);
      onTransacaoCriada(transacaoSalva); 
      setDescription('');
      setAmount('');
    } catch (error) {
      toast.error("Erro ao salvar transação.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // O JSX do formulário de criação
  return (
    <Card className="hover:border-prata">
      <h2 className="text-xl font-semibold mb-4 text-carvao">Registar Nova Transação</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tabs de Venda / Despesa */}
        <div className="grid grid-cols-2 gap-2 rounded-lg p-1 bg-off-white">
          <button
            type="button"
            onClick={() => setType('venda')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${type === 'venda' ? 'bg-dourado text-carvao shadow' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Receita (Venda)
          </button>
          <button
            type="button"
            onClick={() => setType('despesa')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${type === 'despesa' ? 'bg-carvao text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
          >
            Despesa
          </button>
        </div>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Descrição (ex: Embalagens, Venda Anel X)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
          />
          <div className="grid grid-cols-2 gap-3">
             <input
              type="number"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
            />
             <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-gray-700"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full px-4 py-2 rounded-lg text-white font-semibold transition-colors
            ${type === 'venda' ? 'bg-dourado hover:bg-yellow-600' : 'bg-carvao hover:bg-gray-700'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'A registar...' : `Registar ${type === 'venda' ? 'Receita' : 'Despesa'}`}
        </button>
      </form>
    </Card>
  );
}
// ============================================================================
// FIM DO FORMULÁRIO DE CRIAÇÃO
// ============================================================================


// Componente Principal da Página
export function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Estados para controlar o NOVO Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transacao | null>(null);


  useEffect(() => {
    async function carregarTransacoes() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTransacoes();
        setTransacoes(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError("Falha ao carregar transações.");
      } finally {
        setLoading(false);
      }
    }
    carregarTransacoes();
  }, []);

  // Adiciona a nova transação ao topo da lista
  const handleTransacaoCriada = (novaTransacao: Transacao) => {
    setTransacoes(prevTransacoes => [novaTransacao, ...prevTransacoes]);
  };

  // Lógica de Apagar
  const handleApagarTransacao = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Tem a certeza?</p>
        <p className="text-sm text-gray-600 mb-3">Quer mesmo apagar a transação "{nome}"?</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              toast.dismiss(t.id);
              executarApagar(id);
            }}
          >
            Apagar
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const executarApagar = async (id: string) => {
    const promise = deleteTransacao(id);
    toast.promise(promise, {
      loading: 'A apagar transação...',
      success: () => {
        setTransacoes(prev => prev.filter(t => t.id !== id));
        return 'Transação apagada com sucesso!';
      },
      error: 'Erro ao apagar a transação.',
    });
  };

  // --- 4. NOVAS FUNÇÕES PARA EDITAR ---
  
  // Abre o modal para EDITAR uma transação
  const handleEditar = (transacao: Transacao) => {
    setTransacaoSelecionada(transacao); // Define a transação a editar
    setIsEditModalOpen(true);
  };
  
  // Chamada quando o modal de edição salva
  const handleTransacaoSalva = (transacaoAtualizada: Transacao) => {
    // Atualiza a transação na lista
    setTransacoes(prev => 
      prev.map(t => 
        t.id === transacaoAtualizada.id ? transacaoAtualizada : t
      )
    );
  };
  // --- FIM DAS NOVAS FUNÇÕES ---

  // Calcula o Saldo Total
  const saldoTotal = useMemo(() => {
    return transacoes.reduce((acc, t) => acc + t.amount, 0);
  }, [transacoes]); 

  if (loading) return <div>A carregar financeiro...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda (Formulário e Saldo) */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-between items-center"
          >
            <h1 className="text-3xl font-bold text-carvao">Financeiro</h1>
          </motion.div>

          <Card>
            <h2 className="text-lg font-semibold text-gray-500">Saldo Atual</h2>
            <p className={`text-4xl font-bold ${saldoTotal >= 0 ? 'text-dourado' : 'text-red-500'}`}>
              R$ {saldoTotal.toFixed(2)}
            </p>
          </Card>
          
          <FormularioNovaTransacao onTransacaoCriada={handleTransacaoCriada} />
        </div>

        {/* Coluna da Direita (Histórico) */}
        <div className="lg:col-span-2">
          <Card delay={0.1}>
            <h2 className="text-xl font-semibold mb-4 text-carvao">Histórico de Transações</h2>
            
            {transacoes.length === 0 ? (
              <p className="text-gray-500">Nenhuma transação encontrada.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {transacoes.map(t => (
                  <motion.li 
                    key={t.id} 
                    className="py-3 flex justify-between items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout 
                  >
                    <div>
                      <p className="font-medium text-gray-900">{t.description}</p>
                      <p className="text-sm text-gray-500">
                        {/* 5. A data (tipo 'any') tem a propriedade 'seconds' */}
                        {t.date ? new Date(t.date.seconds * 1000).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Data Inválida'} - 
                        <span className={`capitalize font-medium ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{t.type}</span>
                      </p>
                    </div>
                    {/* 6. Botões de Ação Atualizados */}
                    <div className="flex items-center gap-1">
                      <p className={`text-lg font-semibold ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.amount >= 0 ? '+' : ''} R$ {t.amount.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleEditar(t)}
                        className="p-2 rounded-full text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                        title="Editar Transação"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleApagarTransacao(t.id, t.description)}
                        className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Apagar Transação"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* 7. Renderizar o NOVO Modal de Edição */}
      <TransacaoEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        transacaoParaEditar={transacaoSelecionada}
        onTransacaoSalva={handleTransacaoSalva}
      />
    </>
  );
}