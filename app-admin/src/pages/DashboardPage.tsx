import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DashboardStats } from '../types';
import { getDashboardStats, getDashboardCharts, type ChartData } from '../services/apiService';
import { TrendingUp, ArrowDownCircle, DollarSign, Activity, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// Cores da Marca
const COLORS = {
  gold: '#D4AF37',     
  charcoal: '#343434', 
  gray: '#9CA3AF',    
  grid: '#F3F4F6',    
  success: '#10B981',
  danger: '#EF4444',
  bgTooltip: '#FFFFFF'
};

// --- FUNÇÃO DE SEGURANÇA (Vacina contra Erros) ---
const formatMoney = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- Componente: Tooltip Personalizado ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl text-sm z-50">
        <p className="font-bold text-gray-700 mb-1">{label || payload[0].name}</p>
        <p className="text-dourado font-semibold">
          {formatMoney(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

// --- Componente: Cartão de Estatística ---
interface StatCardProps {
  titulo: string;
  valor: number;
  icone: React.ReactElement;
  corIcone: string;
  delay: number;
}

const StatCard = ({ titulo, valor, icone, corIcone, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white shadow-sm hover:shadow-md rounded-2xl p-6 border border-gray-100 flex items-center justify-between transition-all"
  >
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{titulo}</p>
      <p className="text-2xl font-bold text-gray-800">
        {formatMoney(valor)}
      </p>
    </div>
    <div 
      className="p-3 rounded-xl"
      style={{ backgroundColor: `${corIcone}15`, color: corIcone }} 
    >
      {icone}
    </div>
  </motion.div>
);

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVendas: 0,
    totalDespesas: 0,
    lucroLiquido: 0,
    saldoTotal: 0,
  });
  const [chartsData, setChartsData] = useState<ChartData>({ salesByDay: [], incomeVsExpense: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [dadosStats, dadosCharts] = await Promise.all([
          getDashboardStats().catch(() => ({ totalVendas: 0, totalDespesas: 0, lucroLiquido: 0, saldoTotal: 0 })),
          getDashboardCharts().catch(() => ({ salesByDay: [], incomeVsExpense: [] }))
        ]);
        setStats(dadosStats);
        setChartsData(dadosCharts);
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <Loader2 className="animate-spin text-dourado" size={48} />
    </div>
  );

  // Dados seguros para o Donut Chart
  const pieData = [
    { name: 'Receitas', value: stats.totalVendas || 0 },
    { name: 'Despesas', value: Math.abs(stats.totalDespesas || 0) } // Garante positivo
  ];

  // Se não houver dados, cria um placeholder para o gráfico não sumir
  const hasData = pieData.some(d => d.value > 0);
  const finalPieData = hasData ? pieData : [{ name: 'Sem dados', value: 1 }];

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-carvao">Visão Geral</h1>
        <p className="text-sm text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
          Hoje: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </motion.div>

      {/* 1. Cartões de KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard titulo="Saldo Total" valor={stats.saldoTotal} icone={<DollarSign size={24} />} corIcone={COLORS.gold} delay={0.1} />
        <StatCard titulo="Vendas" valor={stats.totalVendas} icone={<TrendingUp size={24} />} corIcone={COLORS.success} delay={0.2} />
        <StatCard titulo="Despesas" valor={stats.totalDespesas} icone={<ArrowDownCircle size={24} />} corIcone={COLORS.danger} delay={0.3} />
        <StatCard titulo="Lucro Líquido" valor={stats.lucroLiquido} icone={<Activity size={24} />} corIcone={stats.lucroLiquido >= 0 ? COLORS.success : COLORS.danger} delay={0.4} />
      </div>

      {/* 2. Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRÁFICO DE BARRAS (VENDAS 7 DIAS) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
        >
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-gray-800">Vendas da Semana</h3>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.salesByDay} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.gray, fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: COLORS.gray, fontSize: 12 }} 
                  tickFormatter={(val) => `R$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
                <Bar 
                  dataKey="vendas" 
                  name="Vendas" 
                  fill={COLORS.gold} 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* GRÁFICO DE PIZZA (DONUT) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center lg:text-left">Balanço</h3>
          
          <div className="flex-grow relative flex items-center justify-center">
             {/* Texto Centralizado (Saldo no meio do Donut) */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saldo</span>
                <span className={`text-xl font-bold ${stats.saldoTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.saldoTotal >= 0 ? '+' : ''}{formatMoney(stats.saldoTotal)}
                </span>
             </div>

            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70} 
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {hasData ? (
                        <>
                           <Cell key="cell-receita" fill={COLORS.success} />
                           <Cell key="cell-despesa" fill={COLORS.danger} />
                        </>
                    ) : (
                        <Cell key="cell-empty" fill="#E5E7EB" />
                    )}
                  </Pie>
                  {hasData && <Tooltip content={<CustomTooltip />} />}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-4 flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Despesas</span>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}