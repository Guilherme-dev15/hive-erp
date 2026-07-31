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
exports.CuponsPage = CuponsPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
var apiService_1 = require("../services/apiService");
// --- CORREÇÃO: Nome da função com 'n' e Maiúscula ---
function CuponsPage() {
    var _this = this;
    var _a = (0, react_1.useState)([]), coupons = _a[0], setCoupons = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(''), newCode = _c[0], setNewCode = _c[1];
    var _d = (0, react_1.useState)(''), newPercent = _d[0], setNewPercent = _d[1];
    var _e = (0, react_1.useState)(false), isSubmitting = _e[0], setIsSubmitting = _e[1];
    (0, react_1.useEffect)(function () {
        loadCoupons();
    }, []);
    var loadCoupons = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    return [4 /*yield*/, (0, apiService_1.getCoupons)()];
                case 1:
                    data = _a.sent();
                    setCoupons(data);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao carregar Cupons.");
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleCreate = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var created, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!newCode || !newPercent)
                        return [2 /*return*/, react_hot_toast_1.toast.error("Preencha todos os campos.")];
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.createCoupon)({ code: newCode, discountPercent: Number(newPercent) })];
                case 2:
                    created = _a.sent();
                    setCoupons(__spreadArray([created], coupons, true));
                    setNewCode('');
                    setNewPercent('');
                    react_hot_toast_1.toast.success("Cupom criado!");
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao criar Cupom. Verifique se já existe.");
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Tem a certeza que quer apagar este Cupom?"))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, apiService_1.deleteCoupon)(id)];
                case 2:
                    _a.sent();
                    setCoupons(coupons.filter(function (c) { return c.id !== id; }));
                    react_hot_toast_1.toast.success("Cupom apagado.");
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao apagar.");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (loading)
        return <div className="p-8 text-center flex justify-center"><lucide_react_1.Loader2 className="animate-spin text-dourado"/></div>;
    return (<div className="space-y-8 pb-10">
      <react_hot_toast_1.Toaster position="top-right"/>
      <framer_motion_1.motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-carvao flex items-center gap-2">
        <lucide_react_1.Ticket className="text-dourado"/> Campanhas e Cupons
      </framer_motion_1.motion.h1>

      {/* Cartão de Criação */}
      <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-dourado">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Criar Nova Campanha</h2>
        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código do Cupom</label>
            <div className="relative">
               <lucide_react_1.Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
               <input value={newCode} onChange={function (e) { return setNewCode(e.target.value.toUpperCase().replace(/\s/g, '')); }} className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg uppercase font-bold tracking-widest focus:ring-2 focus:ring-dourado outline-none" placeholder="EX: VERAO10"/>
            </div>
          </div>
          <div className="w-full md:w-40">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Desconto (%)</label>
            <input type="number" value={newPercent} onChange={function (e) { return setNewPercent(e.target.value); }} className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dourado outline-none font-bold" placeholder="10"/>
          </div>
          <button disabled={isSubmitting} className="w-full md:w-auto bg-carvao text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 font-medium transition-all">
            {isSubmitting ? <lucide_react_1.Loader2 className="animate-spin"/> : <lucide_react_1.Plus size={20}/>} Criar Campanha
          </button>
        </form>
      </div>

      {/* Lista de Cupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(function (coupon, index) { return (<framer_motion_1.motion.div key={coupon.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2">
                 <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded uppercase">Ativo</span>
                 <p className="text-sm text-gray-400">{new Date().toLocaleDateString()}</p>
              </div>
              <p className="text-2xl font-bold text-carvao tracking-widest mt-1">{coupon.code}</p>
              <p className="text-sm font-medium text-green-600">Desconto: {coupon.discountPercent}%</p>
            </div>
            <button onClick={function () { return handleDelete(coupon.id); }} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors" title="Apagar Cupom">
              <lucide_react_1.Trash2 size={20}/>
            </button>
          </framer_motion_1.motion.div>); })}
        
        {coupons.length === 0 && (<div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <lucide_react_1.Ticket className="mx-auto h-12 w-12 text-gray-300 mb-2"/>
             <p className="text-gray-500">Nenhum Cupom ativo. Crie o primeiro acima!</p>
          </div>)}
      </div>
    </div>);
}
