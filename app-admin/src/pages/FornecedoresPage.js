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
exports.FornecedoresPage = FornecedoresPage;
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_1 = require("@hookform/resolvers/zod");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
// Imports Padronizados em Inglês
var apiService_1 = require("../services/apiService");
var schemas_1 = require("../types/schemas");
// --- COMPONENTES AUXILIARES ---
var Input = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, placeholder = _a.placeholder;
    return (<div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...register(name)} placeholder={placeholder} className={"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-dourado outline-none transition-all ".concat(error ? 'border-red-500' : 'border-gray-300')}/>
    {error && <span className="text-xs text-red-500">{error.message}</span>}
  </div>);
};
// --- PÁGINA PRINCIPAL ---
function FornecedoresPage() {
    var _this = this;
    var _a = (0, react_1.useState)([]), fornecedores = _a[0], setFornecedores = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(''), searchTerm = _c[0], setSearchTerm = _c[1];
    // Controle do Modal
    var _d = (0, react_1.useState)(false), isModalOpen = _d[0], setIsModalOpen = _d[1];
    var _e = (0, react_1.useState)(null), editingProvider = _e[0], setEditingProvider = _e[1];
    // Carregar Dados
    (0, react_1.useEffect)(function () {
        carregarFornecedores();
    }, []);
    var carregarFornecedores = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, (0, apiService_1.getFornecedores)()];
                case 1:
                    data = _a.sent();
                    setFornecedores(data);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao carregar fornecedores.");
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Filtragem (Usando nomes em Inglês)
    var filtered = fornecedores.filter(function (f) {
        return f.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
    // Deletar
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm("Tem certeza que deseja excluir?"))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, apiService_1.deleteFornecedor)(id)];
                case 2:
                    _a.sent();
                    setFornecedores(function (prev) { return prev.filter(function (f) { return f.id !== id; }); });
                    react_hot_toast_1.toast.success("Fornecedor removido.");
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao excluir.");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Abrir Modal
    var openModal = function (provider) {
        setEditingProvider(provider || null);
        setIsModalOpen(true);
    };
    return (<div className="space-y-6">
      <react_hot_toast_1.Toaster position="top-right"/>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-carvao">Fornecedores</h1>
          <p className="text-gray-500 text-sm">Parceiros e fabricantes.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow">
            <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input placeholder="Buscar fornecedor..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-dourado w-full"/>
          </div>
          <button onClick={function () { return openModal(); }} className="bg-carvao text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-md">
            <lucide_react_1.Plus size={20}/> Novo
          </button>
        </div>
      </div>

      {/* Lista / Grid */}
      {loading ? (<div className="flex justify-center p-10"><lucide_react_1.Loader2 className="animate-spin text-gray-400"/></div>) : filtered.length === 0 ? (<div className="text-center p-10 text-gray-400 bg-white rounded-xl border border-gray-100">Nenhum fornecedor encontrado.</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(function (f) { return (<div key={f.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-800">{f.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={function () { return openModal(f); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><lucide_react_1.Edit size={16}/></button>
                  <button onClick={function () { return handleDelete(f.id); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><lucide_react_1.Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                {f.contactPhone && (<div className="flex items-center gap-2">
                    <lucide_react_1.Phone size={14} className="text-dourado"/> <span>{f.contactPhone}</span>
                  </div>)}
                {f.url && (<div className="flex items-center gap-2">
                    <lucide_react_1.Link size={14} className="text-dourado"/> 
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">{f.url}</a>
                  </div>)}
                {f.paymentTerms && (<div className="flex items-center gap-2">
                    <lucide_react_1.Truck size={14} className="text-dourado"/> <span>{f.paymentTerms}</span>
                  </div>)}
              </div>
            </div>); })}
        </div>)}

      {/* Modal Interno */}
      <FornecedorModal isOpen={isModalOpen} onClose={function () { return setIsModalOpen(false); }} provider={editingProvider} onSuccess={function (p) {
            if (editingProvider) {
                setFornecedores(function (prev) { return prev.map(function (f) { return f.id === p.id ? p : f; }); });
            }
            else {
                setFornecedores(function (prev) { return __spreadArray(__spreadArray([], prev, true), [p], false); });
            }
            setIsModalOpen(false);
        }}/>
    </div>);
}
// --- COMPONENTE DO FORMULÁRIO (MODAL) ---
function FornecedorModal(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, provider = _a.provider, onSuccess = _a.onSuccess;
    var _b = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(schemas_1.fornecedorSchema)
    }), register = _b.register, handleSubmit = _b.handleSubmit, reset = _b.reset, _c = _b.formState, errors = _c.errors, isSubmitting = _c.isSubmitting;
    // Preencher form ao editar
    react_1.default.useEffect(function () {
        if (isOpen) {
            reset({
                name: (provider === null || provider === void 0 ? void 0 : provider.name) || '',
                contactPhone: (provider === null || provider === void 0 ? void 0 : provider.contactPhone) || '',
                url: (provider === null || provider === void 0 ? void 0 : provider.url) || '',
                paymentTerms: (provider === null || provider === void 0 ? void 0 : provider.paymentTerms) || '',
                email: (provider === null || provider === void 0 ? void 0 : provider.email) || '',
                pixKey: (provider === null || provider === void 0 ? void 0 : provider.pixKey) || ''
            });
        }
    }, [isOpen, provider, reset]);
    var onSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    result = void 0;
                    if (!provider) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, apiService_1.updateFornecedor)(provider.id, data)];
                case 1:
                    result = _a.sent();
                    react_hot_toast_1.toast.success("Atualizado!");
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, apiService_1.createFornecedor)(data)];
                case 3:
                    result = _a.sent();
                    react_hot_toast_1.toast.success("Criado!");
                    _a.label = 4;
                case 4:
                    onSuccess(result);
                    return [3 /*break*/, 6];
                case 5:
                    e_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao salvar.");
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
          <framer_motion_1.motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={function (e) { return e.stopPropagation(); }}>
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">{provider ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
              <button onClick={onClose}><lucide_react_1.X size={20} className="text-gray-500 hover:text-gray-700"/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <Input label="Nome da Empresa *" name="name" register={register} error={errors.name} placeholder="Ex: Pratas Matriz"/>
              <Input label="Telefone / WhatsApp" name="contactPhone" register={register} error={errors.contactPhone} placeholder="Ex: 1199999..."/>
              <Input label="Site ou Catálogo (URL)" name="url" register={register} error={errors.url} placeholder="https://..."/>
              <Input label="Prazo de Pagamento" name="paymentTerms" register={register} error={errors.paymentTerms} placeholder="Ex: 30/60 dias"/>
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="bg-carvao text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                  {isSubmitting && <lucide_react_1.Loader2 className="animate-spin" size={16}/>} Salvar
                </button>
              </div>
            </form>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
