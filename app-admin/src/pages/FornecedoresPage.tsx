import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Phone, Link as LinkIcon, Truck, Loader2, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// Imports Padronizados em Inglês
import { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor } from '../services/apiService';
import type { Fornecedor } from '../types';
import { fornecedorSchema, type FornecedorFormData } from '../types/schemas';

// --- COMPONENTES AUXILIARES ---
const Input = ({ label, name, register, error, placeholder }: any) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input 
      {...register(name)} 
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-dourado outline-none transition-all ${error ? 'border-red-500' : 'border-gray-300'}`}
    />
    {error && <span className="text-xs text-red-500">{error.message}</span>}
  </div>
);

// --- PÁGINA PRINCIPAL ---
export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Fornecedor | null>(null);

  // Carregar Dados
  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      setFornecedores(data);
    } catch (error) {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  };

  // Filtragem (Usando nomes em Inglês)
  const filtered = fornecedores.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Deletar
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteFornecedor(id);
      setFornecedores(prev => prev.filter(f => f.id !== id));
      toast.success("Fornecedor removido.");
    } catch (e) {
      toast.error("Erro ao excluir.");
    }
  };

  // Abrir Modal
  const openModal = (provider?: Fornecedor) => {
    setEditingProvider(provider || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-carvao">Fornecedores</h1>
          <p className="text-gray-500 text-sm">Parceiros e fabricantes.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              placeholder="Buscar fornecedor..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-dourado w-full"
            />
          </div>
          <button onClick={() => openModal()} className="bg-carvao text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-md">
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      {/* Lista / Grid */}
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400"/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-10 text-gray-400 bg-white rounded-xl border border-gray-100">Nenhum fornecedor encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => (
            <div key={f.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{f.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(f)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                {f.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-dourado"/> <span>{f.contactPhone}</span>
                  </div>
                )}
                {f.url && (
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-dourado"/> 
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">{f.url}</a>
                  </div>
                )}
                {f.paymentTerms && (
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-dourado"/> <span>{f.paymentTerms}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Interno */}
      <FornecedorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        provider={editingProvider} 
        onSuccess={(p: Fornecedor) => {
          if (editingProvider) {
            setFornecedores(prev => prev.map(f => f.id === p.id ? p : f));
          } else {
            setFornecedores(prev => [...prev, p]);
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}

// --- COMPONENTE DO FORMULÁRIO (MODAL) ---
function FornecedorModal({ isOpen, onClose, provider, onSuccess }: any) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema)
  });

  // Preencher form ao editar
  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: provider?.name || '',
        contactPhone: provider?.contactPhone || '',
        url: provider?.url || '',
        paymentTerms: provider?.paymentTerms || '',
        email: provider?.email || '',
        pixKey: provider?.pixKey || ''
      });
    }
  }, [isOpen, provider, reset]);

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      let result;
      if (provider) {
        result = await updateFornecedor(provider.id, data);
        toast.success("Atualizado!");
      } else {
        result = await createFornecedor(data);
        toast.success("Criado!");
      }
      onSuccess(result);
    } catch (e) {
      toast.error("Erro ao salvar.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">{provider ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-700"/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <Input label="Nome da Empresa *" name="name" register={register} error={errors.name} placeholder="Ex: Pratas Matriz" />
              <Input label="Telefone / WhatsApp" name="contactPhone" register={register} error={errors.contactPhone} placeholder="Ex: 1199999..." />
              <Input label="Site ou Catálogo (URL)" name="url" register={register} error={errors.url} placeholder="https://..." />
              <Input label="Prazo de Pagamento" name="paymentTerms" register={register} error={errors.paymentTerms} placeholder="Ex: 30/60 dias" />
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-carvao text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />} Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}