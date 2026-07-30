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
exports.CategoryModal = CategoryModal;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
// IMPORTANTE: Adicionamos getCategories para buscar a lista oficial
var apiService_1 = require("../services/apiService");
function CategoryModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, categories = _a.categories, setCategories = _a.setCategories, onCategoryCreated = _a.onCategoryCreated;
    var _b = (0, react_1.useState)(""), newCategoryName = _b[0], setNewCategoryName = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var _d = (0, react_1.useState)(null), deletingId = _d[0], setDeletingId = _d[1];
    // Função para ADICIONAR nova categoria (Modo Sincronização Total)
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var toastId, nameUpper_1, createResponse, listaOficial, novaNaLista, createdData, error_1, msg;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    if (!newCategoryName.trim()) {
                        react_hot_toast_1.toast.error("O nome da categoria não pode estar vazio.");
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    toastId = react_hot_toast_1.toast.loading('A guardar categoria...');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, 5, 6]);
                    nameUpper_1 = newCategoryName.trim().toUpperCase();
                    return [4 /*yield*/, (0, apiService_1.createCategory)({ name: nameUpper_1 })];
                case 2:
                    createResponse = _c.sent();
                    return [4 /*yield*/, (0, apiService_1.getCategories)()];
                case 3:
                    listaOficial = _c.sent();
                    // 3. Atualiza a tela com a lista oficial
                    if (Array.isArray(listaOficial)) {
                        setCategories(listaOficial);
                        novaNaLista = listaOficial.find(function (c) { return c.name === nameUpper_1; });
                        if (novaNaLista) {
                            onCategoryCreated(novaNaLista);
                        }
                        else {
                            createdData = createResponse.data || createResponse;
                            onCategoryCreated(createdData);
                        }
                    }
                    setNewCategoryName("");
                    react_hot_toast_1.toast.dismiss(toastId);
                    react_hot_toast_1.toast.success('Categoria criada!');
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _c.sent();
                    console.error("Erro ao criar categoria:", error_1);
                    react_hot_toast_1.toast.dismiss(toastId);
                    msg = ((_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Erro ao criar categoria.';
                    react_hot_toast_1.toast.error(msg);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleApagar = function (id) {
        setDeletingId(id);
        var promise = (0, apiService_1.deleteCategory)(id);
        react_hot_toast_1.toast.promise(promise, {
            loading: 'A apagar...',
            success: function () {
                // Remove visualmente
                setCategories(function (prev) { return prev.filter(function (c) { return c.id !== id; }); });
                setDeletingId(null);
                return 'Categoria apagada!';
            },
            error: function (err) {
                var _a, _b;
                setDeletingId(null);
                return ((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Erro ao apagar. Verifique se está em uso.';
            },
        });
    };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
          <framer_motion_1.motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={function (e) { return e.stopPropagation(); }}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-carvao">Gerir Categorias</h2>
              <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-200">
                <lucide_react_1.X size={20}/>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex gap-2 border-b">
              <input type="text" value={newCategoryName} onChange={function (e) { return setNewCategoryName(e.target.value); }} placeholder="NOVA CATEGORIA" className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-dourado uppercase text-gray-900" disabled={isSubmitting}/>
              <button type="submit" disabled={isSubmitting} className="flex items-center justify-center bg-carvao text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 disabled:opacity-50 min-w-[3rem]">
                {isSubmitting ? <lucide_react_1.Loader2 size={20} className="animate-spin"/> : <lucide_react_1.Plus size={20}/>}
              </button>
            </form>

            <div className="p-4 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Categorias existentes</h3>
              {categories.length === 0 ? (<p className="text-gray-400 text-sm">Nenhuma categoria encontrada.</p>) : (<ul className="divide-y divide-gray-100">
                  {categories.map(function (c) { return (c && (<li key={c.id || Math.random()} className="py-2 flex justify-between items-center group">
                        <span className="text-gray-800 font-medium">
                          {c.name || "Sem Nome"}
                        </span>
                        <button onClick={function () { return c.id && handleApagar(c.id); }} disabled={deletingId === c.id} className="p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                          {deletingId === c.id ? <lucide_react_1.Loader2 size={16} className="animate-spin"/> : <lucide_react_1.Trash2 size={16}/>}
                        </button>
                      </li>)); })}
                </ul>)}
            </div>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
