import React from 'react';
import QRCode from 'react-qr-code';
import { type ProdutoAdmin } from '../types';

interface EtiquetaImpressaoProps {
  produtos: ProdutoAdmin[];
  config?: {
    storeName?: string;
  };
}

// Utilitário de formatação (mantido e isolado)
const formatMoney = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// URL do Catálogo (Tenta pegar do ENV, senão usa fallback)
// No Vite use: import.meta.env.VITE_CATALOG_URL
// No Create React App use: process.env.REACT_APP_CATALOG_URL
const CATALOGO_URL = import.meta.env.VITE_CATALOG_URL || 'https://hiveerp-catalogo.vercel.app';

export const EtiquetaImpressao = React.forwardRef<HTMLDivElement, EtiquetaImpressaoProps>(
  ({ produtos, config }, ref) => {
    const lista = Array.isArray(produtos) ? produtos : [];
    const storeName = config?.storeName || 'HivePratas';

    return (
      <div style={{ display: 'none' }}>
        <div ref={ref} className="print-container">
          <style type="text/css" media="print">
            {`
              @page { 
                size: auto; 
                margin: 0mm; 
              }
              body {
                margin: 0;
                padding: 0;
              }
              .print-container {
                background: white;
                width: 100%;
                display: flex;
                flex-wrap: wrap; /* Permite A4 e Rolo */
                justify-content: flex-start;
                align-content: flex-start;
                padding: 2mm; 
                gap: 2mm;
              }
              .etiqueta-wrapper {
                /* Dimensões Padrão de Etiqueta Térmica (ex: 60x40mm) */
                width: 60mm;
                height: 40mm;
                
                /* Estilo */
                border: 1px solid transparent; /* Invisível na impressão */
                display: flex;
                background: white;
                overflow: hidden;
                position: relative;
                
                /* CRUCIAL: Evita quebrar a etiqueta no meio em folhas A4 */
                break-inside: avoid; 
                page-break-inside: avoid;
              }

              /* Ajuste fino para conteúdo interno */
              .etiqueta-content {
                width: 100%;
                height: 100%;
                padding: 3mm;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 1px solid #ddd; /* Borda leve apenas para guia visual */
                border-radius: 4px;
              }

              /* Remove borda na hora de imprimir de verdade se desejar */
              @media print {
                .etiqueta-content {
                  border: none;
                }
              }
            `}
          </style>

          {lista.map((produto, index) => (
            <div key={`${produto.id}-${index}`} className="etiqueta-wrapper">
              <div className="etiqueta-content">
                
                {/* Lado Esquerdo: Informações */}
                <div className="flex flex-col justify-between h-full w-[65%] pr-2">
                  
                  {/* Nome da Loja (Pequeno) */}
                  <span className="text-[8px] uppercase tracking-wider text-gray-500 font-bold mb-1 truncate">
                    {storeName}
                  </span>

                  {/* Nome do Produto (Truncado) */}
                  <div className="leading-tight mb-1">
                    <p className="text-[10px] font-bold text-black line-clamp-2 uppercase">
                      {produto.name || 'Produto sem nome'}
                    </p>
                  </div>

                  {/* Preço (Destaque) */}
                  <div className="mt-auto">
                    <p className="text-[16px] font-extrabold text-black tracking-tight leading-none">
                      {formatMoney(produto.salePrice)}
                    </p>
                    {produto.code && (
                      <p className="text-[8px] font-mono text-gray-600 mt-0.5">
                        REF: {produto.code}
                      </p>
                    )}
                  </div>
                </div>

                {/* Lado Direito: QR Code */}
                <div className="flex flex-col items-center justify-center w-[35%] h-full">
                  <div className="border border-gray-900 p-0.5 bg-white">
                    <QRCode 
                      value={`${CATALOGO_URL}?search=${produto.code || ''}`} 
                      size={56} /* Tamanho fixo para não estourar */
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                      level="M" // Nível médio de correção de erro (melhor para imprimir pequeno)
                    />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

EtiquetaImpressao.displayName = 'EtiquetaImpressao';