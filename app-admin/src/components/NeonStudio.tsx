import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CloudUpload,
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle,
  Scale,
  Package,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Calculator,
  Tag,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  uploadImage,
  importProductsBulk,
  getCategories,
  getFornecedores,
} from '../services/apiService';
import { Category, Fornecedor } from '../types';

interface NeonStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemData {
  description: string;
  costPrice: string;
  cm: string;
  mm: string;
  weight: string;
  categoryId: string;
  subcategory: string;
  supplierId: string;
  stock: string;
}

interface ItemEdit {
  scale: number;
  x: number;
  y: number;
}

interface StudioItem {
  id: string;
  file: File;
  previewUrl: string;
  selected: boolean;
  status: 'pending' | 'uploading' | 'success' | 'error';
  code: string;
  data: ItemData;
  edit: ItemEdit;
  finalUrl?: string;
}

interface CssImageEditorProps {
  src: string;
  edit: ItemEdit;
  disabled?: boolean;
  onChange: (key: keyof ItemEdit, value: number) => void;
  onReset: () => void;
}

function CssImageEditor({ src, edit, disabled, onChange, onReset }: CssImageEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    onChange('x', (edit.x || 0) + dx);
    onChange('y', (edit.y || 0) + dy);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    const newScale = Math.max(0.5, Math.min(5, (edit.scale || 1) + delta));
    onChange('scale', parseFloat(newScale.toFixed(2)));
  };

  const handleZoom = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (disabled) return;
    const newScale = Math.max(0.5, Math.min(5, (edit.scale || 1) + delta));
    onChange('scale', parseFloat(newScale.toFixed(2)));
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-gray-950 select-none cursor-move group"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <img
        src={src}
        alt="Foto Joia"
        draggable={false}
        className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transition-transform duration-75 ease-out origin-center pointer-events-none"
        style={{
          transform: `translate(-50%, -50%) translate(${edit.x}px, ${edit.y}px) scale(${edit.scale})`,
        }}
      />

      {/* Mira central e grid sutil para alinhamento profissional */}
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="absolute top-1/2 w-full h-px bg-white/70 -translate-y-1/2" />
        <div className="absolute left-1/2 h-full w-px bg-white/70 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Controles de Zoom rápidos flutuantes */}
      {!disabled && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
          <button
            type="button"
            title="Reduzir Zoom"
            onClick={(e) => handleZoom(e, -0.2)}
            className="p-1 hover:bg-white/20 rounded text-white transition-colors"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-[10px] text-gray-200 font-mono px-1 font-bold">
            {Math.round(edit.scale * 100)}%
          </span>
          <button
            type="button"
            title="Aumentar Zoom"
            onClick={(e) => handleZoom(e, 0.2)}
            className="p-1 hover:bg-white/20 rounded text-white transition-colors"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            title="Resetar Enquadramento"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            className="p-1 hover:bg-white/20 rounded text-white ml-0.5 transition-colors"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      {/* Tooltip de Orientação */}
      <div className="absolute bottom-2 left-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className="text-[10px] bg-black/75 text-indigo-300 font-medium px-2 py-0.5 rounded backdrop-blur-md">
          Arraste • Scroll zoom
        </span>
      </div>
    </div>
  );
}

export function NeonStudio({ isOpen, onClose, onSuccess }: NeonStudioProps) {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [globalGramPrice, setGlobalGramPrice] = useState<number>(0);

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

  // Gerador de Smart Code
  const generateSmartCode = (
    catId: string,
    supId: string,
    catsList: Category[] = categories,
    supsList: Fornecedor[] = suppliers
  ) => {
    const catObj = catsList.find((c) => c.id === catId || c.name === catId);
    const catPrefix = catObj
      ? catObj.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
      : 'GEN';

    const supObj = supsList.find((s) => s.id === supId);
    let supPrefix = 'HP';
    if (supObj) {
      const clean = supObj.name.replace(/[^a-zA-Z]/g, '');
      supPrefix = clean.substring(0, 2).toUpperCase() || 'HP';
    }

    const random3 = Math.floor(Math.random() * 900) + 100;
    return `${catPrefix || 'GEN'}-${supPrefix || 'HP'}-${random3}`;
  };

  // Inicialização
  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups);
        const defaultCatId = cats.length ? cats[0].id : '';
        const defaultSupId = sups.length ? sups[0].id : '';
        setGlobalSettings((p) => ({
          ...p,
          categoryId: p.categoryId || defaultCatId,
          supplierId: p.supplierId || defaultSupId,
        }));
      });
      setItems([]);
      setShowMetalCalc(false);
      setGlobalGramPrice(0);
      setUploadProgress({ current: 0, total: 0 });
    }
  }, [isOpen]);

  // Lógica Automática de Fornecedor por Peso
  useEffect(() => {
    if (globalSettings.supplierId) {
      const sup = suppliers.find((s) => s.id === globalSettings.supplierId);
      if (sup && sup.rules?.isByWeight) {
        setShowMetalCalc(true);
        if (sup.rules.lots && sup.rules.lots.length > 0) {
          setGlobalGramPrice(sup.rules.lots[0].price);
        }
      } else {
        setShowMetalCalc(false);
      }
    }
  }, [globalSettings.supplierId, suppliers]);

  const handleGlobalChange = (field: string, value: string) => {
    setGlobalSettings((prev) => ({ ...prev, [field]: value }));

    if (field === 'supplierId' || field === 'categoryId' || field === 'subcategory') {
      setItems((prev) =>
        prev.map((item) => {
          const updatedData = { ...item.data };
          if (field === 'supplierId') updatedData.supplierId = value;
          if (field === 'categoryId') updatedData.categoryId = value;
          if (field === 'subcategory') updatedData.subcategory = value;
          const newCode = generateSmartCode(
            updatedData.categoryId,
            updatedData.supplierId
          );
          return { ...item, code: newCode, data: updatedData };
        })
      );
    }
  };

  // Upload e Criação dos Itens
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems: StudioItem[] = files.map((file) => {
      const rawName = file.name
        .split('.')[0]
        .replace(/[-_]/g, ' ')
        .trim()
        .toUpperCase();

      const initialCode = generateSmartCode(
        globalSettings.categoryId,
        globalSettings.supplierId
      );

      return {
        id: Math.random().toString(36).substring(7),
        file,
        previewUrl: URL.createObjectURL(file),
        selected: true,
        status: 'pending',
        code: initialCode,
        data: {
          description: rawName,
          costPrice: '',
          cm: '',
          mm: '',
          weight: '',
          categoryId: globalSettings.categoryId,
          subcategory: globalSettings.subcategory,
          supplierId: globalSettings.supplierId,
          stock: globalSettings.stock,
        },
        edit: { scale: 1, x: 0, y: 0 },
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const removeSelected = () => {
    setItems((prev) => prev.filter((i) => !i.selected));
  };

  const selectAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
  };

  const updateItemData = (
    id: string,
    field: keyof ItemData,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newData = { ...i.data, [field]: value };

        let newCode = i.code;
        if (field === 'categoryId' || field === 'supplierId') {
          newCode = generateSmartCode(
            field === 'categoryId' ? value : newData.categoryId,
            field === 'supplierId' ? value : newData.supplierId
          );
        }

        return { ...i, code: newCode, data: newData };
      })
    );
  };

  const updateItemEdit = (
    id: string,
    field: keyof ItemEdit,
    value: number
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, edit: { ...i.edit, [field]: value } } : i
      )
    );
  };

  const resetItemEdit = (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, edit: { scale: 1, x: 0, y: 0 } } : i
      )
    );
  };

  // Processador Canvas 1080x1080 para Enquadramento Profissional
  const generateFinalCrop = async (item: StudioItem): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.previewUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const outputSize = 1080;
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Falha ao instanciar canvas 2D'));
        }

        // Fundo Branco fotográfico uniforme
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outputSize, outputSize);

        const visualSize = 260;
        const ratio = outputSize / visualSize;

        const scale = item.edit.scale || 1;
        const x = (item.edit.x || 0) * ratio;
        const y = (item.edit.y || 0) * ratio;

        ctx.save();
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        const baseScale = Math.max(outputSize / img.width, outputSize / img.height);
        const drawWidth = img.width * baseScale;
        const drawHeight = img.height * baseScale;

        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        ctx.restore();

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Falha ao renderizar imagem final'));
          },
          'image/jpeg',
          0.95
        );
      };

      img.onerror = () => reject(new Error('Falha ao carregar imagem para crop'));
    });
  };

  // Processamento e Sincronização em Massa
  const handleProcess = async () => {
    const selectedItems = items.filter(
      (i) => i.selected && i.status === 'pending'
    );
    if (!selectedItems.length) {
      toast.error('Nenhum item válido selecionado.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedItems.length });

    const activeMarkup = parseFloat(globalSettings.markup) || 2.0;

    try {
      const payload: any[] = [];

      for (let idx = 0; idx < selectedItems.length; idx++) {
        const item = selectedItems[idx];

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'uploading' } : i
          )
        );

        try {
          // 1. Gera Crop 1080x1080 via Canvas com enquadramento do usuário
          const finalBlob = await generateFinalCrop(item);

          // 2. Compõe Nome Comercial com dimensões (CM e MM)
          const nameParts = [
            item.data.description,
            item.data.cm ? `${item.data.cm}CM` : '',
            item.data.mm ? `${item.data.mm}MM` : '',
          ].filter(Boolean);

          const finalName = (nameParts.join(' ') || 'PRODUTO').toUpperCase();
          const fileName = `${finalName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;

          const fileToUpload = new File([finalBlob], fileName, {
            type: 'image/jpeg',
          });

          // 3. Upload da Imagem Processada
          const uploadedUrl = await uploadImage(fileToUpload);

          // 4. Cálculos Financeiros com Markup
          let cost = parseFloat(item.data.costPrice) || 0;
          const weightNum = parseFloat(item.data.weight) || (showMetalCalc ? parseFloat(item.data.mm) || 0 : 0);

          if (showMetalCalc && globalGramPrice > 0 && weightNum > 0) {
            cost = weightNum * globalGramPrice;
          }

          const sale = cost * activeMarkup;

          // 5. Normalização de Categoria e Subcategoria
          const resolvedCategory =
            categories.find((c) => c.id === item.data.categoryId)?.name ||
            item.data.categoryId ||
            'Geral';

          payload.push({
            name: finalName,
            code: item.code,
            category: resolvedCategory,
            categoryId: item.data.categoryId || undefined,
            subcategory: item.data.subcategory || globalSettings.subcategory || undefined,
            description: finalName,
            costPrice: cost,
            salePrice: sale,
            quantity: parseInt(item.data.stock) || 0,
            weight: weightNum > 0 ? weightNum : undefined,
            supplierId: item.data.supplierId || undefined,
            imageUrl: uploadedUrl,
            status: 'ativo' as const,
          });

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'success', finalUrl: uploadedUrl, selected: false }
                : i
            )
          );
        } catch (itemErr) {
          console.error(`Erro ao processar item ${item.id}:`, itemErr);
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'error' } : i
            )
          );
        }

        setUploadProgress({ current: idx + 1, total: selectedItems.length });
      }

      if (payload.length > 0) {
        await importProductsBulk(payload);
        toast.success(`${payload.length} produtos importados com sucesso!`);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (e) {
      console.error('Erro no processamento em lote:', e);
      toast.error('Erro ao salvar produtos no banco de dados.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const activeMarkup = parseFloat(globalSettings.markup) || 2.0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-gray-950/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="ml-auto w-full max-w-7xl bg-gray-50 h-full flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-100">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">NeonStudio</h2>
                  <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                    Estúdio Fotográfico & Lote
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Enquadre, dê zoom e importe joias com códigos e preços automáticos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Esquerda: Grid de Itens e Editor */}
            <div className="flex-1 p-6 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-white p-8">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-5 shadow-sm">
                    <CloudUpload size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nenhuma foto importada ainda
                  </h3>
                  <p className="text-gray-500 max-w-md text-center mb-6 text-sm">
                    Selecione as fotos das joias para abrir o estúdio de enquadramento,
                    geração de códigos inteligentes e precificação em massa.
                  </p>
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-100 cursor-pointer flex items-center gap-2">
                    <Plus size={18} />
                    Selecionar Fotos das Joias
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Toolbar */}
                  <div className="flex flex-wrap justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {items.every((i) => i.selected) ? (
                          <Square size={14} />
                        ) : (
                          <CheckSquare size={14} />
                        )}
                        Alternar Todos
                      </button>
                      <button
                        onClick={removeSelected}
                        disabled={!items.some((i) => i.selected)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 size={14} />
                        Remover Selecionados
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 font-medium">
                        Total:{' '}
                        <b className="text-gray-800">{items.length} fotos</b>
                      </span>
                      <label className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100">
                        <Plus size={14} />
                        Adicionar Mais
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Grid dos Cards de Produtos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 pb-12">
                    {items.map((item) => {
                      const costNum = parseFloat(item.data.costPrice) || 0;
                      const weightNum = parseFloat(item.data.weight) || (showMetalCalc ? parseFloat(item.data.mm) || 0 : 0);
                      const effectiveCost =
                        showMetalCalc && globalGramPrice > 0 && weightNum > 0
                          ? weightNum * globalGramPrice
                          : costNum;
                      const estimatedSale = effectiveCost * activeMarkup;

                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl overflow-hidden border-2 transition-all flex flex-col shadow-sm ${
                            item.selected
                              ? 'border-indigo-500 ring-4 ring-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Topo do Card: Smart Code & Seleção */}
                          <div className="px-3.5 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Tag size={12} className="text-indigo-600" />
                              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                                {item.code}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? { ...i, selected: !i.selected }
                                      : i
                                  )
                                )
                              }
                              className={`p-1 rounded-md transition-colors ${
                                item.selected
                                  ? 'text-indigo-600 bg-indigo-100/60'
                                  : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              {item.selected ? (
                                <CheckSquare size={16} />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                          </div>

                          {/* Editor Fotográfico com Pan & Zoom */}
                          <div className="aspect-square relative bg-gray-900 overflow-hidden">
                            <CssImageEditor
                              src={item.previewUrl}
                              edit={item.edit}
                              disabled={item.status !== 'pending'}
                              onChange={(k, v) => updateItemEdit(item.id, k, v)}
                              onReset={() => resetItemEdit(item.id)}
                            />

                            {/* Overlays de Status */}
                            {item.status !== 'pending' && (
                              <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                {item.status === 'uploading' && (
                                  <>
                                    <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-2" />
                                    <span className="text-xs font-bold text-indigo-700">
                                      Enquadrando & Subindo...
                                    </span>
                                  </>
                                )}
                                {item.status === 'success' && (
                                  <>
                                    <CheckCircle className="text-emerald-500 w-12 h-12 mb-1" />
                                    <span className="text-xs font-bold text-emerald-700">
                                      Importado com Sucesso!
                                    </span>
                                  </>
                                )}
                                {item.status === 'error' && (
                                  <>
                                    <X className="text-rose-500 w-12 h-12 mb-1" />
                                    <span className="text-xs font-bold text-rose-600">
                                      Falha no envio
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Formulário do Produto */}
                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-2.5">
                              {/* Nome da Joia */}
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Nome da Joia
                                </label>
                                <input
                                  type="text"
                                  value={item.data.description}
                                  onChange={(e) =>
                                    updateItemData(
                                      item.id,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ex: Anel Solitário Cravejado"
                                  className="w-full text-xs font-semibold text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 uppercase"
                                  disabled={item.status !== 'pending'}
                                />
                              </div>

                              {/* Dimensões de Joalheria: CM e MM */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Comp. (CM)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.data.cm}
                                    onChange={(e) =>
                                      updateItemData(item.id, 'cm', e.target.value)
                                    }
                                    placeholder="Ex: 45"
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                    disabled={item.status !== 'pending'}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Espessura (MM)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.data.mm}
                                    onChange={(e) =>
                                      updateItemData(item.id, 'mm', e.target.value)
                                    }
                                    placeholder="Ex: 2"
                                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                    disabled={item.status !== 'pending'}
                                  />
                                </div>
                              </div>

                              {/* Subcategoria */}
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  Subcategoria
                                </label>
                                <input
                                  type="text"
                                  value={item.data.subcategory}
                                  onChange={(e) =>
                                    updateItemData(
                                      item.id,
                                      'subcategory',
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ex: Veneziana / Argola"
                                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 uppercase"
                                  disabled={item.status !== 'pending'}
                                />
                              </div>

                              {/* Precificação com Custo e Markup */}
                              <div className="pt-2 border-t border-gray-100">
                                {showMetalCalc ? (
                                  <div className="space-y-1.5 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                        <Scale size={11} /> Peso da Peça
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-600">
                                        R$ {globalGramPrice.toFixed(2)}/g
                                      </span>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <div className="relative flex-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={item.data.weight}
                                          onChange={(e) =>
                                            updateItemData(
                                              item.id,
                                              'weight',
                                              e.target.value
                                            )
                                          }
                                          placeholder="0.00"
                                          className="w-full text-xs border border-emerald-200 rounded-lg pr-6 pl-2 py-1.5 bg-white font-bold text-emerald-900"
                                          disabled={item.status !== 'pending'}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-bold">
                                          g
                                        </span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <span className="block text-[9px] text-gray-400 uppercase">
                                          Venda (x{activeMarkup.toFixed(1)})
                                        </span>
                                        <span className="text-xs font-bold text-emerald-700 font-mono">
                                          R$ {estimatedSale.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Custo (R$)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={item.data.costPrice}
                                        onChange={(e) =>
                                          updateItemData(
                                            item.id,
                                            'costPrice',
                                            e.target.value
                                          )
                                        }
                                        placeholder="0.00"
                                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono"
                                        disabled={item.status !== 'pending'}
                                      />
                                    </div>
                                    <div className="flex-1 text-right pt-2.5">
                                      <span className="block text-[9px] text-gray-400 uppercase">
                                        Venda (x{activeMarkup.toFixed(1)})
                                      </span>
                                      <span className="text-xs font-bold text-indigo-700 font-mono">
                                        R$ {estimatedSale.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Direita: Regras em Lote e Ação */}
            {items.length > 0 && (
              <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Package size={18} className="text-indigo-600" />
                    Regras Globais do Lote
                  </h3>

                  <div className="space-y-4">
                    {/* Categoria Global */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                        Categoria
                      </label>
                      <select
                        value={globalSettings.categoryId}
                        onChange={(e) =>
                          handleGlobalChange('categoryId', e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                      >
                        <option value="">Selecione...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fornecedor Global */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                        Fornecedor (Define Prefixo)
                      </label>
                      <select
                        value={globalSettings.supplierId}
                        onChange={(e) =>
                          handleGlobalChange('supplierId', e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 bg-white"
                      >
                        <option value="">Nenhum / Próprio</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategoria Global */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                        Subcategoria Padrão
                      </label>
                      <input
                        type="text"
                        value={globalSettings.subcategory}
                        onChange={(e) =>
                          handleGlobalChange('subcategory', e.target.value)
                        }
                        placeholder="Ex: ARGOLA, CHOKER"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 uppercase"
                      />
                    </div>

                    {/* Markup Multiplicador */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calculator size={13} className="text-indigo-600" />
                          Markup (Multiplicador)
                        </span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {activeMarkup.toFixed(1)}x
                        </span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={globalSettings.markup}
                        onChange={(e) =>
                          handleGlobalChange('markup', e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 font-bold"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Preço Venda = Custo × Markup
                      </p>
                    </div>

                    {/* Calculadora por Peso quando Fornecedor for por Grama */}
                    {showMetalCalc && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                          <Scale size={14} />
                          Fornecedor por Grama
                        </div>
                        <div>
                          <label className="block text-[10px] text-emerald-700 font-semibold mb-1">
                            Custo por Grama (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={globalGramPrice}
                            onChange={(e) =>
                              setGlobalGramPrice(Number(e.target.value))
                            }
                            className="w-full border border-emerald-300 rounded-lg px-2.5 py-1 text-xs bg-white font-bold"
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Estoque Inicial Padrão */}
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">
                        Estoque Inicial Padrão
                      </label>
                      <input
                        type="number"
                        value={globalSettings.stock}
                        onChange={(e) =>
                          handleGlobalChange('stock', e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer / Botão de Ação */}
                <div className="pt-5 border-t border-gray-200">
                  <div className="flex justify-between text-xs mb-3 font-medium">
                    <span className="text-gray-500">Selecionados:</span>
                    <span className="font-bold text-gray-900">
                      {
                        items.filter(
                          (i) => i.selected && i.status === 'pending'
                        ).length
                      }{' '}
                      de {items.length}
                    </span>
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={
                      isUploading ||
                      items.filter((i) => i.selected && i.status === 'pending')
                        .length === 0
                    }
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-indigo-100"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processando ({uploadProgress.current}/{uploadProgress.total})...
                      </>
                    ) : (
                      <>
                        <CloudUpload size={18} />
                        Sincronizar Lote (
                        {
                          items.filter(
                            (i) => i.selected && i.status === 'pending'
                          ).length
                        }
                        )
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
