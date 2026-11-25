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
  TrendingDown,
  Download,
  Package,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';

// SERVIÇOS
import { getDashboardStats } from '../services/apiService';
import { DetalhePedidoModal } from '../components/DetalhePedidoModal';
import { GettingStartedChecklist } from '../components/GettingStartedChecklist';
import { useTheme } from '../contexts/ThemeContext';
import type { Pagina } from '../components/Sidebar';
import { Order, DashboardStats, ChartData } from '../types';
import { formatCurrency } from '../utils/format';

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

interface DashboardPageProps {
  onNavigate?: (pagina: Pagina) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps = {}) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States preenchidos pelo backend (agregação em O(1))
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);

  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [recentList, setRecentList] = useState<Order[]>([]);

  // 1. CARGA DE DADOS DO BACKEND (Aggregation API)
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats(timeRange);
      setStats(data.stats);
      setCharts(data.charts);
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
    vendasHoje: 0,
    notasEmitidas: 0,
    aReceber: 0,
    itensEmFalta: 0,
    lucroMes: 0,
    lucroMesPercent: 0,
    aPagar: 0,
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20"
    >
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Dashboard Colmeia
            </h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Operação em tempo real e inteligência financeira
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeRange === '7d'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeRange === '30d'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                timeRange === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Tudo
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold rounded-xl shadow-md transition-all">
            <Download size={18} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* CHECKLIST DE PRIMEIROS PASSOS */}
      <GettingStartedChecklist
        storeSlug={theme?.slug}
        activeProductsCount={s.activeProducts}
        onNavigate={onNavigate}
      />

      {/* =========================================================================
          WIDGET COLMEIA HIVE: OS 6 KPIS VISUAIS PROMETIDOS NA LANDING PAGE
          1. Vendas hoje
          2. Notas emitidas
          3. A receber
          4. Itens em falta
          5. Lucro do mês (%)
          6. A pagar
          ========================================================================= */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 rounded-3xl p-6 sm:p-8 text-white border border-amber-500/20 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Colmeia Operacional
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Ao Vivo
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Os 6 pilares de controle diário da sua empresa
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-amber-400/80 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            Atualizado: {new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>

        {/* HEX GRID / 6 COMB CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 relative z-10">
          {/* 1. Vendas Hoje */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Vendas Hoje</span>
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
              {formatCurrency(s.vendasHoje || 0)}
            </div>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <TrendingUp size={12} />
              <span>Faturado hoje</span>
            </div>
          </div>

          {/* 2. Notas Emitidas */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Notas Emitidas</span>
              <FileText size={14} className="text-sky-400" />
            </div>
            <div className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
              {s.notasEmitidas || 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium">
              Documentos fiscais
            </div>
          </div>

          {/* 3. A Receber */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">A Receber</span>
              <Clock size={14} className="text-blue-400" />
            </div>
            <div className="text-xl font-extrabold text-blue-400">
              {formatCurrency(s.aReceber || 0)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium">
              Receitas pendentes
            </div>
          </div>

          {/* 4. Itens em Falta */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Itens em Falta</span>
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className={`text-xl font-extrabold ${(s.itensEmFalta || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {s.itensEmFalta || 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium">
              {(s.itensEmFalta || 0) > 0 ? 'Estoque crítico' : 'Estoque regular'}
            </div>
          </div>

          {/* 5. Lucro do Mês */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Lucro do Mês</span>
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-emerald-400">
              {(s.lucroMesPercent || 0) >= 0 ? '+' : ''}
              {(s.lucroMesPercent || 0).toFixed(1)}%
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium truncate" title={formatCurrency(s.lucroMes || 0)}>
              {formatCurrency(s.lucroMes || 0)}
            </div>
          </div>

          {/* 6. A Pagar */}
          <div className="bg-slate-800/70 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/40 rounded-2xl p-4 transition-all duration-300 group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">A Pagar</span>
              <TrendingDown size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-amber-400">
              {formatCurrency(s.aPagar || 0)}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium">
              Despesas a quitar
            </div>
          </div>
        </div>
      </motion.div>

      {/* CARDS DE KPI GERAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Faturamento Acumulado"
          value={s.totalVendas}
          icon={<DollarSign size={22} className="text-white" />}
          color="bg-slate-900"
          trend="Período"
          trendUp={true}
        />
        <StatsCard
          title="Lucro Líquido"
          value={s.lucroLiquido}
          icon={<TrendingUp size={22} className="text-emerald-600" />}
          color="bg-white"
          iconColor="bg-emerald-50"
          trend="Margem"
          trendUp={s.lucroLiquido >= 0}
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
          title="Saldo Operacional"
          value={s.saldoTotal}
          icon={<Package size={22} className="text-violet-600" />}
          color="bg-white"
          iconColor="bg-violet-50"
          trend="Caixa"
          trendUp={s.saldoTotal >= 0}
        />
      </div>

      {/* ÁREA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col min-h-[400px]"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            Evolução Diária de Vendas
          </h3>
          <div className="flex-grow w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={charts?.salesByDay || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mix de Produtos</h3>
          <p className="text-xs text-gray-400 mb-4">Distribuição do estoque cadastrado</p>
          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length ? categoryData : [{ name: 'Cadastrados', value: s.activeProducts || 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(categoryData.length ? categoryData : [{ name: 'Cadastrados', value: 1 }]).map(
                    (_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    )
                  )}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-gray-900">{s.activeProducts}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Itens Ativos</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MODAL DETALHE DE PEDIDO */}
      {selectedOrder && (
        <DetalhePedidoModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          onStatusChange={loadData}
        />
      )}
    </motion.div>
  );
}

// COMPONENTE AUXILIAR STATS CARD
interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  color: string;
  trend: string;
  trendUp: boolean;
  iconColor?: string;
}

function StatsCard({
  title,
  value,
  icon,
  color,
  trend,
  trendUp,
  iconColor,
}: StatsCardProps) {
  const isSolid = color.startsWith('bg-slate') || color.startsWith('bg-indigo');

  return (
    <motion.div
      variants={itemVariants}
      className={`p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm ${
        isSolid
          ? `${color} text-white border-transparent`
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`p-3 rounded-xl ${
            isSolid ? 'bg-white/10' : iconColor || 'bg-gray-50'
          }`}
        >
          {icon}
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
          className={`text-sm font-medium mb-1 ${
            isSolid ? 'text-slate-300' : 'text-gray-500'
          }`}
        >
          {title}
        </h2>
        <div
          className={`text-2xl font-extrabold tracking-tight ${
            isSolid ? 'text-amber-400' : 'text-gray-900'
          }`}
        >
          {formatCurrency(value)}
        </div>
      </div>
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
