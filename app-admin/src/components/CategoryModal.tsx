import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, Trash2, Loader2, Plus } from 'lucide-react';
import { type Category } from '../types';
// IMPORTANTE: Adicionamos getCategories para buscar a lista oficial
import { createCategory, deleteCategory, getCategories } from '../services/apiService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
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

  // Função para ADICIONAR nova categoria (Modo Sincronização Total)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode estar vazio.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('A guardar categoria...');

    try {
      const nameUpper = newCategoryName.trim().toUpperCase();
      
      // 1. Manda criar no servidor
      const createResponse: any = await createCategory({ name: nameUpper });
      
      // 2. O SEGREDO: Em vez de adicionar manualmente, baixamos a lista nova do banco
      // Isso elimina qualquer hipótese de duplicação visual ou IDs errados.
      const listaOficial = await getCategories();
      
      // 3. Atualiza a tela com a lista oficial
      if (Array.isArray(listaOficial)) {
        setCategories(listaOficial);
        
        // Tenta achar a categoria nova na lista atualizada para selecionar ela automaticamente
        const novaNaLista = listaOficial.find((c: any) => c.name === nameUpper);
        
        if (novaNaLista) {
            onCategoryCreated(novaNaLista);
        } else {
            // Fallback se não achar pelo nome (usa a resposta da criação)
            const createdData = createResponse.data || createResponse;
            onCategoryCreated(createdData);
        }
      }

      setNewCategoryName("");
      toast.dismiss(toastId);
      toast.success('Categoria criada!');

    } catch (error: any) {
      console.error("Erro ao criar categoria:", error);
      toast.dismiss(toastId);
      const msg = error.response?.data?.message || 'Erro ao criar categoria.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApagar = (id: string) => {
    setDeletingId(id);
    const promise = deleteCategory(id);

    toast.promise(promise, {
      loading: 'A apagar...',
      success: () => {
        // Remove visualmente
        setCategories(prev => prev.filter(c => c.id !== id));
        setDeletingId(null);
        return 'Categoria apagada!';
      },
      error: (err) => {
        setDeletingId(null);
        return err.response?.data?.message || 'Erro ao apagar. Verifique se está em uso.';
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-carvao">Gerir Categorias</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex gap-2 border-b">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="NOVA CATEGORIA"
                className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado uppercase text-gray-900"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 min-w-[3rem]"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              </button>
            </form>

            <div className="p-4 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Categorias existentes</h3>
              {categories.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma categoria encontrada.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {categories.map(c => (
                    c && (
                      <li key={c.id || Math.random()} className="py-2 flex justify-between items-center group">
                        <span className="text-gray-800 font-medium">
                          {c.name || "Sem Nome"}
                        </span>
                        <button
                          onClick={() => c.id && handleApagar(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          {deletingId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </li>
                    )
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