import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, DollarSign } from 'lucide-react'; // Importar Ícone

// Importações de Tipos e Lógica da Aplicação
import { type Fornecedor, type ProdutoAdmin } from '../types'; 
import { produtoSchema, type ProdutoFormData } from '../types/schemas'; 
import { createAdminProduto, updateAdminProduto } from '../services/apiService';

// ============================================================================
// Tipagem das Props (Atualizada para Edição)
// ============================================================================
interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  produtoParaEditar?: ProdutoAdmin | null; 
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
}

// ============================================================================
// Input Reutilizável
// ============================================================================
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label: string;
  name: keyof ProdutoFormData;
  register: ReturnType<typeof useForm<ProdutoFormData>>["register"];
  error?: string;
  // Prop extra para adicionar ícone (como R$)
  icon?: React.ReactNode; 
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  error,
  icon,
  ...props
}) => (
  <div>
    <label
      htmlFor={String(name)}
      className="block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    <div className="relative mt-1">
      {/* Adiciona o ícone se ele for passado */}
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <input
        id={String(name)}
        {...props}
        {...register(name)}
        className={`block w-full px-3 py-2 border ${
          error ? "border-red-500" : "border-gray-300"
        } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado
           ${icon ? 'pl-10' : ''}`} // Adiciona padding se tiver ícone
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
  produtoParaEditar,
  onProdutoSalvo,
}: ProdutoFormModalProps) {

  const isEditMode = !!produtoParaEditar;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    // Definimos os valores padrão (defaultValues)
    defaultValues: {
      name: '',
      costPrice: undefined,
      supplierId: '',
      category: '',
      code: '',
      imageUrl: '',
      salePrice: undefined,
      status: 'ativo', // Status padrão
    }
  });

  // Preenche o formulário ao abrir (para Edição ou Criação)
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        // Modo Edição: preenche
        reset(produtoParaEditar);
      } else {
        // Modo Criação: limpa para os valores padrão
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
              <FormInput
                label="Nome do Produto"
                name="name"
                register={register}
                error={errors.name?.message}
                placeholder="Ex: Anel Solitário Prata 925"
              />

              {/* --- CAMPOS DE PREÇO ATUALIZADOS --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Custo (Fornecedor) R$"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.costPrice?.message}
                  placeholder="50.00"
                  icon={<DollarSign size={16} className="text-gray-400" />}
                />
                
                <FormInput
                  label="Preço de Venda Final R$"
                  name="salePrice"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.salePrice?.message}
                  placeholder="89.90"
                  icon={<DollarSign size={16} className="text-gray-400" />}
                />
              </div>
              <p className="text-xs text-gray-500 -mt-2 ml-1">
                Dica: Use a página "Precificação" para calcular o seu Preço de Venda Final.
              </p>
              {/* --- FIM DA ATUALIZAÇÃO DE PREÇO --- */}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">
                    Fornecedor
                  </label>
                  <select
                    id="supplierId"
                    {...register("supplierId")}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.supplierId ? "border-red-500" : "border-gray-300"
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

                {/* --- CAMPO NOVO: STATUS --- */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.status ? "border-red-500" : "border-gray-300"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Categoria (Opcional)"
                  name="category"
                  register={register}
                  error={errors.category?.message}
                  placeholder="Ex: Anéis"
                />
                <FormInput
                  label="Código (SKU) (Opcional)"
                  name="code"
                  register={register}
                  error={errors.code?.message}
                  placeholder="Ex: ANL-001"
                />
              </div>

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
    </AnimatePresence>
  );
}