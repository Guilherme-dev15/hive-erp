import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { type Order, type OrderStatus } from '../types';
// 1. Importar getConfig e o tipo de Configuração
import { getAdminOrders, updateAdminOrderStatus, getConfig } from '../services/apiService';
import { type ConfigFormData } from '../types/schemas';

import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
// 2. Importar ícone ScrollText e o componente CertificadoImpressao
import { Package, Truck, XCircle, Clock, Loader2, ScrollText } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { CertificadoImpressao } from '../components/CertificadoImpressao';

const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string }> = {
  'Aguardando Pagamento': { icon: <Clock size={16} />, color: 'text-yellow-600' },
  'Em Produção': { icon: <Package size={16} />, color: 'text-blue-600' },
  'Em Separação': { icon: <Package size={16} />, color: 'text-purple-600' },
  'Enviado': { icon: <Truck size={16} />, color: 'text-green-600' },
  'Cancelado': { icon: <XCircle size={16} />, color: 'text-red-600' }
};

const statusOrdem: OrderStatus[] = [
  'Aguardando Pagamento',
  'Em Produção',
  'Em Separação',
  'Enviado',
  'Cancelado'
];

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 3. Novos estados para o Certificado
  const [config, setConfig] = useState<ConfigFormData | null>(null);
  const [pedidoParaCertificado, setPedidoParaCertificado] = useState<Order | null>(null);
  const certificadoRef = useRef<HTMLDivElement>(null);

  // 4. Função de Impressão
  const handlePrintCertificado = useReactToPrint({
    contentRef: certificadoRef,
    documentTitle: 'Certificado_Garantia',
  });

  // 5. Função auxiliar para preparar e imprimir
  const prepararEImprimirCertificado = (pedido: Order) => {
    setPedidoParaCertificado(pedido);
    // Pequeno delay para o React renderizar o componente com os dados certos
    setTimeout(() => {
      handlePrintCertificado();
    }, 100);
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setError(null);
        // 6. Carrega Pedidos E Configuração
        const [pedidosData, configData] = await Promise.all([
           getAdminOrders(),
           getConfig()
        ]);
        setPedidos(pedidosData);
        setConfig(configData);
      } catch (err) {
        setError("Falha ao carregar dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  const pedidosAgrupados = useMemo(() => {
    const grupos: Record<string, Order[]> = {};
    statusOrdem.forEach(status => { grupos[status] = []; });
    pedidos.forEach(pedido => {
      if (grupos[pedido.status]) {
        grupos[pedido.status].push(pedido);
      } else {
        if (!grupos['Cancelado']) grupos['Cancelado'] = [];
        grupos['Cancelado'].push(pedido);
      }
    });
    return grupos;
  }, [pedidos]);

  const handleVerDetalhes = (pedido: Order) => {
    setPedidoSelecionado(pedido);
    setModalOpen(true);
  };
  
  const handleStatusChange = async (pedidoId: string, novoStatus: OrderStatus) => {
    setUpdatingId(pedidoId);
    try {
      const pedidoAtualizado = await updateAdminOrderStatus(pedidoId, novoStatus);
      setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? pedidoAtualizado : p));
      toast.success(`Pedido atualizado!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div>A carregar pedidos...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-carvao"
        >
          Gestão de Pedidos (Kanban)
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusOrdem.map(status => (
            <div key={status} className="bg-off-white rounded-lg shadow-inner h-fit max-h-[calc(100vh-200px)] flex flex-col">
              <div className={`flex items-center gap-2 p-3 border-b-2 ${statusConfig[status].color}`}>
                {statusConfig[status].icon}
                <h2 className={`font-semibold uppercase text-sm ${statusConfig[status].color}`}>
                  {status} ({pedidosAgrupados[status].length})
                </h2>
              </div>
              
              <div className="p-3 space-y-3 overflow-y-auto">
                {pedidosAgrupados[status].map(pedido => (
                  <motion.div 
                    key={pedido.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-3 rounded-lg shadow border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-carvao">
                        #{pedido.id.substring(0, 5).toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {pedido.clienteNome ? pedido.clienteNome.split(' ')[0] : 'Cliente'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {pedido.items.length} {pedido.items.length > 1 ? 'itens' : 'item'}
                    </p>
                    <p className="text-lg font-bold text-dourado mb-3">
                      {formatCurrency(pedido.total)}
                    </p>
                    
                    <div className="space-y-2">
                      {/* 7. Botão de Certificado (Novo) */}
                      <button
                        onClick={() => prepararEImprimirCertificado(pedido)}
                        className="w-full text-xs text-center font-medium text-emerald-600 hover:text-emerald-800 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 rounded hover:bg-emerald-100 transition-colors border border-emerald-100"
                        title="Imprimir Garantia"
                      >
                        <ScrollText size={14} /> Certificado
                      </button>

                      <button
                        onClick={() => handleVerDetalhes(pedido)}
                        className="w-full text-xs text-center font-medium text-blue-600 hover:text-blue-800 border border-blue-100 py-1.5 rounded hover:bg-blue-50 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                      
                      {updatingId === pedido.id ? (
                        <div className="flex justify-center items-center h-8">
                          <Loader2 className="animate-spin text-gray-400" size={16} />
                        </div>
                      ) : (
                        <select
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value as OrderStatus)}
                          className="w-full text-xs font-medium border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-dourado bg-gray-50"
                        >
                          {statusOrdem.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetalhePedidoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pedido={pedidoSelecionado}
      />

      {/* 8. Componente Invisível de Impressão */}
      <CertificadoImpressao 
        ref={certificadoRef} 
        pedido={pedidoParaCertificado} 
        config={config} 
      />
    </>
  );
}