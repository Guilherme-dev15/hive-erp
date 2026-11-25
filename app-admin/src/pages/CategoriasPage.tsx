import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  Tags,
  Package,
  Loader2,
  X,
  AlertCircle,
  FolderTree,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  getCategories,
  createCategory,
  deleteCategory,
  getAdminProdutos,
} from '../services/apiService';
import type { Category, ProdutoAdmin } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getContrastColor } from '../utils/themeUtils';

export function CategoriasPage() {
  const { theme } = useTheme();
  const primaryColor = theme.primaryColor || '#D4AF37';
  const contrastOnPrimary = getContrastColor(primaryColor);

  const [categories, setCategories] = useState<Category[]>([]);
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado do Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        getCategories(),
        getAdminProdutos().catch(() => []),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProdutos(Array.isArray(prods) ? prods : []);
    } catch (error) {
      console.error('Erro ao carregar dados de categorias:', error);
      toast.error('Erro ao carregar categorias.');
    } finally {
      setLoading(false);
    }
  };

  // Mapeamento de contagem de produtos por categoria
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    produtos.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [produtos]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim().toUpperCase();

    if (!cleanName) {
      toast.error('O nome da categoria não pode estar vazio.');
      return;
    }

    const jaExiste = categories.some(
      (c) => c.name.toUpperCase() === cleanName
    );
    if (jaExiste) {
      toast.error('Já existe uma categoria com este nome.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Criando categoria...');

    try {
      await createCategory({ name: cleanName });
      const listaAtualizada = await getCategories();
      setCategories(Array.isArray(listaAtualizada) ? listaAtualizada : []);
      setNewCategoryName('');
      setIsModalOpen(false);
      toast.dismiss(toastId);
      toast.success('Categoria criada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast.dismiss(toastId);
      const msg = error.response?.data?.message || 'Erro ao criar categoria.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const qtdProdutos = productCountByCategory[name] || 0;
    const confirmMsg =
      qtdProdutos > 0
        ? `Atenção: Existem ${qtdProdutos} produto(s) associado(s) à categoria "${name}". Deseja realmente excluir?`
        : `Deseja realmente excluir a categoria "${name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(id);
    const toastId = toast.loading('Excluindo categoria...');

    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.dismiss(toastId);
      toast.success('Categoria excluída!');
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error);
      toast.dismiss(toastId);
      const msg =
        error.response?.data?.message ||
        'Erro ao excluir. Verifique se existem vínculos.';
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total de Categorias
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {categories.length}
            </h3>
          </div>
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <Tags size={22} style={{ color: primaryColor }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Produtos Classificados
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {produtos.filter((p) => p.category).length}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Estrutura da Vitrine
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Categorias organizam o menu do catálogo online
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
            <FolderTree size={22} />
          </div>
        </div>
      </div>

      {/* Barra de Ações (Busca + Botão Adicionar) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar categorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all text-gray-800"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 hover:opacity-95"
          style={{
            backgroundColor: primaryColor,
            color: contrastOnPrimary,
          }}
        >
          <Plus size={18} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Conteúdo / Grid de Categorias */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin text-carvao" size={36} />
          <p className="text-sm font-medium mt-3">Carregando categorias...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto text-gray-400 mb-4">
            <Tags size={28} />
          </div>
          <h4 className="text-base font-bold text-gray-900">
            {searchTerm
              ? 'Nenhuma categoria corresponde à busca'
              : 'Nenhuma categoria cadastrada ainda'}
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchTerm
              ? 'Tente buscar com outro termo ou limpe o filtro.'
              : 'Cadastre categorias para organizar os produtos na sua vitrine online.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-95"
              style={{
                backgroundColor: primaryColor,
                color: contrastOnPrimary,
              }}
            >
              <Plus size={16} />
              Criar Primeira Categoria
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => {
            const count = productCountByCategory[cat.name] || 0;
            const isDeleting = deletingId === cat.id;

            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    }}
                  >
                    <Tags size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-gray-900 truncate">
                      {cat.name}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mt-0.5">
                      <Package size={12} className="text-gray-400" />
                      {count === 1 ? '1 produto' : `${count} produtos`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={isDeleting}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Excluir categoria"
                  aria-label={`Excluir categoria ${cat.name}`}
                >
                  {isDeleting ? (
                    <Loader2 size={16} className="animate-spin text-red-500" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação de Categoria */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Tags size={16} style={{ color: primaryColor }} />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Nova Categoria
                  </h3>
                </div>
                <button
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                  disabled={isSubmitting}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="cat-name-input"
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                  >
                    Nome da Categoria
                  </label>
                  <input
                    id="cat-name-input"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: ANEIS, COLANES, PULSEIRAS"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold uppercase text-gray-900 outline-none focus:ring-2 focus:ring-gray-400 transition"
                    autoFocus
                    disabled={isSubmitting}
                  />
                  <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} className="text-gray-400" />
                    O nome será exibido nos filtros da vitrine online.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCategoryName.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition hover:opacity-95 disabled:opacity-50"
                    style={{
                      backgroundColor: primaryColor,
                      color: contrastOnPrimary,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Cadastrar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
