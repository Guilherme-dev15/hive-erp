import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, MessageCircle, Package, Maximize2 } from 'lucide-react';
import { ProdutoCatalogo, ConfigPublica } from '../types';
import { formatCurrency } from '../utils/format';
import { ImageZoomModal } from './ImageZoomModal';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProdutoCatalogo | null;
  onAddToCart: (p: ProdutoCatalogo) => void;
  config: ConfigPublica;
}

export function ProductDetailsModal({ isOpen, onClose, product, onAddToCart, config }: ProductDetailsModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!product) return null;

  const whatsappLink = config.whatsappNumber 
    ? `https://wa.me/${config.whatsappNumber}?text=Olá, tenho uma dúvida sobre o produto: ${product.name}`
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
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full hover:bg-gray-100 text-gray-500 transition-colors shadow-sm backdrop-blur-md"
              >
                <X size={24} />
              </button>

              {/* COLUNA 1: Imagem */}
              <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-6 sm:p-10 relative group/image">
                {product.imageUrl ? (
                  <div 
                    className="relative w-full h-full cursor-zoom-in"
                    onClick={() => setIsZoomed(true)}
                  >
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain max-h-[300px] md:max-h-[400px] drop-shadow-xl transition-transform duration-500 group-hover/image:scale-105" 
                    />
                    <div className="absolute bottom-4 right-4 bg-white/90 p-2.5 rounded-full opacity-0 group-hover/image:opacity-100 transition-all duration-300 shadow-sm backdrop-blur-md text-gray-600 scale-90 group-hover/image:scale-100">
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

              {/* COLUNA 2: Detalhes */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto bg-white custom-scrollbar">
                <div className="mb-6">
                  
                  {/* --- ATUALIZADO: CATEGORIA > SUBCATEGORIA --- */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {product.category || 'Geral'}
                    </span>
                    {product.subcategory && (
                      <>
                        <span className="text-gray-300 text-[10px]">▶</span>
                        <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider" style={{ color: config.primaryColor, backgroundColor: `${config.primaryColor}15` }}>
                          {product.subcategory}
                        </span>
                      </>
                    )}
                  </div>
                  {/* ------------------------------------------- */}

                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2">
                    {product.name}
                  </h2>
                  {product.code && (
                    <p className="text-xs text-gray-400 font-mono">Ref: {product.code}</p>
                  )}
                </div>

                <div className="mb-6 pb-6 border-b border-gray-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Preço Unitário</p>
                  <p className="text-3xl font-extrabold text-gray-900" style={{ color: config.primaryColor }}>
                    {formatCurrency(product.salePrice)}
                  </p>
                </div>

                <div className="mb-8 flex-grow">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    Detalhes do Produto
                  </h3>
                  <div className="prose prose-sm text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                    {product.description || "Sem descrição detalhada para este item."}
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-4 bg-white sticky bottom-0">
                  <button 
                    onClick={() => { onAddToCart(product); onClose(); }}
                    className="w-full py-4 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: config.secondaryColor }}
                  >
                    <ShoppingCart size={20} />
                    ADICIONAR AO CARRINHO
                  </button>
                  
                  {whatsappLink && (
                    <a 
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <MessageCircle size={18} />
                      Tirar dúvida no WhatsApp
                    </a>
                  )}
                </div>
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