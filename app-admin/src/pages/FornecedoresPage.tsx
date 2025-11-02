import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fornecedor } from '../types/index.ts';
// 1. Importar 'deleteFornecedor' (necessário para apagar)
import { getFornecedores, deleteFornecedor } from '../services/apiService.tsx';
import { toast, Toaster } from 'react-hot-toast'; 
import { Trash2, Edit, Link as LinkIcon } from 'lucide-react'; 
// 2. Importar o Modal de Fornecedor (e não o de Produto)
import { FornecedorFormModal } from '../components/FornecedorFormModal.tsx';

// Componente Card
const Card = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent hover:border-prata transition-colors"
  >
    {children}
  </motion.div>
);

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<Fornecedor | null>(null);

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        setLoading(true);
        setError(null);
        const data = await getFornecedores();
        setFornecedores(data);
      } catch (err) {
        setError("Falha ao carregar fornecedores.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarFornecedores();
  }, []);

  // Lógica de Apagar
  const handleApagarFornecedor = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Tem a certeza?</p>
        <p className="text-sm text-gray-600 mb-3">Quer mesmo apagar "{nome}"?</p>
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
    const promise = deleteFornecedor(id);
    toast.promise(promise, {
      loading: 'A apagar fornecedor...',
      success: () => {
        setFornecedores(prev => prev.filter(f => f.id !== id));
        return 'Fornecedor apagado com sucesso!';
      },
      error: 'Erro ao apagar o fornecedor.',
    });
  };

  
  // --- A LÓGICA DE ADICIONAR/EDITAR ---
  
  // Abre o modal para CRIAR
  const handleAdicionar = () => {
    setFornecedorSelecionado(null); 
    setIsModalOpen(true);
  };

  // Abre o modal para EDITAR
  const handleEditar = (fornecedor: Fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setIsModalOpen(true);
  };
  
  // 3. ESTA É A FUNÇÃO QUE O MODAL VAI CHAMAR
  // O nome (handleFornecedorSalvo) deve corresponder ao que passamos na prop
  const handleFornecedorSalvo = (fornecedorSalvo: Fornecedor) => {
    const fornecedorExiste = fornecedores.find(f => f.id === fornecedorSalvo.id);
    
    if (fornecedorExiste) {
      // Atualiza o item na lista
      setFornecedores(prev => 
        prev.map(f => 
          f.id === fornecedorSalvo.id ? fornecedorSalvo : f
        )
      );
    } else {
      // Adiciona o novo item à lista
      setFornecedores(prev => [fornecedorSalvo, ...prev]);
    }
  };


  if (loading) return <div>A carregar fornecedores...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-between items-center"
        >
          <h1 className="text-3xl font-bold text-carvao">Gestão de Fornecedores</h1>
          
          <button 
            onClick={handleAdicionar} // Chama a função de adicionar
            className="bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
          >
            + Adicionar Fornecedor
          </button>
        </motion.div>

        <Card delay={0.1}>
          <h2 className="text-xl font-semibold mb-4 text-carvao">Meus Fornecedores</h2>
          
          {fornecedores.length === 0 ? (
            <p className="text-gray-500">Nenhum fornecedor encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {fornecedores.map(f => (
                <motion.li 
                  key={f.id} 
                  className="py-4 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <div className="flex-1">
                    <a 
                      href={f.url || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`font-medium text-lg ${f.url ? 'text-indigo-600 hover:underline' : 'text-gray-900'}`}
                    >
                      {f.name}
                    </a>
                    <p className="text-sm text-dourado font-semibold">{f.contactPhone || 'Sem telefone'}</p>
                    {f.url && (
                      <span className="text-sm text-indigo-600 flex items-center">
                        <LinkIcon size={14} className="mr-1" />
                        {f.url}
                      </span>
                    )}
                    <p className="text-sm text-gray-500 mt-1">{f.paymentTerms || 'Sem condições de pagamento'}</p>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditar(f)} // Chama a função de editar
                      className="p-2 rounded-full text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                      title="Editar Fornecedor"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleApagarFornecedor(f.id, f.name)}
                      className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Apagar Fornecedor"
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
      
      {/* --- A CORREÇÃO ESTÁ AQUI --- */}
      {/* 4. Garantir que a prop 'onFornecedorSalvo' está a ser passada CORRETAMENTE */}
      <FornecedorFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fornecedorParaEditar={fornecedorSelecionado}
        onFornecedorSalvo={handleFornecedorSalvo} 
      />
    </>
  );
}