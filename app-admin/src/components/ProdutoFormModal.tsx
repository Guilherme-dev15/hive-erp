import React, { useEffect, useMemo, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  X, DollarSign, Plus, Box, Wand2, UploadCloud, 
  Loader2, Image as ImageIcon, Calculator, Scale, AlertCircle,
  Ruler, ChevronDown, Trash2, Copy, Layers, RefreshCw, TrendingUp
} from 'lucide-react';
import { z } from 'zod';

import { CategoryModal } from './CategoryModal';
import { type Fornecedor, type ProdutoAdmin, type Category, type ProdutoVariante } from '../types';
import { produtoSchema, type ConfigFormData } from '../types/schemas';
import { createAdminProduto, updateAdminProduto, uploadImage } from '../services/apiService';

// --- SCHEMA DE VARIANTES ---
const varianteSchema = z.object({
  medida: z.string().min(1, "Obrigatório"),
  valor_ajuste: z.coerce.number(),
  estoque: z.coerce.number(),
  sob_consulta: z.boolean().optional(),
  sku_sufixo: z.string().optional()
});

// --- SCHEMA PRINCIPAL ESTENDIDO ---
const extendedProdutoSchema = produtoSchema.extend({
  subcategory: z.string().optional(),
  markup: z.coerce.number().min(1, "Mínimo 1.0").optional(),
  weight: z.coerce.number().optional(),
  gramPrice: z.coerce.number().optional(),
  cm: z.string().optional(),
  mm: z.string().optional(),
  variantes: z.array(varianteSchema).optional()
});

type ExtendedProdutoFormData = z.infer<typeof extendedProdutoSchema>;

type ExtendedProdutoAdmin = Omit<ProdutoAdmin, 'subcategory' | 'weight' | 'gramPrice'> & {
  subcategory?: string;
  weight?: number;
  gramPrice?: number;
  cm?: string;
  mm?: string;
  variantes?: ProdutoVariante[];
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
// COMPONENTES UI AUXILIARES
// ----------------------------------------------------------------------
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: string;
  register: any;
  error?: string;
  icon?: React.ReactNode;
}

const FormInput: React.FC<FormInputProps> = ({ label, name, register, error, icon, className, ...props }) => (
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

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  name: string;
  register: any;
  error?: string;
  icon?: React.ReactNode;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, name, register, error, icon, className, children, ...props }) => (
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

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
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
      status: 'ativo', description: '', weight: 0, gramPrice: 0, cm: '', mm: '',
      variantes: []
    }
  });

  const custoObs = watch('costPrice');
  const vendaObs = watch('salePrice');
  const markupObs = watch('markup');
  const pesoObs = watch('weight');
  const gramaObs = watch('gramPrice');
  const fornecedorObs = watch('supplierId');
  const variantesObs = watch('variantes');

  // --- FUNÇÕES DE VARIANTES ---
  const addVariante = () => {
    const atuais = getValues('variantes') || [];
    const precoBase = getValues('salePrice') || 0; 
    setValue('variantes', [
      ...atuais, 
      { medida: '', valor_ajuste: precoBase, estoque: 1, sob_consulta: false }
    ]);
  };

  const removeVariante = (index: number) => {
    const atuais = getValues('variantes') || [];
    setValue('variantes', atuais.filter((_, i) => i !== index));
  };

  const updateTotalStock = () => {
    const atuais = getValues('variantes') || [];
    const total = atuais.reduce((acc: number, v: { estoque: number }) => acc + (Number(v.estoque) || 0), 0);
    if (total > 0) {
      setValue('quantity', total);
      toast.success(`Estoque geral atualizado para ${total} un.`);
    }
  };

  const applyBasePriceToAll = () => {
    const currentPrice = getValues('salePrice') || 0;
    const currentVariants = getValues('variantes') || [];
    
    if (currentVariants.length === 0) return toast.error("Adicione variantes primeiro.");

    const updatedVariants = currentVariants.map(v => ({
      ...v,
      valor_ajuste: currentPrice
    }));

    setValue('variantes', updatedVariants);
    toast.success(`Preço R$ ${currentPrice.toFixed(2)} aplicado em todas as grades!`);
  };

  const generateAutoCode = (catName: string, supId: string) => {
    const catPart = catName ? catName.substring(0, 3).toUpperCase() : 'GEN';
    const supObj = fornecedores.find(f => f.id === supId);
    let supPart = 'XX';
    if (supObj) {
        const clean = supObj.name.replace(/[^a-zA-Z]/g, '');
        supPart = clean.substring(0, 2).toUpperCase();
    }
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${catPart}-${supPart}-${random}`;
  };

  // Detectar Regras do Fornecedor
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

  // Cálculos Automáticos
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

  // --- CÁLCULO DE LUCRO E MARGEM (VISÍVEL) ---
  const indicadores = useMemo(() => {
    const c = Number(custoObs) || 0;
    const v = Number(vendaObs) || 0;
    
    if (v === 0) return { lucro: 0, margem: 0 };

    // Taxas globais (se não existirem, usa 0)
    const taxaCartao = configGlobal?.cardFee ? (v * (configGlobal.cardFee / 100)) : 0;
    const taxaEmbalagem = configGlobal?.packagingCost || 0;

    const lucro = v - (c + taxaCartao + taxaEmbalagem);
    const margem = (lucro / v) * 100;

    return { lucro, margem };
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
          markup: parseFloat(mk.toFixed(2)) || 2.0, weight: p.weight || 0, gramPrice: p.gramPrice || 0,
          costPrice: Number(p.costPrice), salePrice: Number(p.salePrice), quantity: p.quantity,
          supplierId: p.supplierId, code: p.code, imageUrl: p.imageUrl, status: p.status, description: p.description,
          cm: p.cm || '', mm: p.mm || '',
          variantes: p.variantes || [] 
        });
        setPreviewImage(p.imageUrl || null);
      } else {
        reset({
          name: '', costPrice: 0, salePrice: 0, markup: 2.0, quantity: 0,
          category: '', subcategory: '', code: '', status: 'ativo', weight: 0, gramPrice: 0, cm: '', mm: '',
          variantes: []
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
      let finalDesc = data.description || '';
      const specs = [];
      if (data.cm) specs.push(`Comprimento: ${data.cm}cm`);
      if (data.mm) specs.push(`Espessura: ${data.mm}mm`);
      if (specs.length > 0) {
         const specsStr = specs.join(' | ');
         if (!finalDesc.includes(specsStr)) finalDesc = `${finalDesc}\n${specsStr}`.trim();
      }

      let finalCode = data.code;
      if (!isEditMode && !finalCode) {
          finalCode = generateAutoCode(data.category || '', data.supplierId || '');
      }

      const payload = { 
        ...data, 
        code: finalCode,
        subcategory: data.subcategory?.toUpperCase() || '',
        weight: Number(data.weight),
        gramPrice: Number(data.gramPrice),
        description: finalDesc,
        cm: data.cm,
        mm: data.mm,
        variantes: data.variantes || [] 
      };

      let res;
      if (isEditMode && produtoParaEditar) {
        await updateAdminProduto(produtoParaEditar.id, payload as any);
        // Para atualizar a lista sem F5, montamos o objeto atualizado manualmente
        // pois o updateAdminProduto as vezes retorna void
        res = { ...produtoParaEditar, ...payload };
      } else {
        res = await createAdminProduto(payload as any);
      }
      
      onProdutoSalvo(res); // Envia o objeto completo para a lista atualizar
      onClose();
      toast.success(isEditMode ? "Produto Atualizado!" : `Produto Criado! SKU: ${finalCode}`);
    } catch (error) { 
        console.error(error);
        toast.error("Erro ao salvar."); 
    }
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
            
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
              <div>
                <h2 className="text-2xl font-black text-[#4a4a4a] tracking-tight flex items-center gap-3">
                   {isEditMode ? "Editar Produto" : "Novo Cadastro"}
                   {isEditMode && produtoParaEditar && <span className="text-[10px] font-bold text-[#d19900] bg-yellow-50 px-2 py-1 rounded-lg uppercase tracking-widest">ID: {produtoParaEditar.id.slice(0,6)}</span>}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">Detalhes técnicos, variantes e precificação.</p>
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

                     {/* --- CALCULADORA DE METAL --- */}
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

                     {/* --- BLOCO PRECIFICAÇÃO & LUCRO --- */}
                     <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm relative">
                        <div className="grid grid-cols-3 gap-5">
                           <FormInput label="Custo Real (R$)" name="costPrice" type="number" step="0.01" register={register} placeholder="0.00" />
                           <div className="relative">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider text-center">Markup</label>
                              <div className="relative group">
                                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Calculator size={14} /></div>
                                 <input type="number" step="0.1" {...register('markup')} className="block w-full px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-center focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all pl-9 text-gray-800" />
                              </div>
                           </div>
                           <div className="relative">
                              <label className="block text-[10px] font-bold text-[#4a4a4a] uppercase mb-1.5 tracking-wider text-right">Venda Final</label>
                              <input type="number" step="0.01" {...register('salePrice')} className="block w-full px-3 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-sm font-black text-right text-[#4a4a4a] focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all" />
                           </div>
                        </div>

                        {/* EXIBIÇÃO DO LUCRO - AGORA BEM VISÍVEL */}
                        <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                           <div className="flex items-center gap-2 text-gray-500">
                              <TrendingUp size={16} />
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Lucro Líquido Estimado</span>
                           </div>
                           <div className="text-right">
                              <span className={`text-sm font-black px-2 py-1 rounded-md ${indicadores.lucro > 0 ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                 R$ {indicadores.lucro.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 ml-2">
                                 ({indicadores.margem.toFixed(0)}%)
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormInput label="Estoque Principal" name="quantity" type="number" register={register} icon={<Box size={14}/>} />
                        <FormSelect label="Estado" name="status" register={register}>
                           <option value="ativo">Disponível / Ativo</option>
                           <option value="inativo">Indisponível / Oculto</option>
                        </FormSelect>
                     </div>
                  </div>
                </div>

                {/* --- SEÇÃO DE GRADES E VARIANTES --- */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                   <div className="flex justify-between items-end mb-4">
                      <div>
                         <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={16} className="text-[#d19900]"/> Grades e Variações
                         </h3>
                         <p className="text-[10px] text-gray-400 font-medium mt-1">
                            Adicione tamanhos, aros ou cores. O preço pode ser ajustado individualmente.
                         </p>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            type="button" 
                            onClick={applyBasePriceToAll} 
                            className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200"
                            title="Copia o 'Preço de Venda Final' para todas as variantes"
                         >
                            <RefreshCw size={14} /> Aplicar Preço Base (R$ {Number(vendaObs).toFixed(2)}) em Tudo
                         </button>

                         <button type="button" onClick={addVariante} className="text-xs bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                            <Plus size={14} /> Nova Variação
                         </button>
                      </div>
                   </div>

                   {(!variantesObs || variantesObs.length === 0) ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-xs font-medium">
                         Nenhuma variação cadastrada. Este produto será vendido como item único.
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <div className="grid grid-cols-12 gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
                            <div className="col-span-3">Nome / Medida</div>
                            <div className="col-span-3">Preço Venda (R$)</div>
                            <div className="col-span-2 text-center">Estoque</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-1"></div>
                         </div>
                         {variantesObs.map((v: any, index: number) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                               <div className="col-span-3">
                                  <input 
                                    {...register(`variantes.${index}.medida`)} 
                                    placeholder="Ex: 45cm ou Aro 18" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#d19900]"
                                  />
                               </div>
                               <div className="col-span-3 relative group">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-green-600 font-bold text-xs">R$</div>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    {...register(`variantes.${index}.valor_ajuste`)} 
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-green-700 outline-none focus:border-green-500 pl-8"
                                  />
                               </div>
                               <div className="col-span-2">
                                  <input 
                                    type="number" 
                                    {...register(`variantes.${index}.estoque`)} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-center outline-none"
                                  />
                               </div>
                               <div className="col-span-3 flex items-center gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-600 select-none hover:text-black">
                                     <input type="checkbox" {...register(`variantes.${index}.sob_consulta`)} className="w-4 h-4 rounded text-[#d19900] focus:ring-[#d19900] border-gray-300" />
                                     Sob Consulta
                                  </label>
                               </div>
                               <div className="col-span-1 flex justify-end">
                                  <button type="button" onClick={() => removeVariante(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                     <Trash2 size={14} />
                                  </button>
                               </div>
                            </div>
                         ))}
                         
                         <div className="flex justify-end pt-2">
                            <button type="button" onClick={updateTotalStock} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                               <Copy size={12}/> Somar estoque das grades para o total
                            </button>
                         </div>
                      </div>
                   )}
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