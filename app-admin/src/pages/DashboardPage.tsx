import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DashboardStats } from '../types';
import { getDashboardStats, getDashboardCharts, type ChartData } from '../services/apiService';
import { TrendingUp, ArrowDownCircle, DollarSign, Activity } from 'lucide-react';
// Importar componentes do Recharts
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// Cores da Marca
const COLORS = {
  primary: '#D4AF37', // Dourado
  secondary: '#343434', // Carvão
  success: '#10B981',
  danger: '#EF4444',
  grid: '#e5e7eb'
};

// Componente Card de Estatística (Mantido igual)
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
    className="bg-white shadow-lg rounded-xl p-5 border-l-4 flex items-center justify-between hover:shadow-xl transition-shadow"
    style={{ borderLeftColor: corIcone }}
  >
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{titulo}</p>
      <p className="text-2xl font-bold text-carvao">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
    </div>
    <div className={`p-3 rounded-full bg-opacity-10`} style={{ backgroundColor: `${corIcone}20`, color: corIcone }}>
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
          getDashboardStats(),
          getDashboardCharts()
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

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dourado"></div></div>;

  return (
    <div className="space-y-8">
      <motion.h1 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="text-3xl font-bold text-carvao"
      >
        Visão Geral
      </motion.h1>

      {/* 1. Cartões de KPI (Mantidos e melhorados) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard titulo="Saldo Total" valor={stats.saldoTotal} icone={<DollarSign size={24} />} corIcone={COLORS.primary} delay={0.1} />
        <StatCard titulo="Vendas" valor={stats.totalVendas} icone={<TrendingUp size={24} />} corIcone={COLORS.success} delay={0.2} />
        <StatCard titulo="Despesas" valor={stats.totalDespesas} icone={<ArrowDownCircle size={24} />} corIcone={COLORS.danger} delay={0.3} />
        <StatCard titulo="Lucro Líquido" valor={stats.lucroLiquido} icone={<Activity size={24} />} corIcone={stats.lucroLiquido >= 0 ? COLORS.success : COLORS.danger} delay={0.4} />
      </div>

      {/* 2. Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Barras: Vendas 7 Dias */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-2"
        >
          <h3 className="text-lg font-bold text-carvao mb-6">Vendas dos Últimos 7 Dias</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <RechartsTooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="vendas" name="Vendas" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico de Pizza: Receita vs Despesa */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-lg border border-gray-100"
        >
          <h3 className="text-lg font-bold text-carvao mb-6">Balanço Financeiro</h3>
          <div className="h-[300px] w-full relative">
             {/* Total no Centro */}
             <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-xs text-gray-400 uppercase">Saldo</span>
                <span className={`text-xl font-bold ${stats.saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.saldoTotal >= 0 ? '+' : ''}{stats.saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
             </div>

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
                  <Cell key="cell-0" fill={COLORS.success} /> {/* Receitas */}
                  <Cell key="cell-1" fill={COLORS.danger} />  {/* Despesas */}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}