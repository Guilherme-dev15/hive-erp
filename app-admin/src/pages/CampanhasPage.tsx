import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingDown, TrendingUp, AlertTriangle, ShieldCheck, 
  Zap, Save, RotateCcw, Loader2, DollarSign, Percent 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { simulateCampaign, applyCampaign, revertCampaign } from '../services/apiService';
import { formatCurrency } from '../utils/format';

export function CampanhasPage() {
  // Estados do Formulário
  const [discount, setDiscount] = useState(10); // Começa com 10%
  const [minMarkup, setMinMarkup] = useState(1.2); // Padrão: 20% acima do custo
  const [campaignName, setCampaignName] = useState('Promoção Relâmpago');
  
  // Estados de Controle
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [mode, setMode] = useState<'simulation' | 'applied'>('simulation');

  // 1. FUNÇÃO DE SIMULAR (O Cérebro)
  const handleSimulate = async () => {
    setLoading(true);
    try {
      const stats = await simulateCampaign(discount, minMarkup);
      setSimulation(stats);
      toast.success("Cenário calculado com sucesso!");
    } catch (error) {
      toast.error("Erro ao simular.");
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNÇÃO DE APLICAR (O Perigo)
  const handleApply = async () => {
    if (!confirm(`TEM CERTEZA? Isso vai aplicar ${discount}% de desconto em TODO o site.`)) return;
    
    setLoading(true);
    try {
      await applyCampaign(discount, minMarkup, campaignName);
      toast.success("Campanha aplicada! Os preços foram atualizados.");
      setMode('applied');
    } catch (error) {
      toast.error("Erro ao aplicar campanha.");
    } finally {
      setLoading(false);
    }
  };

  // 3. FUNÇÃO DE REVERTER (O Resgate)
  const handleRevert = async () => {
    if (!confirm("Isso vai remover todas as promoções e voltar aos preços originais.")) return;

    setLoading(true);
    try {
      const res = await revertCampaign();
      toast.success(res.message);
      setSimulation(null);
      setMode('simulation');
    } catch (error) {
      toast.error("Erro ao reverter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" />
            Central de Campanhas
          </h1>
          <p className="text-gray-500">Gestão de preços em massa com trava de segurança anti-prejuízo.</p>
        </div>
        
        {mode === 'simulation' ? (
           <button 
             onClick={handleRevert}
             className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
           >
             <RotateCcw size={16} /> Resetar Preços Originais
           </button>
        ) : (
           <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 animate-pulse">
              <ShieldCheck size={18} /> CAMPANHA ATIVA
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === COLUNA 1: CONTROLES === */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 h-fit">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <TrendingDown size={20} /> Configurar Desconto
          </h2>

          {/* Slider de Desconto */}
          <div className="space-y-2">
             <div className="flex justify-between font-bold">
               <span>Desconto Global</span>
               <span className="text-blue-600 text-xl">{discount}% OFF</span>
             </div>
             <input 
               type="range" 
               min="0" max="90" step="5"
               value={discount}
               onChange={(e) => setDiscount(Number(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               disabled={mode === 'applied'}
             />
             <div className="flex justify-between text-xs text-gray-400 px-1">
               <span>0%</span>
               <span>50%</span>
               <span>90%</span>
             </div>
          </div>

          {/* Trava de Segurança */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
             <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                <ShieldCheck size={16} /> Trava de Segurança (Markup)
             </div>
             <p className="text-xs text-orange-600 leading-relaxed">
               O sistema <strong>impedirá</strong> que o preço de venda fique abaixo do (Custo x Fator). 
               Ex: 1.0 = Preço de Custo. 1.2 = Custo + 20%.
             </p>
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 step="0.1" 
                 min="1.0"
                 value={minMarkup}
                 onChange={(e) => setMinMarkup(Number(e.target.value))}
                 className="w-full p-2 rounded-lg border border-orange-200 text-center font-bold text-gray-700"
                 disabled={mode === 'applied'}
               />
             </div>
          </div>

          {/* Nome da Campanha */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Nome da Campanha</label>
            <input 
              type="text" 
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mt-1 font-medium"
              placeholder="Ex: Black Friday"
              disabled={mode === 'applied'}
            />
          </div>

          <button 
            onClick={handleSimulate}
            disabled={loading || mode === 'applied'}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Percent size={18} />}
            {mode === 'applied' ? 'Campanha Já Aplicada' : '1. Simular Impacto'}
          </button>
        </div>

        {/* === COLUNA 2 e 3: RESULTADOS === */}
        <div className="lg:col-span-2 space-y-6">
          
          {!simulation ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
               <Zap size={48} className="mb-4 opacity-20" />
               <p>Configure o desconto e clique em "Simular" para ver o futuro.</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
               {/* 1. Resumo do Impacto */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-gray-400 uppercase font-bold">Produtos Afetados</p>
                     <p className="text-2xl font-black text-gray-800 mt-1">{simulation.affectedProducts}</p>
                     <p className="text-xs text-green-500 mt-1">vão receber desconto</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-gray-400 uppercase font-bold">Bloqueados (Segurança)</p>
                     <p className="text-2xl font-black text-orange-500 mt-1">{simulation.skippedProducts}</p>
                     <p className="text-xs text-orange-400 mt-1">protegidos pelo markup mín.</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                     <p className="text-xs text-gray-400 uppercase font-bold">Markup Médio (Loja)</p>
                     <div className="flex items-end gap-2 mt-1">
                        <span className="text-gray-400 text-sm line-through">{Number(simulation.currentAvgMarkup).toFixed(2)}</span>
                        <span className="text-2xl font-black text-blue-600">→ {Number(simulation.projectedAvgMarkup).toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               {/* 2. Gráfico de Barras Financeiro */}
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <DollarSign size={18} /> Projeção Financeira
                  </h3>
                  
                  {/* Faturamento */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Faturamento Potencial (Venda Total)</span>
                      <span className="font-bold text-gray-800">{formatCurrency(simulation.projectedRevenue)}</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex relative">
                       {/* Barra Atual (Fundo) */}
                       <div className="absolute top-0 left-0 h-full bg-gray-300 w-full opacity-30"></div>
                       {/* Barra Projetada */}
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(simulation.projectedRevenue / simulation.currentRevenue) * 100}%` }}
                         className="h-full bg-blue-500 rounded-full"
                       />
                    </div>
                    <p className="text-xs text-right text-red-500 mt-1 font-medium">
                       Queda de {formatCurrency(simulation.currentRevenue - simulation.projectedRevenue)}
                    </p>
                  </div>

                  {/* Lucro Líquido */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Lucro Líquido Estimado</span>
                      <span className="font-bold text-green-600">{formatCurrency(simulation.projectedProfit)}</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex relative">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(simulation.projectedProfit / simulation.currentProfit) * 100}%` }}
                         className={`h-full rounded-full ${simulation.projectedProfit > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                       />
                    </div>
                    {simulation.projectedProfit <= 0 && (
                        <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold">
                           <AlertTriangle size={14} /> ALERTA: Esta promoção pode gerar PREJUÍZO operacional.
                        </div>
                    )}
                  </div>
               </div>

               {/* 3. AÇÃO FINAL */}
               {mode === 'simulation' ? (
                 <div className="flex justify-end pt-4">
                    <button 
                      onClick={handleApply}
                      disabled={loading || simulation.projectedProfit <= 0}
                      className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                      <Zap size={20} />
                      2. APLICAR CAMPANHA AGORA
                    </button>
                 </div>
               ) : (
                 <div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-center">
                    <h3 className="text-green-800 font-bold text-lg mb-2">Campanha Ativa com Sucesso!</h3>
                    <p className="text-green-600 mb-4">Os preços no catálogo já estão atualizados. Para encerrar, clique em reverter.</p>
                    <button 
                      onClick={handleRevert}
                      className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors inline-flex items-center gap-2"
                    >
                      <RotateCcw size={18} /> Encerrar Campanha (Reverter)
                    </button>
                 </div>
               )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}