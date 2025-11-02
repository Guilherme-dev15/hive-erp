import React from 'react';
// 1. Importações de Hooks (removido o 'type Resolver' desnecessário)
import { Resolver, useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Importações de UI e Animação
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

// Importações de Tipos e Lógica da Aplicação
import { type Fornecedor, type ProdutoAdmin } from '../types/index.ts'; 
import { produtoSchema, type ProdutoFormData } from '../types/schemas.ts'; 
import { createAdminProduto } from '../services/apiService.tsx';

// ============================================================================
// Tipagem das Props
// ============================================================================
interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  onProdutoCriado: (novoProduto: ProdutoAdmin) => void;
}

// ============================================================================
// Input Reutilizável
// ============================================================================
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label: string;
  name: keyof ProdutoFormData;
  register: ReturnType<typeof useForm<ProdutoFormData>>["register"];
  error?: string;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  error,
  ...props
}) => (
  <div>
    <label
      htmlFor={String(name)}
      className="block text-sm font-medium text-gray-700"
    >
      {label}
    </label>
    <input
      id={String(name)}
      {...props}
      {...register(name)}
      className={`mt-1 block w-full px-3 py-2 border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
    />
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
  onProdutoCriado,
}: ProdutoFormModalProps) {

  // Hook de formulário
  // (Este é o gancho que falha por causa do AMBIENTE, não do CÓDIGO)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema) as Resolver<ProdutoFormData>,
  });

  // Função de submit validada
  const onSubmit: SubmitHandler<ProdutoFormData> = (data) => {
    
    // 3. Removido o 'as unknown as ...' desnecessário
    // O tipo 'ProdutoFormData' é 100% compatível com o que a API espera
    const promise = createAdminProduto(data); 

    toast.promise(promise, {
      loading: "A salvar produto...",
      success: (produtoSalvo) => {
        onProdutoCriado(produtoSalvo);
        reset();
        onClose();
        return "Produto salvo com sucesso!";
      },
      error: (err) => err.message || "Erro ao salvar produto.",
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
                Adicionar Novo Produto
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Custo do Produto (R$)"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.costPrice?.message}
                  placeholder="Ex: 50.00"
                />

                <div>
                  <label
                    htmlFor="supplierId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Fornecedor
                  </label>
                  <select
                    id="supplierId"
                    {...register("supplierId")}
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.supplierId
                        ? "border-red-500"
                        : "border-gray-300"
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Categoria"
                  name="category"
                  register={register}
                  error={errors.category?.message}
                  placeholder="Ex: Anéis"
                />
                <FormInput
                  label="Código (SKU)"
                  name="code"
                  register={register}
                  error={errors.code?.message}
                  placeholder="Ex: ANL-001"
                />
              </div>

              <FormInput
                label="URL da Imagem"
                name="imageUrl"
                type="url"
                register={register}
                error={errors.imageUrl?.message}
                placeholder="https://..."
              />

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Salvando..." : "Salvar Produto"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}