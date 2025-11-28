import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
// Adicionámos 'UploadCloud', 'Loader2' e 'Image'
import { X, DollarSign, Plus, Link, Box, UploadCloud, Loader2, Image as ImageIcon } from 'lucide-react';

import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category } from '../types';
import { produtoSchema, type ProdutoFormData } from '../types/schemas';
import { createAdminProduto, updateAdminProduto } from '../services/apiService';
// Importar o serviço de upload
import { uploadImageToFirebase } from '../services/storageService';

interface ProdutoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedores: Fornecedor[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  produtoParaEditar?: ProdutoAdmin | null;
  onProdutoSalvo: (produto: ProdutoAdmin) => void;
}

type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  label?: string;
  name: keyof ProdutoFormData;
  register: ReturnType<typeof useForm<ProdutoFormData>>["register"];
  error?: string;
  icon?: React.ReactNode;
};

const FormInput: React.FC<FormInputProps> = ({
  label,
  name,
  register,
  error,
  icon,
  ...props
}) => (
  <div>
    {label && (
      <label htmlFor={String(name)} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
    )}
    <div className={`relative ${label ? 'mt-1' : ''}`}>
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
      )}
      <input
        id={String(name)}
        {...props}
        {...register(name)}
        className={`block w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"
          } rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado
           ${icon ? 'pl-10' : ''}`}
      />
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
}: ProdutoFormModalProps) {

  const isEditMode = !!produtoParaEditar;
  const [isUploading, setIsUploading] = useState(false); // Estado de carregamento da imagem

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      name: '',
      costPrice: undefined,
      salePrice: undefined,
      quantity: 0,
      supplierId: '',
      supplierProductUrl: '',
      category: '',
      code: '',
      imageUrl: '',
      status: 'ativo',
    }
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const imageUrlObservada = watch('imageUrl'); // Para mostrar o preview

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        reset({
          ...produtoParaEditar,
          quantity: produtoParaEditar.quantity ?? 0,
          code: produtoParaEditar.code || '',
          category: produtoParaEditar.category || '',
          supplierProductUrl: produtoParaEditar.supplierProductUrl || '',
          imageUrl: produtoParaEditar.imageUrl || '',
          description: produtoParaEditar.description || ''
        });
      } else {
        reset({
          name: '',
          costPrice: undefined,
          salePrice: undefined,
          quantity: 0,
          supplierId: '',
          supplierProductUrl: '',
          category: '',
          code: '',
          imageUrl: '',
          status: 'ativo',
        });
      }
    }
  }, [isOpen, isEditMode, produtoParaEditar, reset]);

  // Precificação Automática
  const custoObservado = watch('costPrice');
  useEffect(() => {
    if (isEditMode) return;
    const custo = Number(custoObservado);
    if (!isNaN(custo) && custo > 0) {
      let markup = 1.7;
      if (custo <= 25) { markup = 2.0; }
      else if (custo > 200) { markup = 0.8; }
      const precoSugerido = (custo * (1 + markup)) - 0.10;
      setValue('salePrice', parseFloat(precoSugerido.toFixed(2)));
    }
  }, [custoObservado, setValue, isEditMode]);

  // --- FUNÇÃO DE UPLOAD ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Envia para o Firebase Storage
      const url = await uploadImageToFirebase(file, 'produtos');
      // 2. Coloca o link recebido no campo do formulário
      setValue('imageUrl', url, { shouldValidate: true });
      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao fazer upload. Verifique a sua internet.");
    } finally {
      setIsUploading(false);
    }
  };
  // ------------------------

  const onSubmit: SubmitHandler<ProdutoFormData> = (data) => {
    let promise;
    if (isEditMode && produtoParaEditar) {
      promise = updateAdminProduto(produtoParaEditar.id, data);
    } else {
      promise = createAdminProduto(data);
    }

    toast.promise(promise, {
      loading: isEditMode ? "A atualizar..." : "A salvar...",
      success: (produtoSalvo) => {
        onProdutoSalvo(produtoSalvo);
        onClose();
        return `Produto ${isEditMode ? 'atualizado' : 'salvo'}!`;
      },
      error: (err) => err.message || "Erro ao salvar.",
    });
  };

  const handleCategoryCreated = (newCategory: Category) => {
    setValue('category', newCategory.name, { shouldValidate: true });
    setIsCategoryModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-carvao">
                {isEditMode ? "Editar Produto" : "Adicionar Novo Produto"}
              </h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <FormInput label="Nome do Produto" name="name" register={register} error={errors.name?.message} placeholder="Ex: Anel Solitário Prata 925" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput label="Custo (R$)" name="costPrice" type="number" step="0.01" register={register} error={errors.costPrice?.message} placeholder="25.00" icon={<DollarSign size={16} className="text-gray-400" />} />
                <FormInput label="Venda (R$)" name="salePrice" type="number" step="0.01" register={register} error={errors.salePrice?.message} placeholder="Auto" icon={<DollarSign size={16} className="text-gray-400" />} />
                <FormInput label="Stock (Qtd)" name="quantity" type="number" step="1" register={register} error={errors.quantity?.message} placeholder="0" icon={<Box size={16} className="text-gray-400" />} />
              </div>
              <p className="text-xs text-gray-500 -mt-2 ml-1">
                {isEditMode ? "Ajuste o preço manualmente se necessário." : "O preço de venda é calculado automaticamente."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Fornecedor</label>
                  <select id="supplierId" {...register("supplierId")} className={`mt-1 block w-full px-3 py-2 border ${errors.supplierId ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}>
                    <option value="">Selecione um fornecedor</option>
                    {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {errors.supplierId && <p className="mt-1 text-xs text-red-600">{errors.supplierId.message}</p>}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria (Opcional)</label>
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="p-1 rounded-full text-dourado hover:bg-gray-100" title="Gerir categorias"><Plus size={18} /></button>
                  </div>
                  <select id="category" {...register("category")} className={`block w-full px-3 py-2 border ${errors.category ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}>
                    <option value="">Selecione uma categoria</option>
                    {categories.sort((a, b) => a.name.localeCompare(b.name)).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Código (SKU) (Opcional)" name="code" register={register} error={errors.code?.message} placeholder="Ex: ANL-001" />
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select id="status" {...register("status")} className={`mt-1 block w-full px-3 py-2 border ${errors.status ? "border-red-500" : "border-gray-300"} rounded-lg shadow-sm focus:outline-none focus:ring-dourado focus:border-dourado`}>
                    <option value="ativo">Ativo (Visível)</option>
                    <option value="inativo">Inativo (Oculto)</option>
                  </select>
                  {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
                </div>
              </div>

              <FormInput label="Link do Fornecedor (Opcional)" name="supplierProductUrl" type="url" register={register} error={errors.supplierProductUrl?.message} placeholder="https://..." icon={<Link size={16} className="text-gray-400" />} />
              
              {/* --- ÁREA DE UPLOAD DE IMAGEM (NOVA) --- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-24 h-24 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center overflow-hidden relative shadow-sm">
                    {imageUrlObservada ? (
                      <img src={imageUrlObservada} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-300" size={32} />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                        <Loader2 className="text-white animate-spin" size={24} />
                      </div>
                    )}
                  </div>

                  {/* Botão */}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="upload-btn"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="upload-btn"
                      className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
                        ${isUploading 
                          ? 'bg-gray-50 border-gray-300 cursor-not-allowed opacity-70' 
                          : 'border-gray-300 hover:border-dourado hover:bg-yellow-50/50 group'}`}
                    >
                      <UploadCloud className={`mb-1 ${isUploading ? 'text-gray-400' : 'text-gray-500 group-hover:text-dourado'}`} size={24} />
                      <span className={`text-sm font-medium ${isUploading ? 'text-gray-500' : 'text-gray-600 group-hover:text-dourado'}`}>
                        {isUploading ? "A enviar para a nuvem..." : "Clique para carregar imagem"}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP (Máx. 5MB)</span>
                    </label>
                    
                    {/* Input Oculto para o React Hook Form gerir o valor */}
                    <input type="hidden" {...register("imageUrl")} />
                    {errors.imageUrl && <p className="mt-1 text-xs text-red-600">{errors.imageUrl.message}</p>}
                  </div>
                </div>
              </div>
              {/* ---------------------------------------- */}

              <FormInput label="Descrição Curta (Opcional)" name="description" register={register} error={errors.description?.message} placeholder="Ex: Prata 925 com zircônia" />

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSubmitting || isUploading} className="bg-carvao text-white px-5 py-2 rounded-lg shadow-md hover:bg-gray-700 transition-all duration-200 disabled:opacity-50">
                  {isSubmitting ? (isEditMode ? "Atualizando..." : "Salvando...") : (isEditMode ? "Atualizar Produto" : "Salvar Produto")}
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