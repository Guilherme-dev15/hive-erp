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
exports.DashboardPage = DashboardPage;
/* eslint-disable @typescript-eslint/no-explicit-any */
var react_1 = require("react");
var recharts_1 = require("recharts");
var lucide_react_1 = require("lucide-react");
var framer_motion_1 = require("framer-motion");
// SERVIÇOS
var apiService_1 = require("../services/apiService");
var DetalhePedidoModal_1 = require("../components/DetalhePedidoModal");
// --- CONFIGURAÇÕES GLOBAIS ---
var COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
// LÓGICA EXPERT: Status que NÃO são venda (O resto todo entra no gráfico)
var statusIgnorados = ['aguardando pagamento', 'cancelado', ''];
var parseDate = function (d) {
    if (!d)
        return new Date();
    // Se for Firebase Timestamp
    if (d && typeof d === 'object' && 'seconds' in d)
        return new Date(d.seconds * 1000);
    // Se for string ou objeto Date
    var date = new Date(d);
    return isNaN(date.getTime()) ? new Date() : date;
};
// --- ANIMAÇÕES ---
var containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
var itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};
function DashboardPage() {
    var _this = this;
    var _a = (0, react_1.useState)(true), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)('30d'), timeRange = _b[0], setTimeRange = _b[1];
    var _c = (0, react_1.useState)([]), rawProducts = _c[0], setRawProducts = _c[1];
    var _d = (0, react_1.useState)([]), rawOrders = _d[0], setRawOrders = _d[1];
    var _e = (0, react_1.useState)(null), selectedOrder = _e[0], setSelectedOrder = _e[1];
    var _f = (0, react_1.useState)(false), isModalOpen = _f[0], setIsModalOpen = _f[1];
    var _g = (0, react_1.useState)({
        faturamento: 0,
        lucro: 0,
        ticketMedio: 0,
        valorEstoque: 0,
        estoqueBaixo: 0,
        produtosAtivos: 0
    }), kpi = _g[0], setKpi = _g[1];
    var _h = (0, react_1.useState)([]), chartData = _h[0], setChartData = _h[1];
    var _j = (0, react_1.useState)([]), categoryData = _j[0], setCategoryData = _j[1];
    var _k = (0, react_1.useState)([]), recentList = _k[0], setRecentList = _k[1];
    // 1. CARGA DE DADOS
    var loadData = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, prods, orders, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            (0, apiService_1.getAdminProdutos)(),
                            (0, apiService_1.getAdminOrders)().catch(function () { return []; })
                        ])];
                case 1:
                    _a = _b.sent(), prods = _a[0], orders = _a[1];
                    setRawProducts(prods || []);
                    setRawOrders(orders || []);
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.error("Erro Dashboard:", error_1);
                    setLoading(false);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () { loadData(); }, [loadData]);
    // 2. PROCESSAMENTO ROBUSTO
    (0, react_1.useEffect)(function () {
        if (loading || rawOrders.length === 0)
            return;
        var now = new Date();
        var cutoffDate = new Date();
        if (timeRange === '7d')
            cutoffDate.setDate(now.getDate() - 7);
        else if (timeRange === '30d')
            cutoffDate.setDate(now.getDate() - 30);
        else
            cutoffDate.setFullYear(2000);
        var revenue = 0;
        var salesCount = 0;
        var dailyMap = {};
        rawOrders.forEach(function (o) {
            var oDate = parseDate(o.createdAt || o.date);
            // Filtro de Data
            if (oDate < cutoffDate)
                return;
            // Normaliza o status para comparação (remove espaços e põe em minúsculo)
            var statusFormatado = (o.status || '').trim().toLowerCase();
            var isVendaValida = !statusIgnorados.includes(statusFormatado);
            if (isVendaValida) {
                var val = Number(o.total || 0);
                revenue += val;
                salesCount++;
                var dayKey = oDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                if (!dailyMap[dayKey]) {
                    dailyMap[dayKey] = { vendas: 0, lucro: 0, timestamp: oDate.getTime() };
                }
                dailyMap[dayKey].vendas += val;
                dailyMap[dayKey].lucro += (val * 0.7);
            }
        });
        // Atualiza KPIs
        setKpi({
            faturamento: revenue,
            lucro: revenue * 0.7,
            ticketMedio: salesCount > 0 ? revenue / salesCount : 0,
            valorEstoque: rawProducts.reduce(function (acc, p) { return acc + (Number(p.salePrice || 0) * (Number(p.quantity) || 0)); }, 0),
            estoqueBaixo: rawProducts.filter(function (p) { return (Number(p.quantity) || 0) < 5; }).length,
            produtosAtivos: rawProducts.length
        });
        // Prepara Gráfico
        var sortedChart = Object.keys(dailyMap)
            .map(function (key) { return ({
            name: key,
            vendas: dailyMap[key].vendas,
            lucro: dailyMap[key].lucro,
            timestamp: dailyMap[key].timestamp
        }); })
            .sort(function (a, b) { return a.timestamp - b.timestamp; });
        setChartData(sortedChart.length > 0 ? sortedChart : [{ name: 'Sem vendas', vendas: 0, lucro: 0 }]);
        // Mix de Produtos
        var catMap = {};
        rawProducts.forEach(function (p) {
            var c = p.category || 'Outros';
            catMap[c] = (catMap[c] || 0) + 1;
        });
        setCategoryData(Object.keys(catMap).map(function (k) { return ({ name: k, value: catMap[k] }); }));
        setRecentList(rawOrders.slice(0, 5));
    }, [loading, timeRange, rawProducts, rawOrders]);
    var openOrderDetails = function (pedido) {
        setSelectedOrder(pedido);
        setIsModalOpen(true);
    };
    if (loading)
        return <div className="p-8 text-center text-gray-500 animate-pulse font-bold">SINCRONIZANDO...</div>;
    return (<framer_motion_1.motion.div className="space-y-8 pb-20" variants={containerVariants} initial="hidden" animate="visible">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Visão consolidada da operação
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {[{ id: '7d', label: '7 Dias' }, { id: '30d', label: '30 Dias' }, { id: 'all', label: 'Tudo' }].map(function (btn) { return (<button key={btn.id} onClick={function () { return setTimeRange(btn.id); }} className={"px-4 py-1.5 text-sm font-medium rounded-lg transition-all ".concat(timeRange === btn.id ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50')}>{btn.label}</button>); })}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg">
            <lucide_react_1.Download size={18}/> Relatório
          </button>
        </div>
      </div>

      {/* 2. CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="Faturamento" value={kpi.faturamento} icon={<lucide_react_1.DollarSign size={22} className="text-white"/>} trend="Vendas" trendUp={true} color="bg-indigo-600"/>
        <StatsCard title="Lucro Líquido" value={kpi.lucro} icon={<lucide_react_1.TrendingUp size={22} className="text-emerald-600"/>} trend="Real" trendUp={true} color="bg-emerald-100" iconColor="text-emerald-600"/>
        <StatsCard title="Valor em Estoque" value={kpi.valorEstoque} icon={<lucide_react_1.Package size={22} className="text-violet-600"/>} trend="Snapshot" trendUp={true} color="bg-violet-100" iconColor="text-violet-600"/>
        <StatsCard title="Estoque Baixo" value={kpi.estoqueBaixo} isCurrency={false} icon={<lucide_react_1.AlertCircle size={22} className="text-rose-600"/>} trend="Alertas" trendUp={false} color="bg-rose-100" iconColor="text-rose-600"/>
      </div>

      {/* 3. GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <framer_motion_1.motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa</h3>
          <div className="flex-grow w-full min-h-[300px]">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
              <recharts_1.AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/><stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                </defs>
                <recharts_1.CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6"/>
                <recharts_1.XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }} dy={10}/>
                <recharts_1.YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                <recharts_1.Tooltip content={<CustomChartTooltip />}/>
                <recharts_1.Area type="monotone" name="Faturamento" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)"/>
                <recharts_1.Area type="monotone" name="Lucro" dataKey="lucro" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)"/>
              </recharts_1.AreaChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </framer_motion_1.motion.div>

        <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Mix de Produtos</h3>
          <div className="flex-grow flex items-center justify-center relative min-h-[200px]">
            <recharts_1.ResponsiveContainer width="100%" height="100%">
              <recharts_1.PieChart>
                <recharts_1.Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {categoryData.map(function (_, index) { return <recharts_1.Cell key={index} fill={COLORS[index % COLORS.length]}/>; })}
                </recharts_1.Pie>
                <recharts_1.Tooltip />
              </recharts_1.PieChart>
            </recharts_1.ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold text-gray-800">{kpi.produtosAtivos}</span>
               <span className="text-[10px] text-gray-400 uppercase">Itens</span>
            </div>
          </div>
        </framer_motion_1.motion.div>
      </div>

      {/* 4. LISTA RECENTE */}
      <framer_motion_1.motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Extrato Recente</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
              <tr><th className="p-4 pl-6">Descrição</th><th className="p-4">Data</th><th className="p-4 pr-6 text-right">Valor</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {recentList.map(function (o) {
            var _a;
            return (<TransactionRow key={o.id} desc={o.customerName || "Pedido #".concat((_a = o.id) === null || _a === void 0 ? void 0 : _a.slice(-5).toUpperCase())} date={parseDate(o.createdAt || o.date).toLocaleDateString('pt-BR')} value={Number(o.total || 0)} type={!statusIgnorados.includes((o.status || '').toLowerCase()) ? 'in' : 'out'} onClick={function () { return openOrderDetails(o); }}/>);
        })}
            </tbody>
          </table>
        </div>
      </framer_motion_1.motion.div>

      <DetalhePedidoModal_1.DetalhePedidoModal isOpen={isModalOpen} onClose={function () { return setIsModalOpen(false); }} pedido={selectedOrder} onUpdate={loadData}/>

    </framer_motion_1.motion.div>);
}
// COMPONENTES UI (Mantidos Idênticos)
function StatsCard(_a) {
    var title = _a.title, value = _a.value, icon = _a.icon, color = _a.color, iconColor = _a.iconColor, trend = _a.trend, trendUp = _a.trendUp, _b = _a.isCurrency, isCurrency = _b === void 0 ? true : _b;
    var isSolid = color.includes('-600');
    return (<framer_motion_1.motion.div variants={itemVariants} className={"relative p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group overflow-hidden ".concat(isSolid ? color : 'bg-white')}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={"p-3 rounded-xl ".concat(isSolid ? 'bg-white/20 text-white' : color)}>
          <span className={isSolid ? 'text-white' : iconColor}>{icon}</span>
        </div>
        <div className={"px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ".concat(isSolid ? 'bg-white/20 text-white' : (trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'))}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <p className={"text-sm font-medium ".concat(isSolid ? 'text-indigo-100' : 'text-gray-500')}>{title}</p>
        <h3 className={"text-3xl font-bold tracking-tight ".concat(isSolid ? 'text-white' : 'text-gray-900')}>
          {isCurrency ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : value}
        </h3>
      </div>
    </framer_motion_1.motion.div>);
}
function TransactionRow(_a) {
    var desc = _a.desc, date = _a.date, value = _a.value, type = _a.type, onClick = _a.onClick;
    return (<tr onClick={onClick} className="hover:bg-gray-50/80 transition-colors cursor-pointer group text-sm">
      <td className="p-4 pl-6 font-semibold text-gray-700">{desc}</td>
      <td className="p-4 text-gray-500">{date}</td>
      <td className={"p-4 pr-6 text-right font-bold ".concat(type === 'in' ? 'text-emerald-600' : 'text-rose-600')}>
        R$ {Number(value).toFixed(2)}
      </td>
    </tr>);
}
var CustomChartTooltip = function (_a) {
    var active = _a.active, payload = _a.payload, label = _a.label;
    if (active && payload && payload.length) {
        return (<div className="bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-xl shadow-2xl border border-gray-700 text-xs">
        <p className="font-bold mb-2 uppercase tracking-wider">{label}</p>
        {payload.map(function (entry, index) { return (<div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span>{entry.name}: {entry.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>); })}
      </div>);
    }
    return null;
};
