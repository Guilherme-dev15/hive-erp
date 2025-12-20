/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, // <--- Ícone Plus importado novamente
  MessageCircle, 
  Package, 
  Maximize2, 
  Ruler, 
  Check, 
  AlertCircle,
  Info
} from 'lucide-react';
import { ProdutoCatalogo, ConfigPublica } from '../types';
import { formatCurrency } from '../utils/format';
import { ImageZoomModal } from './ImageZoomModal';

// --- CONFIGURAÇÕES ---
const MARKUP_PADRAO = 2.0; 

// A imagem deve estar na pasta 'public' com este nome exato
const URL_GUIA_MEDIDAS = "/guia-medidas.jpg"; 

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProdutoCatalogo | null;
  onAddToCart: (produtoComPrecoCorrigido: any) => void;
  config: ConfigPublica;
}

export function ProductDetailsModal({ isOpen, onClose, product, onAddToCart, config }: ProductDetailsModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [varianteSelecionada, setVarianteSelecionada] = useState<any>(null);

  // 1. Resetar a variante selecionada
  useEffect(() => {
    if (product?.variantes && product.variantes.length > 0) {
      setVarianteSelecionada(product.variantes[0]);
    } else {
      setVarianteSelecionada(null);
    }
    setShowSizeGuide(false);
  }, [product, isOpen]);

  // 2. Lógica de Preço
  const precoFinalCalculado = useMemo(() => {
    if (!product) return 0;
    const valorBase = varianteSelecionada 
      ? Number(varianteSelecionada.valor_ajuste) 
      : Number(product.salePrice);
    const precoGrama = (product as any).gramPrice || 0;

    if (valorBase < 10 && precoGrama > 0) {
      return (valorBase * precoGrama) * MARKUP_PADRAO;
    }
    return valorBase; 
  }, [varianteSelecionada, product]);

  if (!product) return null;

  // LÓGICA PARA DETECTAR SE É CORRENTE
  const isCorrente = 
    product.category?.toUpperCase().includes('CORRENTE') || 
    product.name.toUpperCase().includes('CORRENTE') ||
    product.name.toUpperCase().includes('VENEZIANA') ||
    product.subcategory?.toUpperCase().includes('CORRENTE');

  const isSobConsulta = varianteSelecionada?.sob_consulta;
  
  const linkWhatsApp = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(
        `Olá! Gostaria de comprar:\n*${product.name}*\n` +
        `${varianteSelecionada ? `Opção: *${varianteSelecionada.medida}*\n` : ''}` +
        `Preço: *${formatCurrency(precoFinalCalculado)}*\n` +
        `Ref: ${product.code || '---'}`
      )}`
    : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={onClose} 
                className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full hover:bg-gray-100 text-gray-500 shadow-sm backdrop-blur-md transition-colors"
              >
                <X size={24} />
              </button>

              {/* Lado Esquerdo: Imagem */}
              <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-6 relative group/image">
                {product.imageUrl ? (
                  <div 
                    className="relative w-full h-full cursor-zoom-in flex items-center justify-center" 
                    onClick={() => setIsZoomed(true)}
                  >
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain max-h-[350px] drop-shadow-xl transition-transform duration-500 group-hover/image:scale-105" 
                    />
                    <div className="absolute bottom-4 right-4 bg-white/90 p-2.5 rounded-full shadow-sm text-gray-600 opacity-0 group-hover/image:opacity-100 transition-opacity">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-300 flex flex-col items-center">
                    <Package size={64} strokeWidth={1} />
                    <span className="text-sm mt-2 font-medium">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Lado Direito: Conteúdo */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-white custom-scrollbar">
                
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {product.category || 'Geral'}
                    </span>
                    {product.subcategory && (
                       <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-gray-100">
                         {product.subcategory}
                       </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-2">
                    {product.name}
                  </h2>
                  {product.code && <p className="text-xs text-gray-400 font-mono tracking-wide">REF: {product.code}</p>}
                </div>

                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">
                    {isSobConsulta ? 'Disponibilidade' : 'Preço Final'}
                  </p>
                  <div className="text-3xl font-black tracking-tight" style={{ color: config.primaryColor }}>
                    {isSobConsulta ? (
                      <span className="text-xl flex items-center gap-2 text-orange-500">
                        <AlertCircle size={22} /> Sob Consulta
                      </span>
                    ) : (
                      formatCurrency(precoFinalCalculado)
                    )}
                  </div>
                </div>

                {/* Grades / Variantes */}
                {product.variantes && product.variantes.length > 0 && (
                  <div className="mb-8">
                    <div className="flex justify-between items-end mb-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Ruler size={14} className="text-gray-400" /> Escolha a Medida:
                      </h3>
                      
                      {/* BOTÃO DE GUIA DE MEDIDAS */}
                      {isCorrente && (
                        <button 
                          onClick={() => setShowSizeGuide(true)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg transition-colors border border-blue-100"
                        >
                          <Info size={12} /> Guia de Tamanhos
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {product.variantes.map((v: any, idx: number) => {
                        const isSelected = varianteSelecionada?.medida === v.medida;
                        return (
                          <button
                            key={idx}
                            onClick={() => setVarianteSelecionada(v)}
                            className={`
                              px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2
                              ${isSelected 
                                ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-105' 
                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                              }
                            `}
                          >
                            {isSelected && <Check size={14} strokeWidth={3} />}
                            {v.medida}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-8 flex-grow">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Detalhes</h3>
                  <div className="prose prose-sm text-gray-500 leading-relaxed text-sm whitespace-pre-line">
                    {product.description || "Sem descrição disponível."}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-4 bg-white sticky bottom-0">
                  <button
                    disabled={isSobConsulta}
                    onClick={() => {
                      const produtoParaCarrinho = {
                        ...product,
                        salePrice: precoFinalCalculado,
                        selectedVariant: varianteSelecionada
                      };
                      onAddToCart(produtoParaCarrinho);
                      onClose();
                    }}
                    className={`
                      w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                      ${isSobConsulta 
                        ? 'bg-gray-300 cursor-not-allowed grayscale' 
                        : 'hover:brightness-110 active:scale-[0.98]'
                      }
                    `}
                    style={{ backgroundColor: isSobConsulta ? '#cbd5e1' : config.secondaryColor }}
                  >
                    {/* ÍCONE PLUS RESTAURADO */}
                    <Plus size={22} strokeWidth={3} />
                    {isSobConsulta ? 'INDISPONÍVEL ONLINE' : 'ADICIONAR AO CARRINHO'}
                  </button>

                  {linkWhatsApp && (
                    <a 
                      href={linkWhatsApp} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-full py-3 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageCircle size={18} />
                      Comprar pelo WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL DO GUIA DE TAMANHOS --- */}
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowSizeGuide(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-2 rounded-2xl max-w-lg w-full relative shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowSizeGuide(false)} 
                className="absolute -top-12 right-0 text-white hover:text-gray-300 flex flex-col items-center"
              >
                <X size={32} />
                <span className="text-xs font-bold uppercase">Fechar</span>
              </button>
              
              {/* IMAGEM COM TRATAMENTO DE ERRO VISUAL */}
              <img 
                src={URL_GUIA_MEDIDAS} 
                alt="Guia de Medidas de Correntes" 
                className="w-full h-auto rounded-xl"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const msg = document.createElement('div');
                  msg.className = 'bg-red-50 p-8 rounded-xl text-center';
                  msg.innerHTML = `
                    <p class="text-red-600 font-bold mb-2">Imagem não encontrada</p>
                    <p class="text-xs text-gray-500">
                      Certifique-se de que o arquivo <strong>guia-medidas.jpg</strong><br/>
                      está na pasta <strong>public</strong> do seu projeto.
                    </p>
                  `;
                  e.currentTarget.parentElement?.appendChild(msg);
                }}
              />
              
              <div className="p-4 text-center">
                <h3 className="font-bold text-lg text-gray-800">Guia de Caimento</h3>
                <p className="text-sm text-gray-500">Visualize como cada tamanho fica no corpo.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageZoomModal
        imageUrl={isZoomed && product ? product.imageUrl || null : null}
        onClose={() => setIsZoomed(false)}
      />
    </>
  );
}