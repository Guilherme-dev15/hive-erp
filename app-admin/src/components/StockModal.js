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
exports.StockModal = StockModal;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
var useAuth_1 = require("../hooks/useAuth");
function StockModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, product = _a.product, onSuccess = _a.onSuccess;
    var user = (0, useAuth_1.useAuth)().user;
    var _b = (0, react_1.useState)('adjust'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = (0, react_1.useState)([]), logs = _c[0], setLogs = _c[1];
    var _d = (0, react_1.useState)(false), loadingLogs = _d[0], setLoadingLogs = _d[1];
    var _e = (0, react_1.useState)(false), submitting = _e[0], setSubmitting = _e[1];
    // Form State
    var _f = (0, react_1.useState)('entry'), type = _f[0], setType = _f[1];
    var _g = (0, react_1.useState)(''), quantity = _g[0], setQuantity = _g[1];
    var _h = (0, react_1.useState)(''), reason = _h[0], setReason = _h[1];
    // Carregar Histórico
    (0, react_1.useEffect)(function () {
        if (isOpen && (product === null || product === void 0 ? void 0 : product.id)) {
            loadHistory();
            // Reset form
            setType('entry');
            setQuantity('');
            setReason('');
            setActiveTab('adjust');
        }
    }, [isOpen, product]);
    var loadHistory = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoadingLogs(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.getProductLogs)(product.id)];
                case 2:
                    data = _a.sent();
                    setLogs(data);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoadingLogs(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!quantity || Number(quantity) <= 0)
                        return [2 /*return*/, react_hot_toast_1.toast.error("Quantidade inválida")];
                    setSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.adjustStock)({
                            productId: product.id,
                            type: type,
                            quantity: Number(quantity),
                            reason: reason,
                            userName: (user === null || user === void 0 ? void 0 : user.displayName) || (user === null || user === void 0 ? void 0 : user.email) || 'Admin'
                        })];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Estoque atualizado!");
                    onSuccess(); // Atualiza a lista pai
                    onClose(); // Fecha modal
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao atualizar estoque");
                    return [3 /*break*/, 5];
                case 4:
                    setSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen || !product)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Estoque</h2>
            <p className="text-sm text-gray-500">{product.name} (Atual: <strong className="text-gray-900">{product.quantity}</strong>)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><lucide_react_1.X size={20}/></button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-100">
          <button onClick={function () { return setActiveTab('adjust'); }} className={"flex-1 p-4 text-sm font-bold transition-colors ".concat(activeTab === 'adjust' ? 'text-dourado border-b-2 border-dourado bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50')}>
            Novo Ajuste
          </button>
          <button onClick={function () { return setActiveTab('history'); }} className={"flex-1 p-4 text-sm font-bold transition-colors ".concat(activeTab === 'history' ? 'text-dourado border-b-2 border-dourado bg-yellow-50/50' : 'text-gray-500 hover:bg-gray-50')}>
            Histórico de Movimentações
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'adjust' ? (<form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SELETOR DE TIPO */}
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={function () { return setType('entry'); }} className={"p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ".concat(type === 'entry' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500')}>
                  <lucide_react_1.ArrowUpCircle size={24}/>
                  <span className="font-bold text-sm">Entrada</span>
                </button>
                <button type="button" onClick={function () { return setType('exit'); }} className={"p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ".concat(type === 'exit' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500')}>
                  <lucide_react_1.ArrowDownCircle size={24}/>
                  <span className="font-bold text-sm">Saída</span>
                </button>
                <button type="button" onClick={function () { return setType('loss'); }} className={"p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ".concat(type === 'loss' ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50 text-gray-500')}>
                  <lucide_react_1.AlertTriangle size={24}/>
                  <span className="font-bold text-sm">Perda/Quebra</span>
                </button>
              </div>

              {/* INPUTS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantidade</label>
                  <input type="number" min="1" required value={quantity} onChange={function (e) { return setQuantity(e.target.value); }} className="w-full p-3 border border-gray-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-dourado" placeholder="0"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Observação</label>
                  <input type="text" required value={reason} onChange={function (e) { return setReason(e.target.value); }} className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado" placeholder={type === 'entry' ? "Ex: Reposição de fornecedor" : "Ex: Venda balcão ou Defeito"}/>
                </div>
              </div>

              <button type="submit" disabled={submitting} className="w-full py-4 bg-carvao text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center gap-2">
                {submitting ? <lucide_react_1.Loader2 className="animate-spin"/> : <lucide_react_1.Save size={20}/>}
                Confirmar Movimentação
              </button>
            </form>) : (
        // HISTÓRICO
        <div className="space-y-4">
              {loadingLogs ? (<div className="flex justify-center py-10"><lucide_react_1.Loader2 className="animate-spin text-gray-400"/></div>) : logs.length === 0 ? (<div className="text-center py-10 text-gray-400">Nenhum histórico encontrado.</div>) : (<div className="space-y-3">
                  {logs.map(function (log) { return (<div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={"p-2 rounded-full ".concat(log.type === 'entry' ? 'bg-green-100 text-green-600' :
                        log.type === 'loss' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}>
                          {log.type === 'entry' ? <lucide_react_1.ArrowUpCircle size={16}/> :
                        log.type === 'loss' ? <lucide_react_1.AlertTriangle size={16}/> : <lucide_react_1.ArrowDownCircle size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{log.reason}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleDateString()} às {new Date(log.createdAt).toLocaleTimeString().slice(0, 5)} • por {log.user.split('@')[0]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={"font-bold ".concat(log.change > 0 ? 'text-green-600' : 'text-red-600')}>
                          {log.change > 0 ? '+' : ''}{log.change}
                        </p>
                        <p className="text-[10px] text-gray-400">Saldo: {log.newQuantity}</p>
                      </div>
                    </div>); })}
                </div>)}
            </div>)}
        </div>
      </framer_motion_1.motion.div>
    </div>);
}
