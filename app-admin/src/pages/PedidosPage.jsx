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
exports.PedidosPage = PedidosPage;
/* eslint-disable @typescript-eslint/no-explicit-any */
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var react_to_print_1 = require("react-to-print");
var lucide_react_1 = require("lucide-react");
var apiService_1 = require("../services/apiService");
var DetalhePedidoModal_1 = require("../components/DetalhePedidoModal");
var CertificadoImpressao_1 = require("../components/CertificadoImpressao");
// --- CONFIGURAÇÃO VISUAL ORIGINAL ---
var statusConfig = {
    'Aguardando Pagamento': { icon: <lucide_react_1.Clock size={14}/>, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    'Em Produção': { icon: <lucide_react_1.Package size={14}/>, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Em Separação': { icon: <lucide_react_1.Package size={14}/>, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    'Enviado': { icon: <lucide_react_1.Truck size={14}/>, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    'Concluído': { icon: <lucide_react_1.CheckCircle2 size={14}/>, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    'Cancelado': { icon: <lucide_react_1.XCircle size={14}/>, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};
var statusOrdem = [
    'Aguardando Pagamento', 'Em Produção', 'Em Separação', 'Enviado', 'Concluído', 'Cancelado'
];
var getDateSeconds = function (date) {
    if (!date)
        return 0;
    if (typeof date === 'object' && 'seconds' in date)
        return date.seconds;
    if (date instanceof Date)
        return Math.floor(date.getTime() / 1000);
    if (typeof date === 'string')
        return Math.floor(new Date(date).getTime() / 1000);
    return 0;
};
var formatDate = function (date) {
    if (!date)
        return '-';
    try {
        var seconds = getDateSeconds(date);
        if (seconds === 0)
            return '-';
        return new Date(seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    catch (e) {
        return '-';
    }
};
var formatCurrency = function (value) {
    if (value === undefined || value === null || isNaN(Number(value)))
        return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};
// --- COMPONENTE DE ESTATÍSTICA (P-5 ORIGINAL) ---
function StatCard(_a) {
    var title = _a.title, value = _a.value, icon = _a.icon, sub = _a.sub, color = _a.color;
    return (<div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-gray-800">{value}</h3>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
            <div className={"p-3 rounded-xl ".concat(color, " bg-opacity-10")}>
                {react_1.default.cloneElement(icon, { className: color.replace('bg-', 'text-') })}
            </div>
        </div>);
}
function PedidosPage() {
    var _this = this;
    var _a = (0, react_1.useState)([]), pedidos = _a[0], setPedidos = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)(false), modalOpen = _d[0], setModalOpen = _d[1];
    var _e = (0, react_1.useState)(null), pedidoSelecionado = _e[0], setPedidoSelecionado = _e[1];
    var _f = (0, react_1.useState)(null), updatingId = _f[0], setUpdatingId = _f[1];
    var _g = (0, react_1.useState)('list'), viewMode = _g[0], setViewMode = _g[1];
    var _h = (0, react_1.useState)(''), searchTerm = _h[0], setSearchTerm = _h[1];
    var _j = (0, react_1.useState)('Todos'), statusFilter = _j[0], setStatusFilter = _j[1];
    var _k = (0, react_1.useState)('all'), dateFilter = _k[0], setDateFilter = _k[1];
    var _l = (0, react_1.useState)(null), config = _l[0], setConfig = _l[1];
    var _m = (0, react_1.useState)(null), pedidoParaCertificado = _m[0], setPedidoParaCertificado = _m[1];
    var certificadoRef = (0, react_1.useRef)(null);
    var atualizarEstadoPedido = (0, react_1.useCallback)(function (id, novoStatus) {
        setPedidos(function (prev) { return prev.map(function (p) { return p.id === id ? __assign(__assign({}, p), { status: novoStatus }) : p; }); });
    }, []);
    var carregarDados = (0, react_1.useCallback)(function () {
        var args_1 = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args_1[_i] = arguments[_i];
        }
        return __awaiter(_this, __spreadArray([], args_1, true), void 0, function (silencioso) {
            var _a, pedidosData, configData, sortedPedidos, err_1;
            if (silencioso === void 0) { silencioso = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, 3, 4]);
                        if (!silencioso)
                            setLoading(true);
                        return [4 /*yield*/, Promise.all([(0, apiService_1.getAdminOrders)(), (0, apiService_1.getConfig)()])];
                    case 1:
                        _a = _b.sent(), pedidosData = _a[0], configData = _a[1];
                        sortedPedidos = pedidosData
                            .filter(function (p) { return p && p.id; })
                            .sort(function (a, b) { return getDateSeconds(b.createdAt) - getDateSeconds(a.createdAt); });
                        setPedidos(sortedPedidos);
                        if (configData)
                            setConfig(configData);
                        return [3 /*break*/, 4];
                    case 2:
                        err_1 = _b.sent();
                        setError("Falha ao carregar dados.");
                        return [3 /*break*/, 4];
                    case 3:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, []);
    (0, react_1.useEffect)(function () { carregarDados(); }, [carregarDados]);
    var handleStatusChange = function (pedidoId, novoStatus) { return __awaiter(_this, void 0, void 0, function () {
        var tid, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tid = react_hot_toast_1.toast.loading("Atualizando...");
                    setUpdatingId(pedidoId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.updateAdminOrderStatus)(pedidoId, novoStatus)];
                case 2:
                    _a.sent();
                    atualizarEstadoPedido(pedidoId, novoStatus);
                    react_hot_toast_1.toast.success("Status atualizado!", { id: tid });
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao atualizar.", { id: tid });
                    return [3 /*break*/, 5];
                case 4:
                    setUpdatingId(null);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Essa ação é irreversível. Deseja excluir este pedido?"))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, apiService_1.deleteAdminOrder)(id)];
                case 2:
                    _a.sent();
                    setPedidos(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
                    react_hot_toast_1.toast.success("Pedido excluído!");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao excluir.");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handlePrintCertificado = (0, react_to_print_1.useReactToPrint)({
        contentRef: certificadoRef,
        documentTitle: 'Certificado_Garantia',
    });
    var prepararEImprimirCertificado = function (pedido) {
        setPedidoParaCertificado(pedido);
        setTimeout(function () { handlePrintCertificado(); }, 200);
    };
    var pedidosFiltrados = (0, react_1.useMemo)(function () {
        return pedidos.filter(function (pedido) {
            var _a, _b, _c;
            var termo = searchTerm.toLowerCase();
            var matchText = (((_a = pedido.id) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(termo)) ||
                ((_b = pedido.customerName) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(termo)) ||
                ((_c = pedido.customerPhone) === null || _c === void 0 ? void 0 : _c.includes(termo)));
            if (!matchText)
                return false;
            if (statusFilter !== 'Todos' && pedido.status !== statusFilter)
                return false;
            if (dateFilter !== 'all') {
                var segundos = getDateSeconds(pedido.createdAt);
                if (!segundos)
                    return false;
                var diasAtras = (new Date().getTime() - (segundos * 1000)) / (1000 * 3600 * 24);
                if (dateFilter === '7days' && diasAtras > 7)
                    return false;
                if (dateFilter === '30days' && diasAtras > 30)
                    return false;
            }
            return true;
        });
    }, [pedidos, searchTerm, dateFilter, statusFilter]);
    var stats = (0, react_1.useMemo)(function () {
        var totalVendas = pedidos.reduce(function (acc, p) { return p.status !== 'Cancelado' ? acc + (p.total || 0) : acc; }, 0);
        var pendentes = pedidos.filter(function (p) { return p.status === 'Aguardando Pagamento' || p.status === 'Em Produção'; }).length;
        var concluidos = pedidos.filter(function (p) { return p.status === 'Concluído' || p.status === 'Enviado'; }).length;
        return { totalVendas: totalVendas, pendentes: pendentes, concluidos: concluidos };
    }, [pedidos]);
    if (loading)
        return <div className="h-[80vh] flex flex-col items-center justify-center"><lucide_react_1.Loader2 className="animate-spin text-indigo-600 mb-2" size={40}/><p className="text-gray-400 font-medium text-sm">Carregando pedidos...</p></div>;
    if (error)
        return <div className="p-10 text-center text-red-500 font-bold bg-red-50 rounded-xl m-10 border border-red-100">{error}</div>;
    return (<>
            <react_hot_toast_1.Toaster position="top-right"/>

            <div className="space-y-8 pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Gestão de Pedidos</h1>
                        <p className="text-gray-500 mt-1">Acompanhe vendas, status e expedição em tempo real.</p>
                    </div>
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <button onClick={function () { return setViewMode('list'); }} className={"p-2 rounded-md transition-all ".concat(viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600')}><lucide_react_1.List size={20}/></button>
                        <button onClick={function () { return setViewMode('kanban'); }} className={"p-2 rounded-md transition-all ".concat(viewMode === 'kanban' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600')}><lucide_react_1.LayoutGrid size={20}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Receita Total" value={formatCurrency(stats.totalVendas)} icon={<lucide_react_1.DollarSign size={24}/>} color="bg-emerald-500" sub="Faturamento acumulado"/>
                    <StatCard title="Em Aberto" value={stats.pendentes} icon={<lucide_react_1.Clock size={24}/>} color="bg-yellow-500" sub="Pedidos aguardando"/>
                    <StatCard title="Concluídos" value={stats.concluidos} icon={<lucide_react_1.CheckCircle2 size={24}/>} color="bg-blue-500" sub="Entregues com sucesso"/>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2 border-b border-gray-100">
                        <button onClick={function () { return setStatusFilter('Todos'); }} className={"px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ".concat(statusFilter === 'Todos' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50')}>Todos</button>
                        {statusOrdem.map(function (status) { return (<button key={status} onClick={function () { return setStatusFilter(status); }} className={"px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ".concat(statusFilter === status ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : 'text-gray-500 hover:bg-gray-50')}>{status}</button>); })}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <lucide_react_1.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <input type="text" placeholder="Buscar por ID, Nome ou Telefone..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all"/>
                        </div>
                        <div className="relative min-w-[200px]">
                            <lucide_react_1.Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                            <select value={dateFilter} onChange={function (e) { return setDateFilter(e.target.value); }} className="w-full pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer">
                                <option value="all">Todo o período</option>
                                <option value="7days">Últimos 7 dias</option>
                                <option value="30days">Últimos 30 dias</option>
                            </select>
                        </div>
                    </div>
                </div>

                {viewMode === 'list' ? (<div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs border-b border-gray-200">
                                <tr><th className="px-6 py-4">Pedido / Data</th><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Total</th><th className="px-6 py-4 text-center">Ações</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <framer_motion_1.AnimatePresence>
                                    {pedidosFiltrados.map(function (pedido) {
                var statusStyle = statusConfig[pedido.status] || statusConfig['Aguardando Pagamento'];
                return (<framer_motion_1.motion.tr key={pedido.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono font-bold text-gray-900 text-sm">#{pedido.id.slice(0, 6).toUpperCase()}</span>
                                                        <span className="text-[10px] text-gray-400 mt-0.5">{formatDate(pedido.createdAt)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{pedido.customerName || 'Cliente'}</div>
                                                    <div className="text-xs text-gray-400">{pedido.customerPhone || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {updatingId === pedido.id ? (<lucide_react_1.Loader2 size={14} className="animate-spin text-gray-400"/>) : (<select value={pedido.status} onChange={function (e) { return handleStatusChange(pedido.id, e.target.value); }} className={"appearance-none px-3 py-1.5 rounded-full text-xs font-bold border ".concat(statusStyle.bg, " ").concat(statusStyle.color, " ").concat(statusStyle.border, " outline-none cursor-pointer")}>
                                                            {statusOrdem.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
                                                        </select>)}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(pedido.total)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={function () { return prepararEImprimirCertificado(pedido); }} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"><lucide_react_1.ScrollText size={16}/></button>
                                                        <button onClick={function () { setPedidoSelecionado(pedido); setModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><lucide_react_1.Search size={16}/></button>
                                                        <button onClick={function () { return handleDelete(pedido.id); }} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><lucide_react_1.Trash2 size={16}/></button>
                                                    </div>
                                                </td>
                                            </framer_motion_1.motion.tr>);
            })}
                                </framer_motion_1.AnimatePresence>
                            </tbody>
                        </table>
                    </div>) : (<div className="flex overflow-x-auto pb-6 gap-4 items-start custom-scrollbar">
                        {statusOrdem.map(function (status) {
                var pedidosDoStatus = pedidosFiltrados.filter(function (p) { return p.status === status || (status === 'Aguardando Pagamento' && !p.status); });
                var estilo = statusConfig[status];
                return (<div key={status} className="min-w-[280px] w-[280px] bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-250px)]">
                                    <div className={"p-3 border-b border-gray-200 bg-white rounded-t-xl flex justify-between items-center ".concat(estilo.color)}>
                                        <div className="flex items-center gap-2 font-bold text-sm">{estilo.icon} {status}</div>
                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{pedidosDoStatus.length}</span>
                                    </div>
                                    <div className="p-2 space-y-2 overflow-y-auto flex-1">
                                        {pedidosDoStatus.map(function (pedido) { return (<framer_motion_1.motion.div key={pedido.id} layoutId={pedido.id} onClick={function () { setPedidoSelecionado(pedido); setModalOpen(true); }} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all">
                                                <div className="flex justify-between items-start mb-2 text-[10px] font-bold text-gray-400">
                                                    <span>#{pedido.id.slice(0, 5).toUpperCase()}</span>
                                                    <span>{formatDate(pedido.createdAt).split(' ')[0]}</span>
                                                </div>
                                                <h4 className="font-bold text-gray-800 text-sm truncate">{pedido.customerName || 'Cliente'}</h4>
                                                <p className="font-bold text-indigo-600 mt-2 text-sm">{formatCurrency(pedido.total)}</p>
                                            </framer_motion_1.motion.div>); })}
                                    </div>
                                </div>);
            })}
                    </div>)}
            </div>

            <DetalhePedidoModal_1.DetalhePedidoModal isOpen={modalOpen} onClose={function () { return setModalOpen(false); }} pedido={pedidoSelecionado} onUpdate={function (novoStatus) {
            if (pedidoSelecionado) {
                atualizarEstadoPedido(pedidoSelecionado.id, novoStatus);
            }
        }}/>

            <CertificadoImpressao_1.CertificadoImpressao ref={certificadoRef} pedido={pedidoParaCertificado} config={config}/>
        </>);
}
