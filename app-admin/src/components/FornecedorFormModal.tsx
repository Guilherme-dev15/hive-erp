import React, { useEffect } from 'react'; // 1. Importar 'useEffect'
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

import { type Fornecedor } from '../types/index.ts';
import { fornecedorSchema, type FornecedorFormData } from '../types/schemas.ts';
// 2. Importar 'create' e 'update'
import { createFornecedor, updateFornecedor } from '../services/apiService.tsx';

// ============================================================================
// Props do Modal (ATUALIZADAS)
// ============================================================================
interface FornecedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 3. Adicionar 'fornecedorParaEditar' (opcional)
  fornecedorParaEditar?: Fornecedor | null;
  // 4. Renomear a função 'onSave' para ser genérica
  onFornecedorSalvo: (novoFornecedor: Fornecedor) => void; 
}

// ============================================================================
// Componentes de Input e Textarea
// ============================================================================
// (O código do 'FormInput' e 'FormTextarea' não muda)
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label: string;
  name: keyof FornecedorFormData;
  register: ReturnType<typeof useForm<FornecedorFormData>>["register"];
  error?: string;
};
const FormInput: React.FC<FormInputProps> = ({ label, name, register, error, ...props }) => (
  <div>
    <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      id={String(name)}
      {...props}
      {...register(name)}
      className={`mt-1 block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);
type FormTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> & {
  label: string;
  name: keyof FornecedorFormData;
  register: ReturnType<typeof useForm<FornecedorFormData>>["register"];
  error?: string;
};
const FormTextarea: React.FC<FormTextareaProps> = ({ label, name, register, error, ...props }) => (
  <div>
    <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>
    <textarea
      id={String(name)}
      {...props}
      {...register(name)}
      className={`mt-1 block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ============================================================================
// Componente Principal do Modal (ATUALIZADO)
// ============================================================================
export function FornecedorFormModal({
  isOpen,
  onClose,
  onFornecedorSalvo,
  fornecedorParaEditar, // 5. Receber a nova prop
}: FornecedorFormModalProps) {

  // 6. Definir se estamos em modo de edição
  const isEditMode = !!fornecedorParaEditar;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
  });

  // 7. Usar 'useEffect' para preencher o formulário
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Modo Edição: preenche o formulário com os dados
        reset(fornecedorParaEditar);
      } else {
        // Modo Criação: limpa o formulário
        reset({
          name: '',
          contactPhone: '',
          url: '',
          paymentTerms: '',
        });
      }
    }
  }, [isOpen, isEditMode, fornecedorParaEditar, reset]);


  // 8. Função 'onSubmit' agora decide se deve CRIAR ou ATUALIZAR
  const onSubmit: SubmitHandler<FornecedorFormData> = (data) => {
    
    let promise;
    
    if (isEditMode) {
      // Modo Edição: Chama 'updateFornecedor'
      promise = updateFornecedor(fornecedorParaEditar.id, data);
    } else {
      // Modo Criação: Chama 'createFornecedor'
      promise = createFornecedor(data); 
    }

    toast.promise(promise, {
      loading: isEditMode ? "A atualizar fornecedor..." : "A salvar fornecedor...",
      success: (fornecedorSalvo) => {
        onFornecedorSalvo(fornecedorSalvo); // Atualiza a UI na página
        onClose(); // Fecha o modal
        return isEditMode ? "Fornecedor atualizado!" : "Fornecedor salvo!";
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
            className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b">
              {/* 9. Título dinâmico */}
              <h2 className="text-xl font-semibold text-carvao">
                {isEditMode ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulário (o JSX do formulário não muda) */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-6 space-y-4"
            >
              <FormInput
                label="Nome do Fornecedor"
                name="name"
                register={register}
                error={errors.name?.message}
                placeholder="Ex: Pratas da Casa"
              />

              <FormInput
                label="Telefone de Contato (Opcional)"
                name="contactPhone"
                register={register}
                error={errors.contactPhone?.message}
                placeholder="Ex: (11) 99999-8888"
              />

              <FormInput
                label="Site (Opcional)"
                name="url"
                type="url"
                register={register}
                error={errors.url?.message}
                placeholder="https://..."
              />
              
              <FormTextarea
                label="Condições de Pagamento (Opcional)"
                name="paymentTerms"
                register={register}
                error={errors.paymentTerms?.message}
                rows={3}
                placeholder="Ex: 30/60 dias no boleto, Pix com 5% desconto..."
              />

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                {/* 10. Texto do botão dinâmico */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? (isEditMode ? "A atualizar..." : "A salvar...") : (isEditMode ? "Atualizar Fornecedor" : "Salvar Fornecedor")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}