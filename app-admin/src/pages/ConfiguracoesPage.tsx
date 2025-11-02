import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react'; // Ícones

// 1. Não precisamos mais de 'schemas', mas ainda precisamos dos 'services'
 
import { getConfig, saveConfig } from '../services/apiService.tsx';
// 2. Não precisamos de 'zod' nem 'react-hook-form'
// (Também removemos o 'eslint-disable' pois vamos usar o 'error' no catch)

// Componente Card
const Card = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent"
  >
    {children}
  </motion.div>
);

// --- 3. Componente de Input SIMPLIFICADO ---
// (Não usa 'register' nem 'error', apenas 'value' e 'onChange')
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string; // O nome do campo no estado
  description?: string;
  error?: string; // Erro de validação manual
}

const FormInput: React.FC<FormInputProps> = ({ label, name, description, error, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={name}
      name={name} // Importante para o handler
      {...props}
      className={`mt-1 block w-full px-3 py-2 border ${
        error ? "border-red-500" : "border-gray-300"
      } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);


// Componente Principal da Página
export function ConfiguracoesPage() {
  // 4. Usar useState para o formulário, em vez de useForm
  const [formData, setFormData] = useState({
    whatsappNumber: '',
    monthlyGoal: '1000', // Inputs de número são strings
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ whatsappNumber?: string; monthlyGoal?: string }>({});

  // Carrega os dados existentes
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        setIsLoading(true);
        const data = await getConfig();
        // Atualiza o formulário com os dados da API (convertendo 'number' para 'string')
        setFormData({
          whatsappNumber: data.whatsappNumber || '',
          monthlyGoal: data.monthlyGoal?.toString() || '1000',
        });
      } catch (error) { // 5. Corrigido o erro de ESLint (usando o 'error')
        console.error(error);
        toast.error("Erro ao carregar configurações.");
      } finally {
        setIsLoading(false);
      }
    }
    carregarConfiguracoes();
  }, []); // Roda apenas uma vez

  // Handler manual para inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpa o erro ao digitar
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // 6. Validação manual antes do Submit
  const validarFormulario = (): boolean => {
    const novosErros: { whatsappNumber?: string; monthlyGoal?: string } = {};
    const { whatsappNumber, monthlyGoal } = formData;

    // Valida WhatsApp (se preenchido)
    if (whatsappNumber && !/^[0-9]+$/.test(whatsappNumber)) {
      novosErros.whatsappNumber = "Deve conter apenas números (ex: 55119...)";
    }

    // Valida Meta Mensal
    const metaNum = parseFloat(monthlyGoal);
    if (isNaN(metaNum) || metaNum < 0) {
      novosErros.monthlyGoal = "A meta deve ser um número positivo.";
    }

    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // 7. Função de Submit manual
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) {
      toast.error("Corrija os erros no formulário.");
      return;
    }

    setIsSubmitting(true);
    
    const dadosParaSalvar = {
      whatsappNumber: formData.whatsappNumber,
      monthlyGoal: parseFloat(formData.monthlyGoal), // Converte de volta para número
    };
    
    const promise = saveConfig(dadosParaSalvar);
    
    toast.promise(promise, {
      loading: "A salvar...",
      success: (configSalva) => {
        // Recarrega o formulário com os dados salvos (garantindo a formatação)
        setFormData({
           whatsappNumber: configSalva.whatsappNumber || '',
           monthlyGoal: configSalva.monthlyGoal?.toString() || '1000',
        });
        setIsSubmitting(false);
        return "Configurações salvas com sucesso!";
      },
      error: (err) => {
        setIsSubmitting(false);
        return err.message || "Erro ao salvar.";
      },
    });
  };
  
  if (isLoading) return <div>A carregar configurações...</div>;

  return (
    <>
      <Toaster position="top-right" />
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-carvao mb-6"
      >
        Configurações
      </motion.h1>

      <Card>
        {/* 8. Ligar o 'onSubmit' do formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <h2 className="text-xl font-semibold text-carvao">Catálogo Público</h2>
            <p className="text-sm text-gray-600">Definições para o seu catálogo de cliente (`app-catalogo`).</p>
          </div>

          <FormInput
            label="Nº de WhatsApp para Pedidos"
            name="whatsappNumber"
            value={formData.whatsappNumber} // Controlado pelo useState
            onChange={handleChange} // Controlado pelo useState
            error={errors.whatsappNumber}
            placeholder="5511999998888"
            description="Inclua o código do país (ex: 55 para Brasil) e o DDD. Apenas números."
          />

          <hr />

          <div>
            <h2 className="text-xl font-semibold text-carvao">Metas</h2>
          </div>

          <FormInput
            label="Meta de Lucro Mensal (R$)"
            name="monthlyGoal"
            type="number"
            step="100"
            value={formData.monthlyGoal} // Controlado pelo useState
            onChange={handleChange} // Controlado pelo useState
            error={errors.monthlyGoal}
            placeholder="1000"
          />

          {/* Botão de Salvar */}
          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting} // Desativa se estiver a salvar
              className="flex items-center justify-center bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
              {isSubmitting ? "A salvar..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}