import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CloudUpload,
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  Loader2,
  CheckCircle,
  Scale,
  Package,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  uploadImage,
  importProductsBulk,
  getCategories,
  getFornecedores,
} from '../services/apiService';
import { ProdutoVariante, Category, Fornecedor } from '../types';

interface NeonStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemData {
  description: string;
  price: string;
  cm: string;
  mm: string;
  categoryId: string;
  subcategory: string;
  supplierId: string;
  stock: string;
  variantes: ProdutoVariante[];
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
  data: ItemData;
  edit: ItemEdit;
  finalUrl?: string;
}

export function NeonStudio({ isOpen, onClose, onSuccess }: NeonStudioProps) {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Fornecedor[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  // Inicialização
  useEffect(() => {
    if (isOpen) {
      Promise.all([getCategories(), getFornecedores()]).then(([cats, sups]) => {
        setCategories(cats);
        setSuppliers(sups);
        if (cats.length)
          setGlobalSettings((p) => ({ ...p, categoryId: cats[0].id }));
        if (sups.length)
          setGlobalSettings((p) => ({ ...p, supplierId: sups[0].id }));
      });
      setItems([]);
      setShowMetalCalc(false);
      setGlobalGramPrice(0);
    }
  }, [isOpen]);

  // Lógica Automática de Fornecedor
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
  };

  // Upload e Criação dos Itens
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems: StudioItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      selected: true,
      status: 'pending',
      data: {
        description: '',
        price: '',
        cm: '',
        mm: '',
        categoryId: globalSettings.categoryId,
        subcategory: globalSettings.subcategory,
        supplierId: globalSettings.supplierId,
        stock: globalSettings.stock,
        variantes: [],
      },
      edit: { scale: 100, x: 50, y: 50 },
    }));

    setItems((prev) => [...prev, ...newItems]);
  };

  const removeSelected = () => {
    setItems((prev) => prev.filter((i) => !i.selected));
  };

  const selectAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
  };

  const updateItemData = (id: string, field: keyof ItemData, value: string | ProdutoVariante[]) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newData = { ...i.data, [field]: value };

        // Auto-calcula preço baseado na calculadora de metal (peso * grama * markup)
        if (field === 'mm' && showMetalCalc && globalGramPrice > 0) {
          const weight = parseFloat(value as string) || 0;
          const cost = weight * globalGramPrice;
          const markup = parseFloat(globalSettings.markup) || 2.0;
          newData.price = (cost * markup).toFixed(2);
        }

        return { ...i, data: newData };
      })
    );
  };

  const handleProcess = async () => {
    const selectedItems = items.filter((i) => i.selected && i.status === 'pending');
    if (!selectedItems.length) {
      toast.error('Nenhum item válido selecionado.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload Images
      const itemsWithUrls = await Promise.all(
        selectedItems.map(async (item) => {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
          );
          const url = await uploadImage(item.file);
          return { ...item, finalUrl: url };
        })
      );

      // 2. Prepare Payload
      const payload = itemsWithUrls.map((i) => ({
        name: i.data.description || 'Produto Sem Nome',
        category: i.data.categoryId,
        description: i.data.description,
        salePrice: parseFloat(i.data.price) || 0,
        costPrice: showMetalCalc
          ? (parseFloat(i.data.mm) || 0) * globalGramPrice
          : 0,
        quantity: parseInt(i.data.stock) || 0,
        supplierId: i.data.supplierId,
        imageUrl: i.finalUrl,
        status: 'ativo' as const,
        weight: parseFloat(i.data.mm) || 0,
      }));

      // 3. Bulk Insert API
      await importProductsBulk(payload);

      // 4. Update UI Status
      setItems((prev) =>
        prev.map((i) =>
          i.selected ? { ...i, status: 'success', selected: false } : i
        )
      );

      toast.success(`${payload.length} produtos criados com sucesso!`);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (e) {
      console.error('Erro no processamento em lote:', e);
      toast.error('Erro ao processar lote. Verifique o console.');
      setItems((prev) =>
        prev.map((i) =>
          i.selected && i.status === 'uploading' ? { ...i, status: 'error' } : i
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-gray-900/50 backdrop-blur-sm"
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
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">NeonStudio</h2>
                <p className="text-sm text-gray-500">
                  Criação e edição fotográfica em massa
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Esquerda: Itens (Grid) */}
            <div className="flex-1 p-6 overflow-y-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl bg-white">
                  <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mb-6">
                    <CloudUpload size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nenhuma foto importada
                  </h3>
                  <p className="text-gray-500 max-w-sm text-center mb-8">
                    Arraste as fotos das joias ou clique abaixo para iniciar a
                    importação em massa para a esteira do estúdio.
                  </p>
                  <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 cursor-pointer">
                    Selecionar Fotos
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
                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={selectAll}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <CheckSquare size={16} />
                        Alternar Seleção
                      </button>
                      <button
                        onClick={removeSelected}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        Remover Selecionados
                      </button>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer">
                      <Plus size={16} />
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

                  {/* Grid de Itens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl overflow-hidden border-2 transition-all ${
                          item.selected
                            ? 'border-indigo-500 shadow-md ring-4 ring-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {/* Imagem Placeholder / Editor */}
                        <div
                          className="aspect-square bg-gray-100 relative cursor-pointer group"
                          onClick={() =>
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id
                                  ? { ...i, selected: !i.selected }
                                  : i
                              )
                            )
                          }
                        >
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute inset-0 bg-indigo-600/10 flex items-start justify-end p-3 transition-opacity ${item.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.selected ? 'bg-indigo-600 border-indigo-600' : 'border-white bg-black/20'}`}
                            >
                              {item.selected && (
                                <CheckCircle size={14} className="text-white" />
                              )}
                            </div>
                          </div>

                          {/* Overlay de Status (Loading / Success) */}
                          {item.status !== 'pending' && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                              {item.status === 'uploading' && (
                                <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
                              )}
                              {item.status === 'success' && (
                                <CheckCircle className="text-emerald-500 w-12 h-12" />
                              )}
                              {item.status === 'error' && (
                                <X className="text-rose-500 w-12 h-12" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Formulário Rápido */}
                        <div className="p-4 space-y-3">
                          <input
                            type="text"
                            placeholder="Descrição curta (ex: Aliança Prata)..."
                            value={item.data.description}
                            onChange={(e) =>
                              updateItemData(item.id, 'description', e.target.value)
                            }
                            className="w-full text-sm border-0 border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-600 focus:ring-0 px-0 py-1 bg-transparent transition-colors font-medium text-gray-900"
                            disabled={item.status !== 'pending'}
                          />

                          <div className="flex gap-2">
                            {showMetalCalc && (
                              <div className="flex-1 relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                  g
                                </span>
                                <input
                                  type="number"
                                  placeholder="Peso"
                                  value={item.data.mm}
                                  onChange={(e) =>
                                    updateItemData(item.id, 'mm', e.target.value)
                                  }
                                  className="w-full text-sm border border-gray-200 rounded-lg pl-6 py-1.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                                  disabled={item.status !== 'pending'}
                                />
                              </div>
                            )}

                            <div className="flex-[2] relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                R$
                              </span>
                              <input
                                type="number"
                                placeholder="Preço Final"
                                value={item.data.price}
                                onChange={(e) =>
                                  updateItemData(item.id, 'price', e.target.value)
                                }
                                className={`w-full text-sm border rounded-lg pl-7 py-1.5 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-bold ${showMetalCalc ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-gray-200'}`}
                                disabled={item.status !== 'pending'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direita: Global Settings & Process */}
            {items.length > 0 && (
              <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package size={20} className="text-indigo-600" />
                  Regras em Lote
                </h3>

                <div className="space-y-5 flex-1 overflow-y-auto pr-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Categoria Destino
                    </label>
                    <select
                      value={globalSettings.categoryId}
                      onChange={(e) =>
                        handleGlobalChange('categoryId', e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Selecione...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Fornecedor Padrão
                    </label>
                    <select
                      value={globalSettings.supplierId}
                      onChange={(e) =>
                        handleGlobalChange('supplierId', e.target.value)
                      }
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="">Nenhum / Próprio</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showMetalCalc && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                        <Scale size={16} />
                        Auto-Preço por Peso
                      </div>
                      <div>
                        <label className="block text-xs text-emerald-600 mb-1">
                          Custo do Grama (R$)
                        </label>
                        <input
                          type="number"
                          value={globalGramPrice}
                          onChange={(e) =>
                            setGlobalGramPrice(Number(e.target.value))
                          }
                          className="w-full border-emerald-200 rounded-lg px-2 py-1 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-emerald-600 mb-1">
                          Markup (Multiplicador)
                        </label>
                        <input
                          type="number"
                          value={globalSettings.markup}
                          onChange={(e) =>
                            handleGlobalChange('markup', e.target.value)
                          }
                          className="w-full border-emerald-200 rounded-lg px-2 py-1 text-sm bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-600 leading-tight">
                        O preço final nos cards à esquerda será auto-calculado
                        como: <b>(Peso × Custo/g) × Markup</b>
                      </p>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Estoque Inicial (Por Item)
                    </label>
                    <input
                      type="number"
                      value={globalSettings.stock}
                      onChange={(e) => handleGlobalChange('stock', e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Footer / Botão de Ação */}
                <div className="pt-6 mt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-500">Selecionados:</span>
                    <span className="font-bold text-gray-900">
                      {items.filter((i) => i.selected && i.status === 'pending').length} /{' '}
                      {items.length}
                    </span>
                  </div>
                  <button
                    onClick={handleProcess}
                    disabled={
                      isUploading ||
                      items.filter((i) => i.selected && i.status === 'pending')
                        .length === 0
                    }
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CloudUpload size={20} />
                        Subir Lote ({items.filter((i) => i.selected && i.status === 'pending').length})
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
