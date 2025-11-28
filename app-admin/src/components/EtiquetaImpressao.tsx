import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { type ProdutoAdmin } from '../types';

interface EtiquetaImpressaoProps {
  produtos: ProdutoAdmin[];
}

// Formata moeda
const formatMoney = (value: number) => 
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const EtiquetaImpressao = React.forwardRef<HTMLDivElement, EtiquetaImpressaoProps>(
  ({ produtos }, ref) => {
    return (
      <div style={{ display: 'none' }}> {/* Invisível na tela normal */}
        <div ref={ref} className="p-8 bg-white print-container">
          
          <style type="text/css" media="print">
            {`
              @page { size: A4; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; }
            `}
          </style>

          <div className="text-center mb-6 border-b-2 border-black pb-2">
            <h1 className="text-xl font-bold uppercase">Etiquetas de Stock - HivePratas</h1>
            <p className="text-sm text-gray-600">{new Date().toLocaleDateString()} - {produtos.length} itens</p>
          </div>

          {/* Grid de Etiquetas (Ajustado para folhas tipo Pimaco - 3 ou 4 colunas) */}
          <div className="grid grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <div 
                key={produto.id} 
                className="border border-gray-300 rounded p-2 flex flex-col items-center justify-center text-center h-[140px] break-inside-avoid"
              >
                <p className="text-[10px] font-bold uppercase truncate w-full mb-1">
                  {produto.name}
                </p>
                
                {/* O QR Code aponta para o link do produto no catálogo público (simulação) */}
                <QRCodeSVG 
                  value={`https://hiveerp-catalogo.vercel.app/?search=${produto.code}`} 
                  size={64}
                  level="M" 
                />
                
                <p className="text-xs font-mono mt-1">{produto.code || 'S/C'}</p>
                <p className="text-sm font-bold mt-0.5">{formatMoney(produto.salePrice || 0)}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }
);

EtiquetaImpressao.displayName = 'EtiquetaImpressao';