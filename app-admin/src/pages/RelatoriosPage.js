"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelatoriosPage = RelatoriosPage;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
// Utilitário
var formatCurrency = function (val) { return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
function RelatoriosPage() {
    var _a = (0, react_1.useState)([]), produtos = _a[0], setProdutos = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    (0, react_1.useEffect)(function () {
        function carregarDados() {
            return __awaiter(this, void 0, void 0, function () {
                var data, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, 3, 4]);
                            setLoading(true);
                            return [4 /*yield*/, (0, apiService_1.getAdminProdutos)()];
                        case 1:
                            data = _a.sent();
                            setProdutos(data);
                            return [3 /*break*/, 4];
                        case 2:
                            e_1 = _a.sent();
                            react_hot_toast_1.toast.error("Erro ao carregar dados.");
                            return [3 /*break*/, 4];
                        case 3:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        carregarDados();
    }, []);
    // --- CÁLCULOS (Engine de Relatórios) ---
    var _c = (0, react_1.useMemo)(function () {
        if (produtos.length === 0)
            return { curvaABC: [], resumoEstoque: { totalItens: 0, valorTotal: 0, produtosZerados: 0 } };
        // 1. Resumo de Estoque
        var resumo = produtos.reduce(function (acc, p) {
            var qtd = Number(p.quantity) || 0;
            var preco = Number(p.salePrice) || 0;
            acc.totalItens += qtd;
            acc.valorTotal += (qtd * preco);
            if (qtd === 0)
                acc.produtosZerados++;
            return acc;
        }, { totalItens: 0, valorTotal: 0, produtosZerados: 0 });
        // 2. Curva ABC (Simulada baseada em Estoque x Preço, idealmente seria Vendas)
        // Ordena por valor total em estoque (Potencial de Venda)
        var sorted = __spreadArray([], produtos, true).sort(function (a, b) {
            var valA = (a.salePrice || 0) * (a.quantity || 0);
            var valB = (b.salePrice || 0) * (b.quantity || 0);
            return valB - valA;
        });
        var totalValor = resumo.valorTotal || 1; // Evita divisão por zero
        var acumulado = 0;
        var abc = sorted.map(function (p) {
            var valorEstoque = (p.salePrice || 0) * (p.quantity || 0);
            acumulado += valorEstoque;
            var percentual = (acumulado / totalValor) * 100;
            var classif = 'C';
            if (percentual <= 80)
                classif = 'A';
            else if (percentual <= 95)
                classif = 'B';
            return __assign(__assign({}, p), { valorEstoque: valorEstoque, classificacao: classif });
        });
        return { curvaABC: abc, resumoEstoque: resumo };
    }, [produtos]), curvaABC = _c.curvaABC, resumoEstoque = _c.resumoEstoque;
    if (loading)
        return <div className="flex justify-center p-10"><lucide_react_1.Loader2 className="animate-spin text-dourado"/></div>;
    return (<div className="space-y-6 pb-10">
      <react_hot_toast_1.Toaster position="top-right"/>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-carvao">Relatórios & Inteligência</h1>
          <p className="text-gray-500 text-sm">Análise de estoque e curva ABC.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
           <lucide_react_1.Download size={18}/> Exportar CSV
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Valor em Estoque</p>
              <p className="text-2xl font-bold text-carvao">{formatCurrency(resumoEstoque.valorTotal)}</p>
           </div>
           <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSignIcon /></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Total de Peças</p>
              <p className="text-2xl font-bold text-carvao">{resumoEstoque.totalItens}</p>
           </div>
           <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><lucide_react_1.Package size={24}/></div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-gray-500 text-xs font-bold uppercase">Produtos Esgotados</p>
              <p className="text-2xl font-bold text-red-600">{resumoEstoque.produtosZerados}</p>
           </div>
           <div className="p-3 bg-red-50 text-red-600 rounded-lg"><lucide_react_1.AlertTriangle size={24}/></div>
        </div>
      </div>

      {/* Tabela Curva ABC */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
           <h3 className="font-bold text-gray-800 flex items-center gap-2"><lucide_react_1.TrendingUp size={18} className="text-dourado"/> Curva ABC (Potencial de Venda)</h3>
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
              {curvaABC.map(function (p) { return (<tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={"px-2 py-1 rounded text-xs font-bold ".concat(p.classificacao === 'A' ? 'bg-green-100 text-green-800' :
                p.classificacao === 'B' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800')}>
                      Classe {p.classificacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3 text-center">{p.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold text-carvao">{formatCurrency(p.valorEstoque)}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
// Icon Helper
var DollarSignIcon = function () { return (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>); };
