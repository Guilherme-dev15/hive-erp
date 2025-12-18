import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, X, CloudUpload, Plus, Trash2, Sparkles, 
  CheckSquare, Square, Loader2, CheckCircle, Image as ImageIcon,
  Tag, Layers // Novos ícones
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Seus serviços
import { uploadImage, importProductsBulk, getCategories, getFornecedores } from '../services/apiService';

// --- CONFIGURAÇÃO DE NEGÓCIO ---
const DEFAULT_MARKUP = 2.0; // Markup de Venda

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
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Configurações Globais
  const [globalSettings, setGlobalSettings] = useState({
    supplierId: '',
    categoryId: '',
    subcategory: '', // Novo Global
    stock: '1',
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups);
        if (cats.length) setGlobalSettings(p => ({ ...p, categoryId: cats[0].id }));
        if (sups.length) setGlobalSettings(p => ({ ...p, supplierId: sups[0].id }));
      });
      setItems([]);
    }
  }, [isOpen]);

  // --- NOVA LÓGICA DE CÓDIGO: CAT(3) - FOR(2) - RAND(3) ---
  const generateSmartCode = (categoryId: string, supplierId: string) => {
    // 1. Pega Categoria (3 primeiras letras)
    const catObj = categories.find(c => c.id === categoryId);
    const catPrefix = catObj 
      ? catObj.name.substring(0, 3).toUpperCase() 
      : 'GEN'; // Padrão se não tiver categoria

    // 2. Pega Fornecedor (2 primeiras letras)
    const supObj = suppliers.find(s => s.id === supplierId);
    let supPrefix = 'XX';
    if (supObj) {
        // Remove símbolos e pega letras
        const supClean = supObj.name.replace(/[^a-zA-Z]/g, '');
        supPrefix = supClean.substring(0, 2).toUpperCase();
    }

    // 3. Gera 3 dígitos aleatórios (100 a 999)
    const random3 = Math.floor(Math.random() * 900) + 100;

    // Resultado Ex: BRI-VL-197
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
        subcategory: globalSettings.subcategory, // Novo Campo
        supplierId: globalSettings.supplierId,
        stock: globalSettings.stock,
      },
      edit: { scale: 1, x: 0, y: 0 }
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, data: { ...item.data, [field]: value } } : item));
  };

  const updateEdit = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, edit: { ...item.edit, [field]: value } } : item));
  };

  const toggleSelect = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // --- GERADOR DE CROP (SEM CANVAS NA VISUALIZAÇÃO) ---
  const generateFinalCrop = async (item: any): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = item.previewUrl;
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const outputSize = 1080;
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputSize, outputSize);

        const visualSize = 300; 
        const ratio = outputSize / visualSize;

        const scale = item.edit.scale;
        const x = item.edit.x * ratio;
        const y = item.edit.y * ratio;
        
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        const baseScale = Math.max(outputSize / img.width, outputSize / img.height);
        ctx.drawImage(
          img, 
          -img.width * baseScale / 2, 
          -img.height * baseScale / 2, 
          img.width * baseScale, 
          img.height * baseScale
        );

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Falha ao gerar imagem"));
        }, 'image/jpeg', 0.95);
      };
      img.onerror = reject;
    });
  };

  // --- SINCRONIZAÇÃO ---
  const handleSync = async () => {
    const toUpload = items.filter(i => i.selected && i.status !== 'success');
    if (toUpload.length === 0) return toast.error("Selecione itens para enviar.");

    setIsUploading(true);
    setProgress({ current: 0, total: toUpload.length });
    const successList: any[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const item = toUpload[i];
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'uploading' } : it));

      try {
        const finalBlob = await generateFinalCrop(item);
        
        // 1. Nome Concatenado
        const finalName = [
          item.data.description, 
          item.data.cm ? `${item.data.cm}CM` : '',
          item.data.mm ? `${item.data.mm}MM` : ''
        ].filter(Boolean).join(' ').toUpperCase();

        const fileToUpload = new File([finalBlob], `${finalName}.jpg`, { type: 'image/jpeg' });
        const imageUrl = await uploadImage(fileToUpload);

        // 2. Gera o CÓDIGO INTELIGENTE (ATUALIZADO)
        // Passa Categoria e Fornecedor
        const smartCode = generateSmartCode(item.data.categoryId, item.data.supplierId);

        // 3. Preços
        const costPrice = Number(item.data.price) || 0;
        const salePrice = costPrice * DEFAULT_MARKUP;

        const productData = {
          name: finalName,
          costPrice: costPrice,
          salePrice: salePrice,
          quantity: Number(item.data.stock) || 0,
          category: categories.find(c => c.id === item.data.categoryId)?.name || 'Geral',
          subcategory: item.data.subcategory || '', 
          supplierId: item.data.supplierId,
          imageUrl: imageUrl,
          code: smartCode, // CÓDIGO NOVO APLICADO AQUI
          status: 'ativo'
        };

        successList.push(productData);
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'success' } : it));
        setProgress(prev => ({ ...prev, current: i + 1 }));

      } catch (error) {
        console.error(error);
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error' } : it));
      }
    }

    if (successList.length > 0) {
      await importProductsBulk(successList);
      toast.success(`${successList.length} produtos cadastrados!`);
      onSuccess();
      setTimeout(onClose, 1500);
    }
    setIsUploading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[#0a0a0a] text-white flex flex-col"
        >
          {/* HEADER */}
          <header className="px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X /></button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="text-cyan-400" size={20}/> NEON STUDIO
                </h1>
                <p className="text-xs text-gray-400 font-mono">CÓDIGO: CAT(3) + FOR(2) + 000</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition">
                <Plus size={18} /> <span className="text-sm font-bold">Adicionar Fotos</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>

              <button 
                onClick={handleSync}
                disabled={isUploading || items.filter(i => i.selected).length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold transition shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                {isUploading ? <Loader2 className="animate-spin" /> : <CloudUpload />}
                {isUploading ? `Enviando ${progress.current}/${progress.total}` : 'Sincronizar Tudo'}
              </button>
            </div>
          </header>

          {/* GRID */}
          <main className="flex-1 overflow-y-auto p-6 bg-grid-pattern">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl opacity-50">
                <ImageIcon size={64} className="mb-4 text-gray-600"/>
                <h2 className="text-2xl font-bold text-gray-500">Arraste fotos ou clique em Adicionar</h2>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
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
                    generateSmartCode={generateSmartCode} // Passando a função atualizada
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

// --- CARD ATUALIZADO (COM SUBCATEGORIA E PREVIEW DO CÓDIGO) ---
function ProductCard({ item, categories, suppliers, onUpdate, onEdit, onToggle, onRemove, generateSmartCode }: any) {
  const borderColor = item.status === 'success' ? 'border-green-500' : item.status === 'error' ? 'border-red-500' : item.selected ? 'border-cyan-500' : 'border-white/10';
  
  // Calcula o código em tempo real para mostrar pro usuário (baseado em Cat e Forn)
  const smartCodePreview = generateSmartCode(item.data.categoryId, item.data.supplierId);

  return (
    <div className={`bg-[#111] rounded-xl border ${borderColor} overflow-hidden flex flex-col group relative transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
      
      {/* STATUS */}
      {item.status === 'uploading' && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={40}/></div>}
      {item.status === 'success' && <div className="absolute inset-0 z-50 bg-green-900/90 flex items-center justify-center"><CheckCircle className="text-white" size={40}/></div>}

      {/* EDITOR */}
      <div className="relative aspect-square bg-black overflow-hidden cursor-move">
        <div className="absolute top-2 right-2 z-20 flex gap-2">
           <button onClick={() => onToggle(item.id)} className={`p-2 rounded-lg backdrop-blur ${item.selected ? 'bg-cyan-500 text-black' : 'bg-black/50 text-white hover:bg-white/20'}`}>
              {item.selected ? <CheckSquare size={16}/> : <Square size={16}/>}
           </button>
           <button onClick={() => onRemove(item.id)} className="p-2 rounded-lg bg-black/50 text-white hover:bg-red-500/80 backdrop-blur"><Trash2 size={16}/></button>
        </div>

        {/* CÓDIGO GERADO (PREVIEW NO CARD) */}
        <div className="absolute top-2 left-2 z-20">
           <span className="text-[10px] font-mono bg-black/70 text-cyan-400 px-2 py-1 rounded border border-cyan-500/30 backdrop-blur">
             {smartCodePreview}
           </span>
        </div>

        <CssImageEditor src={item.previewUrl} edit={item.edit} onChange={(k: string, v: any) => onEdit(item.id, k, v)} />
        
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
           <span className="text-[10px] bg-black/60 px-2 py-1 rounded text-cyan-400 font-bold uppercase tracking-wider">Arraste & Zoom</span>
        </div>
      </div>

      {/* DADOS */}
      <div className="p-4 space-y-3 bg-[#111]">
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-bold">Nome do Produto</label>
          <input 
            value={item.data.description}
            onChange={e => onUpdate(item.id, 'description', e.target.value)}
            className="w-full bg-transparent border-b border-white/10 focus:border-cyan-500 text-sm font-bold text-white outline-none py-1 placeholder-gray-600 uppercase"
            placeholder="NOME"
          />
        </div>

        {/* CUSTO E ESTOQUE */}
        <div className="grid grid-cols-2 gap-2">
           <div className="space-y-1">
             <label className="text-[10px] text-cyan-500 uppercase font-bold">Custo (R$)</label>
             <input type="number" value={item.data.price} onChange={e => onUpdate(item.id, 'price', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-xs text-white outline-none border border-cyan-900/50 focus:border-cyan-500 font-mono" placeholder="0.00" />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] text-gray-500 uppercase font-bold">Estoque</label>
             <input type="number" value={item.data.stock} onChange={e => onUpdate(item.id, 'stock', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-xs text-white outline-none border border-transparent focus:border-cyan-500" />
           </div>
        </div>

        {/* CATEGORIA E SUBCATEGORIA */}
        <div className="grid grid-cols-2 gap-2">
           <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Categoria</label>
              <select value={item.data.categoryId} onChange={e => onUpdate(item.id, 'categoryId', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-[10px] text-gray-300 outline-none uppercase">
                 <option value="">Selecione...</option>
                 {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           {/* SUBCATEGORIA (CAMPO LIVRE) */}
           <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold">Subcategoria</label>
              <input 
                 value={item.data.subcategory} 
                 onChange={e => onUpdate(item.id, 'subcategory', e.target.value)}
                 className="w-full bg-white/5 rounded px-2 py-1 text-[10px] text-white outline-none uppercase" 
                 placeholder="EX: ARGOLA"
              />
           </div>
        </div>

        {/* FORNECEDOR */}
        <div className="space-y-1">
           <label className="text-[10px] text-gray-500 uppercase font-bold">Fornecedor (Define Prefixo)</label>
           <select value={item.data.supplierId} onChange={e => onUpdate(item.id, 'supplierId', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-[10px] text-gray-300 outline-none uppercase">
              <option value="">Selecione...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
           </select>
        </div>

        {/* CM E MM */}
        <div className="grid grid-cols-2 gap-2">
           <input type="number" value={item.data.cm} onChange={e => onUpdate(item.id, 'cm', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" placeholder="CM" />
           <input type="number" value={item.data.mm} onChange={e => onUpdate(item.id, 'mm', e.target.value)} className="w-full bg-white/5 rounded px-2 py-1 text-[10px] text-white outline-none" placeholder="MM" />
        </div>
      </div>
    </div>
  );
}

// EDITOR CSS (MANTIDO)
function CssImageEditor({ src, edit, onChange }: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    onChange('x', (edit.x || 0) + dx);
    onChange('y', (edit.y || 0) + dy);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.001;
    const newScale = Math.max(0.5, Math.min(5, (edit.scale || 1) + delta));
    onChange('scale', newScale);
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-[#050505]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <img 
        src={src}
        alt="Edit"
        draggable={false}
        className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transition-transform duration-75 ease-out origin-center"
        style={{
          transform: `translate(-50%, -50%) translate(${edit.x}px, ${edit.y}px) scale(${edit.scale})`
        }}
      />
      <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-30">
        <div className="absolute top-1/2 w-full h-px bg-white/30"></div>
        <div className="absolute left-1/2 h-full w-px bg-white/30"></div>
      </div>
    </div>
  );
}