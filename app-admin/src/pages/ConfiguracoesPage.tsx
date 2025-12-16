import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Save, Loader2, Palette, Store, Calculator, 
  Package, ScrollText, BellRing, Smartphone, Target, CreditCard 
} from 'lucide-react';
import { getConfig, saveConfig } from '../services/apiService';

// --- VARIANTES DE ANIMAÇÃO ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

// --- COMPONENTES VISUAIS ---

const SectionHeader = ({ icon: Icon, title, description }: any) => (
  <div className="flex items-start gap-4 mb-6">
    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
      <Icon size={24} />
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

const InputGroup = ({ label, children, description }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
    {children}
    {description && <p className="text-[11px] text-gray-400 ml-1">{description}</p>}
  </div>
);

export function ConfiguracoesPage() {
  const [formData, setFormData] = useState({
    whatsappNumber: '', monthlyGoal: '',
    storeName: 'HivePratas', primaryColor: '#D4AF37', secondaryColor: '#343434',
    cardFee: '0', packagingCost: '0',
    warrantyText: '', lowStockThreshold: '5',
    banners: [] as string[]
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
            secondaryColor: data.secondaryColor || '#343434',
            cardFee: (data.cardFeePercent ?? data.cardFee ?? 0).toString(),
            packagingCost: (data.packingCost ?? data.packagingCost ?? 0).toString(),
            warrantyText: data.warrantyText || '',
            lowStockThreshold: data.lowStockThreshold?.toString() || '5',
            banners: data.banners || []
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        whatsappNumber: formData.whatsappNumber,
        storeName: formData.storeName,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        warrantyText: formData.warrantyText,
        banners: formData.banners, 
        monthlyGoal: Number(formData.monthlyGoal) || 0,
        cardFee: Number(formData.cardFee) || 0, 
        cardFeePercent: Number(formData.cardFee) || 0,
        packagingCost: Number(formData.packagingCost) || 0,
        packingCost: Number(formData.packagingCost) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
        productCounter: 0
      };

      await saveConfig(payload);
      toast.success("Sistema atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={40} />
    </div>
  );

  return (
    <motion.div 
      className="pb-24 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Toaster position="top-right" />
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações da Loja</h1>
        <p className="text-gray-500 mt-2 text-lg">Personalize a identidade visual e as regras de negócio do seu sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* --- 1. IDENTIDADE VISUAL --- */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={Palette} title="Identidade Visual" description="Defina como sua marca aparece para o cliente." />
            
            <div className="space-y-5">
              <InputGroup label="Nome da Loja" description="Nome exibido no cabeçalho do catálogo.">
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder="Ex: Hive Pratas"
                  />
                </div>
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Cor Principal">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0" />
                    <input type="text" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="w-full bg-transparent border-none text-xs font-mono uppercase focus:ring-0" />
                  </div>
                </InputGroup>
                
                <InputGroup label="Cor Secundária">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0" />
                    <input type="text" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="w-full bg-transparent border-none text-xs font-mono uppercase focus:ring-0" />
                  </div>
                </InputGroup>
              </div>
            </div>
          </motion.div>

          {/* --- 2. OPERACIONAL & CUSTOS --- */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={Calculator} title="Custos & Metas" description="Dados para cálculo automático de lucro." />

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Taxa Cartão (%)">
                   <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="number" step="0.01"
                        name="cardFee"
                        value={formData.cardFee}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                   </div>
                 </InputGroup>

                 <InputGroup label="Custo Embalagem (R$)">
                   <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="number" step="0.01"
                        name="packagingCost"
                        value={formData.packagingCost}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                   </div>
                 </InputGroup>
              </div>

              <InputGroup label="Meta Mensal de Lucro (R$)" description="Valor alvo para o Dashboard.">
                <div className="relative">
                   <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input
                     type="number"
                     name="monthlyGoal"
                     value={formData.monthlyGoal}
                     onChange={handleChange}
                     className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700"
                     placeholder="Ex: 5000"
                   />
                </div>
              </InputGroup>
            </div>
          </motion.div>

          {/* --- 3. ATENDIMENTO --- */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={Smartphone} title="Atendimento" description="Canais de contato e stock." />
            
            <div className="space-y-5">
               <InputGroup label="WhatsApp (Com DDD)" description="Para onde os pedidos serão enviados.">
                  <div className="relative">
                     <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                     <input
                       name="whatsappNumber"
                       value={formData.whatsappNumber}
                       onChange={handleChange}
                       className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                       placeholder="5511999998888"
                     />
                  </div>
               </InputGroup>

               <InputGroup label="Alerta de Stock Baixo" description="Quantidade mínima para avisar reposição.">
                  <div className="relative">
                     <BellRing className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" size={18} />
                     <input
                       type="number"
                       name="lowStockThreshold"
                       value={formData.lowStockThreshold}
                       onChange={handleChange}
                       className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                     />
                  </div>
               </InputGroup>
            </div>
          </motion.div>

          {/* --- 4. GARANTIA --- */}
          <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <SectionHeader icon={ScrollText} title="Termos de Garantia" description="Texto que sai no PDF de impressão." />
             <textarea
                name="warrantyText"
                value={formData.warrantyText}
                onChange={handleChange}
                rows={5}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm leading-relaxed"
                placeholder="Ex: Garantia vitalícia na prata 925..."
             />
          </motion.div>

        </div>

        {/* --- BARRA DE AÇÃO FLUTUANTE (VIDRO) --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-end z-40 md:pl-[280px]"> {/* Ajuste o padding-left se tiver sidebar fixa */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 font-bold text-sm md:text-base"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Salvar Configurações
          </button>
        </div>

      </form>
    </motion.div>
  );
}
export default ConfiguracoesPage;