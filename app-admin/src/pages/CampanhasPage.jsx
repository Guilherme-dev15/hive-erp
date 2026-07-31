"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampanhasPage = CampanhasPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
var format_1 = require("../utils/format");
function CampanhasPage() {
    var _this = this;
    // Estados do Formulário
    var _a = (0, react_1.useState)(10), discount = _a[0], setDiscount = _a[1]; // Começa com 10%
    var _b = (0, react_1.useState)(1.2), minMarkup = _b[0], setMinMarkup = _b[1]; // Padrão: 20% acima do custo
    var _c = (0, react_1.useState)("Promoção Relâmpago"), campaignName = _c[0], setCampaignName = _c[1];
    // Estados de Controle
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    var _e = (0, react_1.useState)(null), simulation = _e[0], setSimulation = _e[1];
    var _f = (0, react_1.useState)("simulation"), mode = _f[0], setMode = _f[1];
    // 1. FUNÇÃO DE SIMULAR
    var handleSimulate = function () { return __awaiter(_this, void 0, void 0, function () {
        var stats, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.simulateCampaign)(discount, minMarkup)];
                case 2:
                    stats = _a.sent();
                    setSimulation(stats);
                    react_hot_toast_1.toast.success("Cenário calculado com sucesso!");
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao simular.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // 2. FUNÇÃO DE APLICAR
    var handleApply = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("TEM CERTEZA? Isso vai aplicar ".concat(discount, "% de desconto em TODO o site.")))
                        return [2 /*return*/];
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.applyCampaign)(discount, minMarkup, campaignName)];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Campanha aplicada! Os preços foram atualizados.");
                    setMode("applied");
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao aplicar campanha.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // 3. FUNÇÃO DE REVERTER
    var handleRevert = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Isso vai remover todas as promoções e voltar aos preços originais."))
                        return [2 /*return*/];
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.revertCampaign)()];
                case 2:
                    res = _a.sent();
                    react_hot_toast_1.toast.success(res.message);
                    setSimulation(null);
                    setMode("simulation");
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao reverter.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center gap-2">
            <lucide_react_1.Zap className="text-yellow-500 fill-yellow-500"/>
            Central de Campanhas
          </h1>
          <p className="text-gray-500">
            Gestão de preços em massa com trava de segurança anti-prejuízo.
          </p>
        </div>

        {mode === "simulation" ? (<button onClick={handleRevert} className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <lucide_react_1.RotateCcw size={16}/> Resetar Preços Originais
          </button>) : (<div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 animate-pulse">
            <lucide_react_1.ShieldCheck size={18}/> CAMPANHA ATIVA
          </div>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === COLUNA 1: CONTROLES === */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 h-fit">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <lucide_react_1.TrendingDown size={20}/> Configurar Desconto
          </h2>

          {/* Slider de Desconto */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold">
              <span>Desconto Global</span>
              <span className="text-blue-600 text-xl">{discount}% OFF</span>
            </div>
            <input type="range" min="0" max="90" step="5" value={discount} onChange={function (e) { return setDiscount(Number(e.target.value)); }} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" disabled={mode === "applied"}/>
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>0%</span>
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Trava de Segurança */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-3">
            <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
              <lucide_react_1.ShieldCheck size={16}/> Trava de Segurança (Markup)
            </div>
            <p className="text-xs text-orange-600 leading-relaxed">
              O sistema <strong>impedirá</strong> que o preço de venda fique
              abaixo do (Custo x Fator). Ex: 1.0 = Preço de Custo. 1.2 = Custo +
              20%.
            </p>
            <div className="flex items-center gap-2">
              <input type="number" step="0.1" min="1.0" value={minMarkup} onChange={function (e) { return setMinMarkup(Number(e.target.value)); }} className="w-full p-2 rounded-lg border border-orange-200 text-center font-bold text-gray-700" disabled={mode === "applied"}/>
            </div>
          </div>

          {/* Nome da Campanha */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">
              Nome da Campanha
            </label>
            <input type="text" value={campaignName} onChange={function (e) { return setCampaignName(e.target.value); }} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 mt-1 font-medium" placeholder="Ex: Black Friday" disabled={mode === "applied"}/>
          </div>

          <button onClick={handleSimulate} disabled={loading || mode === "applied"} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50">
            {loading ? (<lucide_react_1.Loader2 className="animate-spin"/>) : (<lucide_react_1.Percent size={18}/>)}
            {mode === "applied" ? "Campanha Já Aplicada" : "1. Simular Impacto"}
          </button>
        </div>

        {/* === COLUNA 2 e 3: RESULTADOS === */}
        <div className="lg:col-span-2 space-y-6">
          {!simulation ? (<div className="h-full min-h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <lucide_react_1.Zap size={48} className="mb-4 opacity-20"/>
              <p>
                Configure o desconto e clique em "Simular" para ver o futuro.
              </p>
            </div>) : (<framer_motion_1.motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* 1. Resumo do Impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Produtos Afetados
                  </p>
                  <p className="text-2xl font-black text-gray-800 mt-1">
                    {simulation.affectedProducts}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    vão receber desconto
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Bloqueados (Segurança)
                  </p>
                  <p className="text-2xl font-black text-orange-500 mt-1">
                    {simulation.skippedProducts}
                  </p>
                  <p className="text-xs text-orange-400 mt-1">
                    protegidos pelo markup mín.
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase font-bold">
                    Markup Médio (Loja)
                  </p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-gray-400 text-sm line-through">
                      {Number(simulation.currentAvgMarkup).toFixed(2)}
                    </span>
                    <span className="text-2xl font-black text-blue-600">
                      → {Number(simulation.projectedAvgMarkup).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Gráfico de Barras Financeiro */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <lucide_react_1.DollarSign size={18}/> Projeção Financeira
                </h3>

                {/* Faturamento */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      Faturamento Potencial (Venda Total)
                    </span>
                    <span className="font-bold text-gray-800">
                      {(0, format_1.formatCurrency)(simulation.projectedRevenue)}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex relative">
                    {/* Barra Atual (Fundo) */}
                    <div className="absolute top-0 left-0 h-full bg-gray-300 w-full opacity-30"></div>
                    {/* Barra Projetada */}
                    <framer_motion_1.motion.div initial={{ width: 0 }} animate={{
                width: "".concat((simulation.projectedRevenue / simulation.currentRevenue) * 100, "%"),
            }} className="h-full bg-blue-500 rounded-full"/>
                  </div>
                  <p className="text-xs text-right text-red-500 mt-1 font-medium">
                    Queda de{" "}
                    {(0, format_1.formatCurrency)(simulation.currentRevenue - simulation.projectedRevenue)}
                  </p>
                </div>

                {/* Lucro Líquido */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">
                      Lucro Líquido Estimado
                    </span>
                    <span className="font-bold text-green-600">
                      {(0, format_1.formatCurrency)(simulation.projectedProfit)}
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex relative">
                    <framer_motion_1.motion.div initial={{ width: 0 }} animate={{
                width: "".concat((simulation.projectedProfit / simulation.currentProfit) * 100, "%"),
            }} className={"h-full rounded-full ".concat(simulation.projectedProfit > 0 ? "bg-green-500" : "bg-red-500")}/>
                  </div>
                  {simulation.projectedProfit <= 0 && (<div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-xs font-bold">
                      <lucide_react_1.AlertTriangle size={14}/> ALERTA: Esta promoção pode
                      gerar PREJUÍZO operacional.
                    </div>)}
                </div>
              </div>

              {/* 3. AÇÃO FINAL */}
              {mode === "simulation" ? (<div className="flex justify-end pt-4">
                  <button onClick={handleApply} disabled={loading || simulation.projectedProfit <= 0} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                    <lucide_react_1.Zap size={20}/>
                    2. APLICAR CAMPANHA AGORA
                  </button>
                </div>) : (<div className="bg-green-50 border border-green-200 p-6 rounded-3xl text-center">
                  <h3 className="text-green-800 font-bold text-lg mb-2">
                    Campanha Ativa com Sucesso!
                  </h3>
                  <p className="text-green-600 mb-4">
                    Os preços no catálogo já estão atualizados. Para encerrar,
                    clique em reverter.
                  </p>
                  <button onClick={handleRevert} className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-50 transition-colors inline-flex items-center gap-2">
                    <lucide_react_1.RotateCcw size={18}/> Encerrar Campanha (Reverter)
                  </button>
                </div>)}
            </framer_motion_1.motion.div>)}
        </div>
      </div>
    </div>);
}
