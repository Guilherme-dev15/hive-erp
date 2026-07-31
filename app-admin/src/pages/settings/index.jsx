import React, { useState, useEffect } from 'react';
import { Save, Store, Palette, Phone, Globe } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getConfig, saveConfig } from '../../services/apiService'; // Vamos criar essa função já já

export function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    slug: '', // O link da loja (ex: minhaloja)
    whatsapp: '',
    primaryColor: '#000000',
    bannerUrl: '' // Por enquanto texto, depois imagem
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const data = await getConfig();
      if (data) {
        setFormData({
          storeName: data.storeName || '',
          slug: data.slug || '',
          whatsapp: data.whatsapp || '',
          primaryColor: data.primaryColor || '#000000',
          bannerUrl: data.bannerUrl || ''
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar configurações");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveConfig(formData);
      toast.success("Loja atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Minha Loja</h1>
        <p className="text-gray-500">Personalize a aparência e dados da sua vitrine.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identidade */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Store className="text-dourado" size={20} />
            <h3 className="font-bold text-gray-800">Identidade</h3>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input 
              type="text" 
              value={formData.storeName}
              onChange={e => setFormData({...formData, storeName: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none"
              placeholder="Ex: Hive Pratas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link da Loja (Slug)</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                hive-erp.../
              </span>
              <input 
                type="text" 
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                className="flex-1 p-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-dourado outline-none"
                placeholder="minha-loja"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Este será o endereço da sua loja.</p>
          </div>
        </div>

        {/* Contato & Aparência */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="text-dourado" size={20} />
            <h3 className="font-bold text-gray-800">Aparência & Contato</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de Suporte</label>
            <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                type="text" 
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none"
                placeholder="5511999999999"
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor Principal</label>
            <div className="flex gap-2 items-center">
                <input 
                type="color" 
                value={formData.primaryColor}
                onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                className="h-10 w-10 rounded cursor-pointer border-0"
                />
                <input 
                type="text" 
                value={formData.primaryColor}
                onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                className="flex-1 p-2 border border-gray-300 rounded-lg uppercase"
                maxLength={7}
                />
            </div>
          </div>
        </div>

        {/* Botão Salvar (Fixo ou no fim) */}
        <div className="md:col-span-2 flex justify-end">
            <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-dourado text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg disabled:opacity-50"
            >
                {loading ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
            </button>
        </div>

      </form>
    </div>
  );
}