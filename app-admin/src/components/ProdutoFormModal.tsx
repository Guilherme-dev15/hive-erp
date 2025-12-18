import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Plus, Link, Box, Wand2, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod'; // Import Zod directly to extend schema

import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category } from '../types';
import { produtoSchema, type ConfigFormData } from '../types/schemas'; // Removed ProdutoFormData import to redefine locally
import { createAdminProduto, updateAdminProduto, uploadImage } from '../services/apiService';

// --- EXTENDING TYPES AND SCHEMAS LOCALLY ---

// 1. Extend the Zod Schema to include subcategory
const extendedProdutoSchema = produtoSchema.extend({
  subcategory: z.string().optional(),
});

// 2. Derive the new Form Data type from the extended schema
type ExtendedProdutoFormData = z.infer<typeof extendedProdutoSchema>;

// 3. Extend the ProdutoAdmin type for local usage
interface ExtendedProdutoAdmin extends ProdutoAdmin {
  subcategory?: string;
}

interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  produtoParaEditar?: ProdutoAdmin | null;
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
  configGlobal?: ConfigFormData | null;
}

// Componente de Input Reutilizável
type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label?: string;
  name: keyof ExtendedProdutoFormData; // Updated to use Extended Type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
  icon?: React.ReactNode;
};

const FormInput: React.FC<FormInputProps> = ({ label, name, register, error, icon, ...props }) => (
  <div>
    {label && <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <div className="relative">
      {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</div>}
      <input
        id={String(name)}
        {...props}
        {...register(name)}
        className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-dourado focus:border-transparent transition-all ${icon ? 'pl-10' : ''}`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
  </div>
);

export function ProdutoFormModal({
  isOpen,
  onClose,
  fornecedores,
  categories,
  setCategories,
  produtoParaEditar,
  onProdutoSalvo,
  configGlobal
}: ProdutoFormModalProps) {

  const isEditMode = !!produtoParaEditar;
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Hook Form using Extended Schema and Type
  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<ExtendedProdutoFormData>({
    resolver: zodResolver(extendedProdutoSchema),
    defaultValues: {
      name: '',
      costPrice: 0,
      salePrice: 0,
      quantity: 0,
      supplierId: '',
      supplierProductUrl: '',
      category: '',
      subcategory: '',
      code: '',
      imageUrl: '',
      status: 'ativo',
      description: ''
    }
  });

  const custoObservado = watch('costPrice');
  const vendaObservada = watch('salePrice');
  const categoriaObservada = watch('category');
  const fornecedorObservado = watch('supplierId');

  const indicadores = useMemo(() => {
    const custo = Number(custoObservado) || 0;
    const venda = Number(vendaObservada) || 0;

    if (venda === 0) return null;

    const taxaCartao = configGlobal?.cardFee || 0;
    const custoEmbalagem = configGlobal?.packagingCost || 0;

    const valorTaxa = venda * (taxaCartao / 100);
    const custoTotal = custo + valorTaxa + custoEmbalagem;
    const lucro = venda - custoTotal;
    const margem = (lucro / venda) * 100;

    return {
      taxaCartaoValor: valorTaxa,
      custoEmbalagem: custoEmbalagem,
      lucroLiquido: lucro,
      margemLiquida: margem
    };
  }, [custoObservado, vendaObservada, configGlobal]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        // Cast produtoParaEditar to Extended Type to access subcategory safely
        const produtoExt = produtoParaEditar as ExtendedProdutoAdmin;
        
        reset({
          name: produtoExt.name,
          costPrice: produtoExt.costPrice || 0,
          salePrice: produtoExt.salePrice || 0,
          quantity: produtoExt.quantity || 0,
          code: produtoExt.code || '',
          category: produtoExt.category || '',
          subcategory: produtoExt.subcategory || '', 
          supplierId: produtoExt.supplierId || '',
          supplierProductUrl: produtoExt.supplierProductUrl || '',
          imageUrl: produtoExt.imageUrl || '',
          description: produtoExt.description || '',
          status: produtoExt.status || 'ativo'
        });
        setPreviewImage(produtoExt.imageUrl || null);
      } else {
        reset({
          name: '', costPrice: 0, salePrice: 0, quantity: 0,
          supplierId: '', category: '', subcategory: '', code: '', imageUrl: '',
          status: 'ativo', description: ''
        });
        setPreviewImage(null);
      }
    }
  }, [isOpen, isEditMode, produtoParaEditar, reset]);

  useEffect(() => {
    if (isEditMode) return;
    const custo = Number(custoObservado);
    if (custo > 0 && !getValues('salePrice')) {
      let markup = 2.0;
      if (custo > 200) markup = 1.5;
      const precoSugerido = Math.ceil(custo * markup) - 0.10;
      setValue('salePrice', precoSugerido);
    }
  }, [custoObservado, setValue, isEditMode, getValues]);

  useEffect(() => {
    if (isEditMode) return;
    if (categoriaObservada && fornecedorObservado && !getValues('code')) {
      const catInicial = categoriaObservada.charAt(0).toUpperCase();
      const fornecedor = fornecedores.find(f => f.id === fornecedorObservado);
      let fornIniciais = 'XX';
      if (fornecedor) {
        const nomeLimpo = fornecedor.name.replace(/[^a-zA-Z]/g, '');
        fornIniciais = nomeLimpo.substring(0, 2).toUpperCase();
      }
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setValue('code', `${catInicial}${fornIniciais}${randomNum}`);
    }
  }, [categoriaObservada, fornecedorObservado, fornecedores, isEditMode, setValue, getValues]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB."); return; }

    setIsUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      const url = await uploadImage(file, 'products');
      setValue('imageUrl', url, { shouldDirty: true });
      toast.success("Imagem carregada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro no upload.");
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit: SubmitHandler<ExtendedProdutoFormData> = async (data) => {
    try {
      const payload = {
        ...data,
        subcategory: data.subcategory?.toUpperCase() || '',
        imageUrl: data.imageUrl || getValues('imageUrl') || '',
      };

      let result;
      if (isEditMode && produtoParaEditar) {
        // Cast payload to any to bypass strict type checking until types are updated
        result = await updateAdminProduto(produtoParaEditar.id, payload as any);
        toast.success("Produto atualizado!");
      } else {
        result = await createAdminProduto(payload as any);
        toast.success("Produto criado!");
      }

      onProdutoSalvo(result);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setValue('category', newCategory.name, { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-produto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? "Editar Produto" : "Novo Produto"}</h2>
                <p className="text-xs text-gray-500">Preencha os detalhes abaixo.</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <input type="hidden" {...register('imageUrl')} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden relative shrink-0">
                        {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32} />}
                        {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin" /></div>}
                      </div>
                      <div className="flex-1">
                        <input type="file" id="upload-btn" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        <label htmlFor="upload-btn" className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading ? 'opacity-50' : 'border-gray-300 hover:border-dourado hover:bg-yellow-50/30'}`}>
                          <UploadCloud className="text-gray-400 mb-1" />
                          <span className="text-xs font-bold text-gray-500">{isUploading ? "Enviando..." : "Clique para enviar"}</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <FormInput label="Nome do Produto" name="name" register={register} error={errors.name?.message} placeholder="Ex: Anel Solitário" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <div className="flex gap-1">
                        <select {...register("category")} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado text-sm">
                          <option value="">Selecione...</option>
                          {categories.sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"><Plus size={18} /></button>
                      </div>
                      {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                    </div>
                    
                    <FormInput 
                      label="Subcategoria" 
                      name="subcategory" 
                      register={register} 
                      placeholder="Ex: Argola" 
                      error={errors.subcategory?.message}
                    />
                  </div>
                  
                  <FormInput label="SKU (Auto)" name="code" register={register} placeholder="Auto" icon={<Wand2 size={14} />} />
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><DollarSign size={16} /> Precificação</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <FormInput label="Custo (R$)" name="costPrice" type="number" step="0.01" register={register} error={errors.costPrice?.message} />
                      <FormInput label="Venda (R$)" name="salePrice" type="number" step="0.01" register={register} error={errors.salePrice?.message} />
                    </div>

                    {indicadores && (
                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
                        <div className="flex justify-between text-gray-500 mb-1">
                          <span>Taxas ({configGlobal?.cardFee || 0}% + Emb):</span>
                          <span className="text-red-500">- R$ {(indicadores.taxaCartaoValor + indicadores.custoEmbalagem).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-gray-700">Lucro Líquido:</span>
                          <span className={`text-sm ${indicadores.lucroLiquido > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {indicadores.lucroLiquido.toFixed(2)} ({indicadores.margemLiquida.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Estoque Atual" name="quantity" type="number" register={register} error={errors.quantity?.message} icon={<Box size={14} />} />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select {...register("status")} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado text-sm">
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <select {...register("supplierId")} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado text-sm">
                      <option value="">Selecione...</option>
                      {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <FormInput label="Link do Fornecedor (Opcional)" name="supplierProductUrl" type="url" register={register} icon={<Link size={14} />} placeholder="https://..." />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Curta</label>
                <textarea {...register("description")} rows={2} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado text-sm resize-none" placeholder="Ex: Prata 925 legítima..." />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={isSubmitting || isUploading} className="bg-carvao text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isEditMode ? "Atualizar Produto" : "Salvar Produto"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        setCategories={setCategories}
        onCategoryCreated={handleCategoryCreated}
      />
    </AnimatePresence>
  );
}