import React from 'react';
import QRCode from 'react-qr-code'; // Certifique-se de ter instalado: npm install react-qr-code
import { type ProdutoAdmin } from '../types';

interface EtiquetaImpressaoProps {
  produtos: ProdutoAdmin[];
}

// --- FUNÇÃO BLINDADA ---
const formatMoney = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const EtiquetaImpressao = React.forwardRef<HTMLDivElement, EtiquetaImpressaoProps>(
  ({ produtos }, ref) => {
    // Proteção para lista vazia
    const lista = Array.isArray(produtos) ? produtos : [];

    // URL base do catálogo (ajuste conforme seu deploy)
    const CATALOGO_URL = 'https://hiveerp-catalogo.vercel.app'; 

    return (
      <div style={{ display: 'none' }}>
        <div ref={ref} className="p-4 bg-white">
          <style type="text/css" media="print">
            {`
              @page { size: auto; margin: 0mm; }
              .etiqueta-container {
                display: grid;
                grid-template-columns: repeat(3, 1fr); /* 3 por linha, ajuste conforme papel */
                gap: 10px;
                padding: 10px;
              }
              .etiqueta {
                border: 1px dashed #ccc;
                padding: 10px;
                width: 60mm; /* Largura típica */
                height: 40mm; /* Altura típica */
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                page-break-inside: avoid;
              }
            `}
          </style>

          <div className="etiqueta-container">
            {lista.map((produto) => (
              <div key={produto.id} className="etiqueta">
                <div style={{ flex: 1, paddingRight: '5px' }}>
                  <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px', lineHeight: '1.1' }}>
                    {produto.name?.substring(0, 40) || 'Produto'}
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: '900' }}>
                    {formatMoney(produto.salePrice)}
                  </p>
                  <p style={{ fontSize: '8px', fontFamily: 'monospace' }}>
                    {produto.code || 'S/COD'}
                  </p>
                </div>
                
                <div style={{ width: '40px', height: '40px' }}>
                  <QRCode 
                    value={`${CATALOGO_URL}?search=${produto.code || ''}`} 
                    size={40} 
                    level="M"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

EtiquetaImpressao.displayName = 'EtiquetaImpressao';