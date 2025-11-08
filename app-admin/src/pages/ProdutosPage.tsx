import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ProdutoAdmin, Fornecedor, Category } from '../types';
// 1. Corrigido: Importar 'deleteAdminProduto'
import { getAdminProdutos, deleteAdminProduto, getFornecedores, getCategories } from '../services/apiService';
import { Trash2, Edit, Package } from 'lucide-react';
// 2. Corrigido: Importar 'toast'
import { toast, Toaster } from 'react-hot-toast';
import { ProdutoFormModal } from '../components/ProdutoFormModal';

// --- Card de Admin (Reutilizável) ---
interface ProdutoAdminCardProps {
  produto: ProdutoAdmin;
  fornecedorNome: string;
  onEditar: () => void;
  onApagar: () => void;
}

// O seu componente de Card (está perfeito, sem alterações)
const ProdutoAdminCard: React.FC<ProdutoAdminCardProps> = ({ produto, fornecedorNome, onEditar, onApagar }) => {
  const custo = produto.costPrice || 0;
  const venda = produto.salePrice || 0;
  const lucro = venda > 0 ? venda - custo : 0;
  const statusCor = produto.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl border border-gray-200 flex flex-col h-full overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="relative w-full overflow-hidden">
        {/* Imagem ou Placeholder */}
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {produto.imageUrl ? (
            <img src={produto.imageUrl} alt={produto.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={32} className="text-prata" />
          )}
        </div>
        {/* Tag de Status */}
        <span className={`absolute top-2 left-2 text-xs font-medium px-2.5 py-0.5 rounded ${statusCor}`}>
          {produto.status}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <p className="text-sm text-gray-500">{produto.category || 'Sem Categoria'}</p>
          <h3 className="font-semibold text-lg text-carvao">{produto.name}</h3>
          <p className="text-sm text-gray-500 font-mono mb-2">{produto.code || 'N/A'}</p>
          <p className="text-sm text-dourado font-semibold">Fornecedor: {fornecedorNome}</p>
        </div>

        {/* Finanças */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Custo:</span>
            <span className="font-medium text-red-600">R$ {custo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Venda:</span>
            <span className="font-medium text-green-600">R$ {venda.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-carvao">Lucro:</span>
            <span className="text-carvao">R$ {lucro.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex border-t border-gray-100 bg-gray-50">
        <button
          onClick={onEditar}
          className="flex-1 p-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Edit size={16} className="inline mr-1" /> Editar
        </button>
        <button
          onClick={onApagar}
          className="flex-1 p-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
        >
          <Trash2 size={16} className="inline mr-1" /> Apagar
        </button>
      </div>
    </motion.div>
  );
};


// ============================================================================
// Componente Principal da Página
// ============================================================================
export function ProdutosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 3. Corrigido: Faltava o 'setProdutoSelecionado'
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAdmin | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");

  // Carrega todos os dados (Produtos, Fornecedores, Categorias)
  useEffect(() => {
    async function carregarDadosPagina() {
      try {
        setLoading(true);
        setError(null);
        const [produtosData, fornecedoresData, categoriesData] = await Promise.all([
          getAdminProdutos(),
          getFornecedores(),
          getCategories()
        ]);
        setProdutos(produtosData);
        setFornecedores(fornecedoresData);
        setCategories(categoriesData);
      } catch (err) {
        setError("Falha ao carregar dados da página.");
      } finally {
        setLoading(false);
      }
    }
    carregarDadosPagina();
  }, []);

  // --- LÓGICA DE FILTRAGEM (O seu código está perfeito) ---
  const produtosFiltrados = useMemo(() => {
    if (categoryFilter === "Todos") {
      return produtos;
    }
    if (categoryFilter === "Sem Categoria") {
      return produtos.filter(p => !p.category);
    }
    return produtos.filter(p => p.category === categoryFilter);
  }, [produtos, categoryFilter]);

  const getFornecedorNome = (id: string) => {
    return fornecedores.find(f => f.id === id)?.name || 'N/A';
  };

  // --- 4. RESTAURADA: Lógica de Apagar ---
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
  
  // --- 5. RESTAURADA: Função 'executarApagar' ---
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
  
  // --- 6. RESTAURADA: Funções de Adicionar e Editar ---
  const handleAdicionar = () => {
    setProdutoSelecionado(null); // Limpa a seleção
    setIsModalOpen(true);
  };
  
  const handleEditar = (produto: ProdutoAdmin) => {
    setProdutoSelecionado(produto); // Define o produto a editar
    setIsModalOpen(true);
  };

  // --- 7. RESTAURADA: Lógica de Salvar (Criação/Edição) ---
  const handleProdutoSalvo = (produtoSalvo: ProdutoAdmin) => {
    const produtoExiste = produtos.find(p => p.id === produtoSalvo.id);
    if (produtoExiste) {
      // Atualiza o produto na lista
      setProdutos(prev => prev.map(p => (p.id === produtoSalvo.id ? produtoSalvo : p)));
    } else {
      // Adiciona o novo produto à lista
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
          className="flex flex-col md:flex-row justify-between md:items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-carvao">Gestão de Produtos</h1>
          <div className="flex gap-4">
            {/* Filtro de Categoria (O seu código está perfeito) */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-dourado"
            >
              <option value="Todos">Todas as Categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="Sem Categoria">Sem Categoria</option>
            </select>

            <button
              onClick={handleAdicionar} // Função agora funciona
              className="bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 transform hover:scale-105"
            >
              + Adicionar Produto
            </button>
          </div>
        </motion.div>

        {/* Listagem em Grid (O seu código está perfeito) */}
        {produtosFiltrados.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-gray-500 py-10">
            <p>Nenhum produto encontrado {categoryFilter !== 'Todos' && `na categoria "${categoryFilter}"`}.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtosFiltrados.map(produto => (
              <ProdutoAdminCard
                key={produto.id}
                produto={produto}
                fornecedorNome={getFornecedorNome(produto.supplierId)}
                onEditar={() => handleEditar(produto)} // Função agora funciona
                onApagar={() => handleApagarProduto(produto.id, produto.name)} // Função agora funciona
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ProdutoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // 8. Corrigido: Adicionada a prop 'onClose'
        fornecedores={fornecedores}
        categories={categories}
        setCategories={setCategories}
        produtoParaEditar={produtoSelecionado} // Prop agora é atualizada
        onProdutoSalvo={handleProdutoSalvo} // Função agora funciona
      />
    </>
  );
}