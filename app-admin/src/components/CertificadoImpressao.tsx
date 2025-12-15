import { forwardRef } from 'react';
import { type Order } from '../types';
import { type ConfigFormData } from '../types/schemas';

interface CertificadoProps {
  pedido: Order | null;
  config: ConfigFormData | null;
}

// Utilitário de Data
const formatDate = (timestamp: any) => {
  if (!timestamp) return new Date().toLocaleDateString('pt-BR');
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
  return new Date(timestamp).toLocaleDateString('pt-BR');
};

export const CertificadoImpressao = forwardRef<HTMLDivElement, CertificadoProps>(
  ({ pedido, config }, ref) => {
    if (!pedido) return null;

    // Cores e Configurações (com fallbacks)
    const primaryColor = config?.primaryColor || '#D4AF37';
    const storeName = config?.storeName || 'HivePratas';
    const warrantyText = config?.warrantyText || 'Garantia de 90 dias contra defeitos de fabricação.';
    const whatsApp = config?.whatsappNumber || '';

    return (
      <div style={{ display: 'none' }}>
        <div ref={ref} className="p-8 font-sans text-gray-800" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Borda Decorativa */}
          <div className="border-8 border-double p-8 h-full relative" style={{ borderColor: primaryColor }}>
            
            {/* Cabeçalho */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                Certificado de Garantia
              </h1>
              <p className="text-sm uppercase tracking-widest text-gray-500">Autenticidade & Qualidade</p>
            </div>

            {/* Conteúdo Principal */}
            <div className="text-center space-y-6 mb-8">
              <p className="text-lg">
                Certificamos que as joias adquiridas por 
                <strong className="block text-xl mt-2 mb-2 font-serif">{pedido.customerName || 'Cliente Especial'}</strong>
                são confeccionadas em <strong>Prata 925</strong> legítima e possuem garantia vitalícia quanto à autenticidade do metal.
              </p>

              {/* Detalhes do Pedido */}
              <div className="py-4 border-t border-b border-gray-100 w-3/4 mx-auto">
                <p className="text-sm text-gray-500 mb-2">Detalhes da Compra</p>
                <div className="flex justify-between font-bold text-sm mb-1">
                  <span>Pedido:</span>
                  <span>#{pedido.id.substring(0, 5).toUpperCase()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Data:</span>
                  <span>{formatDate(pedido.createdAt)}</span>
                </div>
              </div>

              {/* Lista de Itens (Resumida) */}
              <div className="text-left bg-gray-50 p-4 rounded-lg text-sm w-3/4 mx-auto">
                <p className="font-bold text-center mb-2 text-gray-400 text-xs uppercase">Itens Cobertos</p>
                <ul className="space-y-1">
                  {pedido.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                      <span>{item.quantidade}x {item.name}</span>
                      {item.code && <span className="text-gray-400 font-mono text-xs">{item.code}</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Texto da Garantia (Configurável) */}
              <div className="text-xs text-gray-500 leading-relaxed italic px-8">
                "{warrantyText}"
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center mt-12 pt-4 border-t border-gray-200">
              <h2 className="font-bold text-lg mb-1" style={{ color: primaryColor }}>{storeName}</h2>
              {whatsApp && <p className="text-sm text-gray-400">WhatsApp: {whatsApp}</p>}
              <p className="text-xs text-gray-300 mt-4">Documento emitido eletronicamente.</p>
            </div>

          </div>
        </div>
      </div>
    );
  }
);

CertificadoImpressao.displayName = 'CertificadoImpressao';