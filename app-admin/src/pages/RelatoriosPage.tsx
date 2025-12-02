import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Package, Award } from 'lucide-react';
import { getABCReport } from '../services/apiService';
import { type ABCProduct } from '../types';
import { toast, Toaster } from 'react-hot-toast';

const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Componente de Badge para a Classe
const ClassBadge = ({ classification }: { classification: string }) => {
  const colors = {
    'A': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'B': 'bg-gray-100 text-gray-700 border-gray-200',
    'C': 'bg-red-50 text-red-700 border-red-100'
  };
  const labels = {
    'A': 'Classe A (Ouro)',
    'B': 'Classe B (Prata)',
    'C': 'Classe C (Atenção)'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[classification as keyof typeof colors]}`}>
      {labels[classification as keyof typeof labels]}
    </span>
  );
};

export function RelatoriosPage() {
  const [data, setData] = useState<ABCProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const report = await getABCReport();
        setData(report);
      } catch (error) {
        toast.error("Erro ao carregar relatório.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-dourado" size={40} /></div>;

  return (
    <div className="space-y-8 pb-10">
      <Toaster position="top-right" />
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-carvao">Inteligência de Vendas</h1>
        <p className="text-gray-500 mt-1">Descubra quais produtos pagam as suas contas (Curva ABC).</p>
      </motion.div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-400 flex items-center gap-4">
           <div className="p-3 bg-yellow-50 rounded-full text-yellow-600"><Award /></div>
           <div>
             <p className="text-xs text-gray-500 uppercase font-bold">Campeões de Venda (A)</p>
             <p className="text-xl font-bold text-carvao">{data.filter(i => i.classification === 'A').length} produtos</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-400 flex items-center gap-4">
           <div className="p-3 bg-gray-50 rounded-full text-gray-600"><Package /></div>
           <div>
             <p className="text-xs text-gray-500 uppercase font-bold">Regulares (B)</p>
             <p className="text-xl font-bold text-carvao">{data.filter(i => i.classification === 'B').length} produtos</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-400 flex items-center gap-4">
           <div className="p-3 bg-red-50 rounded-full text-red-600"><AlertCircle /></div>
           <div>
             <p className="text-xs text-gray-500 uppercase font-bold">Parados / Encalhe (C)</p>
             <p className="text-xl font-bold text-carvao">{data.filter(i => i.classification === 'C').length} produtos</p>
           </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs border-b">
              <tr>
                <th className="px-6 py-4">Classificação</th>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4 text-center">Un. Vendidas</th>
                <th className="px-6 py-4 text-right">Faturação Total</th>
                <th className="px-6 py-4 text-center">Stock Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <ClassBadge classification={item.classification} />
                  </td>
                  <td className="px-6 py-4 font-medium text-carvao flex items-center gap-3">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-300"><Package size={16} /></div>
                    )}
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-gray-600">{item.unitsSold}</td>
                  <td className="px-6 py-4 text-right font-bold text-carvao">{formatMoney(item.revenue)}</td>
                  <td className="px-6 py-4 text-center">
                    {item.stock === 0 ? (
                      <span className="text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded">ESGOTADO</span>
                    ) : (
                      <span className="text-gray-600 font-mono">{item.stock}</span>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">Sem dados de vendas suficientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}