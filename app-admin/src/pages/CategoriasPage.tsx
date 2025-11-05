import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { type Category } from '../types';
import { getCategories, createCategory, deleteCategory } from '../services/apiService';
import { toast, Toaster } from 'react-hot-toast';
import { Trash2, Loader2, Plus } from 'lucide-react';

// Componente Card
const Card = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent"
  >
    {children}
  </motion.div>
);

export function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega as categorias
  useEffect(() => {
    async function carregarCategorias() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError("Falha ao carregar categorias.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarCategorias();
  }, []);

  // Lidar com a submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode estar vazio.");
      return;
    }

    setIsSubmitting(true);
    const promise = createCategory({ name: newCategoryName });

    toast.promise(promise, {
      loading: 'A salvar categoria...',
      success: (novaCategoria) => {
        setCategories(prev => [novaCategoria, ...prev]);
        setNewCategoryName(""); // Limpa o input
        setIsSubmitting(false);
        return 'Categoria salva com sucesso!';
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.response?.data?.message || 'Erro ao salvar categoria.';
      },
    });
  };

  // Lidar com apagar
  const handleApagar = (id: string, name: string) => {
    toast((t) => (
      <div className="flex flex-col p-2">
        <p className="font-semibold text-carvao">Tem a certeza?</p>
        <p className="text-sm text-gray-600 mb-3">Quer mesmo apagar "{name}"?</p>
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
    ));
  };

  const executarApagar = async (id: string) => {
    const promise = deleteCategory(id);
    toast.promise(promise, {
      loading: 'A apagar...',
      success: () => {
        setCategories(prev => prev.filter(c => c.id !== id));
        return 'Categoria apagada!';
      },
      error: 'Erro ao apagar.',
    });
  };

  if (loading) return <div>A carregar categorias...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold text-carvao"
        >
          Gestão de Categorias
        </motion.h1>

        {/* Formulário de Nova Categoria */}
        <Card>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da nova categoria (ex: Anéis)"
              className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              <span className="ml-2">{isSubmitting ? "A salvar..." : "Adicionar"}</span>
            </button>
          </form>
        </Card>

        {/* Lista de Categorias Existentes */}
        <Card delay={0.1}>
          <h2 className="text-xl font-semibold mb-4 text-carvao">Categorias Registadas</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500">Nenhuma categoria registada.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {categories.map(c => (
                <motion.li
                  key={c.id}
                  className="py-3 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  layout
                >
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <button
                    onClick={() => handleApagar(c.id, c.name)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Apagar Categoria"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}