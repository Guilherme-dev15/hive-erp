"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrecificacaoPage = PrecificacaoPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
// --- (Os componentes Card e InputComIcone não mudam, continuam aqui em cima) ---
var Card = function (_a) {
    var children = _a.children, _b = _a.delay, delay = _b === void 0 ? 0 : _b;
    return (<framer_motion_1.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: delay }} className="bg-white shadow-lg rounded-lg p-4 sm:p-6 border border-transparent">
    {children}
  </framer_motion_1.motion.div>);
};
var InputComIcone = function (_a) {
    var icone = _a.icone, _b = _a.step, step = _b === void 0 ? "0.01" : _b, props = __rest(_a, ["icone", "step"]);
    return (<div className="relative">
    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
      {icone}
    </span>
    <input {...props} type="number" step={step} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado"/>
  </div>);
};
// Componente Principal da Página
function PrecificacaoPage() {
    // Campos do formulário
    var _a = (0, react_1.useState)(''), custoProduto = _a[0], setCustoProduto = _a[1];
    var _b = (0, react_1.useState)(''), custoFrete = _b[0], setCustoFrete = _b[1];
    var _c = (0, react_1.useState)(''), custoEmbalagem = _c[0], setCustoEmbalagem = _c[1];
    var _d = (0, react_1.useState)(''), taxaCartao = _d[0], setTaxaCartao = _d[1]; // Taxa da maquininha (%)
    var _e = (0, react_1.useState)(''), markup = _e[0], setMarkup = _e[1]; // Margem (Markup) desejada (%)
    // Onde guardamos o resultado
    var _f = (0, react_1.useState)(null), resultado = _f[0], setResultado = _f[1];
    var calcularPreco = function (e) {
        e.preventDefault();
        var nCustoProduto = parseFloat(custoProduto) || 0;
        var nCustoFrete = parseFloat(custoFrete) || 0;
        var nCustoEmbalagem = parseFloat(custoEmbalagem) || 0;
        var nTaxaCartao = parseFloat(taxaCartao) || 0;
        var nMarkup = parseFloat(markup) || 0; // Mudei o nome da variável
        if (nCustoProduto <= 0) {
            react_hot_toast_1.toast.error("O Custo do Produto é obrigatório para o cálculo.");
            return;
        }
        if (nMarkup <= 0) {
            react_hot_toast_1.toast.error("A % de Markup é obrigatória.");
            return;
        }
        // --- INÍCIO DA LÓGICA REATORADA (MARKUP) ---
        // 1. Custo Total de Aquisição (Quanto você gasta)
        var custoTotal = nCustoProduto + nCustoFrete + nCustoEmbalagem;
        // 2. Lucro Bruto Desejado (O seu "200% em cima")
        // (Ex: 74 * (200 / 100) = 148)
        var lucroBruto = custoTotal * (nMarkup / 100);
        // 3. Preço de Venda (Custo + Lucro)
        var precoAntesDeTaxas = custoTotal + lucroBruto;
        // 4. Calcular o Preço de Venda Sugerido (A fórmula "híbrida" nova)
        // Preço Final = (Custo + Lucro) / (1 - (%Taxa / 100))
        // Isto garante que o seu 'lucroBruto' (ex: R$ 148) seja preservado
        // mesmo DEPOIS de pagar a taxa da maquininha.
        var divisorTaxa = 1 - (nTaxaCartao / 100);
        if (divisorTaxa <= 0) {
            react_hot_toast_1.toast.error("A Taxa da Maquininha não pode ser 100% ou mais.");
            return;
        }
        var precoVendaSugerido = precoAntesDeTaxas / divisorTaxa;
        // 5. Valor da Taxa (para mostrar no resultado)
        var taxaValor = precoVendaSugerido * (nTaxaCartao / 100);
        // --- FIM DA LÓGICA REATORADA ---
        setResultado({
            custoTotal: custoTotal,
            lucroBruto: lucroBruto, // Este é o lucro líquido antes de impostos (ex: R$ 148,00)
            precoVendaSugerido: precoVendaSugerido,
            taxaValor: taxaValor,
        });
    };
    return (<>
      <react_hot_toast_1.Toaster position="top-right"/>
      <framer_motion_1.motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-3xl font-bold text-carvao mb-6">
        Simulador de Precificação
      </framer_motion_1.motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda: Formulário de Cálculo */}
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={calcularPreco} className="space-y-4">
              <h2 className="text-xl font-semibold text-carvao">Custos Diretos (Quanto você paga)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputComIcone icone={<lucide_react_1.DollarSign size={18}/>} placeholder="Custo do Produto" value={custoProduto} onChange={function (e) { return setCustoProduto(e.target.value); }} step="0.01" required/>
                <InputComIcone icone={<lucide_react_1.Download size={18}/>} placeholder="Frete (por item)" value={custoFrete} onChange={function (e) { return setCustoFrete(e.target.value); }} step="0.01"/>
                <InputComIcone icone={<lucide_react_1.Package size={18}/>} placeholder="Embalagem" value={custoEmbalagem} onChange={function (e) { return setCustoEmbalagem(e.target.value); }} step="0.01"/>
              </div>

              <hr className="my-4"/>
              
              <h2 className="text-xl font-semibold text-carvao">Taxas e Markup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputComIcone icone={<lucide_react_1.CreditCard size={18}/>} placeholder="Taxa Maquininha (%)" value={taxaCartao} onChange={function (e) { return setTaxaCartao(e.target.value); }} step="0.1"/>
                
                {/* --- MUDANÇA NO NOME DO CAMPO --- */}
                <InputComIcone icone={<lucide_react_1.Percent size={18}/>} placeholder="Markup / % em Cima do Custo" value={markup} onChange={function (e) { return setMarkup(e.target.value); }} step="1" required/>
                
              </div>
              
              <button type="submit" className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-white font-semibold transition-colors bg-carvao hover:bg-gray-700 transform hover:scale-[1.01]">
                <lucide_react_1.Calculator size={20} className="mr-2"/> Calcular Preço
              </button>
            </form>
          </Card>
        </div>

        {/* Coluna da Direita: Resultados */}
        <div className="lg:col-span-1 space-y-4">
          <Card delay={0.1}>
            <h2 className="text-xl font-semibold mb-4 text-carvao">Resultado</h2>
            {resultado ? (<div className="space-y-4">
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

              </div>) : (<div className="h-48 flex items-center justify-center bg-off-white rounded-lg">
                <p className="text-gray-500 text-center">Preencha os dados ao lado para calcular.</p>
              </div>)}
          </Card>
        </div>
      </div>
    </>);
}
