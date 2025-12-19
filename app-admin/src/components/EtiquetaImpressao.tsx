import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import { type ProdutoAdmin } from '../types';

interface EtiquetaImpressaoProps {
  produtos: ProdutoAdmin[];
  config?: {
    storeName?: string;
  };
}

export const EtiquetaImpressao = forwardRef<HTMLDivElement, EtiquetaImpressaoProps>(
  ({ produtos, config }, ref) => {
    
    // 🔥 URL DE PRODUÇÃO FIXA
    // Isso garante que a etiqueta funcione sempre, não importa de onde foi impressa
    const baseUrl = 'https://hive-erp.vercel.app';

    return (
      <div style={{ display: 'none' }}> {/* Oculto na tela, visível na impressão */}
        <div ref={ref} className="w-full bg-white p-4">
          <style type="text/css" media="print">
            {`
              @page { size: auto; margin: 0mm; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              .page-break { page-break-after: always; }
            `}
          </style>

          {/* GRID DE ETIQUETAS */}
          <div className="grid grid-cols-3 gap-4">
            {produtos.map((produto) => {
              // Gera o link direto para a busca no Admin de Produção
              const adminUrl = `${baseUrl}/admin/produtos?q=${produto.code}`;

              return (
                <div 
                  key={produto.id} 
                  className="border border-gray-300 rounded-lg p-3 flex flex-col items-center justify-center text-center h-[40mm] overflow-hidden relative break-inside-avoid"
                >
                  {/* Nome da Loja */}
                  <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                    {config?.storeName || 'HIVE ERP'}
                  </div>

                  <div className="flex flex-row items-center gap-3 w-full justify-between px-2">
                    
                    {/* QR Code apontando para Produção */}
                    <div className="bg-white p-1">
                      <QRCode 
                        value={adminUrl} 
                        size={64} 
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    </div>

                    {/* Dados do Produto */}
                    <div className="flex flex-col items-end text-right flex-1">
                      <h3 className="text-[10px] font-bold text-black leading-tight line-clamp-2 max-w-[120px] mb-1">
                        {produto.name}
                      </h3>
                      
                      <div className="text-[8px] font-mono text-gray-600 mb-1">
                        SKU: {produto.code}
                      </div>

                      <div className="text-sm font-black text-black">
                        R$ {Number(produto.salePrice).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Decorativo (Cinza Escuro para impressão nítida) */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#4a4a4a]"></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

EtiquetaImpressao.displayName = 'EtiquetaImpressao';