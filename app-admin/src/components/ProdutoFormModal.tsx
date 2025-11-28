import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
// Ícones completos
import { X, DollarSign, Plus, Link, Box, Wand2, UploadCloud, Loader2, Image as ImageIcon, Calculator } from 'lucide-react';

import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category } from '../types';
import { produtoSchema, type ProdutoFormData, type ConfigFormData } from '../types/schemas';
import { createAdminProduto, updateAdminProduto } from '../services/apiService';
import { uploadImageToFirebase } from '../services/storageService';

interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  produtoParaEditar?: ProdutoAdmin | null;
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
  configGlobal?: ConfigFormData | null; // Prop para a calculadora
}

type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label?: string;
  name: keyof ProdutoFormData;
  register: ReturnType<typeof useForm<ProdutoFormData>>["register"];
  error?: string;
  icon?: React.ReactNode;
};

const FormInput: React.FC<FormInputProps> = ({ label, name, register, error, icon, ...props }) => (
  <div>
    {label && <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">{label}</label>}
    <div className={`relative ${label ? 'mt-1' : ''}`}>
      {icon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>}
      <input id={String(name)} {...props} {...register(name)} className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado ${icon ? 'pl-10' : ''}`} />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      name: '', costPrice: undefined, salePrice: undefined, quantity: 0, supplierId: '', supplierProductUrl: '', category: '', code: '', imageUrl: '', status: 'ativo',
    }
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const imageUrlObservada = watch('imageUrl');
  const custoObservado = watch('costPrice');
  const vendaObservada = watch('salePrice');
  const categoriaObservada = watch('category');
  const fornecedorObservado = watch('supplierId');

  // --- RAIO-X DO LUCRO ---
  const [raioX, setRaioX] = useState<{ taxaCartao: number; custoEmbalagem: number; lucroLiquido: number; margemLiquida: number; } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        reset({ ...produtoParaEditar, quantity: produtoParaEditar.quantity ?? 0, code: produtoParaEditar.code || '', category: produtoParaEditar.category || '', supplierProductUrl: produtoParaEditar.supplierProductUrl || '', imageUrl: produtoParaEditar.imageUrl || '', description: produtoParaEditar.description || '' });
      } else {
        reset({ name: '', costPrice: undefined, salePrice: undefined, quantity: 0, supplierId: '', supplierProductUrl: '', category: '', code: '', imageUrl: '', status: 'ativo' });
      }
    }
  }, [isOpen, isEditMode, produtoParaEditar, reset]);

  // Lógica de Precificação Automática
  useEffect(() => {
    if (isEditMode) return;
    const custo = Number(custoObservado);
    if (!isNaN(custo) && custo > 0) {
      let markup = 1.7;
      if (custo <= 25) markup = 2.0;
      else if (custo > 200) markup = 0.8;
      const precoSugerido = (custo * (1 + markup)) - 0.10;
      setValue('salePrice', parseFloat(precoSugerido.toFixed(2)));
    } else if (custo === 0) { setValue('salePrice', undefined); }
  }, [custoObservado, setValue, isEditMode]);

  // Lógica do Raio-X
  useEffect(() => {
    const custo = Number(custoObservado) || 0;
    const venda = Number(vendaObservada) || 0;
    if (venda > 0) {
      const taxaPercentual = configGlobal?.cardFee || 0;
      const custoEmbalagem = configGlobal?.packagingCost || 0;
      const valorTaxa = venda * (taxaPercentual / 100);
      const lucro = venda - custo - valorTaxa - custoEmbalagem;
      const margem = (lucro / venda) * 100;
      setRaioX({ taxaCartao: valorTaxa, custoEmbalagem: custoEmbalagem, lucroLiquido: lucro, margemLiquida: margem });
    } else { setRaioX(null); }
  }, [custoObservado, vendaObservada, configGlobal]);

  // Lógica de SKU Automático
  useEffect(() => {
    if (isEditMode) return;
    if (categoriaObservada && fornecedorObservado) {
      const catInicial = categoriaObservada.charAt(0).toUpperCase();
      const fornecedor = fornecedores.find(f => f.id === fornecedorObservado);
      let fornIniciais = 'XX';
      if (fornecedor) {
         const nomeLimpo = fornecedor.name.replace(/\s/g, '');
         fornIniciais = nomeLimpo.substring(0, 2).toUpperCase();
      }
      const randomNum = Math.floor(100 + Math.random() * 900);
      setValue('code', `${catInicial}${fornIniciais}${randomNum}`);
    }
  }, [categoriaObservada, fornecedorObservado, fornecedores, isEditMode, setValue]);

  // Função de Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB."); return; }
    setIsUploading(true);
    try {
      const url = await uploadImageToFirebase(file, 'produtos');
      setValue('imageUrl', url, { shouldValidate: true });
      toast.success("Imagem carregada!");
    } catch (error) { toast.error("Erro no upload."); } finally { setIsUploading(false); }
  };

  const onSubmit: SubmitHandler<ProdutoFormData> = (data) => {
    let promise;
    if (isEditMode && produtoParaEditar) { promise = updateAdminProduto(produtoParaEditar.id, data); } 
    else { promise = createAdminProduto(data); }
    toast.promise(promise, {
      loading: "A salvar...",
      success: (res) => { onProdutoSalvo(res); onClose(); return "Salvo!"; },
      error: "Erro ao salvar."
    });
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setValue('category', newCategory.name, { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-carvao">{isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}</h2>
              <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormInput label="Nome do Produto" name="name" register={register} error={errors.name?.message} placeholder="Ex: Anel Solitário Prata 925" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Custo (R$)" name="costPrice" type="number" step="0.01" register={register} error={errors.costPrice?.message} placeholder="25.00" icon={<DollarSign size={16} />} />
                <FormInput label="Venda (R$)" name="salePrice" type="number" step="0.01" register={register} error={errors.salePrice?.message} placeholder="Auto" icon={<DollarSign size={16} />} />
                <FormInput label="Stock (Qtd)" name="quantity" type="number" step="1" register={register} error={errors.quantity?.message} placeholder="0" icon={<Box size={16} />} />
              </div>

              {/* --- VISUALIZAÇÃO DO RAIO-X (Inserido aqui) --- */}
              {raioX && (
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-sm animate-in fade-in slide-in-from-top-2">
                  <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> Raio-X do Lucro Real</h4>
                  <div className="grid grid-cols-2 gap-y-1 text-gray-600">
                    <span>Venda Bruta:</span><span className="text-right font-medium text-gray-900">R$ {Number(vendaObservada).toFixed(2)}</span>
                    <span>(-) Custo Peça:</span><span className="text-right text-red-500">- R$ {Number(custoObservado).toFixed(2)}</span>
                    <span>(-) Taxa Cartão ({configGlobal?.cardFee || 0}%):</span><span className="text-right text-red-500">- R$ {raioX.taxaCartao.toFixed(2)}</span>
                    <span>(-) Embalagem:</span><span className="text-right text-red-500">- R$ {raioX.custoEmbalagem.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-emerald-200 flex justify-between items-center">
                    <span className="font-bold text-emerald-900">Lucro Líquido:</span>
                    <div className="text-right">
                      <span className={`block text-lg font-bold ${raioX.lucroLiquido > 0 ? 'text-emerald-700' : 'text-red-600'}`}>R$ {raioX.lucroLiquido.toFixed(2)}</span>
                      <span className="text-xs text-emerald-600 font-medium">Margem: {raioX.margemLiquida.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
              {/* --------------------------------------------- */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fornecedor</label>
                  <select {...register("supplierId")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado">
                    <option value="">Selecione...</option>
                    {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {errors.supplierId && <p className="mt-1 text-xs text-red-600">{errors.supplierId.message}</p>}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="p-1 rounded-full text-dourado hover:bg-gray-100"><Plus size={18} /></button>
                  </div>
                  <select {...register("category")} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado">
                    <option value="">Selecione...</option>
                    {categories.sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Código (SKU)" name="code" register={register} error={errors.code?.message} placeholder="Auto (Ex: BMO123)" icon={<Wand2 size={16} className="text-dourado" />} />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select {...register("status")} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-dourado">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <FormInput label="Link do Fornecedor" name="supplierProductUrl" type="url" register={register} placeholder="https://..." icon={<Link size={16} />} />
              
              {/* --- UPLOAD --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {imageUrlObservada ? <img src={imageUrlObservada} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={32} />}
                    {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="text-white animate-spin" /></div>}
                  </div>
                  <div className="flex-1">
                    <input type="file" id="upload-btn" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                    <label htmlFor="upload-btn" className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-dourado hover:bg-yellow-50/50'}`}>
                      <UploadCloud className="text-gray-400 mb-1" />
                      <span className="text-sm font-medium text-gray-600">{isUploading ? "A carregar..." : "Carregar Foto"}</span>
                    </label>
                    <input type="hidden" {...register("imageUrl")} />
                  </div>
                </div>
              </div>

              <FormInput label="Descrição Curta" name="description" register={register} placeholder="Ex: Prata 925 com zircônia" />

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting || isUploading} className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50">
                  {isSubmitting ? "A guardar..." : (isEditMode ? "Atualizar" : "Salvar")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} onCategoryCreated={handleCategoryCreated} />
    </AnimatePresence>
  );
}