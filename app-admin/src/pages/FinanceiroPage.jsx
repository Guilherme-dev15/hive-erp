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
exports.FinanceiroPage = FinanceiroPage;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var recharts_1 = require("recharts");
var apiService_1 = require("../services/apiService");
var format_1 = require("../utils/format");
// Variantes de animação (Padrão Cascata)
var containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
var itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
};
function FinanceiroPage() {
    var _this = this;
    var _a = (0, react_1.useState)([]), transactions = _a[0], setTransactions = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(''), searchTerm = _c[0], setSearchTerm = _c[1];
    // Estado do Formulário
    var _d = (0, react_1.useState)({
        description: '',
        amount: '',
        type: 'despesa',
        category: 'Geral'
    }), newTrans = _d[0], setNewTrans = _d[1];
    // --- CARREGAMENTO ---
    var carregar = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, apiService_1.apiClient.get('/admin/transactions')];
                case 1:
                    res = _a.sent();
                    setTransactions(res.data);
                    return [3 /*break*/, 4];
                case 2:
                    e_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao carregar finanças");
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () { carregar(); }, []);
    // --- CÁLCULOS EM TEMPO REAL ---
    var stats = (0, react_1.useMemo)(function () {
        return transactions.reduce(function (acc, t) {
            var val = Number(t.amount);
            var isEntrada = t.type === 'receita' || t.type === 'venda';
            if (isEntrada) {
                acc.entradas += val;
            }
            else {
                acc.saidas += Math.abs(val);
            }
            acc.saldo = acc.entradas - acc.saidas;
            return acc;
        }, { entradas: 0, saidas: 0, saldo: 0 });
    }, [transactions]);
    // --- DADOS PARA O GRÁFICO (Top 5 Categorias ou Simplificado) ---
    var chartData = (0, react_1.useMemo)(function () {
        return [
            { name: 'Entradas', value: stats.entradas, color: '#10b981' },
            { name: 'Saídas', value: stats.saidas, color: '#f43f5e' },
            { name: 'Saldo', value: stats.saldo, color: '#6366f1' },
        ];
    }, [stats]);
    // --- FILTRO DE BUSCA ---
    var filteredTransactions = (0, react_1.useMemo)(function () {
        return transactions.filter(function (t) {
            return t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [transactions, searchTerm]);
    // --- AÇÕES ---
    var handleAdd = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var payload_1, res_1, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!newTrans.description || !newTrans.amount) {
                        react_hot_toast_1.toast.error("Preencha descrição e valor");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    payload_1 = __assign(__assign({}, newTrans), { amount: parseFloat(newTrans.amount.replace(',', '.')), date: new Date().toISOString() });
                    return [4 /*yield*/, apiService_1.apiClient.post('/admin/transactions', payload_1)];
                case 2:
                    res_1 = _a.sent();
                    // Atualização Otimista
                    setTransactions(function (prev) { return __spreadArray([__assign({ id: res_1.data.id }, payload_1)], prev, true); });
                    setNewTrans({ description: '', amount: '', type: 'despesa', category: 'Geral' });
                    react_hot_toast_1.toast.success("Lançamento registrado!");
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao salvar");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Excluir este lançamento?"))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, apiService_1.apiClient.delete("/admin/transactions/".concat(id))];
                case 2:
                    _a.sent();
                    setTransactions(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
                    react_hot_toast_1.toast.success("Excluído com sucesso");
                    return [3 /*break*/, 4];
                case 3:
                    e_3 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao excluir");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (<div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-400 font-medium text-sm animate-pulse">Carregando financeiro...</p>
        </div>
      </div>);
    }
    return (<framer_motion_1.motion.div className="space-y-6 pb-20" variants={containerVariants} initial="hidden" animate="visible">
      <react_hot_toast_1.Toaster position="top-right"/>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie entradas e saídas manualmente.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
           <lucide_react_1.Download size={16}/> Exportar Extrato
        </button>
      </div>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatsCard title="Saldo Atual" value={stats.saldo} icon={<lucide_react_1.Wallet size={24} className="text-white"/>} bgClass="bg-indigo-600" textClass="text-white" subTextClass="text-indigo-200"/>
        <StatsCard title="Total Receitas" value={stats.entradas} icon={<lucide_react_1.ArrowUpRight size={24} className="text-emerald-600"/>} bgClass="bg-white" textClass="text-gray-900" subTextClass="text-gray-400" borderClass="border-emerald-100" iconBg="bg-emerald-50"/>
        <StatsCard title="Total Despesas" value={stats.saidas} icon={<lucide_react_1.ArrowDownRight size={24} className="text-rose-600"/>} bgClass="bg-white" textClass="text-gray-900" subTextClass="text-gray-400" borderClass="border-rose-100" iconBg="bg-rose-50"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: FORMULÁRIO + GRÁFICO */}
        <div className="space-y-6">
          {/* FORMULÁRIO "QUICK ADD" */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <lucide_react_1.Plus size={18} className="text-indigo-600"/> Novo Lançamento
            </h3>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descrição</label>
                <input value={newTrans.description} onChange={function (e) { return setNewTrans(__assign(__assign({}, newTrans), { description: e.target.value })); }} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium" placeholder="Ex: Conta de Luz, Venda Balcão..."/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Valor (R$)</label>
                  <input type="number" value={newTrans.amount} onChange={function (e) { return setNewTrans(__assign(__assign({}, newTrans), { amount: e.target.value })); }} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium" placeholder="0.00"/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tipo</label>
                  <select value={newTrans.type} onChange={function (e) { return setNewTrans(__assign(__assign({}, newTrans), { type: e.target.value })); }} className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm font-medium appearance-none cursor-pointer">
                    <option value="despesa">Saída (-)</option>
                    <option value="receita">Entrada (+)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </framer_motion_1.motion.div>

          {/* MINI GRÁFICO DE BALANÇO */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hidden lg:block">
             <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Resumo Financeiro</h3>
             <div className="h-40 w-full">
               <recharts_1.ResponsiveContainer width="100%" height="100%">
                 <recharts_1.BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <recharts_1.CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0"/>
                    <recharts_1.XAxis type="number" hide/>
                    <recharts_1.YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={60}/>
                    <recharts_1.Tooltip cursor={{ fill: 'transparent' }} formatter={function (value) { return (0, format_1.formatCurrency)(value); }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
                    <recharts_1.Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map(function (entry, index) { return (<recharts_1.Cell key={"cell-".concat(index)} fill={entry.color}/>); })}
                    </recharts_1.Bar>
                 </recharts_1.BarChart>
               </recharts_1.ResponsiveContainer>
             </div>
          </framer_motion_1.motion.div>
        </div>

        {/* COLUNA DIREITA: LISTA DE TRANSAÇÕES */}
        <framer_motion_1.motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-fit min-h-[500px]">
          {/* Barra de Filtro */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-3">
             <div className="relative flex-grow">
               <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
               <input type="text" placeholder="Buscar lançamentos..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
             </div>
             <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
               <lucide_react_1.Filter size={18}/>
             </button>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-gray-400 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="p-4 pl-6">Descrição</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-right">Valor</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <framer_motion_1.AnimatePresence>
                  {filteredTransactions.map(function (t) {
            var isEntrada = t.type === 'receita' || t.type === 'venda';
            return (<framer_motion_1.motion.tr key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="group hover:bg-gray-50/80 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className={"p-2 rounded-lg ".concat(isEntrada ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                              {isEntrada ? <lucide_react_1.TrendingUp size={16}/> : <lucide_react_1.TrendingDown size={16}/>}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">{t.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                           {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                           <span className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600 border border-gray-200">
                             {t.category}
                           </span>
                        </td>
                        <td className={"p-4 text-right font-bold text-sm ".concat(isEntrada ? 'text-emerald-600' : 'text-rose-500')}>
                          {isEntrada ? '+' : '-'} {(0, format_1.formatCurrency)(Number(t.amount))}
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={function () { return handleDelete(t.id); }} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Excluir lançamento">
                            <lucide_react_1.Trash2 size={16}/>
                          </button>
                        </td>
                      </framer_motion_1.motion.tr>);
        })}
                </framer_motion_1.AnimatePresence>
                {filteredTransactions.length === 0 && (<tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                      Nenhum lançamento encontrado.
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </framer_motion_1.motion.div>
      </div>
    </framer_motion_1.motion.div>);
}
// Componente de Card Reutilizável com Design System
function StatsCard(_a) {
    var title = _a.title, value = _a.value, icon = _a.icon, bgClass = _a.bgClass, textClass = _a.textClass, subTextClass = _a.subTextClass, borderClass = _a.borderClass, iconBg = _a.iconBg;
    return (<framer_motion_1.motion.div variants={itemVariants} className={"p-6 rounded-2xl shadow-sm border ".concat(borderClass || 'border-transparent', " ").concat(bgClass)}>
      <div className="flex justify-between items-start mb-4">
        <div className={"p-3 rounded-xl ".concat(iconBg || 'bg-white/20')}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={"text-3xl font-bold tracking-tight ".concat(textClass)}>
          {(0, format_1.formatCurrency)(value)}
        </h3>
        <p className={"text-sm font-medium mt-1 ".concat(subTextClass)}>
          {title}
        </p>
      </div>
    </framer_motion_1.motion.div>);
}
