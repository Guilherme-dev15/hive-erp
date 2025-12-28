/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Ruler, TrendingDown } from 'lucide-react';
import { ProdutoCatalogo, ConfigPublica } from '../types';
import { formatCurrency } from '../utils/format';

interface CardProdutoProps {
  produto: ProdutoCatalogo;
  config: ConfigPublica;
  onAdicionar: () => void;
  onImageClick: () => void;
}

export function CardProduto({ produto, config, onAdicionar, onImageClick }: CardProdutoProps) {
  const stock = produto.quantity ?? 0;
  const temStock = stock > 0;
  // Usa a configuração global de estoque baixo ou 5 como padrão
  const lowStockLimit = config.lowStockThreshold || 5;

  // --- LÓGICA INTELIGENTE DE PREÇO E PROMOÇÃO ---
  const { precoMostrado, precoAntigo, temVariantes, sufixo, temDesconto, percentualDesconto } = useMemo(() => {
    const variantes = produto.variantes || [];
    
    // --- CENÁRIO 1: SEM VARIANTES (PRODUTO SIMPLES) ---
    if (variantes.length === 0) {
      const precoOriginal = Number(produto.salePrice) || 0;
      const precoPromo = Number(produto.promotionalPrice) || 0;
      
      // Verifica se a promoção é válida e ativa
      const isPromo = produto.isOnSale && precoPromo > 0 && precoPromo < precoOriginal;

      return { 
        precoMostrado: isPromo ? precoPromo : precoOriginal,
        precoAntigo: isPromo ? precoOriginal : null,
        temVariantes: false, 
        temDesconto: isPromo,
        percentualDesconto: isPromo ? Math.round(((precoOriginal - precoPromo) / precoOriginal) * 100) : 0,
        sufixo: '' 
      };
    }

    // --- CENÁRIO 2: COM VARIANTES ---
    // (Nota: Promoções globais geralmente afetam o preço base. 
    // Se quiser aplicar em variantes, precisaria refatorar a estrutura de variantes no backend)
    const precosVariantes = variantes
      .map((v: { valor_ajuste: any; }) => Number(v.valor_ajuste))
      .filter((p: number) => p > 0);

    if (precosVariantes.length > 0) {
      const menorPreco = Math.min(...precosVariantes);
      
      // Trava visual para valores muito baixos (ex: peso em gramas cadastrado errado como preço)
      if (menorPreco < 5) {
         return { 
           precoMostrado: Number(produto.salePrice) || 0, 
           precoAntigo: null,
           temVariantes: true, 
           temDesconto: false,
           percentualDesconto: 0,
           sufixo: 'A partir de' 
         };
      }

      return { 
        precoMostrado: menorPreco, 
        precoAntigo: null,
        temVariantes: true, 
        temDesconto: false,
        percentualDesconto: 0,
        sufixo: 'A partir de' 
      };
    }

    // Fallback
    return { 
      precoMostrado: Number(produto.salePrice) || 0, 
      precoAntigo: null,
      temVariantes: true, 
      temDesconto: false,
      percentualDesconto: 0,
      sufixo: 'A partir de' 
    };
  }, [produto]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-50 flex flex-col h-full relative group transition-all duration-300 cursor-pointer"
      onClick={onImageClick}
    >
      {/* IMAGEM */}
      <div className="relative aspect-[1/1.1] bg-gray-100 overflow-hidden">
        {produto.imageUrl ? (
          <img 
            src={produto.imageUrl} 
            alt={produto.name} 
            loading="lazy" 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!temStock ? 'grayscale opacity-70' : ''}`} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Package size={40} strokeWidth={1.5} />
          </div>
        )}
        
        {/* BADGE: PROMOÇÃO (NOVO) */}
        {temDesconto && (
           <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm flex items-center gap-1 animate-pulse">
              <TrendingDown size={12} />
              -{percentualDesconto}%
           </div>
        )}

        {/* BADGE: "X OPÇÕES" */}
        {temVariantes && (
          <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-white/10 uppercase tracking-wider">
            <Ruler size={10} className="text-[#d19900]"/> 
            {produto.variantes?.length} Opções
          </div>
        )}

        {/* BADGE: ESTOQUE */}
        {!temStock ? (
           <span className="absolute top-2 right-2 bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Esgotado</span>
        ) : stock <= lowStockLimit ? (
           <span className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-sm border border-white/20">Últimas {stock}</span>
        ) : null}
      </div>

      {/* CONTEÚDO */}
      <div className="p-3.5 flex flex-col flex-grow justify-between bg-white">
        <div>
          {/* Categoria */}
          <div className="flex items-center gap-1 mb-1.5 flex-wrap opacity-80">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              {produto.category || 'GERAL'}
            </span>
            {produto.subcategory && (
              <>
                <span className="text-[8px] text-gray-300">/</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: config.primaryColor }}>
                  {produto.subcategory}
                </span>
              </>
            )}
          </div>

          <h3 className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug min-h-[2.4em] tracking-tight group-hover:text-black transition-colors">
            {produto.name}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-mono">{produto.code || ''}</p>
        </div>
        
        {/* PREÇO E AÇÃO */}
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-gray-50 pt-3">
          <div className="flex flex-col items-start">
            
            {/* Sufixo "A partir de" se tiver variantes */}
            {temVariantes && (
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">
                {sufixo}
              </span>
            )}

            {/* Preço Antigo (Riscado) - SÓ APARECE SE TIVER DESCONTO */}
            {temDesconto && precoAntigo && (
                <span className="text-[10px] text-gray-400 line-through font-medium leading-none mb-0.5">
                    {formatCurrency(precoAntigo)}
                </span>
            )}

            {/* Preço Final (Com destaque se for promo) */}
            <p className={`text-lg font-black tracking-tight leading-none ${temDesconto ? 'text-red-600' : ''}`} style={!temDesconto ? { color: config.secondaryColor } : {}}>
              {formatCurrency(precoMostrado)}
            </p>
          </div>
          
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (temVariantes) {
                onImageClick(); 
              } else {
                onAdicionar(); 
              }
            }} 
            disabled={!temStock} 
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all active:scale-90 
              ${temStock 
                ? 'hover:brightness-110 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
            `}
            style={temStock ? { backgroundColor: temDesconto ? '#DC2626' : config.primaryColor } : {}} // Botão vermelho se for promo
            title={temVariantes ? "Ver opções" : "Adicionar ao carrinho"}
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}