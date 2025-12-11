import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { Save, Loader2, Palette, Store, Calculator, Percent, Package, ScrollText, AlertTriangle } from 'lucide-react';
import { getConfig, saveConfig } from '../services/apiService';

// --- COMPONENTES AUXILIARES ---

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
        className={`w-full py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado transition-all ${icon ? 'pl-10 pr-3' : 'px-3'}`}
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
    packagingCost: '0',

    // Garantia
    warrantyText: '',

    // NOVO: Gestão de Stock
    lowStockThreshold: '5' 
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

            cardFee: data.cardFeePercent?.toString() || '0', // Mapeando cardFeePercent da API para cardFee do form
            packagingCost: data.packingCost?.toString() || '0', // Mapeando packingCost da API para packagingCost do form

            warrantyText: data.warrantyText || 'Garantimos a autenticidade da Prata 925. Garantia de 90 dias para defeitos de fabrico.',
            
            // Carrega o limite de stock (ou padrão 5)
            lowStockThreshold: data.lowStockThreshold?.toString() || '5'
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

  // 2. Manipular Mudanças (Input)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. Salvar Dados
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Prepara o objeto exatamente como a API (Schema) espera
      const payload = {
        whatsappNumber: formData.whatsappNumber,
        storeName: formData.storeName,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        warrantyText: formData.warrantyText,
        banners: [], // Mantemos banners vazios aqui pois são geridos noutro lugar ou via array separado se necessário
        
        // Conversões Numéricas Obrigatórias
        monthlyGoal: Number(formData.monthlyGoal) || 0,
        
        // Mapeamento correto para a API (packingCost e cardFeePercent)
        packingCost: Number(formData.packagingCost) || 0,
        cardFeePercent: Number(formData.cardFee) || 0,
        
        // O campo que faltava e causava o erro
        lowStockThreshold: Number(formData.lowStockThreshold) || 5 
      };

      // @ts-ignore - Ignoramos erros estritos de tipagem aqui pois garantimos o payload acima
      await saveConfig(payload);
      
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
          <p className="text-gray-500 mt-1">Personalize o visual, taxas e regras do seu negócio.</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* --- 1. IDENTIDADE VISUAL --- */}
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

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden shadow-sm" />
                    <input type="text" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono" />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor Secundária</label>
                  <div className="flex items-center gap-2">
                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="h-10 w-10 rounded cursor-pointer border-0 p-0 overflow-hidden shadow-sm" />
                    <input type="text" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* --- 2. CUSTOS OPERACIONAIS --- */}
          <Card borderColor="border-green-500">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Calculator className="text-green-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Custos Operacionais</h2>
                <p className="text-xs text-gray-500">Usado para calcular o lucro líquido.</p>
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
                description="Média da taxa cobrada pela maquininha."
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
                description="Custo médio por pedido (saquinho, caixa, etc.)."
              />
            </div>
          </Card>

          {/* --- 3. CONTROLE DE STOCK (NOVO!) --- */}
          <Card borderColor="border-yellow-500">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <AlertTriangle className="text-yellow-600" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Alertas de Stock</h2>
                <p className="text-xs text-gray-500">Defina quando o sistema deve avisar que o produto está a acabar.</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex items-center gap-4">
               <div className="flex-1">
                 <FormInput
                    label="Stock Mínimo para Alerta"
                    name="lowStockThreshold"
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    placeholder="5"
                    description="Produtos com quantidade igual ou menor a este valor ficarão destacados."
                 />
               </div>
               <div className="hidden sm:block text-sm text-yellow-800 max-w-xs">
                  Isto ajuda a gerar a lista de reposição antes que os produtos esgotem.
               </div>
            </div>
          </Card>

          {/* --- 4. CANAIS DE VENDA --- */}
          <Card borderColor="border-dourado">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <Store className="text-dourado" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Canais & Garantia</h2>
                <p className="text-xs text-gray-500">Configurações de atendimento.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="WhatsApp para Pedidos"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="5511999998888"
                description="Formato: 55 + DDD + Número (apenas dígitos)."
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

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <ScrollText size={18} className="text-gray-400" />
                <label className="block text-sm font-medium text-gray-700">Texto da Garantia (PDF)</label>
              </div>
              <textarea
                name="warrantyText"
                value={formData.warrantyText}
                onChange={(e) => setFormData(prev => ({ ...prev, warrantyText: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm"
                placeholder="Ex: Garantia vitalícia na prata. 90 dias para defeitos de fabrico..."
              />
            </div>
          </Card>

          {/* Botão de Salvar */}
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