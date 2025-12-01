import React from 'react';
import { type Order, type OrderLineItem } from '../types';
import { type ConfigFormData } from '../types/schemas';

interface CertificadoImpressaoProps {
  pedido: Order | null;
  config: ConfigFormData | null;
}

export const CertificadoImpressao = React.forwardRef<HTMLDivElement, CertificadoImpressaoProps>(
  ({ pedido, config }, ref) => {
    if (!pedido || !config) return null;

    const dataCompra = pedido.createdAt?.seconds 
      ? new Date(pedido.createdAt.seconds * 1000).toLocaleDateString('pt-BR') 
      : new Date().toLocaleDateString('pt-BR');

    return (
      <div style={{ display: 'none' }}>
        <div ref={ref} className="print-container p-8 font-serif text-gray-800">
          
          <style type="text/css" media="print">
            {`
              @page { size: A5 landscape; margin: 0; } /* Tamanho ideal para caixas */
              body { -webkit-print-color-adjust: exact; }
              .certificado-border {
                 border: 4px double ${config.primaryColor || '#D4AF37'};
                 padding: 30px;
                 height: 100%;
                 display: flex;
                 flex-direction: column;
                 justify-content: space-between;
                 background-color: #fff;
              }
            `}
          </style>

          <div className="certificado-border h-[148mm]"> {/* Altura A5 */}
            
            {/* Cabeçalho */}
            <div className="text-center border-b-2 pb-4" style={{ borderColor: config.primaryColor }}>
              <h1 className="text-4xl font-bold uppercase tracking-widest" style={{ color: config.secondaryColor }}>
                {config.storeName || 'Certificado'}
              </h1>
              <p className="text-xs uppercase tracking-[0.3em] mt-2 text-gray-500">Certificado de Autenticidade & Garantia</p>
            </div>

            {/* Corpo */}
            <div className="flex-grow flex flex-col justify-center py-4">
              <p className="text-center italic text-gray-600 mb-2">Este documento certifica que as joias abaixo pertencem a:</p>
              <h2 className="text-2xl font-bold text-center mb-6 capitalize">{pedido.clienteNome}</h2>

              <div className="bg-gray-50 p-4 rounded border border-gray-100 mb-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Peças Adquiridas:</p>
                <ul className="text-sm space-y-1">
                  {pedido.items.map((item: OrderLineItem) => (
                    <li key={item.id} className="flex justify-between border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                      <span>• {item.name}</span>
                      <span className="text-gray-400 text-xs font-mono">{item.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="text-xs text-justify text-gray-500 leading-relaxed px-2">
                <span className="font-bold text-gray-700">Termos de Garantia: </span>
                {config.warrantyText}
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex justify-between items-end border-t pt-2" style={{ borderColor: config.primaryColor }}>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Data</p>
                <p className="font-bold text-sm">{dataCompra}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] text-gray-400 uppercase">Autenticado por</p>
                 <p className="font-bold text-sm" style={{ color: config.secondaryColor }}>{config.storeName}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

CertificadoImpressao.displayName = 'CertificadoImpressao';