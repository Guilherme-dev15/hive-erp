import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Percent, Package, CreditCard, DollarSign, Download } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// --- (Os componentes Card e InputComIcone não mudam, continuam aqui em cima) ---
const Card = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent"
  >
    {children}
  </motion.div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icone: React.ReactNode;
  step?: string;
}

const InputComIcone = ({ icone, step = "0.01", ...props }: InputProps) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
      {icone}
    </span>
    <input
      {...props}
      type="number"
      step={step}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"
    />
  </div>
);
// --- (Fim dos componentes reutilizáveis) ---


// Interface para guardar os resultados do cálculo
interface ResultadoPrecificacao {
  custoTotal: number;
  lucroBruto: number;
  precoVendaSugerido: number;
  taxaValor: number;
}

// Componente Principal da Página
export function PrecificacaoPage() {
  // Campos do formulário
  const [custoProduto, setCustoProduto] = useState('');
  const [custoFrete, setCustoFrete] = useState('');
  const [custoEmbalagem, setCustoEmbalagem] = useState('');
  const [taxaCartao, setTaxaCartao] = useState(''); // Taxa da maquininha (%)
  const [markup, setMarkup] = useState(''); // Margem (Markup) desejada (%)

  // Onde guardamos o resultado
  const [resultado, setResultado] = useState<ResultadoPrecificacao | null>(null);

  const calcularPreco = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nCustoProduto = parseFloat(custoProduto) || 0;
    const nCustoFrete = parseFloat(custoFrete) || 0;
    const nCustoEmbalagem = parseFloat(custoEmbalagem) || 0;
    const nTaxaCartao = parseFloat(taxaCartao) || 0;
    const nMarkup = parseFloat(markup) || 0; // Mudei o nome da variável

    if (nCustoProduto <= 0) {
      toast.error("O Custo do Produto é obrigatório para o cálculo.");
      return;
    }
    
    if (nMarkup <= 0) {
      toast.error("A % de Markup é obrigatória.");
      return;
    }

    // --- INÍCIO DA LÓGICA REATORADA (MARKUP) ---

    // 1. Custo Total de Aquisição (Quanto você gasta)
    const custoTotal = nCustoProduto + nCustoFrete + nCustoEmbalagem;

    // 2. Lucro Bruto Desejado (O seu "200% em cima")
    // (Ex: 74 * (200 / 100) = 148)
    const lucroBruto = custoTotal * (nMarkup / 100);

    // 3. Preço de Venda (Custo + Lucro)
    const precoAntesDeTaxas = custoTotal + lucroBruto;
    
    // 4. Calcular o Preço de Venda Sugerido (A fórmula "híbrida" nova)
    // Preço Final = (Custo + Lucro) / (1 - (%Taxa / 100))
    // Isto garante que o seu 'lucroBruto' (ex: R$ 148) seja preservado
    // mesmo DEPOIS de pagar a taxa da maquininha.
    const divisorTaxa = 1 - (nTaxaCartao / 100);

    if (divisorTaxa <= 0) {
      toast.error("A Taxa da Maquininha não pode ser 100% ou mais.");
      return;
    }
    
    const precoVendaSugerido = precoAntesDeTaxas / divisorTaxa;

    // 5. Valor da Taxa (para mostrar no resultado)
    const taxaValor = precoVendaSugerido * (nTaxaCartao / 100);
    
    // --- FIM DA LÓGICA REATORADA ---

    setResultado({
      custoTotal,
      lucroBruto, // Este é o lucro líquido antes de impostos (ex: R$ 148,00)
      precoVendaSugerido,
      taxaValor,
    });
  };

  return (
    <>
      <Toaster position="top-right" />
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-3xl font-bold text-carvao mb-6"
      >
        Simulador de Precificação
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda: Formulário de Cálculo */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={calcularPreco} className="space-y-4">
              <h2 className="text-xl font-semibold text-carvao">Custos Diretos (Quanto você paga)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputComIcone icone={<DollarSign size={18} />} placeholder="Custo do Produto" value={custoProduto} onChange={(e) => setCustoProduto(e.target.value)} step="0.01" required />
                <InputComIcone icone={<Download size={18} />} placeholder="Frete (por item)" value={custoFrete} onChange={(e) => setCustoFrete(e.target.value)} step="0.01" />
                <InputComIcone icone={<Package size={18} />} placeholder="Embalagem" value={custoEmbalagem} onChange={(e) => setCustoEmbalagem(e.target.value)} step="0.01" />
              </div>

              <hr className="my-4" />
              
              <h2 className="text-xl font-semibold text-carvao">Taxas e Markup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputComIcone icone={<CreditCard size={18} />} placeholder="Taxa Maquininha (%)" value={taxaCartao} onChange={(e) => setTaxaCartao(e.target.value)} step="0.1" />
                
                {/* --- MUDANÇA NO NOME DO CAMPO --- */}
                <InputComIcone 
                  icone={<Percent size={18} />} 
                  placeholder="Markup / % em Cima do Custo" 
                  value={markup} 
                  onChange={(e) => setMarkup(e.target.value)} 
                  step="1" 
                  required 
                />
                
              </div>
              
              <button 
                type="submit" 
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-semibold transition-colors bg-carvao hover:bg-gray-700 transform hover:scale-[1.01]"
              >
                <Calculator size={20} className="mr-2" /> Calcular Preço
              </button>
            </form>
          </Card>
        </div>

        {/* Coluna da Direita: Resultados */}
        <div className="lg:col-span-1 space-y-4">
          <Card delay={0.1}>
            <h2 className="text-xl font-semibold mb-4 text-carvao">Resultado</h2>
            {resultado ? (
              <div className="space-y-4">
                {/* Preço de Venda Sugerido */}
                <div className="bg-dourado/10 p-4 rounded-lg text-center border border-dourado">
                  <p className="text-sm font-medium text-carvao uppercase">Preço de Venda Sugerido</p>
                  <p className="text-4xl font-bold text-carvao">
                    R$ {resultado.precoVendaSugerido.toFixed(2)}
                  </p>
                </div>
                
                {/* Detalhes */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Custo Total (Produto + Frete + Embalagem):</span>
                    <span className="font-medium text-red-600">- R$ {resultado.custoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Taxa da Maquininha ({taxaCartao || 0}%):</span>
                    <span className="font-medium text-red-600">- R$ {resultado.taxaValor.toFixed(2)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-gray-900 font-bold">
                    <span>LUCRO (Seu {markup}% de Markup):</span>
                    <span className="text-green-600">+ R$ {resultado.lucroBruto.toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-48 flex items-center justify-center bg-off-white rounded-lg">
                <p className="text-gray-500 text-center">Preencha os dados ao lado para calcular.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}