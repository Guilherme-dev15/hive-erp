import React from 'react';
import { type ProdutoAdmin } from '../types';
import { type ConfigFormData } from '../types/schemas';

interface CatalogoImpressaoProps {
  produtos: ProdutoAdmin[];
  config: ConfigFormData | null;
}

// --- CORREÇÃO: Função Blindada contra Erros ---
const formatMoney = (value: number | undefined | null) => {
  // Se for inválido, retorna R$ 0,00 e não quebra o sistema
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'R$ 0,00';
  }
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const CatalogoImpressao = React.forwardRef<HTMLDivElement, CatalogoImpressaoProps>(
  ({ produtos, config }, ref) => {
    // Proteção extra: se a lista de produtos for nula/indefinida
    const listaSegura = Array.isArray(produtos) ? produtos : [];

    return (
      <div style={{ display: 'none' }}>
        <div ref={ref} className="p-10 bg-white font-sans text-gray-800">
          
          <style type="text/css" media="print">
            {`
              @page { size: A4; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; }
              .page-break { page-break-inside: avoid; }
            `}
          </style>

          {/* Cabeçalho */}
          <div className="text-center border-b-4 pb-6 mb-8" style={{ borderColor: config?.primaryColor || '#000' }}>
            <h1 className="text-4xl font-bold uppercase tracking-widest text-gray-900">
              {config?.storeName || 'Catálogo de Produtos'}
            </h1>
            {config?.whatsappNumber && (
              <p className="text-xl text-gray-600 mt-2 font-medium">
                Faça seu pedido: +{config.whatsappNumber}
              </p>
            )}
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-2 gap-8">
            {listaSegura.map((produto) => (
              <div 
                key={produto.id} 
                className="page-break border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-between shadow-sm"
              >
                {/* Imagem */}
                <div className="w-full h-64 mb-4 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                  {produto.imageUrl ? (
                    <img 
                      src={produto.imageUrl} 
                      alt={produto.name} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-300 font-bold text-xl">SEM FOTO</span>
                  )}
                </div>

                {/* Detalhes */}
                <div className="text-center w-full">
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-1 h-14 flex items-center justify-center">
                    {produto.name || 'Produto sem nome'}
                  </h2>
                  
                  <p className="text-xs text-gray-500 font-mono mb-3">Ref: {produto.code || 'N/A'}</p>
                  
                  {/* Preço */}
                  <div 
                    className="py-2 px-6 rounded-full inline-block font-bold text-xl text-white"
                    style={{ backgroundColor: config?.primaryColor || '#000' }}
                  >
                    {formatMoney(produto.salePrice)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div className="mt-12 text-center text-sm text-gray-400 border-t pt-4">
            <p>Preços e disponibilidade sujeitos a alteração sem aviso prévio.</p>
          </div>

        </div>
      </div>
    );
  }
);

CatalogoImpressao.displayName = 'CatalogoImpressao';