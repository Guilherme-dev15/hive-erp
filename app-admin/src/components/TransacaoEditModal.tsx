import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

// Importações de Tipos e Lógica
import { type Transacao } from '../types/index.ts';
import { transacaoSchema, type TransacaoFormData } from '../types/schemas.ts';
import { updateTransacao } from '../services/apiService.tsx';

// ============================================================================
// Props do Modal
// ============================================================================
interface TransacaoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  // A transação que queremos editar
  transacaoParaEditar: Transacao | null;
  // Função para atualizar a lista na página principal
  onTransacaoSalva: (transacaoAtualizada: Transacao) => void; 
}

// ============================================================================
// Input Reutilizável
// ============================================================================
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label: string;
  name: keyof TransacaoFormData;
  register: ReturnType<typeof useForm<TransacaoFormData>>["register"];
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

// ============================================================================
// Componente Principal do Modal
// ============================================================================
export function TransacaoEditModal({
  isOpen,
  onClose,
  transacaoParaEditar,
  onTransacaoSalva,
}: TransacaoEditModalProps) {

  // Este hook não deve "crashar" se o seu ambiente foi corrigido
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
  });

  // 'useEffect' para preencher o formulário quando o modal abre
  useEffect(() => {
    if (transacaoParaEditar && isOpen) {
      
      let dataFormatada = '';

      // Lógica para lidar com datas (Timestamp do Firebase ou String)
      if (transacaoParaEditar.date && typeof transacaoParaEditar.date === 'object' && transacaoParaEditar.date.seconds) {
        // É um Timestamp, converte para "YYYY-MM-DD"
        dataFormatada = new Date(transacaoParaEditar.date.seconds * 1000)
          .toISOString()
          .split('T')[0];
      } else if (typeof transacaoParaEditar.date === 'string') {
        // É uma string (ex: "2025-11-02"), apenas a usamos
        dataFormatada = transacaoParaEditar.date.split('T')[0]; // Garante que não tem hora
      }
          
      reset({
        ...transacaoParaEditar,
        date: dataFormatada, // Usa a string formatada
        // O schema espera 'amount' positivo
        amount: Math.abs(transacaoParaEditar.amount),
      });
    }
  }, [isOpen, transacaoParaEditar, reset]);


  // Função 'onSubmit' para ATUALIZAR
  const onSubmit: SubmitHandler<TransacaoFormData> = (data) => {
    
    if (!transacaoParaEditar) return; // Segurança

    // Re-aplicamos o sinal negativo se for uma despesa
    const amountCorrigido = data.type === 'despesa' 
      ? -Math.abs(data.amount) 
      : Math.abs(data.amount);

    const dadosParaSalvar = {
      ...data,
      amount: amountCorrigido,
      date: data.date.split('T')[0], // Garante o formato
    };
    
    const promise = updateTransacao(transacaoParaEditar.id, dadosParaSalvar); 

    toast.promise(promise, {
      loading: "A atualizar transação...",
      success: (transacaoSalva) => {
        onTransacaoSalva(transacaoSalva); // Atualiza a UI na página
        onClose(); // Fecha o modal
        return "Transação atualizada!";
      },
      error: (err) => err.message || "Erro ao atualizar.",
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
              <h2 className="text-xl font-semibold text-carvao">
                Editar Transação
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
              {/* Dropdown de Tipo */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  id="type"
                  {...register("type")}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.type ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
                >
                  <option value="venda">Venda</option>
                  <option value="despesa">Despesa</option>
                  <option value="capital">Injeção de Capital</option>
                </select>
                {errors.type && <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>}
              </div>

              <FormInput
                label="Descrição"
                name="description"
                register={register}
                error={errors.description?.message}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Valor (R$)"
                  name="amount"
                  type="number"
                  step="0.01"
                  register={register}
                  error={errors.amount?.message}
                />
                <FormInput
                  label="Data"
                  name="date"
                  type="date"
                  register={register}
                  error={errors.date?.message}
                />
              </div>

              {/* Botão de Salvar */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? "A atualizar..." : "Atualizar Transação"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}