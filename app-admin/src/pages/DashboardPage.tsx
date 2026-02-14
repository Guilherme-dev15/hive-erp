import { useEffect, useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, Download,
  Package, AlertCircle, Info
} from 'lucide-react';
import { motion } from 'framer-motion';

// SERVIÇOS
import { getAdminProdutos, getTransacoes } from '../services/apiService';

// --- CORES PREMIUM ORIGINAIS ---
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
  
  // Armazena os dados BRUTOS vindos da API
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);

  // Dados processados para exibição
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

  // 1. CARGA INICIAL
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [prods, trans] = await Promise.all([
          getAdminProdutos(),
          getTransacoes().catch(() => [])
        ]);
        
        setRawProducts(prods || []);
        setRawTransactions(trans || []);
        
        setTimeout(() => setLoading(false), 800);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. PROCESSAMENTO E FILTROS
  useEffect(() => {
    if (loading) return;

    // --- A. FILTRAGEM POR DATA ---
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
    if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
    if (timeRange === 'all') cutoffDate.setFullYear(2000);

    const filteredTrans = rawTransactions.filter((t: any) => {
      const tDate = new Date(t.date);
      return tDate >= cutoffDate;
    });

    // --- B. CÁLCULOS KPI ---
    const stockValue = rawProducts.reduce((acc, p) => acc + (Number(p.salePrice || 0) * (Number(p.quantity) || 0)), 0);
    const lowStock = rawProducts.filter(p => (Number(p.quantity) || 0) < 5).length;
    
    let revenue = 0;
    let expenses = 0;
    let salesCount = 0;

    filteredTrans.forEach((t: any) => {
      const val = Number(t.amount || 0);
      if (t.type === 'receita' || t.type === 'venda') {
        revenue += val;
        salesCount++;
      } else if (t.type === 'despesa' || t.type === 'saida') {
        expenses += val;
      }
    });

    const profit = revenue - expenses;
    const avgTicket = salesCount > 0 ? revenue / salesCount : 0;

    setKpi({
      faturamento: revenue,
      lucro: profit,
      ticketMedio: avgTicket,
      valorEstoque: stockValue,
      estoqueBaixo: lowStock,
      produtosAtivos: rawProducts.length
    });

    // --- C. GRÁFICO DE LINHA/ÁREA ---
    const dailyMap: Record<string, { vendas: number, lucro: number, dateObj: number }> = {};

    filteredTrans.forEach((t: any) => {
      const dateObj = new Date(t.date);
      const dayKey = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const val = Number(t.amount || 0);

      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { vendas: 0, lucro: 0, dateObj: dateObj.getTime() };
      }

      if (t.type === 'receita' || t.type === 'venda') {
        dailyMap[dayKey].vendas += val;
        dailyMap[dayKey].lucro += val;
      } else {
        dailyMap[dayKey].lucro -= val;
      }
    });

    const sortedChart = Object.keys(dailyMap)
      .map(key => ({
        name: key,
        vendas: dailyMap[key].vendas,
        lucro: dailyMap[key].lucro,
        timestamp: dailyMap[key].dateObj
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    setChartData(sortedChart.length > 0 ? sortedChart : [{ name: 'Sem dados', vendas: 0, lucro: 0 }]);

    // --- D. GRÁFICO DE CATEGORIA ---
    const catMap: Record<string, number> = {};
    rawProducts.forEach(p => {
      const c = p.category || 'Outros';
      catMap[c] = (catMap[c] || 0) + 1;
    });
    
    const pieChartData = Object.keys(catMap).map(k => ({ name: k, value: catMap[k] }));
    setCategoryData(pieChartData);

    // --- E. LISTA RECENTE ---
    const sortedRecents = [...rawTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    setRecentList(sortedRecents);

  }, [loading, timeRange, rawProducts, rawTransactions]);


  if (loading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-80 bg-gray-200 rounded-2xl"></div>
          <div className="h-80 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
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
            {[
              { id: '7d', label: '7 Dias' },
              { id: '30d', label: '30 Dias' },
              { id: 'all', label: 'Tudo' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id as any)}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  timeRange === btn.id 
                    ? 'bg-gray-900 text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
            <Download size={18} /> Relatório
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard 
          title="Faturamento" 
          value={kpi.faturamento} 
          icon={<DollarSign size={22} className="text-white"/>} 
          trend={timeRange === '7d' ? 'Última semana' : timeRange === '30d' ? 'Último mês' : 'Total'} 
          trendUp={true}
          color="bg-indigo-600"
          tooltipText="Soma de todas as Entradas/Vendas no período selecionado."
        />
        <StatsCard 
          title="Lucro Líquido" 
          value={kpi.lucro} 
          icon={<TrendingUp size={22} className="text-emerald-600"/>} 
          trend="Real" trendUp={kpi.lucro >= 0}
          color="bg-emerald-100"
          iconColor="text-emerald-600"
          tooltipText="Faturamento menos Despesas no período selecionado."
        />
        <StatsCard 
          title="Valor em Estoque" 
          value={kpi.valorEstoque} 
          icon={<Package size={22} className="text-violet-600"/>} 
          trend="Preço Venda" trendUp={true}
          color="bg-violet-100"
          iconColor="text-violet-600"
          tooltipText="Quanto sua loja vale em mercadoria hoje (snapshot atual)."
        />
        <StatsCard 
          title="Estoque Baixo" 
          value={kpi.estoqueBaixo} 
          isCurrency={false}
          icon={<AlertCircle size={22} className="text-rose-600"/>} 
          trend="Produtos" trendUp={false}
          color="bg-rose-100"
          iconColor="text-rose-600"
          tooltipText="Produtos com menos de 5 unidades. Reposição necessária!"
        />
      </div>

      {/* 3. GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
        
        {/* GRÁFICO 1: EVOLUÇÃO FINANCEIRA */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Fluxo de Caixa
              <InfoTooltip text="Relação entre o que entrou (Vendas) e o que sobrou (Lucro) dia a dia." />
            </h3>
          </div>

          <div className="flex-grow w-full min-h-[300px]">
             {chartData.length > 0 && chartData[0].name !== 'Sem dados' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} tickFormatter={(val) => `R$${val/1000}k`} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" name="Faturamento" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                    <Area type="monotone" name="Lucro" dataKey="lucro" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                  </AreaChart>
                </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Activity size={40} className="mb-2 opacity-20"/>
                  <p>Sem dados financeiros no período.</p>
               </div>
             )}
          </div>
        </motion.div>

        {/* GRÁFICO 2: MIX DE PRODUTOS */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mix de Produtos</h3>
          <p className="text-sm text-gray-500 mb-6">Distribuição real do estoque.</p>

          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold text-gray-800">{kpi.produtosAtivos}</span>
               <span className="text-[10px] text-gray-400 uppercase">Itens</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
            {categoryData.map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-gray-600 truncate max-w-[120px]">{cat.name}</span>
                 </div>
                 <span className="font-bold text-gray-800">{cat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 4. LISTA RECENTE */}
      <motion.div variants={itemVariants}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Extrato Recente</h3>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Ver Financeiro <ArrowUpRight size={14}/>
          </button>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6 font-semibold">Descrição</th>
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 pr-6 text-right font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentList.length > 0 ? recentList.map((t: any) => (
                <TransactionRow 
                  key={t.id}
                  desc={t.description || t.category} 
                  date={new Date(t.date).toLocaleDateString('pt-BR')} 
                  value={Number(t.amount || 0)} 
                  type={t.type === 'receita' || t.type === 'venda' ? 'in' : 'out'} 
                />
              )) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400">
                    Nenhuma movimentação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      
    </motion.div>
  );
}

// ============================================================================
// COMPONENTES UI KIT
// ============================================================================

function StatsCard({ title, value, icon, color, iconColor, trend, trendUp, tooltipText, isCurrency = true }: any) {
  const isSolid = color.includes('-600') || color.includes('-500');
  return (
    <motion.div variants={itemVariants} className={`relative p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group overflow-hidden ${isSolid ? color : 'bg-white'}`}>
      {isSolid && <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${isSolid ? 'bg-white/20 text-white' : color}`}>
          <span className={isSolid ? 'text-white' : iconColor}>{icon}</span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isSolid ? 'bg-white/20 text-white' : (trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}`}>
          {trendUp ? <TrendingUp size={12}/> : <TrendingDown size={12}/>} {trend}
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 opacity-80 mb-1">
          <p className={`text-sm font-medium ${isSolid ? 'text-indigo-100' : 'text-gray-500'}`}>{title}</p>
          {tooltipText && <InfoTooltip text={tooltipText} dark={!isSolid} />}
        </div>
        <h3 className={`text-3xl font-bold tracking-tight ${isSolid ? 'text-white' : 'text-gray-900'}`}>
          {isCurrency && typeof value === 'number'
             ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
             : value
          }
        </h3>
      </div>
    </motion.div>
  );
}

function TransactionRow({ desc, date, value, type }: any) {
  return (
    <tr className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
      <td className="p-4 pl-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${type === 'in' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'}`}>
             {type === 'in' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
          </div>
          <p className="font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">{desc}</p>
        </div>
      </td>
      <td className="p-4 text-gray-500">{date}</td>
      <td className={`p-4 pr-6 text-right font-bold ${type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {type === 'out' && '-'} R$ {Number(value).toFixed(2)}
      </td>
    </tr>
  );
}

function InfoTooltip({ text, dark = true }: { text: string, dark?: boolean }) {
  return (
    <div className="relative group inline-block z-10 align-middle ml-1">
      <Info size={14} className={`cursor-help transition-colors ${dark ? 'text-gray-400 hover:text-indigo-600' : 'text-indigo-200 hover:text-white'}`} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-center shadow-xl pointer-events-none z-50 leading-relaxed border border-gray-700">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-gray-700">
        <p className="text-xs text-gray-400 font-bold uppercase mb-2 tracking-wider">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1 text-sm">
            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></div>
            <span className="text-gray-300 w-20">{entry.name}:</span>
            <span className="font-mono font-bold text-white text-base">
              R$ {Number(entry.value).toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};