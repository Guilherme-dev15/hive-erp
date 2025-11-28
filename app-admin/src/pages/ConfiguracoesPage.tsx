import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Save, Loader2, Palette, Store } from 'lucide-react';
import { getConfig, saveConfig } from '../services/apiService';

// Componente Card
const Card = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className="bg-white shadow-lg rounded-lg p-6 border border-gray-100"
  >
    {children}
  </motion.div>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  description?: string;
}

const FormInput = ({ label, description, ...props }: FormInputProps) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado transition-all"
    />
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);

export function ConfiguracoesPage() {
  const [formData, setFormData] = useState({
    whatsappNumber: '',
    monthlyGoal: '',
    // Novos campos com valores padrão (HivePratas)
    storeName: 'HivePratas',
    primaryColor: '#D4AF37', // Dourado
    secondaryColor: '#343434' // Carvão
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getConfig();
        if (data) {
          setFormData({
            whatsappNumber: data.whatsappNumber || '',
            monthlyGoal: data.monthlyGoal?.toString() || '',
            storeName: data.storeName || 'HivePratas',
            primaryColor: data.primaryColor || '#D4AF37',
            secondaryColor: data.secondaryColor || '#343434'
          });
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Salva no Firebase
      await saveConfig({
        ...formData,
        monthlyGoal: Number(formData.monthlyGoal)
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6 pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-carvao"
        >
          Configurações da Loja
        </motion.h1>

        <form onSubmit={handleSubmit}>
          
          {/* 1. Identidade Visual (White-Label) */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Palette className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Identidade Visual (White-Label)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Nome da Loja"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Ex: Joias da Ana"
                description="Este nome aparecerá no topo do catálogo público."
              />
              
              {/* Seletores de Cor */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal (Destaques)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <input 
                      type="text" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Cor de botões e ícones.</p>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária (Fundo/Texto)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <input 
                      type="text" 
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
                    />
                  </div>
                   <p className="text-xs text-gray-500 mt-1">Cor do cabeçalho e títulos.</p>
                </div>
              </div>
            </div>
            
            {/* Preview Visual */}
            <div className="mt-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Pré-visualização</p>
              <div className="flex items-center gap-4 p-4 rounded-lg border shadow-sm bg-white">
                 <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: formData.secondaryColor }}>
                    Logo
                 </div>
                 <div className="flex-1">
                    <h4 className="font-bold" style={{ color: formData.secondaryColor }}>{formData.storeName || "Nome da Loja"}</h4>
                    <p className="text-xs text-gray-500">Exemplo de título</p>
                 </div>
                 <button
                    type="button" 
                    className="px-4 py-2 rounded-lg text-white font-bold shadow-sm text-sm"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Comprar
                  </button>
              </div>
            </div>
          </Card>

          <div className="h-6"></div>

          {/* 2. Configurações de Venda */}
          <Card>
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Store className="text-dourado" />
              <h2 className="text-xl font-semibold text-gray-800">Configurações de Venda</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="WhatsApp para Pedidos"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="5511999998888"
                description="Inclua o código do país (ex: 55). Apenas números."
              />
              <FormInput
                label="Meta de Lucro Mensal (R$)"
                name="monthlyGoal"
                type="number"
                value={formData.monthlyGoal}
                onChange={handleChange}
                placeholder="1000"
              />
            </div>
          </Card>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center bg-carvao text-white px-8 py-3 rounded-lg shadow-lg hover:bg-gray-800 transition-all disabled:opacity-70 text-lg font-medium"
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
              Salvar Todas as Alterações
            </button>
          </div>
        </form>
      </div>
    </>
  );
}