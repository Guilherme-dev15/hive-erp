/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell} from 'recharts';
import { 
  DollarSign, TrendingUp, 
  Download,
  Package, AlertCircle} from 'lucide-react';
import { motion } from 'framer-motion';

// SERVIÇOS
import { getAdminProdutos, getAdminOrders } from '../services/apiService';
import { DetalhePedidoModal } from '../components/DetalhePedidoModal';

// --- CONFIGURAÇÕES GLOBAIS ---
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// LÓGICA EXPERT: Status que NÃO são venda (O resto todo entra no gráfico)
const statusIgnorados = ['aguardando pagamento', 'cancelado', ''];

const parseDate = (d: any) => {
  if (!d) return new Date();
  // Se for Firebase Timestamp
  if (d && typeof d === 'object' && 'seconds' in d) return new Date(d.seconds * 1000);
  // Se for string ou objeto Date
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date() : date;
};

// --- ANIMAÇÕES ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [rawOrders, setRawOrders] = useState<any[]>([]); 

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [kpi, setKpi] = useState({
    faturamento: 0,
    lucro: 0,
    ticketMedio: 0,
    valorEstoque: 0,
    estoqueBaixo: 0,
    produtosAtivos: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentList, setRecentList] = useState<any[]>([]);

  // 1. CARGA DE DADOS
  const loadData = useCallback(async () => {
    try {
      const [prods, orders] = await Promise.all([
        getAdminProdutos(),
        getAdminOrders().catch(() => []) 
      ]);
      setRawProducts(prods || []);
      setRawOrders(orders || []);
      setLoading(false);
    } catch (error) {
      console.error("Erro Dashboard:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 2. PROCESSAMENTO ROBUSTO
  useEffect(() => {
    if (loading || rawOrders.length === 0) return;

    const now = new Date();
    const cutoffDate = new Date();
    if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
    else cutoffDate.setFullYear(2000);

    let revenue = 0;
    let salesCount = 0;
    const dailyMap: Record<string, { vendas: number, lucro: number, timestamp: number }> = {};

    rawOrders.forEach((o: any) => {
      const oDate = parseDate(o.createdAt || o.date);
      
      // Filtro de Data
      if (oDate < cutoffDate) return;

      // Normaliza o status para comparação (remove espaços e põe em minúsculo)
      const statusFormatado = (o.status || '').trim().toLowerCase();
      const isVendaValida = !statusIgnorados.includes(statusFormatado);

      if (isVendaValida) {
        const val = Number(o.total || 0);
        revenue += val;
        salesCount++;

        const dayKey = oDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = { vendas: 0, lucro: 0, timestamp: oDate.getTime() };
        }
        dailyMap[dayKey].vendas += val;
        dailyMap[dayKey].lucro += (val * 0.7);
      }
    });

    // Atualiza KPIs
    setKpi({
      faturamento: revenue,
      lucro: revenue * 0.7,
      ticketMedio: salesCount > 0 ? revenue / salesCount : 0,
      valorEstoque: rawProducts.reduce((acc, p) => acc + (Number(p.salePrice || 0) * (Number(p.quantity) || 0)), 0),
      estoqueBaixo: rawProducts.filter(p => (Number(p.quantity) || 0) < 5).length,
      produtosAtivos: rawProducts.length
    });

    // Prepara Gráfico
    const sortedChart = Object.keys(dailyMap)
      .map(key => ({
        name: key,
        vendas: dailyMap[key].vendas,
        lucro: dailyMap[key].lucro,
        timestamp: dailyMap[key].timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    setChartData(sortedChart.length > 0 ? sortedChart : [{ name: 'Sem vendas', vendas: 0, lucro: 0 }]);

    // Mix de Produtos
    const catMap: Record<string, number> = {};
    rawProducts.forEach(p => {
      const c = p.category || 'Outros';
      catMap[c] = (catMap[c] || 0) + 1;
    });
    setCategoryData(Object.keys(catMap).map(k => ({ name: k, value: catMap[k] })));

    setRecentList(rawOrders.slice(0, 5));

  }, [loading, timeRange, rawProducts, rawOrders]);

  const openOrderDetails = (pedido: any) => {
    setSelectedOrder(pedido);
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse font-bold">SINCRONIZANDO...</div>;

  return (
    <motion.div className="space-y-8 pb-20" variants={containerVariants} initial="hidden" animate="visible">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
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
            {[{ id: '7d', label: '7 Dias' }, { id: '30d', label: '30 Dias' }, { id: 'all', label: 'Tudo' }].map((btn) => (
              <button key={btn.id} onClick={() => setTimeRange(btn.id as any)} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${timeRange === btn.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{btn.label}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg">
            <Download size={18} /> Relatório
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Faturamento" value={kpi.faturamento} icon={<DollarSign size={22} className="text-white"/>} trend="Vendas" trendUp={true} color="bg-indigo-600" />
        <StatsCard title="Lucro Líquido" value={kpi.lucro} icon={<TrendingUp size={22} className="text-emerald-600"/>} trend="Real" trendUp={true} color="bg-emerald-100" iconColor="text-emerald-600" />
        <StatsCard title="Valor em Estoque" value={kpi.valorEstoque} icon={<Package size={22} className="text-violet-600"/>} trend="Snapshot" trendUp={true} color="bg-violet-100" iconColor="text-violet-600" />
        <StatsCard title="Estoque Baixo" value={kpi.estoqueBaixo} isCurrency={false} icon={<AlertCircle size={22} className="text-rose-600"/>} trend="Alertas" trendUp={false} color="bg-rose-100" iconColor="text-rose-600" />
      </div>

      {/* 3. GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa</h3>
          <div className="flex-grow w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                <Tooltip content={<CustomChartTooltip />} />
                <Area type="monotone" name="Faturamento" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                <Area type="monotone" name="Lucro" dataKey="lucro" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mix de Produtos</h3>
          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold text-gray-800">{kpi.produtosAtivos}</span>
               <span className="text-[10px] text-gray-400 uppercase">Itens</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. LISTA RECENTE */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Extrato Recente</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
              <tr><th className="p-4 pl-6">Descrição</th><th className="p-4">Data</th><th className="p-4 pr-6 text-right">Valor</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentList.map((o: any) => (
                <TransactionRow 
                  key={o.id}
                  desc={o.customerName || `Pedido #${o.id?.slice(-5).toUpperCase()}`} 
                  date={parseDate(o.createdAt || o.date).toLocaleDateString('pt-BR')} 
                  value={Number(o.total || 0)} 
                  type={!statusIgnorados.includes((o.status || '').toLowerCase()) ? 'in' : 'out'}
                  onClick={() => openOrderDetails(o)}
                />
              ))}
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

// COMPONENTES UI (Mantidos Idênticos)
function StatsCard({ title, value, icon, color, iconColor, trend, trendUp, isCurrency = true }: any) {
  const isSolid = color.includes('-600');
  return (
    <motion.div variants={itemVariants} className={`relative p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group overflow-hidden ${isSolid ? color : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${isSolid ? 'bg-white/20 text-white' : color}`}>
          <span className={isSolid ? 'text-white' : iconColor}>{icon}</span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isSolid ? 'bg-white/20 text-white' : (trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}`}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-sm font-medium ${isSolid ? 'text-indigo-100' : 'text-gray-500'}`}>{title}</p>
        <h3 className={`text-3xl font-bold tracking-tight ${isSolid ? 'text-white' : 'text-gray-900'}`}>
          {isCurrency ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
        </h3>
      </div>
    </motion.div>
  );
}

function TransactionRow({ desc, date, value, type, onClick }: any) {
  return (
    <tr onClick={onClick} className="hover:bg-gray-50/80 transition-colors cursor-pointer group text-sm">
      <td className="p-4 pl-6 font-semibold text-gray-700">{desc}</td>
      <td className="p-4 text-gray-500">{date}</td>
      <td className={`p-4 pr-6 text-right font-bold ${type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
        R$ {Number(value).toFixed(2)}
      </td>
    </tr>
  );
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-gray-700 text-xs">
        <p className="font-bold mb-2 uppercase tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span>{entry.name}: {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};