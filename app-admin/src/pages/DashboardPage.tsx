import { useEffect, useState, useCallback, ReactNode } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Download,
  Package,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

// SERVIÇOS
import { getDashboardStats } from '../services/apiService';
import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { Order, DashboardStats, ChartData } from '../types';

// --- CONFIGURAÇÕES GLOBAIS ---
const COLORS = [
  '#4F46E5',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

const parseDate = (d: unknown) => {
  if (!d) return new Date();
  if (typeof d === 'object' && d !== null && 'seconds' in d)
    return new Date((d as { seconds: number }).seconds * 1000);
  const date = new Date(d as string | number);
  return isNaN(date.getTime()) ? new Date() : date;
};

// --- ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

// --- TIPOS ---
type TimeRange = '7d' | '30d' | 'all';
interface CategoryData {
    name: string;
    value: number;
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States preenchidos pelo backend (agregação em O(1))
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);

  // Fallbacks visuais caso a API de gráficos ou de extrato não esteja 100% pronta
  // (Como o PERF-01 otimizou stats, vamos focar neles)
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentList, setRecentList] = useState<Order[]>([]);

  // 1. CARGA DE DADOS DO BACKEND (Aggregation API)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Passa o timeRange pro backend calcular na query
      const data = await getDashboardStats(timeRange);
      setStats(data.stats);
      setCharts(data.charts);
      
      // Temporary stub for features not yet implemented in aggregation API
      setCategoryData([]);
      setRecentList([]);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro Dashboard:', error);
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openOrderDetails = (pedido: Order) => {
    setSelectedOrder(pedido);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-500 font-medium tracking-widest text-sm">
          SINCRONIZANDO...
        </span>
      </div>
    );
  }

  // Prepara valores ou usa 0 se estiver nulo
  const s = stats || {
    totalVendas: 0,
    lucroLiquido: 0,
    totalDespesas: 0,
    saldoTotal: 0,
    activeProducts: 0,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Visão consolidada da operação
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${timeRange === '7d' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${timeRange === '30d' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${timeRange === 'all' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Tudo
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg">
            <Download size={18} /> Relatório
          </button>
        </div>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Faturamento"
          value={s.totalVendas}
          icon={<DollarSign size={22} className="text-white" />}
          color="bg-indigo-600"
          trend="Vendas"
          trendUp={true}
        />
        <StatsCard
          title="Lucro Líquido"
          value={s.lucroLiquido}
          icon={<TrendingUp size={22} className="text-emerald-600" />}
          color="bg-white"
          iconColor="bg-emerald-50"
          trend="Real"
          trendUp={true}
        />
        <StatsCard
          title="Total Despesas"
          value={s.totalDespesas}
          icon={<AlertCircle size={22} className="text-rose-600" />}
          color="bg-white"
          iconColor="bg-rose-50"
          trend="Saídas"
          trendUp={false}
        />
        <StatsCard
          title="Saldo Geral"
          value={s.saldoTotal}
          icon={<Package size={22} className="text-violet-600" />}
          color="bg-white"
          iconColor="bg-violet-50"
          trend="Liquidez"
          trendUp={s.saldoTotal >= 0}
        />
      </div>

      {/* ÁREA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col min-h-[400px]"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            Fluxo de Caixa
          </h3>
          <div className="flex-grow w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesByDay || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mix de Produtos</h3>
          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData.length ? categoryData : [{name: 'Vazio', value: 1}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {(categoryData.length ? categoryData : [{name: 'Vazio', value: 1}]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{s.activeProducts}</span>
              <span className="text-[10px] text-gray-400 uppercase">Itens Ativos</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* EXTRATO RECENTE */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Extrato Recente</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Descrição</th>
                <th className="p-4">Data</th>
                <th className="p-4 pr-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentList.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => openOrderDetails(tx)}
                >
                  <td className="p-4 pl-6">
                    <p className="font-bold text-gray-900">{tx.customerName}</p>
                    <p className="text-gray-500 text-xs">{tx.status}</p>
                  </td>
                  <td className="p-4 text-gray-500">
                    {parseDate(tx.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 pr-6 text-right font-medium text-emerald-600">
                    {tx.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
              {recentList.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400">
                    Nenhuma transação recente encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <DetalhePedidoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pedido={selectedOrder}
        onUpdate={loadData}
      />
    </motion.div>
  );
}

interface StatsCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    color: string;
    iconColor?: string;
    trend: string;
    trendUp: boolean;
    isCurrency?: boolean;
}
function StatsCard({
  title,
  value,
  icon,
  color,
  iconColor = 'bg-white/20',
  trend,
  trendUp,
  isCurrency = true,
}: StatsCardProps) {
  const isSolid = color !== 'bg-white';
  return (
    <motion.div
      variants={itemVariants}
      className={`relative p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group overflow-hidden ${color}`}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${iconColor} text-white`}>
          <span className={isSolid ? 'text-white' : ''}>{icon}</span>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            isSolid
              ? 'bg-white/20 text-white'
              : trendUp
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
          }`}
        >
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h2
          className={`text-sm font-medium mb-1 ${isSolid ? 'text-indigo-100' : 'text-gray-500'}`}
        >
          {title}
        </h2>
        <div
          className={`text-3xl font-bold tracking-tight ${isSolid ? 'text-white' : 'text-gray-900'}`}
        >
          {isCurrency
            ? value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            : value}
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-white/0 to-white/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl text-sm border border-gray-800">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span>
              {entry.name}:{' '}
              {entry.value?.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl text-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: payload[0].payload.fill }}
          ></div>
          <span className="font-medium text-gray-900">
            {payload[0].name}
          </span>
          <span className="text-gray-500 ml-2">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};
