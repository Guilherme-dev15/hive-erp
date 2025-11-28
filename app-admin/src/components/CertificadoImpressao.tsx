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
        <div ref={ref} className="print-container p-8 font-serif text-carvao">
          
          <style type="text/css" media="print">
            {`
              @page { size: A5 landscape; margin: 0; } /* Define tamanho A5 Paisagem */
              body { -webkit-print-color-adjust: exact; }
              .certificado-border {
                 border: 2px solid ${config.primaryColor || '#D4AF37'};
                 padding: 20px;
                 height: 100%;
                 position: relative;
              }
            `}
          </style>

          {/* Borda Decorativa */}
          <div className="certificado-border h-[130mm] flex flex-col justify-between bg-white">
            
            {/* Cabeçalho */}
            <div className="text-center border-b pb-4" style={{ borderColor: config.primaryColor }}>
              <h1 className="text-3xl font-bold uppercase tracking-widest" style={{ color: config.secondaryColor }}>
                {config.storeName || 'Certificado'}
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Certificado de Autenticidade e Garantia</p>
            </div>

            {/* Corpo */}
            <div className="py-4 px-8 text-center flex-grow flex flex-col justify-center">
              <p className="text-sm italic text-gray-600 mb-4">Certificamos que as joias abaixo pertencem a:</p>
              
              <h2 className="text-2xl font-bold mb-6 capitalize">{pedido.clienteNome}</h2>

              <div className="text-left bg-gray-50 p-4 rounded border border-gray-100 mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Peças Adquiridas:</p>
                <ul className="text-sm space-y-1">
                  {pedido.items.map((item: OrderLineItem) => (
                    <li key={item.id} className="flex justify-between">
                      <span>• {item.name}</span>
                      <span className="text-gray-400 text-xs">{item.code}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <p className="text-xs text-justify text-gray-500 leading-relaxed">
                <span className="font-bold">Termos de Garantia: </span>
                {config.warrantyText}
              </p>
            </div>

            {/* Rodapé */}
            <div className="flex justify-between items-end border-t pt-4 mt-4" style={{ borderColor: config.primaryColor }}>
              <div className="text-left">
                <p className="text-xs text-gray-400">Data da Compra</p>
                <p className="font-bold">{dataCompra}</p>
              </div>
              
              <div className="text-right">
                {config.whatsappNumber && (
                   <p className="text-xs text-gray-400">Suporte: +{config.whatsappNumber}</p>
                )}
                <p className="text-xs font-bold" style={{ color: config.primaryColor }}>www.sua-loja.com</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

CertificadoImpressao.displayName = 'CertificadoImpressao';