/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { type Order, type OrderStatus, type FirestoreDate } from '../types';
import { getAdminOrders, updateAdminOrderStatus, getConfig, deleteAdminOrder } from '../services/apiService';
import { type ConfigFormData } from '../types/schemas';

import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { 
  Package, Truck, Clock, Loader2, ScrollText, 
  Search, Calendar, LayoutGrid, List as ListIcon, XCircle, Trash2,
  DollarSign, Filter, CheckCircle2} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { CertificadoImpressao } from '../components/CertificadoImpressao';

// --- CONFIGURAÇÃO VISUAL (CORES E ÍCONES) ---
const statusConfig: Record<OrderStatus, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Aguardando Pagamento': { icon: <Clock size={14} />, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  'Em Produção': { icon: <Package size={14} />, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Em Separação': { icon: <Package size={14} />, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Enviado': { icon: <Truck size={14} />, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'Concluído': { icon: <CheckCircle2 size={14} />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Cancelado': { icon: <XCircle size={14} />, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

const statusOrdem: OrderStatus[] = [
  'Aguardando Pagamento', 'Em Produção', 'Em Separação', 'Enviado', 'Concluído', 'Cancelado'
];

// --- FUNÇÕES AUXILIARES ---
const getDateSeconds = (date: FirestoreDate | undefined): number => {
  if (!date) return 0;
  if (typeof date === 'object' && 'seconds' in date) return date.seconds;
  if (date instanceof Date) return Math.floor(date.getTime() / 1000);
  if (typeof date === 'string') return Math.floor(new Date(date).getTime() / 1000);
  return 0;
};

const formatDate = (date: FirestoreDate | undefined): string => {
  if (!date) return '-';
  try {
    const seconds = getDateSeconds(date);
    if (seconds === 0) return '-';
    return new Date(seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '-'; }
};

const formatCurrency = (value: any): string => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTE DE ESTATÍSTICA (KPI) ---
function StatCard({ title, value, icon, sub, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.cloneElement(icon, { className: color.replace('bg-', 'text-') })}
      </div>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI States
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list'); 
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos'); 
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');

  // Config & Print
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
    setTimeout(() => { handlePrintCertificado(); }, 200);
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const [pedidosData, configData] = await Promise.all([getAdminOrders(), getConfig()]);
        
        const pedidosLimpos = pedidosData.filter((p: any) => p && p.id);
        const sortedPedidos = pedidosLimpos.sort((a: Order, b: Order) => {
           return getDateSeconds(b.createdAt) - getDateSeconds(a.createdAt);
        });

        setPedidos(sortedPedidos);
        if (configData) setConfig({ ...configData, warrantyText: configData.warrantyText || '', lowStockThreshold: configData.lowStockThreshold || 5 });

      } catch (err) {
        setError("Falha ao carregar dados.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // --- DELETE ---
  const handleDelete = async (id: string) => {
    if (!confirm("Essa ação é irreversível. Deseja excluir este pedido?")) return;
    const backup = [...pedidos];
    setPedidos(prev => prev.filter(p => p.id !== id)); 
    try {
        await deleteAdminOrder(id);
        toast.success("Pedido excluído!");
    } catch (error) {
        setPedidos(backup);
        toast.error("Erro ao excluir.");
    }
  };

  // --- FILTROS AVANÇADOS ---
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      const termo = searchTerm.toLowerCase();
      const matchText = (pedido.id?.toLowerCase().includes(termo) || 
                         pedido.customerName?.toLowerCase().includes(termo) || 
                         pedido.customerPhone?.includes(termo));
      if (!matchText) return false;

      if (statusFilter !== 'Todos' && pedido.status !== statusFilter) return false;

      if (dateFilter !== 'all') {
        const segundos = getDateSeconds(pedido.createdAt);
        if (!segundos) return false;
        const diasAtras = (new Date().getTime() - (segundos * 1000)) / (1000 * 3600 * 24);
        if (dateFilter === '7days' && diasAtras > 7) return false;
        if (dateFilter === '30days' && diasAtras > 30) return false;
      }
      return true;
    });
  }, [pedidos, searchTerm, dateFilter, statusFilter]);

  // --- ESTATÍSTICAS (KPIs) ---
  const stats = useMemo(() => {
    const totalVendas = pedidos.reduce((acc, p) => p.status !== 'Cancelado' ? acc + (p.total || 0) : acc, 0);
    const pendentes = pedidos.filter(p => p.status === 'Aguardando Pagamento' || p.status === 'Em Produção').length;
    const concluidos = pedidos.filter(p => p.status === 'Concluído' || p.status === 'Enviado').length;
    return { totalVendas, pendentes, concluidos };
  }, [pedidos]);

  // --- UPDATE STATUS ---
  const handleStatusChange = async (pedidoId: string, novoStatus: OrderStatus) => {
    const pedidosAnteriores = [...pedidos];
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    const toastId = toast.loading("Atualizando...");
    setUpdatingId(pedidoId);

    try {
      await updateAdminOrderStatus(pedidoId, novoStatus);
      toast.success(`Status alterado para ${novoStatus}`, { id: toastId });
    } catch (err) {
      setPedidos(pedidosAnteriores);
      toast.error("Erro ao atualizar.", { id: toastId });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="h-[80vh] flex flex-col items-center justify-center"><Loader2 className="animate-spin text-dourado mb-2" size={40} /><p className="text-gray-400 font-medium">Carregando pedidos...</p></div>;
  if (error) return <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl m-10 border border-red-100">{error}</div>;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff', borderRadius: '10px' } }} />
      
      <div className="space-y-8 pb-20">
        
        {/* 1. HEADER & KPI DASHBOARD */}
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Gestão de Pedidos</h1>
                    <p className="text-gray-500 mt-1">Acompanhe vendas, status e expedição em tempo real.</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon size={20}/></button>
                    <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Receita Total" value={formatCurrency(stats.totalVendas)} icon={<DollarSign size={24}/>} color="bg-emerald-500" sub="Faturamento acumulado" />
                <StatCard title="Em Aberto" value={stats.pendentes} icon={<Clock size={24}/>} color="bg-yellow-500" sub="Pedidos aguardando" />
                <StatCard title="Concluídos" value={stats.concluidos} icon={<CheckCircle2 size={24}/>} color="bg-blue-500" sub="Entregues com sucesso" />
            </div>
        </div>

        {/* 2. FILTROS AVANÇADOS */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2 border-b border-gray-100">
                <button 
                    onClick={() => setStatusFilter('Todos')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${statusFilter === 'Todos' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Todos
                </button>
                {statusOrdem.map(status => (
                    <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${statusFilter === status ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por ID (#), Nome do Cliente ou Telefone..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-dourado focus:border-transparent outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select 
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as any)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-dourado outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Todo o período</option>
                        <option value="7days">Últimos 7 dias</option>
                        <option value="30days">Últimos 30 dias</option>
                    </select>
                </div>
            </div>
        </div>

        {/* 3. CONTEÚDO PRINCIPAL (LISTA ou KANBAN) */}
        
        {viewMode === 'list' && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Pedido / Data</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {pedidosFiltrados.map(pedido => {
                                    // Fallback para status desconhecido
                                    const statusStyle = statusConfig[pedido.status as OrderStatus] || statusConfig['Aguardando Pagamento'];
                                    
                                    return (
                                        <motion.tr 
                                            key={pedido.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50/80 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-bold text-gray-900 text-sm">#{pedido.id.slice(0,6).toUpperCase()}</span>
                                                    <span className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <Calendar size={10}/> {formatDate(pedido.createdAt)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{pedido.customerName || 'Consumidor Final'}</div>
                                                <div className="text-xs text-gray-400">{pedido.customerPhone || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative group/status inline-block">
                                                    {updatingId === pedido.id ? (
                                                        <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2 text-xs font-bold text-gray-500">
                                                            <Loader2 size={12} className="animate-spin"/> Atualizando...
                                                        </div>
                                                    ) : (
                                                        <select 
                                                            value={pedido.status}
                                                            onChange={(e) => handleStatusChange(pedido.id, e.target.value as OrderStatus)}
                                                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}
                                                        >
                                                            {statusOrdem.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-900 text-base">{formatCurrency(pedido.total)}</span>
                                                <div className="text-[10px] text-gray-400">{pedido.items?.length || 0} itens</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => prepararEImprimirCertificado(pedido)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title="Certificado">
                                                        <ScrollText size={16} />
                                                    </button>
                                                    <button onClick={() => { setPedidoSelecionado(pedido); setModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100" title="Detalhes">
                                                        <Search size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(pedido.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                            {pedidosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Filter size={48} className="mb-3 opacity-20" />
                                            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
                                            <p className="text-sm">Tente ajustar os filtros de busca.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* MODO KANBAN CORRIGIDO */}
        {viewMode === 'kanban' && (
            <div className="flex overflow-x-auto pb-6 gap-4 items-start custom-scrollbar">
                {statusOrdem.map(status => {
                    
                    // --- FILTRO DO KANBAN CORRIGIDO ---
                    // Agora aceita pedidos sem status (null/undefined) na coluna "Aguardando Pagamento"
                    const pedidosDoStatus = pedidosFiltrados.filter(p => {
                        if (p.status === status) return true;
                        if (status === 'Aguardando Pagamento' && !p.status) return true;
                        return false;
                    });

                    const estilo = statusConfig[status];
                    
                    return (
                        <div key={status} className="min-w-[280px] w-[280px] flex-shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-250px)]">
                            <div className={`p-3 border-b border-gray-200 rounded-t-xl bg-white sticky top-0 z-10 flex justify-between items-center ${estilo.color}`}>
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    {estilo.icon} {status}
                                </div>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{pedidosDoStatus.length}</span>
                            </div>
                            <div className="p-2 space-y-2 overflow-y-auto flex-1">
                                {pedidosDoStatus.map(pedido => (
                                    <motion.div 
                                        key={pedido.id} layoutId={pedido.id}
                                        onClick={() => { setPedidoSelecionado(pedido); setModalOpen(true); }}
                                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-xs font-bold text-gray-500">#{pedido.id.slice(0,5)}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(pedido.createdAt).split(' ')[0]}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 truncate">{pedido.customerName || 'Cliente'}</h4>
                                        <div className="flex justify-between items-end mt-3">
                                            <span className="text-xs text-gray-500">{pedido.items?.length || 0} itens</span>
                                            <span className="font-bold text-dourado text-sm">{formatCurrency(pedido.total)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )
                })}
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