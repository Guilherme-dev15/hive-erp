import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, TrendingUp, TrendingDown, 
  ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';

// Serviços e Utilitários
import { getDashboardStats, getDashboardCharts, getTransacoes } from '../services/apiService';
import { formatCurrency } from '../utils/format'; // Agora esse arquivo existe!

// Tipos Importados
import type { DashboardStats, ChartData } from '../types/index'; // Ajuste se seu arquivo de tipos tiver outro nome

// Cores do Gráfico de Rosca
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];

export function DashboardPage() {
  const [loading, setLoading] = useState(true);

  // CORREÇÃO: Tipagem explícita <DashboardStats>
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    saldoTotal: 0,
    activeProducts: 0
  });
  
  // CORREÇÃO: Tipagem explícita <ChartData> para evitar erro de never[]
  const [chartsData, setChartsData] = useState<ChartData>({
    salesByDay: [],
    incomeVsExpense: []
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

        // Garante que activeProducts tenha valor
        setStats({
            ...statsData,
            activeProducts: statsData.activeProducts || 0
        });
        
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
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-dourado border-t-transparent"></div>
                <p className="text-gray-500 font-medium">Carregando indicadores...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. CARDS DE ESTATÍSTICAS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Vendas Totais" 
          value={stats.totalVendas} 
          icon={<TrendingUp className="text-green-500"/>} 
          color="green"
        />
        <StatsCard 
          title="Lucro Líquido" 
          value={stats.lucroLiquido} 
          icon={<DollarSign className="text-dourado"/>} 
          color="yellow"
        />
        <StatsCard 
          title="Despesas" 
          value={stats.totalDespesas} 
          icon={<TrendingDown className="text-red-500"/>} 
          color="red"
        />
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Produtos Ativos</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.activeProducts}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <ShoppingBag className="text-blue-600" size={24}/>
          </div>
        </div>
      </div>

      {/* 2. ÁREA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE VENDAS (ÁREA) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity size={20} className="text-dourado"/> Evolução de Vendas
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.salesByDay}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0"/>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  dy={10}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                  formatter={(value: number) => [formatCurrency(value), 'Vendas']}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorVendas)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO DE ROSCA (DONUT) - DESPESAS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Despesas por Categoria</h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            {chartsData.incomeVsExpense.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.incomeVsExpense}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {/* Usamos _entry com underscore para o TS não reclamar que não foi usado */}
                    {chartsData.incomeVsExpense.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 flex flex-col items-center">
                <div className="bg-gray-100 p-3 rounded-full mb-2">
                    <TrendingDown size={24} className="text-gray-300"/>
                </div>
                <p>Nenhuma despesa registrada</p>
              </div>
            )}
            
            {/* Texto Central do Donut */}
            {chartsData.incomeVsExpense.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                 <span className="text-xs text-gray-400">Total</span>
                 <span className="font-bold text-gray-800">
                   {formatCurrency(chartsData.incomeVsExpense.reduce((acc: any, curr: { value: any; }) => acc + curr.value, 0))}
                 </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. ÚLTIMAS TRANSAÇÕES (TABELA) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">Últimas Movimentações</h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Descrição</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800 flex items-center gap-3">
                      <div className={`p-2 rounded-full ${t.type === 'venda' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'venda' ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
                      </div>
                      {t.description || (t.type === 'venda' ? 'Venda realizada' : 'Despesa')}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {t.category || (t.type === 'venda' ? 'Vendas' : 'Geral')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {t.date ? new Date(t.date).toLocaleDateString() : 'Hoje'}
                    </td>
                    <td className={`p-4 text-right font-bold ${t.type === 'venda' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'despesa' ? '-' : '+'} {formatCurrency(Number(t.amount))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma movimentação recente.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Componente Auxiliar de Card (interno)
function StatsCard({ title, value, icon, color }: any) {
  const bgColors: any = { green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50' };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
    >
      <div>
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(value)}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgColors[color]}`}>
        {icon}
      </div>
    </motion.div>
  );
}