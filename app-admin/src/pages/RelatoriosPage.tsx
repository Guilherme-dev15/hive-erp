import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, AlertTriangle, Package, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import { getAdminProdutos } from '../services/apiService';
import type { ProdutoAdmin } from '../types';

// Utilitário
const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function RelatoriosPage() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const data = await getAdminProdutos();
        setProdutos(data);
      } catch (e) {
        toast.error("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  // --- CÁLCULOS (Engine de Relatórios) ---
  const { curvaABC, resumoEstoque } = useMemo(() => {
    if (produtos.length === 0) return { curvaABC: [], resumoEstoque: { totalItens: 0, valorTotal: 0, produtosZerados: 0 } };

    // 1. Resumo de Estoque
    const resumo = produtos.reduce((acc, p) => {
      const qtd = Number(p.quantity) || 0;
      const preco = Number(p.salePrice) || 0;
      
      acc.totalItens += qtd;
      acc.valorTotal += (qtd * preco);
      if (qtd === 0) acc.produtosZerados++;
      
      return acc;
    }, { totalItens: 0, valorTotal: 0, produtosZerados: 0 });

    // 2. Curva ABC (Simulada baseada em Estoque x Preço, idealmente seria Vendas)
    // Ordena por valor total em estoque (Potencial de Venda)
    const sorted = [...produtos].sort((a, b) => {
        const valA = (a.salePrice || 0) * (a.quantity || 0);
        const valB = (b.salePrice || 0) * (b.quantity || 0);
        return valB - valA;
    });

    const totalValor = resumo.valorTotal || 1; // Evita divisão por zero
    let acumulado = 0;

    const abc = sorted.map(p => {
       const valorEstoque = (p.salePrice || 0) * (p.quantity || 0);
       acumulado += valorEstoque;
       const percentual = (acumulado / totalValor) * 100;
       
       let classif = 'C';
       if (percentual <= 80) classif = 'A';
       else if (percentual <= 95) classif = 'B';
       
       return {
         ...p,
         valorEstoque,
         classificacao: classif
       };
    });

    return { curvaABC: abc, resumoEstoque: resumo };
  }, [produtos]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-dourado"/></div>;

  return (
    <div className="space-y-6 pb-10">
      <Toaster position="top-right"/>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-carvao">Relatórios & Inteligência</h1>
          <p className="text-gray-500 text-sm">Análise de estoque e curva ABC.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
           <Download size={18}/> Exportar CSV
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Valor em Estoque</p>
              <p className="text-2xl font-bold text-carvao">{formatCurrency(resumoEstoque.valorTotal)}</p>
           </div>
           <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSignIcon/></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Total de Peças</p>
              <p className="text-2xl font-bold text-carvao">{resumoEstoque.totalItens}</p>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24}/></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Produtos Esgotados</p>
              <p className="text-2xl font-bold text-red-600">{resumoEstoque.produtosZerados}</p>
           </div>
           <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertTriangle size={24}/></div>
        </div>
      </div>

      {/* Tabela Curva ABC */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
           <h3 className="font-bold text-gray-800 flex items-center gap-2"><TrendingUp size={18} className="text-dourado"/> Curva ABC (Potencial de Venda)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Classificação</th>
                <th className="px-4 py-3 text-right">Preço</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3 text-right">Valor em Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {curvaABC.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      p.classificacao === 'A' ? 'bg-green-100 text-green-800' :
                      p.classificacao === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      Classe {p.classificacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3 text-center">{p.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-carvao">{formatCurrency(p.valorEstoque)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Icon Helper
const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
);