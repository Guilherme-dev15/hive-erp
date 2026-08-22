import { useState, useEffect } from 'react';
import {
  Loader2,
  Download,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getABCReport } from '../services/apiService';
import { ABCReport } from '../types';

// Utilitário
const formatCurrency = (val: number): string =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RelatoriosPage() {
  const [report, setReport] = useState<ABCReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const data = await getABCReport();
        setReport(data);
      } catch (e) {
        console.error("Erro ao carregar dados para relatórios:", e);
        toast.error('Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  if (loading || !report) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  const { curvaABC, resumoEstoque } = report;

  return (
    <div className="space-y-6 pb-20">
      <Toaster position="top-right" />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Relatórios & Estoque
        </h1>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm font-medium">
          <Download size={20} />
          Exportar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Itens em Estoque</p>
            <p className="text-2xl font-bold text-gray-900">
              {resumoEstoque.totalItens}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor Total Estoque</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(resumoEstoque.valorTotal)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-full">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Produtos Zerados</p>
            <p className="text-2xl font-bold text-gray-900">
              {resumoEstoque.produtosZerados}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-600" /> Curva ABC de
            Estoque
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="p-4 pl-6 font-semibold">Produto</th>
                <th className="p-4 font-semibold text-center">Classificação</th>
                <th className="p-4 text-right font-semibold">Quantidade</th>
                <th className="p-4 pr-6 text-right font-semibold">
                  Valor Estoque
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {curvaABC.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 pl-6 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.classificacao === 'A'
                          ? 'bg-emerald-100 text-emerald-700'
                          : p.classificacao === 'B'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Classe {p.classificacao}
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    {p.quantity} un
                  </td>
                  <td className="p-4 pr-6 text-right font-bold text-gray-900">
                    {formatCurrency(p.valorEstoque)}
                  </td>
                </tr>
              ))}
              {curvaABC.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    Nenhum produto em estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
