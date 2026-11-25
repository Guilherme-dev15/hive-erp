import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import {
  Package,
  Truck,
  Clock,
  Loader2,
  ScrollText,
  Search,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  XCircle,
  Trash2,
  DollarSign,
  CheckCircle2,
  FileText,
  FileCheck,
  Plus,
} from 'lucide-react';
import {
  TooltipProps,
} from 'recharts';

import { type Order, type OrderStatus, type FirestoreDate } from '../types';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  getConfig,
  deleteAdminOrder,
  emitirNfe,
} from '../services/apiService';
import { type ConfigFormData } from '../types/schemas';

import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { CertificadoImpressao } from '../components/CertificadoImpressao';
import { NovoPedidoModal } from '../components/NovoPedidoModal';

// --- CONFIGURAÇÃO VISUAL ---
const statusConfig: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  'Orçamento': {
    icon: <FileText size={14} />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  'Aguardando Pagamento': {
    icon: <Clock size={14} />,
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  Pago: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  'Em Produção': {
    icon: <Package size={14} />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  'Em Separação': {
    icon: <Package size={14} />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  Enviado: {
    icon: <Truck size={14} />,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  Concluído: {
    icon: <CheckCircle2 size={14} />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  Cancelado: {
    icon: <XCircle size={14} />,
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
};

const statusOrdem: OrderStatus[] = [
  'Orçamento',
  'Aguardando Pagamento',
  'Em Produção',
  'Em Separação',
  'Enviado',
  'Concluído',
  'Cancelado',
];

const getDateSeconds = (date: FirestoreDate | undefined): number => {
  if (!date) return 0;
  if (typeof date === 'object' && 'seconds' in date) return date.seconds;
  if (date instanceof Date) return Math.floor(date.getTime() / 1000);
  if (typeof date === 'string')
    return Math.floor(new Date(date).getTime() / 1000);
  return 0;
};

const formatDate = (date: FirestoreDate | undefined): string => {
  if (!date) return '-';
  try {
    const seconds = getDateSeconds(date);
    if (seconds === 0) return '-';
    return new Date(seconds * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return '-';
  }
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(Number(value)))
    return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

// --- TIPOS E INTERFACES ---
type TimeRange = 'all' | '7days' | '30days';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  sub: string;
  color: string;
}
interface TransactionRowProps {
    desc: string;
    date: string;
    value: number;
    type: 'in' | 'out';
    onClick: () => void;
}

// --- COMPONENTES VISUAIS ---
function StatCard({ title, value, icon, sub, color }: StatCardProps) {
    return (
    <motion.div
      // variants={itemVariants}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
    >
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-800">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        {React.cloneElement(icon as React.ReactElement, {
          className: color.replace('bg-', 'text-'),
        })}
      </div>
    </motion.div>
  );
}


export function PedidosPage() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Order | null>(
    null
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [emittingNfeId, setEmittingNfeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<TimeRange>('all');

  const [config, setConfig] = useState<ConfigFormData | null>(null);
  const [pedidoParaCertificado, setPedidoParaCertificado] =
    useState<Order | null>(null);
  const certificadoRef = useRef<HTMLDivElement>(null);

  const atualizarEstadoPedido = useCallback(
    (id: string, novoStatus: OrderStatus) => {
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
      );
      setPedidoSelecionado((prev) =>
        prev && prev.id === id ? { ...prev, status: novoStatus } : prev
      );
    },
    []
  );

  const carregarDados = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const [pedidosData, configData] = await Promise.all([
        getAdminOrders(),
        getConfig(),
      ]);
      const rawPedidos: Order[] = Array.isArray(pedidosData)
        ? pedidosData
        : Array.isArray((pedidosData as any)?.data)
        ? (pedidosData as any).data
        : Array.isArray((pedidosData as any)?.orders)
        ? (pedidosData as any).orders
        : [];

      const sortedPedidos = rawPedidos
        .filter((p: Order) => p && p.id)
        .sort(
          (a: Order, b: Order) =>
            getDateSeconds(b.createdAt) - getDateSeconds(a.createdAt)
        );

      setPedidos(sortedPedidos);
      setPedidoSelecionado((prev) =>
        prev ? sortedPedidos.find((p: Order) => p.id === prev.id) || prev : null
      );
      if (configData) setConfig(configData);
    } catch (err) {
      console.error("Erro ao carregar dados dos pedidos:", err);
      setError('Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleStatusChange = async (
    pedidoId: string,
    novoStatus: OrderStatus
  ) => {
    const pedidoAtual = pedidos.find((p) => p.id === pedidoId);
    if (pedidoAtual && pedidoAtual.status === novoStatus) return;

    const tid = toast.loading('Atualizando...');
    setUpdatingId(pedidoId);
    try {
      await updateAdminOrderStatus(pedidoId, novoStatus);
      atualizarEstadoPedido(pedidoId, novoStatus);
      toast.success('Status atualizado!', { id: tid });
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      toast.error('Erro ao atualizar.', { id: tid });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Essa ação é irreversível. Deseja excluir este pedido?'))
      return;
    try {
      await deleteAdminOrder(id);
      setPedidos((prev) => prev.filter((p) => p.id !== id));
      toast.success('Pedido excluído!');
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      toast.error('Erro ao excluir.');
    }
  };

  const isNfeEmitted = useCallback((p: Order) => {
    return (
      p.nfeStatus === 'AUTORIZADA' ||
      p.nfeStatus === 'EMITIDA' ||
      Boolean(p.nfeKey)
    );
  }, []);

  const handleEmitirNfeDirect = async (pedidoId: string) => {
    try {
      setEmittingNfeId(pedidoId);
      const res = await emitirNfe(pedidoId);
      toast.success('Comprovante sequencial registrado com sucesso!');
      await carregarDados(true);
      if (res && res.id) {
        setPedidoSelecionado(res);
        setModalOpen(true);
      }
    } catch (error: any) {
      console.error('Erro ao registrar comprovante:', error);
      toast.error(error.response?.data?.message || 'Erro ao registrar comprovante.');
    } finally {
      setEmittingNfeId(null);
    }
  };

  const handlePrintCertificado = useReactToPrint({
    contentRef: certificadoRef,
    documentTitle: 'Certificado_Garantia',
  });

  const prepararEImprimirCertificado = (pedido: Order) => {
    setPedidoParaCertificado(pedido);
    setTimeout(() => {
      handlePrintCertificado();
    }, 200);
  };

  const pedidosFiltrados = useMemo(() => {
    const list = Array.isArray(pedidos) ? pedidos : [];
    return list.filter((pedido) => {
      const termo = searchTerm.toLowerCase();
      const matchText =
        pedido.id?.toLowerCase().includes(termo) ||
        pedido.customerName?.toLowerCase().includes(termo) ||
        pedido.customerPhone?.includes(termo) ||
        pedido.nfeKey?.includes(termo) ||
        String(pedido.nfeNumber || '').includes(termo);
      if (!matchText) return false;

      if (statusFilter !== 'Todos') {
        if (statusFilter === 'Comprovante Emitido' || statusFilter === 'NF-e Emitida') {
          if (!isNfeEmitted(pedido)) return false;
        } else if (statusFilter === 'Sem Comprovante' || statusFilter === 'NF-e Pendente') {
          if (isNfeEmitted(pedido) || pedido.status === 'Cancelado') return false;
        } else if (pedido.status !== statusFilter) {
          return false;
        }
      }

      if (dateFilter !== 'all') {
        const segundos = getDateSeconds(pedido.createdAt);
        if (!segundos) return false;
        const diasAtras =
          (new Date().getTime() - segundos * 1000) / (1000 * 3600 * 24);
        if (dateFilter === '7days' && diasAtras > 7) return false;
        if (dateFilter === '30days' && diasAtras > 30) return false;
      }
      return true;
    });
  }, [pedidos, searchTerm, dateFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(pedidos) ? pedidos : [];
    const totalVendas = list.reduce(
      (acc, p) => (p.status !== 'Cancelado' ? acc + (Number(p.total) || 0) : acc),
      0
    );
    const pendentes = list.filter(
      (p) => p.status === 'Aguardando Pagamento' || p.status === 'Em Produção'
    ).length;
    const concluidos = list.filter(
      (p) => p.status === 'Concluído' || p.status === 'Enviado'
    ).length;
    return { totalVendas, pendentes, concluidos };
  }, [pedidos]);

  if (loading)
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600 mb-2" size={40} />
        <p className="text-gray-400 font-medium text-sm">
          Carregando pedidos...
        </p>
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl m-10 border border-red-100">
        {error}
      </div>
    );

  return (
    <>
      <Toaster position="top-right" />

      <div className="space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                Gestão de Pedidos
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full text-indigo-800 text-xs font-bold">
                <FileText size={13} className="text-indigo-600" />
                Comprovante & Declaração em 1 clique
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Acompanhe vendas, status, expedição, comprovantes e declarações de envio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsNovoModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-carvao hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <Plus size={18} /> Novo Pedido / Orçamento
            </button>
            <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <ListIcon size={20} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Receita Total"
            value={formatCurrency(stats.totalVendas)}
            icon={<DollarSign size={24} />}
            color="bg-emerald-500"
            sub="Faturamento acumulado"
          />
          <StatCard
            title="Em Aberto"
            value={stats.pendentes}
            icon={<Clock size={24} />}
            color="bg-yellow-500"
            sub="Pedidos aguardando"
          />
          <StatCard
            title="Concluídos"
            value={stats.concluidos}
            icon={<CheckCircle2 size={24} />}
            color="bg-blue-500"
            sub="Entregues com sucesso"
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2 border-b border-gray-100">
            <button
              onClick={() => setStatusFilter('Todos')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${statusFilter === 'Todos' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('Comprovante Emitido')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${statusFilter === 'Comprovante Emitido' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
            >
              <FileCheck size={14} /> Comprovante Emitido
            </button>
            <button
              onClick={() => setStatusFilter('Sem Comprovante')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${statusFilter === 'Sem Comprovante' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}
            >
              <FileText size={14} /> Sem Comprovante
            </button>
            {(Array.isArray(statusOrdem) ? statusOrdem : []).map((status) => (
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
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por ID, Nome ou Telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Calendar
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as TimeRange)}
                className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
              >
                <option value="all">Todo o período</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
              </select>
            </div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Pedido / Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Comprovante & Envio</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {(Array.isArray(pedidosFiltrados) ? pedidosFiltrados : []).map((pedido) => {
                    const statusStyle =
                      statusConfig[pedido.status as OrderStatus] ||
                      statusConfig['Aguardando Pagamento'];
                    return (
                      <motion.tr
                        key={pedido.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-gray-900 text-sm">
                              #{pedido.id.slice(0, 6).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              {formatDate(pedido.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {pedido.customerName || 'Cliente'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {pedido.customerPhone || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {updatingId === pedido.id ? (
                            <Loader2
                              size={14}
                              className="animate-spin text-gray-400"
                            />
                          ) : (
                            <select
                              value={pedido.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  pedido.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className={`appearance-none px-3 py-1.5 rounded-full text-xs font-bold border ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} outline-none cursor-pointer`}
                            >
                              {(Array.isArray(statusOrdem) ? statusOrdem : []).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isNfeEmitted(pedido) ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <FileCheck size={12} /> Comprovante Nº {pedido.nfeNumber || 1}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPedidoSelecionado(pedido);
                                  setModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                title="Ver Comprovante e Declaração de Envio"
                              >
                                <Eye size={12} /> Ver / Imprimir
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmitirNfeDirect(pedido.id);
                              }}
                              disabled={emittingNfeId === pedido.id || pedido.status === 'Cancelado' || pedido.status === 'Orçamento'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
                              title="Registrar comprovante e gerar declaração de envio"
                            >
                              {emittingNfeId === pedido.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <FileText size={13} />
                              )}
                              Gerar Comprovante
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          {formatCurrency(pedido.total)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() =>
                                prepararEImprimirCertificado(pedido)
                              }
                              className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <ScrollText size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setPedidoSelecionado(pedido);
                                setModalOpen(true);
                              }}
                              className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Search size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(pedido.id)}
                              className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-6 gap-4 items-start custom-scrollbar">
            {(Array.isArray(statusOrdem) ? statusOrdem : []).map((status) => {
              const pedidosDoStatus = (Array.isArray(pedidosFiltrados) ? pedidosFiltrados : []).filter(
                (p) =>
                  p.status === status ||
                  (status === 'Aguardando Pagamento' && !p.status)
              );
              const estilo = statusConfig[status as OrderStatus] || statusConfig['Aguardando Pagamento'];
              return (
                <div
                  key={status}
                  className="min-w-[280px] w-[280px] bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-250px)]"
                >
                  <div
                    className={`p-3 border-b border-gray-200 bg-white rounded-t-xl flex justify-between items-center ${estilo.color}`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {estilo.icon} {status}
                    </div>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">
                      {pedidosDoStatus.length}
                    </span>
                  </div>
                  <div className="p-2 space-y-2 overflow-y-auto flex-1">
                    {(Array.isArray(pedidosDoStatus) ? pedidosDoStatus : []).map((pedido) => (
                      <motion.div
                        key={pedido.id}
                        layoutId={pedido.id}
                        onClick={() => {
                          setPedidoSelecionado(pedido);
                          setModalOpen(true);
                        }}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all"
                      >
                        <div className="flex justify-between items-start mb-2 text-[10px] font-bold text-gray-400">
                          <span>#{pedido.id.slice(0, 5).toUpperCase()}</span>
                          <span>
                            {formatDate(pedido.createdAt).split(' ')[0]}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm truncate">
                          {pedido.customerName || 'Cliente'}
                        </h4>
                        <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-gray-100">
                          <p className="font-bold text-indigo-600 text-sm">
                            {formatCurrency(pedido.total)}
                          </p>
                          {isNfeEmitted(pedido) ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPedidoSelecionado(pedido);
                                setModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 transition"
                              title="Ver Comprovante e Declaração"
                            >
                              <FileCheck size={10} /> Nº {pedido.nfeNumber || 1}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmitirNfeDirect(pedido.id);
                              }}
                              disabled={emittingNfeId === pedido.id || pedido.status === 'Cancelado' || pedido.status === 'Orçamento'}
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1 transition disabled:opacity-50"
                            >
                              <FileText size={10} /> Comprovante
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DetalhePedidoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        pedido={pedidoSelecionado}
        onUpdate={() => carregarDados(true)}
      />

      <NovoPedidoModal
        isOpen={isNovoModalOpen}
        onClose={() => setIsNovoModalOpen(false)}
        onSuccess={() => carregarDados(true)}
      />

      <CertificadoImpressao
        ref={certificadoRef}
        pedido={pedidoParaCertificado}
        config={config}
      />
    </>
  );
}
