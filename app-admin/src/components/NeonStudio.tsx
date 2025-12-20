import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CloudUpload, Plus, Trash2, Sparkles, 
  CheckSquare, Loader2, CheckCircle, Image as ImageIcon,
  Scale, Package} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { uploadImage, importProductsBulk, getCategories, getFornecedores } from '../services/apiService';
import { ProdutoVariante } from '../types';

interface NeonStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NeonStudio({ isOpen, onClose, onSuccess }: NeonStudioProps) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [] = useState({ current: 0, total: 0 });

  // Configurações Globais
  const [globalSettings, setGlobalSettings] = useState({
    supplierId: '',
    categoryId: '',
    subcategory: '', 
    stock: '1',
    markup: '2.0',
  });

  // Calculadora de Metal
  const [showMetalCalc, setShowMetalCalc] = useState(false);
  const [, setActiveSupplierRules] = useState<any>(null);
  const [globalGramPrice, setGlobalGramPrice] = useState<number>(0);

  // Inicialização
  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups);
        if (cats.length) setGlobalSettings(p => ({ ...p, categoryId: cats[0].id }));
        if (sups.length) setGlobalSettings(p => ({ ...p, supplierId: sups[0].id }));
      });
      setItems([]);
      setShowMetalCalc(false);
      setGlobalGramPrice(0);
    }
  }, [isOpen]);

  // Lógica Automática de Fornecedor
  useEffect(() => {
    if (globalSettings.supplierId) {
      const sup = suppliers.find(s => s.id === globalSettings.supplierId);
      if (sup && sup.rules?.isByWeight) {
        setActiveSupplierRules(sup.rules);
        setShowMetalCalc(true); 
        if (sup.rules.lots?.length > 0) {
            setGlobalGramPrice(sup.rules.lots[0].price);
        }
      } else {
        setActiveSupplierRules(null);
      }
    }
  }, [globalSettings.supplierId, suppliers]);

  const handleGlobalChange = (field: string, value: string) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }));
  };

  // Upload e Criação dos Itens
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newItems = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: true,
      status: 'pending', 
      data: {
        description: file.name.split('.')[0].replace(/-/g, ' ').toUpperCase(),
        price: '', 
        cm: '', // Campo original mantido
        mm: '', // Campo original mantido
        categoryId: globalSettings.categoryId,
        subcategory: globalSettings.subcategory,
        supplierId: globalSettings.supplierId,
        stock: globalSettings.stock,
        variantes: [] as ProdutoVariante[] // Nova lista de variantes
      },
      edit: { scale: 1, x: 0, y: 0 }
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  // Funções de Update do Item
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, data: { ...i.data, [field]: value } } : i));
  const updateEdit = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, edit: { ...i.edit, [field]: value } } : i));
  const toggleSelect = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // --- LÓGICA DE VARIANTES (ADICIONAR/REMOVER/EDITAR) ---
  const addVariante = (itemId: string, type: 'cm' | 'aro') => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const nova: ProdutoVariante = {
        sku_sufixo: type === 'cm' ? '-40CM' : '-N18',
        valor_ajuste: Number(item.data.price) || 0, // Herda o preço base
        medida: type === 'cm' ? '40cm' : '18',
        estoque: 1,
        sob_consulta: false
      };
      return { ...item, data: { ...item.data, variantes: [...item.data.variantes, nova] } };
    }));
  };

  const updateVariante = (itemId: string, index: number, field: keyof ProdutoVariante, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const novas = [...item.data.variantes];
      novas[index] = { ...novas[index], [field]: value };
      return { ...item, data: { ...item.data, variantes: novas } };
    }));
  };

  const removeVariante = (itemId: string, index: number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const novas = item.data.variantes.filter((_:any, i:number) => i !== index);
      return { ...item, data: { ...item.data, variantes: novas } };
    }));
  };

  // Gerador de SKU
  const generateSmartCode = (categoryId: string, supplierId: string) => {
    const catObj = categories.find(c => c.id === categoryId);
    const catPrefix = catObj ? catObj.name.substring(0, 3).toUpperCase() : 'GEN';
    const supObj = suppliers.find(s => s.id === supplierId);
    let supPrefix = 'XX';
    if (supObj) {
        const supClean = supObj.name.replace(/[^a-zA-Z]/g, '');
        supPrefix = supClean.substring(0, 2).toUpperCase();
    }
    const random3 = Math.floor(Math.random() * 900) + 100;
    return `${catPrefix}-${supPrefix}-${random3}`;
  };

  // Gerador de Crop Final
  const generateFinalCrop = async (item: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = item.previewUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080; canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject();
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 1080, 1080);
        const ratio = 1080 / 300; // 300 é o tamanho visual aproximado
        ctx.translate(1080 / 2, 1080 / 2);
        ctx.translate(item.edit.x * ratio, item.edit.y * ratio);
        ctx.scale(item.edit.scale, item.edit.scale);
        const baseScale = Math.max(1080 / img.width, 1080 / img.height);
        ctx.drawImage(img, -img.width * baseScale / 2, -img.height * baseScale / 2, img.width * baseScale, img.height * baseScale);
        canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(); }, 'image/jpeg', 0.95);
      };
      img.onerror = reject;
    });
  };

  // Sincronização
const handleSync = async () => {
  const toUpload = items.filter(i => i.selected && i.status !== 'success');
  if (toUpload.length === 0) return toast.error("Selecione itens para enviar.");
  
  setIsUploading(true);
  const successList: any[] = [];
  const activeMarkup = Number(globalSettings.markup) || 2.0;

  for (let i = 0; i < toUpload.length; i++) {
    const item = toUpload[i];
    setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading' } : it));
    
    try {
      const finalBlob = await generateFinalCrop(item);
      const finalName = [
        item.data.description, 
        item.data.cm ? `${item.data.cm}CM` : '', 
        item.data.mm ? `${item.data.mm}MM` : ''
      ].filter(Boolean).join(' ').toUpperCase();
      
      const fileToUpload = new File([finalBlob], `${finalName}.jpg`, { type: 'image/jpeg' });
      const imageUrl = await uploadImage(fileToUpload);
      const smartCode = generateSmartCode(item.data.categoryId, item.data.supplierId);

      // --- LÓGICA DE PREÇO DO PRODUTO PAI ---
      let costPrice = 0;
      let weight = 0;
      const rawInputValue = Number(item.data.price) || 0;

      if (showMetalCalc && globalGramPrice > 0) {
          weight = rawInputValue;
          costPrice = weight * globalGramPrice;
      } else {
          costPrice = rawInputValue;
      }

      const finalSalePrice = costPrice * activeMarkup;

      // --- LÓGICA DE PREÇO DAS VARIANTES (FIX CORRIGIDO) ---
      const variantesCalculadas = item.data.variantes.map((v: any) => {
        let vCusto = 0;
        const vValorInput = Number(v.valor_ajuste) || 0;

        if (showMetalCalc && globalGramPrice > 0) {
           // Se está no modo metal, o que foi digitado na variante (ex: 1.5) é o PESO
           vCusto = vValorInput * globalGramPrice; 
        } else {
           // Modo padrão: o valor digitado já é o custo
           vCusto = vValorInput;
        }

        return {
          ...v,
          // O valor que vai para o banco é: (Peso * Grama) * Markup
          valor_ajuste: parseFloat((vCusto * activeMarkup).toFixed(2))
        };
      });

      const productData = {
        name: finalName,
        costPrice: parseFloat(costPrice.toFixed(2)),
        salePrice: parseFloat(finalSalePrice.toFixed(2)),
        quantity: item.data.variantes.length > 0 
          ? item.data.variantes.reduce((acc: number, v: any) => acc + Number(v.estoque), 0) 
          : Number(item.data.stock) || 0,
        category: categories.find(c => c.id === item.data.categoryId)?.name || 'Geral',
        subcategory: item.data.subcategory || '',
        supplierId: item.data.supplierId,
        imageUrl: imageUrl,
        code: smartCode,
        status: 'ativo',
        weight: weight > 0 ? weight : undefined,
        gramPrice: showMetalCalc ? globalGramPrice : undefined,
        variantes: variantesCalculadas
      };

      successList.push(productData);
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'success' } : it));
    } catch (error) { 
      console.error(error);
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error' } : it)); 
    }
  }

  if (successList.length > 0) {
    await importProductsBulk(successList);
    toast.success(`${successList.length} cadastrados com sucesso!`);
    onSuccess();
    setTimeout(onClose, 1500);
  }
  setIsUploading(false);
};
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#000] text-white flex flex-col font-sans">
          
          {/* HEADER */}
          <header className="px-6 py-4 border-b border-white/5 bg-black/80 backdrop-blur-xl flex flex-col xl:flex-row justify-between items-center sticky top-0 z-50 gap-4 shadow-2xl">
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"><X size={20}/></button>
              <h1 className="text-lg font-bold flex items-center gap-2 text-white tracking-wider">
                <Sparkles className="text-cyan-400" size={18}/> NEON STUDIO
              </h1>
            </div>

            <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto w-full xl:w-auto scrollbar-hide backdrop-blur-md">
                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <div className="flex flex-col w-36">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Fornecedor</label>
                      <select value={globalSettings.supplierId} onChange={e => handleGlobalChange('supplierId', e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                         <option value="" className="bg-black">Selecione...</option>
                         {suppliers.map((s: any) => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <button onClick={() => setShowMetalCalc(!showMetalCalc)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${showMetalCalc ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                      <Scale size={14} /> {showMetalCalc ? 'Modo Peso' : 'Modo R$'}
                   </button>
                   {showMetalCalc && (
                     <div className="flex flex-col w-24">
                        <label className="text-[9px] text-purple-400 font-bold uppercase mb-1">R$/g</label>
                        <input type="number" step="0.01" value={globalGramPrice} onChange={(e) => setGlobalGramPrice(Number(e.target.value))} className="bg-transparent text-sm font-bold text-white outline-none w-full" />
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-4 px-3">
                   <div className="flex flex-col w-20 text-center">
                      <label className="text-[9px] text-cyan-500 font-bold uppercase mb-1">Markup</label>
                      <input type="number" step="0.1" value={globalSettings.markup} onChange={e => handleGlobalChange('markup', e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none text-center" />
                   </div>
                   <div className="flex flex-col w-16 text-center">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Qtd Padrão</label>
                      <input type="number" value={globalSettings.stock} onChange={e => handleGlobalChange('stock', e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none text-center" />
                   </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition border border-white/10">
                <Plus size={20} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={handleSync} disabled={isUploading || items.filter(i => i.selected).length === 0} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 transition-all active:scale-95">
                {isUploading ? <Loader2 className="animate-spin" size={20}/> : <CloudUpload size={20}/>}
                <span>Sincronizar</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-black">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                <ImageIcon size={48} className="text-gray-600 mb-4"/>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Arraste imagens para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                {items.map(item => (
                  <ProductCard 
                    key={item.id} 
                    item={item} 
                    categories={categories}
                    suppliers={suppliers}
                    onUpdate={updateItem}
                    onEdit={updateEdit}
                    onToggle={toggleSelect}
                    onRemove={removeItem}
                    onAddVariante={addVariante}
                    onUpdateVariante={updateVariante}
                    onRemoveVariante={removeVariante}
                    generateSmartCode={generateSmartCode}
                    activeMarkup={globalSettings.markup}
                    isByWeight={showMetalCalc}
                    lotPrice={globalGramPrice}
                  />
                ))}
              </div>
            )}
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- CARD RESTAURADO (DESIGN ORIGINAL + VARIANTES DISCRETAS) ---
function ProductCard({ item, categories, suppliers, onUpdate, onEdit, onToggle, onRemove, onAddVariante, onUpdateVariante, onRemoveVariante, generateSmartCode, activeMarkup, isByWeight, lotPrice }: any) {
  const isSelected = item.selected;
  const smartCodePreview = generateSmartCode(item.data.categoryId, item.data.supplierId);
  
  const inputValue = Number(item.data.price) || 0;
  let custoReal = inputValue;
  if (isByWeight && lotPrice > 0) custoReal = inputValue * lotPrice;
  const estimatedSale = custoReal * (Number(activeMarkup) || 2);

  return (
    <div className={`relative bg-black rounded-2xl overflow-hidden flex flex-col transition-all duration-300 border border-white/10 group hover:border-white/30 ${isSelected ? 'ring-1 ring-cyan-500/50' : 'opacity-90 hover:opacity-100'}`}>
      
      {/* IMAGEM E EDITOR (INTACTO) */}
      <div className="relative aspect-square bg-[#050505] overflow-hidden border-b border-white/5">
        {item.status === 'uploading' && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-cyan-400" size={32}/></div>}
        {item.status === 'success' && <div className="absolute inset-0 z-50 bg-green-900/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30"><CheckCircle className="text-green-400" size={48}/></div>}

        <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => onToggle(item.id)} className={`p-2 rounded-lg backdrop-blur-md border ${isSelected ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-black/60 border-white/20 text-gray-300'}`}><CheckSquare size={14}/></button>
           <button onClick={() => onRemove(item.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md"><Trash2 size={14}/></button>
        </div>
        <div className="absolute bottom-3 left-3 z-20">
           <span className="text-[10px] font-mono font-bold bg-black/80 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 backdrop-blur-md shadow-lg">{smartCodePreview}</span>
        </div>
        <CssImageEditor src={item.previewUrl} edit={item.edit} onChange={(k: string, v: any) => onEdit(item.id, k, v)} />
      </div>

      <div className="p-4 space-y-3 bg-black flex-1 flex flex-col">
        {/* NOME */}
        <input 
          value={item.data.description} 
          onChange={e => onUpdate(item.id, 'description', e.target.value)} 
          className="w-full bg-transparent text-xs font-bold text-white border-b border-white/10 focus:border-cyan-500 outline-none uppercase py-1"
          placeholder="NOME DO PRODUTO"
        />

        {/* PREÇO E VENDA */}
        <div className="bg-white/5 rounded-xl p-2 border border-white/10 flex justify-between items-center">
           <div className="flex flex-col w-1/2 border-r border-white/10 pr-2">
              <label className={`text-[8px] font-black uppercase tracking-wider ${isByWeight ? 'text-purple-400' : 'text-cyan-500'}`}>{isByWeight ? 'PESO (g)' : 'CUSTO (R$)'}</label>
              <input type="number" value={item.data.price} onChange={e => onUpdate(item.id, 'price', e.target.value)} className="bg-transparent text-sm font-mono font-bold text-white outline-none" placeholder="0.00" />
           </div>
           <div className="flex flex-col w-1/2 pl-2 text-right">
              <label className="text-[8px] text-gray-500 uppercase">Venda Est.</label>
              <span className="text-xs font-bold text-green-400">R$ {estimatedSale.toFixed(0)}</span>
           </div>
        </div>

        {/* CM / MM (RESTAURADOS) */}
        <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute top-2 left-2 text-[8px] text-gray-500 font-bold">CM</span>
              <input value={item.data.cm} onChange={e => onUpdate(item.id, 'cm', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" placeholder="45" />
            </div>
            <div className="relative">
              <span className="absolute top-2 left-2 text-[8px] text-gray-500 font-bold">MM</span>
              <input value={item.data.mm} onChange={e => onUpdate(item.id, 'mm', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" placeholder="1.5" />
            </div>
        </div>

        {/* GAVETA DE VARIANTES (NOVO RECURSO COMPACTO) */}
        <div className="pt-2 mt-auto">
           <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-black text-gray-600 uppercase flex items-center gap-1"><Package size={10}/> Grades</label>
              <div className="flex gap-1">
                 <button onClick={() => onAddVariante(item.id, 'cm')} className="text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/10 hover:bg-[#d19900] hover:text-black hover:border-[#d19900] transition-colors">+CM</button>
                 <button onClick={() => onAddVariante(item.id, 'aro')} className="text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/10 hover:bg-[#d19900] hover:text-black hover:border-[#d19900] transition-colors">+ARO</button>
              </div>
           </div>
           
           <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
              {item.data.variantes.map((v: ProdutoVariante, idx: number) => (
                 <div key={idx} className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5 group/v">
                    <input value={v.medida} onChange={e => onUpdateVariante(item.id, idx, 'medida', e.target.value)} className="w-10 bg-transparent text-[9px] text-white outline-none font-bold" placeholder="Tam" />
                    <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                       <span className="text-[8px] text-gray-600">R$</span>
                       <input type="number" value={v.valor_ajuste} onChange={e => onUpdateVariante(item.id, idx, 'valor_ajuste', Number(e.target.value))} className="w-10 bg-transparent text-[9px] text-white outline-none" />
                    </div>
                    <button onClick={() => onUpdateVariante(item.id, idx, 'sob_consulta', !v.sob_consulta)} className={`ml-auto text-[7px] font-black px-1 py-0.5 rounded ${v.sob_consulta ? 'text-red-400' : 'text-green-400'}`}>
                       {v.sob_consulta ? 'CONS' : 'OK'}
                    </button>
                    <button onClick={() => onRemoveVariante(item.id, idx)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover/v:opacity-100 transition-opacity"><Trash2 size={10}/></button>
                 </div>
              ))}
           </div>
        </div>

        {/* SELECTS */}
        <div className="grid grid-cols-2 gap-2 mt-2">
            <select value={item.data.categoryId} onChange={e => onUpdate(item.id, 'categoryId', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-gray-400 outline-none">
                <option value="">Cat...</option>
                {categories.map((c: any) => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
            </select>
            <select value={item.data.supplierId} onChange={e => onUpdate(item.id, 'supplierId', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-gray-400 outline-none">
                <option value="">Forn...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
            </select>
        </div>
      </div>
    </div>
  );
}

// EDITOR CSS (MANTIDO 100% IGUAL)
function CssImageEditor({ src, edit, onChange }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setLastPos({ x: e.clientX, y: e.clientY }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isDragging) return; const dx = e.clientX - lastPos.x; const dy = e.clientY - lastPos.y; setLastPos({ x: e.clientX, y: e.clientY }); onChange('x', (edit.x || 0) + dx); onChange('y', (edit.y || 0) + dy); };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => { const delta = e.deltaY * -0.001; const newScale = Math.max(0.5, Math.min(5, (edit.scale || 1) + delta)); onChange('scale', newScale); };
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050505]" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
      <img src={src} draggable={false} className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transition-transform duration-75 ease-out origin-center" style={{ transform: `translate(-50%, -50%) translate(${edit.x}px, ${edit.y}px) scale(${edit.scale})` }} />
      <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-30"><div className="absolute top-1/2 w-full h-px bg-white/10"></div><div className="absolute left-1/2 h-full w-px bg-white/10"></div></div>
    </div>
  );
}