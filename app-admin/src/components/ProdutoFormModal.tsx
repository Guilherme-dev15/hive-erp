import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, Image as ImageIcon, TrendingUp, DollarSign } from 'lucide-react';
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
  const watchedSale = watch('salePrice'); // Agora vigiamos a venda também
  const watchedCategory = watch('category');
  const watchedSupplierId = watch('supplierId');

  // --- CÁLCULO DE LUCRO E MARGEM (MEMOIZADO) ---
  const indicadores = useMemo(() => {
    const custo = parseFloat(String(watchedCost || 0));
    const venda = parseFloat(String(watchedSale || 0));
    
    if (isNaN(custo) || isNaN(venda)) return { lucro: 0, margem: 0, markup: 0 };

    const lucro = venda - custo;
    // Margem = (Lucro / Venda) * 100
    const margem = venda > 0 ? (lucro / venda) * 100 : 0;
    
    return { lucro, margem };
  }, [watchedCost, watchedSale]);

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

  // --- LÓGICA 1: SUGESTÃO DE PREÇO (APENAS NA CRIAÇÃO) ---
  useEffect(() => {
    if (watchedCost && !produtoParaEditar && !watchedSale) { 
      const custo = parseFloat(watchedCost.toString());
      if (!isNaN(custo) && custo > 0) {
        const markup = configGlobal ? 2.0 : 2.0; 
        const sugestao = (custo * markup).toFixed(2);
        setValue('salePrice', parseFloat(sugestao)); 
      }
    }
  }, [watchedCost, produtoParaEditar, setValue, configGlobal]); // Removido watchedSale do deps para não loopar

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
      
      const payload = {
        ...data,
        costPrice: Number(data.costPrice || 0),
        salePrice: Number(data.salePrice || 0),
        quantity: Number(data.quantity || 0),
        status: (data.status === 'inativo' ? 'inativo' : 'ativo') as 'ativo' | 'inativo'
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

            {/* --- ÁREA FINANCEIRA COM CÁLCULOS (REFATORADA) --- */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                 <DollarSign size={16} className="text-green-600"/>
                 <h4 className="text-sm font-bold text-gray-700 uppercase">Precificação</h4>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Custo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                    <input type="number" step="0.01" {...register('costPrice', { required: true })} className="w-full pl-8 p-2 border rounded-lg text-sm" placeholder="0.00"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">Venda</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800 text-xs font-bold">R$</span>
                    <input type="number" step="0.01" {...register('salePrice', { required: true })} className="w-full pl-8 p-2 border border-green-300 rounded-lg font-bold text-green-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="0.00"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque</label>
                  <input type="number" {...register('quantity', { required: true })} className="w-full p-2 border rounded-lg text-center text-sm" />
                </div>
              </div>

              {/* BARRA DE LUCRO E MARGEM (VISUAL) */}
              {(indicadores.lucro !== 0 || indicadores.margem !== 0) && (
                <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-1">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold">Lucro Líquido</span>
                      <span className={`text-sm font-bold ${indicadores.lucro > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        R$ {indicadores.lucro.toFixed(2)}
                      </span>
                   </div>
                   
                   <div className="h-8 w-px bg-gray-100 mx-4"></div>

                   <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1">
                        Margem <TrendingUp size={10}/>
                      </span>
                      <span className={`text-sm font-bold ${indicadores.margem >= 50 ? 'text-green-600' : indicadores.margem > 20 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {indicadores.margem.toFixed(1)}%
                      </span>
                   </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Descrição</label>
              <textarea {...register('description')} rows={3} className="w-full p-2 border rounded-lg resize-none text-sm" placeholder="Detalhes do produto..."></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-bold">Cancelar</button>
              <button type="submit" disabled={isSubmitting || uploadingImage} className="px-6 py-2 bg-carvao text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 text-sm shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Produto
              </button>
            </div>

          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}