 
import { motion } from 'framer-motion';
import { Package, Plus } from 'lucide-react';
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
  
  // Lógica para descrição curta
  const descResumida = produto.description 
    ? (produto.description.length > 60 ? produto.description.substring(0, 60) + '...' : produto.description)
    : '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "50px" }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-50 flex flex-col h-full relative group transition-all duration-300 cursor-pointer"
      onClick={onImageClick}
    >
      {/* Imagem */}
      <div className="relative aspect-[1/1.1] bg-gray-100 overflow-hidden">
        {produto.imageUrl ? (
          <img 
            src={produto.imageUrl} 
            alt={produto.name} 
            loading="lazy" 
            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!temStock ? 'grayscale opacity-70' : ''}`} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"><Package size={40} strokeWidth={1.5} /></div>
        )}
        
        {!temStock && (
           <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border border-white/10">ESGOTADO</span>
        )}
        {temStock && stock <= 3 && (
           <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg border border-red-400">Últimos {stock}</span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3.5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-[13px] font-semibold text-gray-800 line-clamp-2 leading-relaxed min-h-[2.5em] tracking-tight group-hover:text-black transition-colors" title={produto.name}>
            {produto.name}
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-wide">{produto.code || ''}</p>
          
          {descResumida && (
            <p className="mt-1 text-[11px] text-gray-400 leading-tight line-clamp-2">
              {descResumida} 
              {/* Opcional: Se quiser um "ver mais" colorido no card, descomente abaixo */}
              {/* <span style={{ color: config.primaryColor }} className="font-bold ml-1 text-[10px]">Ver</span> */}
            </p>
          )}
        </div>
        
        <div className="mt-3 flex items-end justify-between">
          {/* COR DO PREÇO (SecondaryColor) */}
          <p className="text-lg font-extrabold tracking-tight" style={{ color: config.secondaryColor }}>
            {formatCurrency(produto.salePrice)}
          </p>
          
          {/* COR DO BOTÃO (PrimaryColor) */}
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onAdicionar(); 
            }} 
            disabled={!temStock} 
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 hover:brightness-110 ${temStock ? 'text-white shadow-lg shadow-black/10' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
            // AQUI ESTÁ A MÁGICA DA COR:
            style={temStock ? { backgroundColor: config.primaryColor } : {}}
            title={temStock ? "Adicionar ao Carrinho" : "Sem Estoque"}
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}