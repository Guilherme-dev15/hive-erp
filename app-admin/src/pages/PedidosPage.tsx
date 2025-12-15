import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { type Order, type OrderStatus, type FirestoreDate } from '../types';
import { getAdminOrders, updateAdminOrderStatus, getConfig, deleteAdminOrder } from '../services/apiService';
import { type ConfigFormData } from '../types/schemas';

import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { 
  Package, Truck, Clock, Loader2, ScrollText, 
  Search, Calendar, LayoutGrid, List as ListIcon, XCircle, Trash2
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { CertificadoImpressao } from '../components/CertificadoImpressao';

// --- CONFIGURAÇÃO VISUAL ---
const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string; bg: string }> = {
  'Aguardando Pagamento': { icon: <Clock size={16} />, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  'Em Produção': { icon: <Package size={16} />, color: 'text-blue-700', bg: 'bg-blue-50' },
  'Em Separação': { icon: <Package size={16} />, color: 'text-purple-700', bg: 'bg-purple-50' },
  'Enviado': { icon: <Truck size={16} />, color: 'text-green-700', bg: 'bg-green-50' },
  'Cancelado': { icon: <XCircle size={16} />, color: 'text-red-700', bg: 'bg-red-50' },
  'Concluído': { icon: <Package size={16} />, color: 'text-emerald-700', bg: 'bg-emerald-50' }
};

const statusOrdem: OrderStatus[] = [
  'Aguardando Pagamento',
  'Em Produção',
  'Em Separação',
  'Enviado',
  'Cancelado'
];

// --- FUNÇÕES AUXILIARES SEGURAS (CORREÇÃO DOS ERROS DE TIPO) ---

// 1. Extrai segundos independente do formato (Timestamp, Date ou String)
const getDateSeconds = (date: FirestoreDate | undefined): number => {
  if (!date) return 0;
  // Se for objeto do Firestore { seconds: ... }
  if (typeof date === 'object' && 'seconds' in date) {
    return date.seconds;
  }
  // Se for Date do JS
  if (date instanceof Date) {
    return Math.floor(date.getTime() / 1000);
  }
  // Se for String ISO
  if (typeof date === 'string') {
    return Math.floor(new Date(date).getTime() / 1000);
  }
  return 0;
};

// 2. Formata para exibir na tela
const formatDate = (date: FirestoreDate | undefined): string => {
  if (!date) return '-';
  try {
    const seconds = getDateSeconds(date);
    if (seconds === 0) return '-';
    return new Date(seconds * 1000).toLocaleDateString('pt-BR');
  } catch (e) {
    return '-';
  }
};

const formatCurrency = (value: any): string => {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 'R$ 0,00';
  }
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTE PRINCIPAL ---
export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');

  const [config, setConfig] = useState<ConfigFormData | null>(null);
  const [pedidoParaCertificado, setPedidoParaCertificado] = useState<Order | null>(null);
  const certificadoRef = useRef<HTMLDivElement>(null);

  const handlePrintCertificado = useReactToPrint({
    contentRef: certificadoRef,
    documentTitle: 'Certificado_Garantia',
  });

  const prepararEImprimirCertificado = (pedido: Order) => {
    if (!pedido) return;
    setPedidoParaCertificado(pedido);
    setTimeout(() => {
      handlePrintCertificado();
    }, 200);
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        setError(null);
        const [pedidosData, configData] = await Promise.all([
           getAdminOrders(),
           getConfig()
        ]);

        const pedidosLimpos = pedidosData.filter((p: any) => p && p.id);
        
        // CORREÇÃO: Usando a função auxiliar getDateSeconds para ordenar
        const sortedPedidos = pedidosLimpos.sort((a: Order, b: Order) => {
            const dateA = getDateSeconds(a.createdAt);
            const dateB = getDateSeconds(b.createdAt);
            return dateB - dateA;
        });

        setPedidos(sortedPedidos);

        if (configData) {
            setConfig({
                ...configData,
                warrantyText: configData.warrantyText || '',
                lowStockThreshold: configData.lowStockThreshold || 5
            });
        }

      } catch (err) {
        setError("Falha ao carregar dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido permanentemente?")) return;
    
    try {
        setPedidos(prev => prev.filter(p => p.id !== id)); // Otimista
        await deleteAdminOrder(id);
        toast.success("Pedido excluído!");
    } catch (error) {
        toast.error("Erro ao excluir. Tente novamente.");
        const dados = await getAdminOrders();
        setPedidos(dados);
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      const termo = searchTerm.toLowerCase();
      
      const id = pedido.id ? pedido.id.toLowerCase() : '';
      const nome = pedido.customerName ? pedido.customerName.toLowerCase() : '';
      const tel = pedido.customerPhone || '';

      const matchText = id.includes(termo) || nome.includes(termo) || tel.includes(termo);

      if (!matchText) return false;

      if (dateFilter !== 'all') {
        // CORREÇÃO: Usando a função auxiliar getDateSeconds para filtrar
        const segundos = getDateSeconds(pedido.createdAt);
        if (!segundos) return false;
        
        const dataPedido = new Date(segundos * 1000);
        const diasAtras = (new Date().getTime() - dataPedido.getTime()) / (1000 * 3600 * 24);
        
        if (dateFilter === '7days' && diasAtras > 7) return false;
        if (dateFilter === '30days' && diasAtras > 30) return false;
      }

      return true;
    });
  }, [pedidos, searchTerm, dateFilter]);

  const pedidosAgrupados = useMemo(() => {
    const grupos: Record<string, Order[]> = {};
    statusOrdem.forEach(status => { grupos[status] = []; });
    
    pedidosFiltrados.forEach(pedido => {
      const statusSeguro = pedido.status || 'Aguardando Pagamento';
      if (grupos[statusSeguro]) {
        grupos[statusSeguro].push(pedido);
      } else {
        if (!grupos['Cancelado']) grupos['Cancelado'] = [];
        grupos['Cancelado'].push(pedido);
      }
    });
    return grupos;
  }, [pedidosFiltrados]);

  const handleVerDetalhes = (pedido: Order) => {
    setPedidoSelecionado(pedido);
    setModalOpen(true);
  };
  
  const handleStatusChange = async (pedidoId: string, novoStatus: OrderStatus) => {
    setUpdatingId(pedidoId);
    try {
      const pedidoAtualizado = await updateAdminOrderStatus(pedidoId, novoStatus);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? pedidoAtualizado : p));
      toast.success(`Pedido atualizado!`);
    } catch (err) {
      toast.error("Erro ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-dourado" /></div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6 pb-10">
        
        {/* --- BARRA DE CONTROLE --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-carvao">Gestão de Pedidos</h1>
            <p className="text-xs text-gray-500">{pedidosFiltrados.length} pedidos encontrados</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar ID, Nome ou Tel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm"
              />
            </div>

            <div className="relative">
               <select 
                 value={dateFilter}
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 onChange={(e) => setDateFilter(e.target.value as any)}
                 className="appearance-none w-full sm:w-auto pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado text-sm bg-white cursor-pointer"
               >
                 <option value="all">Todo o Período</option>
                 <option value="7days">Últimos 7 dias</option>
                 <option value="30days">Últimos 30 dias</option>
               </select>
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow text-carvao' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-carvao' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* --- MODO KANBAN --- */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {statusOrdem.map(status => (
              <div key={status} className="bg-off-white rounded-lg shadow-inner h-fit max-h-[calc(100vh-220px)] flex flex-col min-w-[250px]">
                <div className={`flex items-center gap-2 p-3 border-b-2 ${statusConfig[status].color} ${statusConfig[status].bg} rounded-t-lg sticky top-0 z-10`}>
                  {statusConfig[status].icon}
                  <h2 className={`font-bold uppercase text-xs ${statusConfig[status].color}`}>
                    {status} ({pedidosAgrupados[status].length})
                  </h2>
                </div>
                
                <div className="p-2 space-y-2 overflow-y-auto custom-scrollbar">
                  {pedidosAgrupados[status].map(pedido => (
                    <motion.div 
                      key={pedido.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-carvao text-sm">
                          #{pedido.id.substring(0, 5).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(pedido.createdAt)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2 truncate">
                        {pedido.customerName || 'Cliente s/ nome'}
                      </div>

                      <div className="flex justify-between items-end mb-3">
                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                          {pedido.items ? pedido.items.length : 0} itens
                        </span>
                        <span className="font-bold text-dourado text-sm">
                          {formatCurrency(pedido.total)}
                        </span>
                      </div>
                      
                      {/* BOTÕES DE AÇÃO (KANBAN) */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => prepararEImprimirCertificado(pedido)}
                          title="Imprimir Certificado"
                          className="flex items-center justify-center py-1 text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 border border-emerald-200"
                        >
                          <ScrollText size={14} />
                        </button>

                        <button
                          onClick={() => handleVerDetalhes(pedido)}
                          title="Ver Detalhes"
                          className="flex items-center justify-center py-1 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 border border-blue-200"
                        >
                          <Search size={14} />
                        </button>

                        <button
                          onClick={() => handleDelete(pedido.id)}
                          title="Excluir Pedido"
                          className="flex items-center justify-center py-1 text-red-700 bg-red-50 rounded hover:bg-red-100 border border-red-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-100">
                          {updatingId === pedido.id ? (
                             <div className="flex justify-center"><Loader2 className="animate-spin text-gray-400" size={14}/></div>
                          ) : (
                             <select
                               value={pedido.status || 'Aguardando Pagamento'}
                               onChange={(e) => handleStatusChange(pedido.id, e.target.value as OrderStatus)}
                               className="w-full text-[10px] font-medium border-none bg-transparent text-gray-500 focus:ring-0 cursor-pointer text-center hover:text-carvao"
                             >
                               {statusOrdem.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- MODO LISTA --- */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3 text-center">Itens</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidosFiltrados.map(pedido => (
                    <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-gray-700">#{pedido.id.substring(0, 5).toUpperCase()}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(pedido.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{pedido.customerName || 'S/ Nome'}</p>
                        <p className="text-xs text-gray-400">{pedido.customerPhone || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{pedido.items ? pedido.items.length : 0}</td>
                      <td className="px-4 py-3 text-right font-bold text-dourado">{formatCurrency(pedido.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={pedido.status || 'Aguardando Pagamento'}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-2 py-1 rounded-full border-none cursor-pointer focus:ring-0 ${statusConfig[pedido.status || 'Aguardando Pagamento'].bg} ${statusConfig[pedido.status || 'Aguardando Pagamento'].color}`}
                        >
                          {statusOrdem.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      
                      {/* AÇÕES DA LISTA */}
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => prepararEImprimirCertificado(pedido)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Certificado">
                          <ScrollText size={16} />
                        </button>
                        <button onClick={() => handleVerDetalhes(pedido)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ver Detalhes">
                          <Search size={16} />
                        </button>
                        <button onClick={() => handleDelete(pedido.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pedidosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">Nenhum pedido encontrado com estes filtros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <DetalhePedidoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pedido={pedidoSelecionado}
      />

      <CertificadoImpressao 
        ref={certificadoRef} 
        pedido={pedidoParaCertificado} 
        config={config} 
      />
    </>
  );
}