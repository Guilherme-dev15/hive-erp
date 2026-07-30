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
exports.DetalhePedidoModal = DetalhePedidoModal;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var apiService_1 = require("../services/apiService");
var react_hot_toast_1 = require("react-hot-toast");
function DetalhePedidoModal(_a) {
    var _this = this;
    var _b;
    var isOpen = _a.isOpen, onClose = _a.onClose, pedido = _a.pedido, onUpdate = _a.onUpdate;
    var _c = (0, react_1.useState)(false), isUpdating = _c[0], setIsUpdating = _c[1];
    if (!pedido)
        return null;
    var handleStatusChange = function (newStatus) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setIsUpdating(true);
                    return [4 /*yield*/, (0, apiService_1.updateAdminOrderStatus)(pedido.id, newStatus)];
                case 1:
                    _a.sent();
                    react_hot_toast_1.toast.success("Status atualizado!");
                    if (!onUpdate) return [3 /*break*/, 3];
                    return [4 /*yield*/, onUpdate()];
                case 2:
                    _a.sent(); // AQUI ELE ATUALIZA A TELA DE PEDIDOS
                    _a.label = 3;
                case 3: return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao salvar.");
                    return [3 /*break*/, 6];
                case 5:
                    setIsUpdating(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/20 backdrop-blur-sm print:bg-white print:p-0" onClick={onClose}>
          <style>{"\n            @media print {\n              @page { size: auto; margin: 10mm; }\n              body { visibility: hidden; }\n              .print-content { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; }\n              .no-print { display: none !important; }\n            }\n          "}</style>

          <framer_motion_1.motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 print-content print:max-h-none print:shadow-none" onClick={function (e) { return e.stopPropagation(); }}>
            
            {/* CABEÇALHO SÓ PARA IMPRESSÃO */}
            <div className="hidden print:block p-4 border-b-2 border-gray-100 mb-4 text-center">
              <h1 className="text-xl font-bold uppercase">Comprovante de Pedido - Hive Pratas</h1>
              <p className="text-indigo-600 font-bold">ID: #{pedido.id.toUpperCase()}</p>
            </div>

            {/* HEADER DA TELA */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><lucide_react_1.Package size={24}/></div>
                <h2 className="text-xl font-bold text-gray-900">Pedido #{pedido.id.toUpperCase()}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={function () { return window.print(); }} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 border border-gray-100"><lucide_react_1.Printer size={20}/></button>
                <button onClick={onClose} className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-rose-500 border border-gray-100"><lucide_react_1.X size={20}/></button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 print:p-0">
              {/* SELETOR DE STATUS (CLEAN) */}
              <div className="space-y-4 no-print">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Logística: <span className="text-indigo-600 ml-2">{pedido.status}</span></p>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                  {['Em Separação', 'Enviado', 'Concluído'].map(function (st) { return (<button key={st} onClick={function () { return handleStatusChange(st); }} disabled={isUpdating} className={"px-5 py-2 rounded-xl text-[11px] font-black border transition-all ".concat(pedido.status === st ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-400 border-gray-200')}>{st}</button>); })}
                </div>
              </div>

              {/* DADOS CLIENTE */}
              <div className="grid grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-indigo-600 font-bold text-[10px] uppercase">Cliente</p>
                  <p className="font-bold text-gray-900">{pedido.customerName || 'Venda Online'}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2"><lucide_react_1.Phone size={14}/> {pedido.customerPhone}</p>
                </div>
                <div className="p-6 rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-gray-400 font-bold text-[10px] uppercase">Obs</p>
                  <p className="text-sm text-gray-500 italic">{pedido.notes || "Nenhuma nota."}</p>
                </div>
              </div>

              {/* TABELA ITENS */}
              <table className="w-full text-left border border-gray-100 rounded-2xl overflow-hidden">
                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black"><tr className="border-b"><th className="p-4">Item</th><th className="p-4 text-center">Qtd</th><th className="p-4 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(_b = pedido.items) === null || _b === void 0 ? void 0 : _b.map(function (item, i) { return (<tr key={i} className="text-sm">
                      <td className="p-4 font-bold text-gray-700">{item.name}</td>
                      <td className="p-4 text-center font-black text-indigo-600">x{item.quantidade}</td>
                      <td className="p-4 text-right font-bold text-gray-900">R$ {(item.salePrice * item.quantidade).toFixed(2)}</td>
                    </tr>); })}
                </tbody>
              </table>

              {/* TOTAL */}
              <div className="flex justify-end">
                <div className="w-full md:w-64 p-6 rounded-2xl border-2 border-indigo-600 text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Pago</p>
                  <p className="text-2xl font-black text-indigo-600">R$ {pedido.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
