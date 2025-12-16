import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar, Download 
} from 'lucide-react';
import { motion } from 'framer-motion';

import { getDashboardStats, getDashboardCharts, getTransacoes } from '../services/apiService';
import { formatCurrency } from '../utils/format';
import type { DashboardStats, ChartData } from '../types/index';

// Paleta de Cores Moderna (SaaS Premium)
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Variantes de Animação (Stagger Effect)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0, activeProducts: 0
  });
  
  const [chartsData, setChartsData] = useState<ChartData>({
    salesByDay: [], incomeVsExpense: []
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, charts, trans] = await Promise.all([
          getDashboardStats(),
          getDashboardCharts(),
          getTransacoes()
        ]);

        setStats({ ...statsData, activeProducts: statsData.activeProducts || 0 });
        setChartsData(charts);
        setRecentTransactions(trans.slice(0, 5));
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-400 font-medium text-sm animate-pulse">Sincronizando dados...</p>
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
      
      {/* 1. HEADER EXECUTIVO */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe o desempenho da sua loja em tempo real.</p>
        </div>
        <div className="flex gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar size={16} /> Últimos 30 dias
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95">
            <Download size={16} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPI (BENTO GRID STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard 
          title="Receita Total" 
          value={stats.totalVendas} 
          icon={<TrendingUp size={20} className="text-emerald-600"/>} 
          trend="+12.5%" trendUp={true}
          bgIcon="bg-emerald-50"
        />
        <StatsCard 
          title="Lucro Líquido" 
          value={stats.lucroLiquido} 
          icon={<DollarSign size={20} className="text-indigo-600"/>} 
          trend="+8.2%" trendUp={true}
          bgIcon="bg-indigo-50"
        />
        <StatsCard 
          title="Despesas" 
          value={stats.totalDespesas} 
          icon={<TrendingDown size={20} className="text-rose-600"/>} 
          trend="-2.4%" trendUp={false} // Despesa caindo é bom, mas visualmente usamos vermelho pra identificar despesa
          bgIcon="bg-rose-50"
        />
        <StatsCard 
          title="Produtos Ativos" 
          value={stats.activeProducts} 
          isCurrency={false}
          icon={<ShoppingBag size={20} className="text-amber-600"/>} 
          trend="Estoque em dia" trendUp={true}
          bgIcon="bg-amber-50"
        />
      </div>

      {/* 3. SEÇÃO DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO PRINCIPAL (ÁREA) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Fluxo de Vendas
              </h3>
              <p className="text-xs text-gray-400">Performance diária</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
              <Activity size={18} />
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.salesByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 11}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 11}}
                  tickFormatter={(val) => `R$${val/1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GRÁFICO SECUNDÁRIO (ROSCA) */}
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Despesas</h3>
          <p className="text-xs text-gray-400 mb-6">Por categoria</p>
          
          <div className="flex-grow flex items-center justify-center relative">
            {chartsData.incomeVsExpense.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartsData.incomeVsExpense}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartsData.incomeVsExpense.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400">
                <p>Sem dados de despesas</p>
              </div>
            )}
            
            {/* Texto Central */}
            {chartsData.incomeVsExpense.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
                <span className="font-bold text-gray-800 text-lg">
                  {formatCurrency(chartsData.incomeVsExpense.reduce((acc: any, curr: { value: any; }) => acc + curr.value, 0))}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 4. ÚLTIMAS TRANSAÇÕES (TABELA MODERNA) */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <div>
             <h3 className="text-lg font-bold text-gray-900">Transações Recentes</h3>
             <p className="text-xs text-gray-400">Últimas 5 movimentações financeiras</p>
          </div>
          <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            Ver todas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 text-gray-400 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Descrição</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Data</th>
                <th className="p-4 pr-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <tr key={t.id} className="group hover:bg-gray-50/80 transition-colors cursor-default">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${t.type === 'receita' || t.type === 'venda' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === 'receita' || t.type === 'venda' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700 text-sm group-hover:text-indigo-600 transition-colors">
                             {t.description || (t.type === 'venda' ? 'Venda realizada' : 'Despesa')}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono hidden sm:block">ID: {t.id.substring(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">
                        {t.category || (t.type === 'venda' ? 'Vendas' : 'Geral')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString('pt-BR') : 'Hoje'}
                    </td>
                    <td className={`p-4 pr-6 text-right font-bold text-sm ${t.type === 'receita' || t.type === 'venda' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {t.type === 'despesa' ? '-' : '+'} {formatCurrency(Number(t.amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-400 flex flex-col items-center">
                    <Activity size={32} className="mb-2 opacity-20"/>
                    Nenhuma movimentação recente.
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

// --- SUBCOMPONENTES ---

// 1. Card de KPI
function StatsCard({ title, value, icon, bgIcon, trend, trendUp, isCurrency = true }: any) {
  return (
    <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgIcon}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <h3 className={`text-2xl font-bold text-gray-900 tracking-tight ${!isCurrency ? 'font-mono' : ''}`}>
          {isCurrency ? formatCurrency(value) : value}
        </h3>
        <p className="text-sm text-gray-500 font-medium mt-1">{title}</p>
      </div>
    </motion.div>
  );
}

// 2. Tooltip Customizado para o Gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-800">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};