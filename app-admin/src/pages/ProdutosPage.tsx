import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ProdutoAdmin, Fornecedor } from '../types';
import { getAdminProdutos, deleteAdminProduto, getFornecedores } from '../services/apiService';
// 1. Importar o ícone de Edição
import { Trash2, Edit } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { ProdutoFormModal } from '../components/ProdutoFormModal';

// ... (Componente Card não muda) ...
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


export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 2. Criar estado para guardar o produto a ser editado
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAdmin | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDadosPagina() {
      try {
        setLoading(true);
        setError(null);
        const [produtosData, fornecedoresData] = await Promise.all([
          getAdminProdutos(),
          getFornecedores()
        ]);
        setProdutos(produtosData);
        setFornecedores(fornecedoresData);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setError("Falha ao carregar dados da página.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosPagina();
  }, []);

  // ... (Lógica de Apagar: handleApagarProduto e executarApagar não mudam) ...
  const handleApagarProduto = (id: string, nome: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Tem a certeza?</p>
        <p className="text-sm text-gray-600 mb-3">Quer mesmo apagar o produto "{nome}"?</p>
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
    const promise = deleteAdminProduto(id);
    toast.promise(promise, {
      loading: 'A apagar produto...',
      success: () => {
        setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== id));
        return 'Produto apagado com sucesso!';
      },
      error: 'Erro ao apagar o produto.',
    });
  };

  // --- 3. FUNÇÕES ATUALIZADAS PARA ADICIONAR E EDITAR ---

  // Abre o modal para CRIAR (limpa a seleção)
  const handleAdicionar = () => {
    setProdutoSelecionado(null);
    setIsModalOpen(true);
  };
  
  // Abre o modal para EDITAR (define a seleção)
  const handleEditar = (produto: ProdutoAdmin) => {
    setProdutoSelecionado(produto);
    setIsModalOpen(true);
  };
  
  // Função que o modal chama ao salvar (Criação OU Edição)
  const handleProdutoSalvo = (produtoSalvo: ProdutoAdmin) => {
    const produtoExiste = produtos.find(p => p.id === produtoSalvo.id);
    
    if (produtoExiste) {
      // É uma ATUALIZAÇÃO: substitui o produto na lista
      setProdutos(prev => 
        prev.map(p => 
          p.id === produtoSalvo.id ? produtoSalvo : p
        )
      );
    } else {
      // É uma CRIAÇÃO: adiciona o novo produto ao topo da lista
      setProdutos(prev => [produtoSalvo, ...prev]);
    }
  };


  if (loading) return <div>A carregar produtos...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-carvao">Gestão de Produtos</h1>
          
          {/* 4. Atualizar o botão para chamar handleAdicionar */}
          <button 
            onClick={handleAdicionar} // Ação do botão
            className="bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
          >
            + Adicionar Produto
          </button>
        </motion.div>

        <Card delay={0.1}>
          <h2 className="text-xl font-semibold mb-4 text-carvao">Meus Produtos</h2>
          {produtos.length === 0 ? (
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {produtos.map(produto => (
                <motion.li 
                  key={produto.id} 
                  className="py-3 flex justify-between items-center transition-transform duration-200 hover:scale-[1.01]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{produto.name}</p>
                    <p className="text-sm text-gray-500">{produto.code || 'Sem Código'}</p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold text-dourado">Custo: R$ {produto.costPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      Fornecedor: {fornecedores.find(f => f.id === produto.supplierId)?.name || 'N/A'}
                    </p>
                  </div>
                  
                  {/* --- 5. ADICIONAR OS BOTÕES DE AÇÃO --- */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditar(produto)}
                      className="p-2 rounded-full text-gray-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                      title="Editar Produto"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleApagarProduto(produto.id, produto.name)}
                      className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Apagar Produto"
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
      
      {/* --- 6. ATUALIZAR AS PROPS DO MODAL --- */}
      <ProdutoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // (Opcional: podia limpar a seleção aqui também)
        fornecedores={fornecedores}
        produtoParaEditar={produtoSelecionado} // Passa o produto a editar
        onProdutoSalvo={handleProdutoSalvo} // Prop corrigida
      />
    </>
  );
}