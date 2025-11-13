// 1. 'Wand2' e 'useState' desnecessário removidos
import React, { useEffect, useState } from 'react';
// 2. Adicionado 'watch' para a precificação
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Plus, Link } from 'lucide-react';

// 3. Import do 'NamerModal' removido
import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category } from '../types';
import { produtoSchema, type ProdutoFormData } from '../types/schemas';
import { createAdminProduto, updateAdminProduto } from '../services/apiService';

// ============================================================================
// Tipagem das Props
// ============================================================================
interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  produtoParaEditar?: ProdutoAdmin | null;
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
}

// ============================================================================
// Input Reutilizável
// ============================================================================
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label?: string; // Label agora é opcional
  name: keyof ProdutoFormData;
  register: ReturnType<typeof useForm<ProdutoFormData>>["register"];
  error?: string;
  icon?: React.ReactNode;
};

// (Componente FormInput não muda)
const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  error,
  icon,
  ...props
}) => (
  <div>
    {label && (
      <label
        htmlFor={String(name)}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
    )}
    <div className={`relative ${label ? 'mt-1' : ''}`}>
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <input
        id={String(name)}
        {...props}
        {...register(name)}
        className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"
          } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado
           ${icon ? 'pl-10' : ''}`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ============================================================================
// Componente Principal do Modal
// ============================================================================
export function ProdutoFormModal({
  isOpen,
  onClose,
  fornecedores,
  categories,
  setCategories,
  produtoParaEditar,
  onProdutoSalvo,
}: ProdutoFormModalProps) {

  const isEditMode = !!produtoParaEditar;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch, // 4. 'watch' ADICIONADO para ler o campo de custo
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      name: '',
      costPrice: undefined,
      supplierId: '',
      category: '',
      code: '',
      imageUrl: '',
      salePrice: undefined,
      status: 'ativo',
    }
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  // 5. Estado 'isNamerModalOpen' REMOVIDO

  // Preenche o formulário ao abrir (para Edição ou Criação)
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        reset(produtoParaEditar);
      } else {
        reset({
          name: '',
          costPrice: undefined,
          supplierId: '',
          category: '',
          code: '',
          imageUrl: '',
          salePrice: undefined,
          status: 'ativo',
        });
      }
    }
  }, [isOpen, isEditMode, produtoParaEditar, reset]);


  // --- 6. MÓDULO DE PRECIFICAÇÃO AUTOMÁTICA ADICIONADO ---
  const custoObservado = watch('costPrice');

  useEffect(() => {
    // Não executa no modo de edição (para não sobrescrever preços antigos)
    if (isEditMode) return;

    const custo = parseFloat(custoObservado as any);

    if (custo > 0) {
      let markup = 1.7; // 170% (Nível 2 - Padrão)

      if (custo <= 25) { // Nível 1
        markup = 2.0; // 200%
      } else if (custo > 200) { // Nível 3
        markup = 0.8; // 80%
      }

      // A sua lógica: (Custo * (1 + Markup)) - 0.10
      const precoSugerido = (custo * (1 + markup)) - 0.10;

      // Seta o valor no campo de Preço de Venda
      setValue('salePrice', parseFloat(precoSugerido.toFixed(2)));
    } else if (custo === 0) {
      // Limpa o preço de venda se o custo for 0
      setValue('salePrice', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custoObservado, setValue, isEditMode]); // Dependemos do custoObservado
  // --- FIM DA PRECIFICAÇÃO ---


  // Função de submit validada
  const onSubmit: SubmitHandler<ProdutoFormData> = (data) => {
    let promise;
    if (isEditMode && produtoParaEditar) {
      promise = updateAdminProduto(produtoParaEditar.id, data);
    } else {
      promise = createAdminProduto(data);
    }

    toast.promise(promise, {
      loading: isEditMode ? "A atualizar..." : "A salvar...",
      success: (produtoSalvo) => {
        onProdutoSalvo(produtoSalvo);
        onClose();
        return `Produto ${isEditMode ? 'atualizado' : 'salvo'}!`;
      },
      error: (err) => err.message || "Erro ao salvar.",
    });
  };

  // Função para lidar com a criação de categoria
  const handleCategoryCreated = (newCategory: Category) => {
    setValue('category', newCategory.name, { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  // 7. Função 'handleNameGenerated' REMOVIDA

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-carvao">
                {isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-4"
            >
              {/* --- 8. CAMPO DE NOME (BOTÃO IA REMOVIDO) --- */}
              <FormInput
                label="Nome do Produto" // Label restaurado
                name="name"
                register={register}
                error={errors.name?.message}
                placeholder="Ex: Anel Solitário Prata 925"
              />

              {/* --- CAMPOS DE PREÇO (COM AUTOMAÇÃO) --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Custo (Fornecedor) R$"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.costPrice?.message}
                  placeholder="25.00" // Placeholder atualizado
                  icon={<DollarSign size={16} className="text-gray-400" />}
                />

                <FormInput
                  label="Preço de Venda Final R$"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.salePrice?.message}
                  placeholder="Calculado automaticamente" // Placeholder atualizado
                  icon={<DollarSign size={16} className="text-gray-400" />}
                />
              </div>
              <p className="text-xs text-gray-500 -mt-2 ml-1">
                {isEditMode
                  ? "Ajuste o preço de venda manualmente se necessário."
                  : "O preço de venda é calculado automaticamente com base no custo."
                }
              </p>

              {/* --- FORNECEDOR E CATEGORIA --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">
                    Fornecedor
                  </label>
                  <select
                    id="supplierId"
                    {...register("supplierId")}
                    className={`mt-1 block w-full px-3 py-2 border ${errors.supplierId ? "border-red-500" : "border-gray-300"
                      } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
                  >
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.supplierId.message}
                    </p>
                  )}
                </div>

                {/* --- CAMPO DE CATEGORIA (com botão +) --- */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Categoria (Opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="p-1 rounded-full text-dourado hover:bg-gray-100"
                      title="Gerir categorias"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <select
                    id="category"
                    {...register("category")}
                    className={`block w-full px-3 py-2 border ${errors.category ? "border-red-500" : "border-gray-300"
                      } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories
                      .sort((a, b) => a.name.localeCompare(b.name)) // Ordena alfabeticamente
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* --- SKU E STATUS --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Código (SKU) (Opcional)"
                  name="code"
                  register={register}
                  error={errors.code?.message}
                  placeholder="Ex: ANL-001"
                />

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    className={`mt-1 block w-full px-3 py-2 border ${errors.status ? "border-red-500" : "border-gray-300"
                      } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
                  >
                    <option value="ativo">Ativo (Visível no catálogo)</option>
                    <option value="inativo">Inativo (Oculto do catálogo)</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>
              {/* --- 4. NOVO CAMPO ADICIONADO --- */}
              <FormInput
                label="Link do Produto no Fornecedor (Opcional)"
                name="supplierProductUrl"
                type="url"
                register={register}
                error={errors.supplierProductUrl?.message}
                placeholder="https://fornecedor.com/produto/123"
                icon={<Link size={16} className="text-gray-400" />}
              />
              <FormInput
                label="URL da Imagem (Opcional)"
                name="imageUrl"
                type="url"
                register={register}
                error={errors.imageUrl?.message}
                placeholder="https://..."
              />

              <FormInput
                label="Descrição Curta (Opcional)"
                name="description"
                register={register}
                error={errors.description?.message}
                placeholder="Ex: Prata 925 com zircônia"
              />

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (isEditMode ? "Atualizando..." : "Salvando...") : (isEditMode ? "Atualizar Produto" : "Salvar Produto")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de Categoria (permanece) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* 9. Modal da IA (REMOVIDO) */}

    </AnimatePresence>
  );
}