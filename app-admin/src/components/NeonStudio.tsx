import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CloudUpload, Plus, Trash2, Sparkles, 
  CheckSquare, Square, Loader2, CheckCircle, Image as ImageIcon,
  Calculator, Scale, Ruler
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { uploadImage, importProductsBulk, getCategories, getFornecedores } from '../services/apiService';

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
  const [, setProgress] = useState({ current: 0, total: 0 });

  const [globalSettings, setGlobalSettings] = useState({
    supplierId: '',
    categoryId: '',
    subcategory: '', 
    stock: '1',
    markup: '2.0',
  });

  const [showMetalCalc, setShowMetalCalc] = useState(false);
  const [activeSupplierRules, setActiveSupplierRules] = useState<any>(null);
  const [globalGramPrice, setGlobalGramPrice] = useState<number>(0);

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
        cm: '',
        mm: '',
        categoryId: globalSettings.categoryId,
        subcategory: globalSettings.subcategory,
        supplierId: globalSettings.supplierId,
        stock: globalSettings.stock,
      },
      edit: { scale: 1, x: 0, y: 0 }
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  // Funções de Update
  const updateItem = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, data: { ...i.data, [field]: value } } : i));
  const updateEdit = (id: string, field: string, value: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, edit: { ...i.edit, [field]: value } } : i));
  const toggleSelect = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

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
        const ratio = 1080 / 300;
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

  const handleSync = async () => {
    const toUpload = items.filter(i => i.selected && i.status !== 'success');
    if (toUpload.length === 0) return toast.error("Selecione itens para enviar.");
    setIsUploading(true);
    setProgress({ current: 0, total: toUpload.length });
    const successList: any[] = [];
    const activeMarkup = Number(globalSettings.markup) || 2.0;

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading' } : it));
      try {
        const finalBlob = await generateFinalCrop(item);
        const finalName = [item.data.description, item.data.cm ? `${item.data.cm}CM` : '', item.data.mm ? `${item.data.mm}MM` : ''].filter(Boolean).join(' ').toUpperCase();
        const fileToUpload = new File([finalBlob], `${finalName}.jpg`, { type: 'image/jpeg' });
        const imageUrl = await uploadImage(fileToUpload);
        const smartCode = generateSmartCode(item.data.categoryId, item.data.supplierId);

        let costPrice = 0;
        let weight = 0;
        if (showMetalCalc && globalGramPrice > 0) {
            weight = Number(item.data.price) || 0;
            costPrice = weight * globalGramPrice;
        } else {
            costPrice = Number(item.data.price) || 0;
        }
        const salePrice = costPrice * activeMarkup;

        const productData = {
          name: finalName, costPrice: parseFloat(costPrice.toFixed(2)), salePrice: parseFloat(salePrice.toFixed(2)),
          quantity: Number(item.data.stock) || 0, category: categories.find(c => c.id === item.data.categoryId)?.name || 'Geral',
          subcategory: item.data.subcategory || '', supplierId: item.data.supplierId, imageUrl: imageUrl, code: smartCode,
          status: 'ativo', weight: weight > 0 ? weight : undefined, gramPrice: showMetalCalc ? globalGramPrice : undefined
        };
        successList.push(productData);
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'success' } : it));
        setProgress(prev => ({ ...prev, current: i + 1 }));
      } catch (error) { setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error' } : it)); }
    }
    if (successList.length > 0) {
      await importProductsBulk(successList);
      toast.success(`${successList.length} cadastrados!`);
      onSuccess();
      setTimeout(onClose, 1500);
    }
    setIsUploading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#000] text-white flex flex-col font-sans">
          
          {/* HEADER MODERNO E ESPELHADO */}
          <header className="px-6 py-4 border-b border-white/5 bg-black/80 backdrop-blur-xl flex flex-col xl:flex-row justify-between items-center sticky top-0 z-50 gap-4 shadow-2xl">
            
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"><X size={20}/></button>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2 text-white tracking-wider">
                  <Sparkles className="text-cyan-400" size={18}/> NEON STUDIO
                </h1>
              </div>
            </div>

            {/* BARRA DE FERRAMENTAS - GLASSMOPHISM */}
            <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto w-full xl:w-auto scrollbar-hide backdrop-blur-md">
                
                {/* 1. SELEÇÃO DE FONTE */}
                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <div className="flex flex-col w-36">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Fornecedor</label>
                      <select 
                         value={globalSettings.supplierId} 
                         onChange={e => handleGlobalChange('supplierId', e.target.value)} 
                         className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer hover:text-cyan-400 transition-colors"
                      >
                         <option value="" className="bg-black">Selecione...</option>
                         {suppliers.map((s: any) => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
                      </select>
                   </div>
                </div>

                {/* 2. CÁLCULO DE CUSTO (METAL VS PADRÃO) */}
                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <button 
                      onClick={() => setShowMetalCalc(!showMetalCalc)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${showMetalCalc ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'}`}
                   >
                      <Scale size={14} />
                      {showMetalCalc ? 'Modo Peso (g)' : 'Modo Padrão (R$)'}
                   </button>

                   <AnimatePresence>
                     {showMetalCalc && (
                       <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="flex flex-col w-28">
                             <label className="text-[9px] text-purple-400 font-bold uppercase mb-1">Cotação (R$/g)</label>
                             {activeSupplierRules && activeSupplierRules.lots.length > 0 ? (
                                <select 
                                   className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
                                   onChange={(e) => setGlobalGramPrice(Number(e.target.value))}
                                   value={globalGramPrice || ''}
                                >
                                   <option value="0" className="bg-black">Manual</option>
                                   {activeSupplierRules.lots.map((l:any) => <option key={l.id} value={l.price} className="bg-black">{l.name} - R${l.price}</option>)}
                                </select>
                             ) : (
                                <input 
                                   type="number" step="0.01" value={globalGramPrice} onChange={(e) => setGlobalGramPrice(Number(e.target.value))}
                                   className="bg-transparent text-sm font-bold text-white outline-none w-full placeholder-gray-600" placeholder="0.00"
                                />
                             )}
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>

                {/* 3. ECONOMIA (MARKUP E ESTOQUE) */}
                <div className="flex items-center gap-4 px-3">
                   <div className="flex flex-col w-20">
                      <label className="text-[9px] text-cyan-500 font-bold uppercase mb-1 flex items-center gap-1"><Calculator size={10}/> Markup</label>
                      <input 
                         type="number" step="0.1" value={globalSettings.markup}
                         onChange={e => handleGlobalChange('markup', e.target.value)}
                         className="bg-transparent text-sm font-bold text-white outline-none text-center border-b border-white/10 focus:border-cyan-500 transition-colors"
                      />
                   </div>
                   <div className="flex flex-col w-16">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Qtd</label>
                      <input 
                         type="number" value={globalSettings.stock} onChange={e => handleGlobalChange('stock', e.target.value)}
                         className="bg-transparent text-sm font-bold text-white outline-none text-center border-b border-white/10 focus:border-white transition-colors"
                      />
                   </div>
                </div>
            </div>

            {/* Botão de Ação */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition border border-white/10">
                <Plus size={20} />
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
              <button 
                onClick={handleSync}
                disabled={isUploading || items.filter(i => i.selected).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
              >
                {isUploading ? <Loader2 className="animate-spin" size={20}/> : <CloudUpload size={20}/>}
                <span>{isUploading ? 'Sincronizar Tudo' : 'Sincronizar Tudo'}</span>
              </button>
            </div>
          </header>

          {/* GRID DE PRODUTOS - PRETO ABSOLUTO */}
          <main className="flex-1 overflow-y-auto p-6 bg-black">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                <div className="p-6 bg-black rounded-full mb-4 border border-white/10 shadow-2xl">
                   <ImageIcon size={48} className="text-gray-600"/>
                </div>
                <h2 className="text-xl font-bold text-gray-300">Galeria Vazia</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-xs text-center">Arraste imagens ou clique em "+" para começar a criar produtos.</p>
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

// --- CARD PRETO ESPELHADO COM CM/MM ---
function ProductCard({ item, categories, suppliers, onUpdate, onEdit, onToggle, onRemove, generateSmartCode, activeMarkup, isByWeight, lotPrice }: any) {
  const isSelected = item.selected;
  const smartCodePreview = generateSmartCode(item.data.categoryId, item.data.supplierId);
  
  const inputValue = Number(item.data.price) || 0;
  let custoReal = inputValue;
  if (isByWeight && lotPrice > 0) custoReal = inputValue * lotPrice;
  const estimatedSale = custoReal * (Number(activeMarkup) || 2);

  return (
    <div className={`
      relative bg-black rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group
      border border-white/10 shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:border-white/20
      ${isSelected ? 'ring-1 ring-cyan-500/50' : 'opacity-90 hover:opacity-100'}
    `}>
      
      {/* OVERLAYS DE STATUS */}
      {item.status === 'uploading' && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-cyan-400" size={32}/></div>}
      {item.status === 'success' && <div className="absolute inset-0 z-50 bg-green-900/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30 rounded-2xl"><CheckCircle className="text-green-400 drop-shadow-lg" size={48}/></div>}

      {/* ÁREA DA IMAGEM */}
      <div className="relative aspect-square bg-[#050505] overflow-hidden cursor-move group-hover:shadow-inner border-b border-white/5">
        <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => onToggle(item.id)} className={`p-2 rounded-lg backdrop-blur-md border ${isSelected ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-black/60 text-white border-white/20'}`}>
              {isSelected ? <CheckSquare size={14}/> : <Square size={14}/>}
           </button>
           <button onClick={() => onRemove(item.id)} className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md">
              <Trash2 size={14}/>
           </button>
        </div>

        <div className="absolute bottom-3 left-3 z-20">
           <span className="text-[10px] font-mono font-bold bg-black/80 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 backdrop-blur-md">
             {smartCodePreview}
           </span>
        </div>

        <CssImageEditor src={item.previewUrl} edit={item.edit} onChange={(k: string, v: any) => onEdit(item.id, k, v)} />
      </div>

      {/* FORMULÁRIO DO CARD (PRETO) */}
      <div className="p-4 space-y-4 bg-black">
        
        {/* Nome */}
        <div className="relative group/input">
          <input 
            value={item.data.description}
            onChange={e => onUpdate(item.id, 'description', e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-white placeholder-gray-600 outline-none border-b border-white/10 focus:border-cyan-500 transition-colors py-1 uppercase"
            placeholder="NOME DO PRODUTO"
          />
        </div>

        {/* CÁLCULO FINANCEIRO */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
           <div className="flex justify-between items-center mb-1">
              <label className={`text-[9px] font-black uppercase tracking-wider ${isByWeight ? 'text-purple-400' : 'text-cyan-500'}`}>
                 {isByWeight ? 'PESO (g)' : 'CUSTO (R$)'}
              </label>
              {isByWeight && <span className="text-[9px] text-gray-500">x R${lotPrice}</span>}
           </div>
           
           <div className="flex items-center gap-2">
              <input 
                 type="number" 
                 value={item.data.price} 
                 onChange={e => onUpdate(item.id, 'price', e.target.value)} 
                 className={`w-full bg-transparent text-lg font-mono font-bold outline-none ${isByWeight ? 'text-purple-300 placeholder-purple-900/50' : 'text-cyan-300 placeholder-cyan-900/50'}`}
                 placeholder="0.00" 
              />
              <div className="text-right">
                 <p className="text-[9px] text-gray-500 uppercase">Venda</p>
                 <p className="text-xs font-bold text-green-400">R$ {estimatedSale.toFixed(0)}</p>
              </div>
           </div>
        </div>

        {/* --- CAMPOS RECUPERADOS (CM / MM) --- */}
        <div className="grid grid-cols-2 gap-3">
           <div className="relative">
              <Ruler size={10} className="absolute top-2 left-2 text-gray-600"/>
              <input 
                 value={item.data.cm} 
                 onChange={e => onUpdate(item.id, 'cm', e.target.value)} 
                 className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 pr-2 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" 
                 placeholder="CM" 
              />
           </div>
           <div className="relative">
              <Ruler size={10} className="absolute top-2 left-2 text-gray-600"/>
              <input 
                 value={item.data.mm} 
                 onChange={e => onUpdate(item.id, 'mm', e.target.value)} 
                 className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 pr-2 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" 
                 placeholder="MM" 
              />
           </div>
        </div>

        {/* Categorias e Fornecedor */}
        <div className="space-y-2">
           <div className="grid grid-cols-2 gap-2">
              <select value={item.data.categoryId} onChange={e => onUpdate(item.id, 'categoryId', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 outline-none focus:border-cyan-500">
                 <option value="" className="bg-black">Cat...</option>
                 {categories.map((c: any) => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
              </select>
              <input value={item.data.subcategory} onChange={e => onUpdate(item.id, 'subcategory', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-cyan-500 placeholder-gray-600 uppercase" placeholder="SUB..." />
           </div>
           
           <select value={item.data.supplierId} onChange={e => onUpdate(item.id, 'supplierId', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-400 outline-none focus:border-cyan-500">
              <option value="" className="bg-black">Fornecedor...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id} className="bg-black">{s.name}</option>)}
           </select>
        </div>

      </div>
    </div>
  );
}

// EDITOR CSS (MANTIDO)
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