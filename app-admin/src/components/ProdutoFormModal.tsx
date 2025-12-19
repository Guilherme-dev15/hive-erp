import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  X, DollarSign, Plus, Box, Wand2, UploadCloud, 
  Loader2, Image as ImageIcon, Calculator, Scale, AlertCircle,
  Ruler, ChevronDown 
} from 'lucide-react';
import { z } from 'zod';

import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category } from '../types';
import { produtoSchema, type ConfigFormData } from '../types/schemas';
import { createAdminProduto, updateAdminProduto, uploadImage } from '../services/apiService';

// --- SCHEMA ---
const extendedProdutoSchema = produtoSchema.extend({
  subcategory: z.string().optional(),
  markup: z.coerce.number().min(1, "Mínimo 1.0").optional(),
  weight: z.coerce.number().optional(),
  gramPrice: z.coerce.number().optional(),
  cm: z.string().optional(),
  mm: z.string().optional(),
});

type ExtendedProdutoFormData = z.infer<typeof extendedProdutoSchema>;

// Tipo Estendido
type ExtendedProdutoAdmin = Omit<ProdutoAdmin, 'subcategory' | 'weight' | 'gramPrice'> & {
  subcategory?: string;
  weight?: number;
  gramPrice?: number;
  cm?: string;
  mm?: string;
};

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

// ----------------------------------------------------------------------
// 1. INPUT PADRONIZADO
// ----------------------------------------------------------------------
const FormInput: React.FC<any> = ({ label, name, register, error, icon, className, children, ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={String(name)} className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider ml-1">
        {label}
      </label>
    )}
    <div className="relative group">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-[#d19900] transition-colors">
          {icon}
        </div>
      )}
      <input
        id={String(name)}
        {...props}
        {...register(name)}
        className={`
          block w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all duration-200
          ${error 
            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
            : "border-gray-200 hover:border-gray-300 focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10"
          } 
          ${icon ? 'pl-10' : ''} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed placeholder:text-gray-400 text-gray-800
        `}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
  </div>
);

// ----------------------------------------------------------------------
// 2. SELECT PADRONIZADO
// ----------------------------------------------------------------------
const FormSelect: React.FC<any> = ({ label, name, register, error, icon, className, children, ...props }) => (
  <div className={className}>
    {label && (
      <label htmlFor={String(name)} className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider ml-1">
        {label}
      </label>
    )}
    <div className="relative group">
      {icon && (
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-[#d19900] transition-colors">
          {icon}
        </div>
      )}
      <select
        id={String(name)}
        {...props}
        {...register(name)}
        className={`
          block w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all duration-200 appearance-none
          ${error 
            ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
            : "border-gray-200 hover:border-gray-300 focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10"
          } 
          ${icon ? 'pl-10' : ''} disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-800
        `}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <ChevronDown size={14} />
      </div>
    </div>
    {error && <p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1"><AlertCircle size={10}/> {error}</p>}
  </div>
);

export function ProdutoFormModal({
  isOpen, onClose, fornecedores, categories, setCategories, produtoParaEditar, onProdutoSalvo, configGlobal
}: ProdutoFormModalProps) {

  const isEditMode = !!produtoParaEditar;
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // --- ESTADOS DA CALCULADORA ---
  const [showMetalCalc, setShowMetalCalc] = useState(false);
  const [activeSupplierRules, setActiveSupplierRules] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors, isSubmitting } } = useForm<ExtendedProdutoFormData>({
    resolver: zodResolver(extendedProdutoSchema),
    defaultValues: {
      name: '', costPrice: 0, salePrice: 0, markup: 2.0, quantity: 0,
      supplierId: '', category: '', subcategory: '', code: '', imageUrl: '',
      status: 'ativo', description: '', weight: 0, gramPrice: 0, cm: '', mm: ''
    }
  });

  const custoObs = watch('costPrice');
  const vendaObs = watch('salePrice');
  const markupObs = watch('markup');
  const pesoObs = watch('weight');
  const gramaObs = watch('gramPrice');
  const fornecedorObs = watch('supplierId');

  // --- LÓGICA DE GERAÇÃO DE CÓDIGO INTELIGENTE ---
  const generateAutoCode = (catName: string, supId: string) => {
    // 1. Prefixo Categoria (3 letras)
    const catPart = catName ? catName.substring(0, 3).toUpperCase() : 'GEN';
    
    // 2. Prefixo Fornecedor (2 letras)
    const supObj = fornecedores.find(f => f.id === supId);
    let supPart = 'XX';
    if (supObj) {
        // Remove espaços e pega as 2 primeiras letras
        const clean = supObj.name.replace(/[^a-zA-Z]/g, '');
        supPart = clean.substring(0, 2).toUpperCase();
    }
    
    // 3. Número Aleatório (4 dígitos)
    const random = Math.floor(Math.random() * 9000) + 1000;
    
    return `${catPart}-${supPart}-${random}`;
  };

  // 1. Detectar Regras do Fornecedor
  useEffect(() => {
    if (fornecedorObs) {
      const forn = fornecedores.find(f => f.id === fornecedorObs);
      if (forn && forn.rules?.isByWeight) {
        setActiveSupplierRules(forn.rules);
        setShowMetalCalc(true); 
        if (!isEditMode && forn.rules.lots.length > 0 && !getValues('gramPrice')) {
           setValue('gramPrice', forn.rules.lots[0].price);
        }
      } else {
        setActiveSupplierRules(null);
      }
    }
  }, [fornecedorObs, fornecedores, isEditMode, setValue, getValues]);

  // 2. Cálculos Automáticos
  useEffect(() => {
    if (!showMetalCalc) return;
    const p = Number(pesoObs) || 0;
    const g = Number(gramaObs) || 0;
    if (p > 0 && g > 0) {
      const custoCalculado = parseFloat((p * g).toFixed(2));
      if (Math.abs(Number(getValues('costPrice')) - custoCalculado) > 0.01) {
         setValue('costPrice', custoCalculado);
      }
    }
  }, [pesoObs, gramaObs, showMetalCalc, setValue, getValues]);

  useEffect(() => {
    const c = Number(custoObs) || 0;
    const m = Number(markupObs) || 0;
    if (c > 0 && m > 0) {
      const vendaCalculada = parseFloat((c * m).toFixed(2));
      if (Math.abs(Number(getValues('salePrice')) - vendaCalculada) > 0.01) {
         setValue('salePrice', vendaCalculada);
      }
    }
  }, [custoObs, markupObs, setValue, getValues]);

  const indicadores = useMemo(() => {
    const c = Number(custoObs) || 0;
    const v = Number(vendaObs) || 0;
    if (v === 0) return null;
    const lucro = v - (c + (v * (configGlobal?.cardFee || 0)/100) + (configGlobal?.packagingCost || 0));
    return { lucro, margem: (lucro / v) * 100 };
  }, [custoObs, vendaObs, configGlobal]);

  // Init Form
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && produtoParaEditar) {
        const p = produtoParaEditar as unknown as ExtendedProdutoAdmin;
        const mk = (p.salePrice && p.costPrice) ? (p.salePrice / p.costPrice) : 2.0;
        if (p.weight && p.weight > 0) setShowMetalCalc(true);
        reset({
          name: p.name, category: p.category, subcategory: p.subcategory || '',
          markup: parseFloat(mk.toFixed(2)), weight: p.weight || 0, gramPrice: p.gramPrice || 0,
          costPrice: Number(p.costPrice), salePrice: Number(p.salePrice), quantity: p.quantity,
          supplierId: p.supplierId, code: p.code, imageUrl: p.imageUrl, status: p.status, description: p.description,
          cm: p.cm || '', mm: p.mm || ''
        });
        setPreviewImage(p.imageUrl || null);
      } else {
        reset({
          name: '', costPrice: 0, salePrice: 0, markup: 2.0, quantity: 0,
          category: '', subcategory: '', code: '', status: 'ativo', weight: 0, gramPrice: 0, cm: '', mm: ''
        });
        setPreviewImage(null);
        setShowMetalCalc(false);
      }
    }
  }, [isOpen, isEditMode, produtoParaEditar, reset]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'products');
      setPreviewImage(URL.createObjectURL(file));
      setValue('imageUrl', url);
      toast.success("Foto carregada!");
    } catch { toast.error("Erro no upload"); } 
    finally { setIsUploading(false); }
  };

  const onSubmit: SubmitHandler<ExtendedProdutoFormData> = async (data) => {
    try {
      // 1. Gera descrição técnica se tiver CM/MM
      let finalDesc = data.description || '';
      const specs = [];
      if (data.cm) specs.push(`Comprimento: ${data.cm}cm`);
      if (data.mm) specs.push(`Espessura: ${data.mm}mm`);
      if (specs.length > 0) {
         const specsStr = specs.join(' | ');
         if (!finalDesc.includes(specsStr)) finalDesc = `${finalDesc}\n${specsStr}`.trim();
      }

      // 2. GERAÇÃO DE CÓDIGO (A Mágica acontece aqui)
      // Se não estiver editando e o código estiver vazio, gera um novo.
      let finalCode = data.code;
      if (!isEditMode && !finalCode) {
          finalCode = generateAutoCode(data.category || '', data.supplierId || '');
      }

      const payload = { 
        ...data, 
        code: finalCode, // Usa o código gerado
        subcategory: data.subcategory?.toUpperCase() || '',
        weight: Number(data.weight),
        gramPrice: Number(data.gramPrice),
        description: finalDesc,
        cm: data.cm,
        mm: data.mm
      };

      let res;
      if (isEditMode && produtoParaEditar) res = await updateAdminProduto(produtoParaEditar.id, payload as any);
      else res = await createAdminProduto(payload as any);
      
      onProdutoSalvo(res);
      onClose();
      toast.success(isEditMode ? "Produto Atualizado!" : `Produto Criado! SKU: ${finalCode}`);
    } catch { toast.error("Erro ao salvar."); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          onClick={onClose}
        >
          <motion.div 
            key="modal-content"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20" 
            onClick={e => e.stopPropagation()} 
            initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          >
            
            {/* CABEÇALHO */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
              <div>
                <h2 className="text-2xl font-black text-[#4a4a4a] tracking-tight flex items-center gap-3">
                   {isEditMode ? "Editar Produto" : "Novo Cadastro"}
                   {isEditMode && produtoParaEditar && <span className="text-[10px] font-bold text-[#d19900] bg-yellow-50 px-2 py-1 rounded-lg uppercase tracking-widest">ID: {produtoParaEditar.id.slice(0,6)}</span>}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">Detalhes técnicos, dimensões e precificação.</p>
              </div>
              <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                <input type="hidden" {...register('imageUrl')} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* --- COLUNA ESQUERDA: DADOS --- */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">Visual do Produto</label>
                      <div className="flex gap-4 items-center">
                        <div className="w-28 h-28 bg-white border border-gray-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden shrink-0 relative transition-transform group-hover:scale-105 duration-300">
                          {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-200" size={40} />}
                          {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm"><Loader2 className="text-white animate-spin" size={30}/></div>}
                        </div>
                        <div className="flex-1">
                          <input type="file" id="upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          <label htmlFor="upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#d19900] hover:bg-white transition-all group/label">
                             <UploadCloud className="text-gray-300 group-hover/label:text-[#d19900] mb-1.5 transition-colors" />
                             <span className="text-[10px] font-black text-gray-400 group-hover/label:text-[#d19900] uppercase tracking-tighter text-center px-2">Carregar Foto</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormInput label="Nome Oficial" name="name" register={register} error={errors.name?.message} placeholder="Ex: Corrente Veneziana" />
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Categoria</label>
                            <div className="flex gap-2">
                               <select {...register("category")} className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none text-gray-700">
                                  <option value="">Selecione...</option>
                                  {categories.sort((a,b)=>a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                               </select>
                               <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200"><Plus size={18}/></button>
                            </div>
                         </div>
                         <FormInput label="Subcategoria" name="subcategory" register={register} placeholder="Ex: Veneziana" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <FormInput label="Comprimento (cm)" name="cm" register={register} placeholder="Ex: 45" icon={<Ruler size={14}/>} />
                         <FormInput label="Espessura (mm)" name="mm" register={register} placeholder="Ex: 1.5" icon={<Ruler size={14}/>} />
                      </div>

                      <FormInput label="SKU (Gerado ao Salvar)" name="code" register={register} icon={<Wand2 size={14}/>} placeholder="Automático" readOnly />
                    </div>
                  </div>

                  {/* --- COLUNA DIREITA: FINANCEIRO --- */}
                  <div className="lg:col-span-7 space-y-6">
                     <FormSelect label="Parceiro / Fornecedor" name="supplierId" register={register}>
                        <option value="">Escolha o Fornecedor...</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                     </FormSelect>

                     {/* --- CALCULADORA DE METAL (DESTAQUE ROXO MANTIDO PARA CONTEXTO TÉCNICO) --- */}
                     <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Scale size={12}/> Precificação por Peso</span>
                           <button type="button" onClick={() => setShowMetalCalc(!showMetalCalc)} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all ${showMetalCalc ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                              {showMetalCalc ? 'Modo Peso Ativado' : 'Ativar Modo Peso'}
                           </button>
                        </div>
                        <AnimatePresence>
                          {showMetalCalc && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 grid grid-cols-2 gap-4 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full -translate-y-10 translate-x-10 pointer-events-none"></div>

                                 {activeSupplierRules?.lots?.length > 0 && (
                                    <div className="col-span-2 mb-2">
                                       <label className="text-[9px] font-black text-purple-600 uppercase mb-1.5 block">Selecione Lote / Cotação</label>
                                       <select className="w-full text-xs border-purple-200 rounded-xl p-2.5 font-bold text-purple-900 bg-white outline-none focus:ring-4 focus:ring-purple-500/10" onChange={(e) => { const v = Number(e.target.value); if(v > 0) setValue('gramPrice', v); }}>
                                          <option value="">Tabela de Preços...</option>
                                          {activeSupplierRules.lots.map((l:any) => <option key={l.id} value={l.price}>{l.name} - R$ {l.price.toFixed(2)}/g</option>)}
                                       </select>
                                    </div>
                                 )}
                                 <FormInput label="Peso (g)" name="weight" type="number" step="0.01" register={register} placeholder="0.00" />
                                 <FormInput label="Cotação (R$/g)" name="gramPrice" type="number" step="0.01" register={register} placeholder="0.00" icon={<DollarSign size={14} className="text-purple-400"/>} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>

                     {/* --- BLOCO PRECIFICAÇÃO (CLEAN) --- */}
                     <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm relative">
                        <div className="grid grid-cols-3 gap-5">
                           
                           {/* Custo Real */}
                           <FormInput 
                              label="Custo Real (R$)" 
                              name="costPrice" 
                              type="number" step="0.01" 
                              register={register} 
                              placeholder="0.00"
                           />
                           
                           {/* Markup */}
                           <div className="relative">
                              <label htmlFor="markup" className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider text-center">Markup</label>
                              <div className="relative group">
                                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    <Calculator size={14} />
                                 </div>
                                 <input
                                    id="markup"
                                    type="number"
                                    step="0.1"
                                    {...register('markup')}
                                    className="block w-full px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-center focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all pl-9 text-gray-800"
                                 />
                              </div>
                           </div>
                           
                           {/* Venda Final */}
                           <div className="relative">
                              <label htmlFor="salePrice" className="block text-[10px] font-bold text-[#4a4a4a] uppercase mb-1.5 tracking-wider text-right">Venda Final</label>
                              <input
                                 id="salePrice"
                                 type="number"
                                 step="0.01"
                                 {...register('salePrice')}
                                 className="block w-full px-3 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-sm font-black text-right text-[#4a4a4a] focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all"
                              />
                           </div>
                        </div>

                        {indicadores && (
                           <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Lucro Líquido Estimado:</span>
                              <span className={`text-xs font-black px-3 py-1 rounded-lg ${indicadores.lucro > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                 R$ {indicadores.lucro.toFixed(2)} ({indicadores.margem.toFixed(0)}%)
                              </span>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormInput label="Estoque Inicial" name="quantity" type="number" register={register} icon={<Box size={14}/>} />
                        
                        <FormSelect label="Estado" name="status" register={register}>
                           <option value="ativo">Disponível / Ativo</option>
                           <option value="inativo">Indisponível / Oculto</option>
                        </FormSelect>
                     </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Descrição Técnica e Notas</label>
                   <textarea {...register("description")} rows={3} className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none resize-none transition-all text-gray-700" placeholder="Especifique materiais, banho, tamanho e outros detalhes cruciais..."></textarea>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4">
                   <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest">Cancelar</button>
                   <button type="submit" disabled={isSubmitting} className="bg-[#4a4a4a] hover:bg-black text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-gray-200 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 tracking-widest uppercase text-xs">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18} className="text-[#d19900]"/>}
                      {isEditMode ? "Atualizar Produto" : "Salvar Produto"}
                   </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} onCategoryCreated={(cat) => setValue('category', cat.name)} />
    </AnimatePresence>
  );
}