/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DashboardStats } from '../types';
import { getDashboardStats } from '../services/apiService';
import { TrendingUp, ArrowDownCircle, DollarSign, Activity, type LucideProps } from 'lucide-react'; // Ícones

// Componente Card de Estatística (um card pequeno e reutilizável)
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
    className="bg-white shadow-lg rounded-lg p-5 border-l-4"
    style={{ borderLeftColor: corIcone }} // Borda colorida
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase">{titulo}</p>
        <p className="text-3xl font-bold text-carvao">R$ {valor.toFixed(2)}</p>
      </div>
      <div className={`p-3 rounded-full`} style={{ backgroundColor: `${corIcone}20` }}> 
        {/* Usamos a cor do ícone com 20% de opacidade para o fundo */}
        {React.cloneElement(icone, { color: corIcone } as LucideProps)}
      </div>
    </div>
  </motion.div>
);

// Componente Principal da Página
export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarStats() {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError("Falha ao carregar estatísticas do dashboard.");
      } finally {
        setLoading(false);
      }
    }
    carregarStats();
  }, []);

  if (loading) return <div>A carregar dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return <div className="text-gray-500">Nenhuma estatística encontrada.</div>;

  return (
    <div className="space-y-6">
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-carvao"
      >
        Dashboard
      </motion.h1>

      {/* Grelha de Cartões de Estatística */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          titulo="Saldo Total"
          valor={stats.saldoTotal}
          icone={<DollarSign size={24} />}
          corIcone="#D4AF37" // Dourado
          delay={0.1}
        />
        <StatCard
          titulo="Total Vendas"
          valor={stats.totalVendas}
          icone={<TrendingUp size={24} />}
          corIcone="#10B981" // Verde Esmeralda
          delay={0.2}
        />
         <StatCard
          titulo="Total Despesas"
          valor={stats.totalDespesas} // Já é negativo
          icone={<ArrowDownCircle size={24} />}
          corIcone="#EF4444" // Vermelho
          delay={0.3}
        />
        <StatCard
          titulo="Lucro Líquido"
          valor={stats.lucroLiquido}
          icone={<Activity size={24} />}
          corIcone={stats.lucroLiquido >= 0 ? "#10B981" : "#EF4444"} // Verde ou Vermelho
          delay={0.4}
        />
      </div>

      {/* Placeholder para o Gráfico Futuro */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className="bg-white shadow-lg rounded-lg p-6 border border-transparent"
      >
        <h2 className="text-xl font-semibold mb-4 text-carvao">Performance Financeira</h2>
        <div className="h-64 flex items-center justify-center bg-off-white rounded">
          <p className="text-gray-500">(Gráfico de Lucro vs Despesas virá aqui - Requer 'recharts')</p>
        </div>
      </motion.div>
    </div>
  );
}