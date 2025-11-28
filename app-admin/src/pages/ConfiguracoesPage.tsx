import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
// Adicionamos ícones novos: Palette (Cores), Calculator (Custos), Percent, Package
import { Save, Loader2, Palette, Store, Calculator, Percent, Package } from 'lucide-react';
import { getConfig, saveConfig } from '../services/apiService';

// --- COMPONENTES AUXILIARES ---

// Card com Borda Colorida
const Card = ({ children, borderColor = "border-gray-200" }: { children: React.ReactNode, borderColor?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    className={`bg-white shadow-lg rounded-lg p-6 border-l-4 ${borderColor} border-t border-r border-b border-gray-100`}
  >
    {children}
  </motion.div>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

const FormInput = ({ label, description, icon, ...props }: FormInputProps) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado transition-all ${
          icon ? 'pl-10 pr-3' : 'px-3'
        }`}
      />
    </div>
    {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
  </div>
);

// --- PÁGINA PRINCIPAL ---

export function ConfiguracoesPage() {
  const [formData, setFormData] = useState({
    // Vendas
    whatsappNumber: '',
    monthlyGoal: '',
    // White-Label (Visual)
    storeName: 'HivePratas',
    primaryColor: '#D4AF37',
    secondaryColor: '#343434',
    // Custos Operacionais
    cardFee: '0',
    packagingCost: '0'
  });
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Carregar Dados
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
            secondaryColor: data.secondaryColor || '#343434',
            
            cardFee: data.cardFee?.toString() || '0',
            packagingCost: data.packagingCost?.toString() || '0'
          });
        }
      } catch (error) {
        toast.error("Erro ao carregar configurações.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Manipular Mudanças
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Salvar Dados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Convertemos strings numéricas de volta para number antes de enviar
      await saveConfig({
        ...formData,
        monthlyGoal: Number(formData.monthlyGoal),
        cardFee: Number(formData.cardFee),
        packagingCost: Number(formData.packagingCost),
        banners: [] // Mantemos vazio por enquanto, ou pode implementar o upload depois
      });
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-dourado" size={40} />
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
           <h1 className="text-3xl font-bold text-carvao">Configurações da Loja</h1>
           <p className="text-gray-500 mt-1">Personalize o visual e as regras do seu negócio.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- 1. IDENTIDADE VISUAL (WHITE-LABEL) --- */}
          <Card borderColor="border-blue-500">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Palette className="text-blue-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Identidade Visual</h2>
                <p className="text-xs text-gray-500">Como a sua loja aparece para o cliente.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Nome da Loja"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                placeholder="Ex: Joias da Ana"
                description="Aparece no topo do catálogo e na aba do navegador."
              />
              
              {/* Seletores de Cor */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                    />
                    <input 
                      type="text" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Botões e destaques.</p>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                    />
                    <input 
                      type="text" 
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                    />
                  </div>
                   <p className="text-xs text-gray-500 mt-1">Fundo do cabeçalho e textos.</p>
                </div>
              </div>
            </div>

            {/* Preview Rápido */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-4">
               <span className="text-xs font-bold text-gray-400 uppercase">Preview:</span>
               <div className="px-4 py-2 rounded text-white text-sm font-bold shadow-sm" style={{ backgroundColor: formData.primaryColor }}>
                  Botão Principal
               </div>
               <span className="font-bold text-lg" style={{ color: formData.secondaryColor }}>
                  Título da Loja
               </span>
            </div>
          </Card>

          {/* --- 2. CUSTOS OPERACIONAIS (LUCRO REAL) --- */}
          <Card borderColor="border-green-500">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Calculator className="text-green-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Custos Operacionais</h2>
                <p className="text-xs text-gray-500">Usado para calcular o lucro líquido no cadastro de produtos.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Taxa de Cartão / Gateway (%)"
                name="cardFee"
                type="number"
                step="0.01"
                value={formData.cardFee}
                onChange={handleChange}
                placeholder="4.99"
                icon={<Percent size={16} />}
                description="Média da taxa cobrada pela maquininha ou link de pagamento."
              />

              <FormInput
                label="Custo de Embalagem (R$)"
                name="packagingCost"
                type="number"
                step="0.01"
                value={formData.packagingCost}
                onChange={handleChange}
                placeholder="1.50"
                icon={<Package size={16} />}
                description="Custo médio por pedido (saquinho, caixa, laço, etc.)."
              />
            </div>
          </Card>

          {/* --- 3. CONFIGURAÇÕES DE VENDA --- */}
          <Card borderColor="border-dourado">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Store className="text-dourado" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Canais de Venda</h2>
                <p className="text-xs text-gray-500">Onde e como você vende.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="WhatsApp para Pedidos"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="5511999998888"
                description="Número que receberá as mensagens do catálogo. Use o formato internacional (55...)."
              />
              <FormInput
                label="Meta de Lucro Mensal (R$)"
                name="monthlyGoal"
                type="number"
                value={formData.monthlyGoal}
                onChange={handleChange}
                placeholder="1000"
                description="O seu objetivo para visualizar no Dashboard."
              />
            </div>
          </Card>

          {/* Botão de Salvar Flutuante ou Fixo */}
          <div className="sticky bottom-6 flex justify-end z-10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center bg-carvao text-white px-8 py-4 rounded-xl shadow-2xl hover:bg-gray-800 hover:scale-105 transition-all disabled:opacity-70 disabled:hover:scale-100 text-lg font-bold border-2 border-white/10"
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