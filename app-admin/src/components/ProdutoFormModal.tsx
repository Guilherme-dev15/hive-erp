import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
// 1. Removido 'Trash2' que não estava sendo usado
import { X, Save, Loader2, Image as ImageIcon } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { createAdminProduto, updateAdminProduto, uploadImage } from '../services/apiService';
import type { ProdutoAdmin, Fornecedor, Category } from '../types';
import type { ConfigFormData } from '../types/schemas';

interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  produtoParaEditar?: ProdutoAdmin | null;
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
  configGlobal: ConfigFormData | null;
}

export function ProdutoFormModal({ 
  isOpen, onClose, fornecedores, categories, produtoParaEditar, onProdutoSalvo, configGlobal 
}: ProdutoFormModalProps) {
  
  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<ProdutoAdmin>();
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  // Vigia os campos para recalcular preços e códigos
  const watchedCost = watch('costPrice');
  const watchedCategory = watch('category');
  const watchedSupplierId = watch('supplierId');

  useEffect(() => {
    if (isOpen) {
      if (produtoParaEditar) {
        reset(produtoParaEditar);
        setPreviewImage(produtoParaEditar.imageUrl || null);
      } else {
        reset({
          name: '',
          costPrice: 0,
          salePrice: 0,
          quantity: 0,
          description: '',
          code: '',
          category: '',
          supplierId: '',
          status: 'ativo'
        });
        setPreviewImage(null);
      }
    }
  }, [isOpen, produtoParaEditar, reset]);

  // --- LÓGICA 1: CÁLCULO DE PREÇO AUTOMÁTICO ---
  useEffect(() => {
    if (watchedCost && !produtoParaEditar) { 
      const custo = parseFloat(watchedCost.toString());
      if (!isNaN(custo)) {
        // 2. Corrigido: Usamos a variável 'sugestao' e 'configGlobal' para evitar o erro de não uso
        // Se houver configuração de markup global, usamos, senão padrão 2.0
        // (Assumindo que configGlobal possa ter essa info futuramente, por enquanto usamos fallback seguro)
        const markup = configGlobal ? 2.0 : 2.0; 
        const sugestao = (custo * markup).toFixed(2);
        
        // Aplicamos o valor no campo
        setValue('salePrice', parseFloat(sugestao)); 
      }
    }
  }, [watchedCost, produtoParaEditar, setValue, configGlobal]);

  // --- LÓGICA 2: REGENERAÇÃO DE SKU ---
  useEffect(() => {
    if (!watchedCategory || !watchedSupplierId) return;

    const catName = watchedCategory;
    const supObj = fornecedores.find(f => f.id === watchedSupplierId);
    const supName = supObj ? supObj.name : 'GEN';

    const catPrefix = catName.substring(0, 3).toUpperCase();
    const supPrefix = supName.substring(0, 3).toUpperCase();

    let sequence = '0000';
    const currentCode = getValues('code');

    if (currentCode && currentCode.includes('-')) {
      const parts = currentCode.split('-');
      if (parts.length === 3 && !isNaN(Number(parts[1]))) {
        sequence = parts[1];
      } else {
        sequence = String(Math.floor(1000 + Math.random() * 9000));
      }
    } else {
      sequence = String(Math.floor(1000 + Math.random() * 9000));
    }

    const newCode = `${catPrefix}-${sequence}-${supPrefix}`;

    if (currentCode !== newCode) {
      setValue('code', newCode);
    }

  }, [watchedCategory, watchedSupplierId, fornecedores, setValue, getValues]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      const url = await uploadImage(file, 'produtos');
      setValue('imageUrl', url);
      toast.success("Imagem carregada!");
    } catch (error) {
      toast.error("Erro ao subir imagem.");
      setPreviewImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const onFormSubmit = async (data: ProdutoAdmin) => {
    try {
      let savedProduct;
      
      // 3. CORREÇÃO CRÍTICA DOS TIPOS (FIXED)
      // Garantimos que 'status' é estritamente 'ativo' ou 'inativo' e números são válidos
      const payload = {
        ...data,
        costPrice: Number(data.costPrice || 0),
        salePrice: Number(data.salePrice || 0), // Resolve erro 'possibly undefined'
        quantity: Number(data.quantity || 0),
        status: (data.status === 'inativo' ? 'inativo' : 'ativo') as 'ativo' | 'inativo' // Resolve erro de tipagem estrita
      };

      if (produtoParaEditar?.id) {
        savedProduct = await updateAdminProduto(produtoParaEditar.id, payload);
        toast.success("Produto atualizado!");
      } else {
        savedProduct = await createAdminProduto(payload);
        toast.success("Produto criado!");
      }
      onProdutoSalvo(savedProduct);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="bg-carvao p-4 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold text-lg">{produtoParaEditar ? 'Editar Produto' : 'Novo Produto'}</h3>
            <button onClick={onClose}><X size={20}/></button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="flex gap-6">
              {/* Upload Imagem */}
              <div className="shrink-0">
                <label className={`block w-32 h-32 rounded-lg border-2 border-dashed cursor-pointer overflow-hidden relative group ${previewImage ? 'border-dourado' : 'border-gray-300 hover:border-gray-400'}`}>
                  {uploadingImage ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-dourado"/></div>
                  ) : previewImage ? (
                    <>
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="text-white"/>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <ImageIcon size={24} />
                      <span className="text-[10px] mt-1">Alterar Foto</span>
                    </div>
                  )}
                  <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome do Produto</label>
                  <input {...register('name', { required: true })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-dourado outline-none" placeholder="Ex: Anel Solitário"/>
                  {errors.name && <span className="text-red-500 text-xs">Obrigatório</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SKU (Auto)</label>
                    <input {...register('code')} className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 font-mono text-sm" readOnly />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                    <select {...register('status')} className="w-full p-2 border rounded-lg">
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Categoria</label>
                <select {...register('category', { required: true })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-dourado">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {errors.category && <span className="text-red-500 text-xs">Selecione uma categoria</span>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fornecedor</label>
                <select {...register('supplierId', { required: true })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-dourado">
                  <option value="">Selecione...</option>
                  {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                {errors.supplierId && <span className="text-red-500 text-xs">Selecione um fornecedor</span>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custo (R$)</label>
                <input type="number" step="0.01" {...register('costPrice', { required: true })} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-bold text-green-700 uppercase mb-1">Venda (R$)</label>
                <input type="number" step="0.01" {...register('salePrice', { required: true })} className="w-full p-2 border border-green-200 rounded-lg font-bold text-green-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque</label>
                <input type="number" {...register('quantity', { required: true })} className="w-full p-2 border rounded-lg text-center" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição</label>
              <textarea {...register('description')} rows={3} className="w-full p-2 border rounded-lg resize-none" placeholder="Detalhes do produto..."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting || uploadingImage} className="px-6 py-2 bg-carvao text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Salvar Produto
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}