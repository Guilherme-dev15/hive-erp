import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { type Order, type OrderStatus } from '../types';
import { getAdminOrders, updateAdminOrderStatus } from '../services/apiService';
import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

// Mapeia os status para ícones e cores (o coração do Kanban)
const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string }> = {
  'Aguardando Pagamento': { icon: <Clock size={16} />, color: 'text-yellow-600' },
  'Em Produção': { icon: <Package size={16} />, color: 'text-blue-600' },
  'Em Separação': { icon: <Package size={16} />, color: 'text-purple-600' }, // Bônus: Status extra
  'Enviado': { icon: <Truck size={16} />, color: 'text-green-600' },
  'Cancelado': { icon: <XCircle size={16} />, color: 'text-red-600' }
};

// Ordem das colunas do Kanban
const statusOrdem: OrderStatus[] = [
  'Aguardando Pagamento',
  'Em Produção',
  'Em Separação',
  'Enviado',
  'Cancelado'
];

// Função Utilitária para formatar Moeda (R$)
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Carrega os pedidos
  useEffect(() => {
    async function carregarPedidos() {
      try {
        setLoading(true);
        setError(null);
        const data = await getAdminOrders();
        setPedidos(data);
      } catch (err) {
        setError("Falha ao carregar pedidos.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarPedidos();
  }, []);

  // Agrupa os pedidos por status
  const pedidosAgrupados = useMemo(() => {
    const grupos: Record<string, Order[]> = {};
    // Inicializa todos os grupos para que a coluna apareça mesmo vazia
    statusOrdem.forEach(status => {
      grupos[status] = [];
    });
    // Preenche os grupos com os pedidos
    pedidos.forEach(pedido => {
      if (grupos[pedido.status]) {
        grupos[pedido.status].push(pedido);
      } else {
        // Fallback para pedidos com status desconhecido
        if (!grupos['Cancelado']) grupos['Cancelado'] = [];
        grupos['Cancelado'].push(pedido);
      }
    });
    return grupos;
  }, [pedidos]);

  // Função para ver detalhes
  const handleVerDetalhes = (pedido: Order) => {
    setPedidoSelecionado(pedido);
    setModalOpen(true);
  };
  
  // Função para mudar o status
  const handleStatusChange = async (pedidoId: string, novoStatus: OrderStatus) => {
    setUpdatingId(pedidoId);
    try {
      const pedidoAtualizado = await updateAdminOrderStatus(pedidoId, novoStatus);
      // Atualiza a lista local
      setPedidos(prevPedidos => 
        prevPedidos.map(p => 
          p.id === pedidoId ? pedidoAtualizado : p
        )
      );
      toast.success(`Pedido #${pedidoId.substring(0, 5)} atualizado!`);
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
        
        {/* Board Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusOrdem.map(status => (
            <div key={status} className="bg-off-white rounded-lg shadow-inner">
              {/* Cabeçalho da Coluna */}
              <div className={`flex items-center gap-2 p-3 border-b-2 ${statusConfig[status].color}`}>
                {statusConfig[status].icon}
                <h2 className={`font-semibold uppercase text-sm ${statusConfig[status].color}`}>
                  {status} ({pedidosAgrupados[status].length})
                </h2>
              </div>
              
              {/* Cartões de Pedido */}
              <div className="p-3 space-y-3 h-full min-h-[200px]">
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
                        Pedido #{pedido.id.substring(0, 5).toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {pedido.createdAt?.seconds ? new Date(pedido.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {pedido.items.length} {pedido.items.length > 1 ? 'itens' : 'item'}
                    </p>
                    <p className="text-lg font-bold text-dourado mb-3">
                      {formatCurrency(pedido.total)}
                    </p>
                    
                    {/* Ações */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleVerDetalhes(pedido)}
                        className="w-full text-sm text-center font-medium text-blue-600 hover:text-blue-800"
                      >
                        Ver Detalhes
                      </button>
                      
                      {updatingId === pedido.id ? (
                        <div className="flex justify-center items-center h-9">
                          <Loader2 className="animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <select
                          value={pedido.status}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value as OrderStatus)}
                          className="w-full text-sm font-medium border border-gray-300 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-dourado"
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

      {/* Modal de Detalhes */}
      <DetalhePedidoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pedido={pedidoSelecionado}
      />
    </>
  );
}