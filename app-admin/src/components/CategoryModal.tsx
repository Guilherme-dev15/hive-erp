import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, Trash2, Loader2, Plus } from 'lucide-react';
import { type Category } from '../types';
import { createCategory, deleteCategory } from '../services/apiService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  // Esta função avisa o modal de produto que uma nova categoria foi criada
  onCategoryCreated: (newCategory: Category) => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  categories,
  setCategories,
  onCategoryCreated
}: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Função para ADICIONAR nova categoria
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
        // Atualiza a lista de categorias na ProdutosPage
        setCategories(prev => [novaCategoria, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategoryName("");
        setIsSubmitting(false);
        // Avisa o modal de produto para selecionar esta nova categoria
        onCategoryCreated(novaCategoria);
        return 'Categoria salva!';
      },
      error: (err) => {
        setIsSubmitting(false);
        // Exibe o erro (ex: "Categoria já existe")
        return err.response?.data?.message || 'Erro ao salvar.';
      },
    });
  };

  // Função para APAGAR categoria
  const handleApagar = (id: string) => {
    setDeletingId(id);
    const promise = deleteCategory(id);

    toast.promise(promise, {
      loading: 'A apagar...',
      success: () => {
        // Remove da lista
        setCategories(prev => prev.filter(c => c.id !== id));
        setDeletingId(null);
        return 'Categoria apagada!';
      },
      error: (err) => {
        setDeletingId(null);
        // Exibe o erro da API (ex: "Categoria em uso")
        return err.response?.data?.message || 'Erro ao apagar.';
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // z-index 60 para ficar SOBRE o modal de produto (que é z-50)
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-carvao">Gerir Categorias</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário de Adicionar */}
            <form onSubmit={handleSubmit} className="p-4 flex gap-2 border-b">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              </button>
            </form>

            {/* Lista de Categorias Existentes */}
            <div className="p-4 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Categorias existentes</h3>
              {categories.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma categoria registada.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {categories.map(c => (
                    <li key={c.id} className="py-2 flex justify-between items-center">
                      <span className="text-gray-800">{c.name}</span>
                      <button
                        onClick={() => handleApagar(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Apagar Categoria"
                      >
                        {deletingId === c.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}