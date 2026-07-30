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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipePage = EquipePage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var firestore_1 = require("firebase/firestore");
var useAuth_1 = require("../hooks/useAuth");
var db = (0, firestore_1.getFirestore)();
function EquipePage() {
    var _this = this;
    var _a = (0, useAuth_1.useAuth)(), user = _a.user, userData = _a.userData; // userData tem o 'role' (owner/vendedor)
    var _b = (0, react_1.useState)([]), usersList = _b[0], setUsersList = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    // Form
    var _d = (0, react_1.useState)(''), newEmail = _d[0], setNewEmail = _d[1];
    var _e = (0, react_1.useState)(''), newName = _e[0], setNewName = _e[1];
    var _f = (0, react_1.useState)(false), isSubmitting = _f[0], setIsSubmitting = _f[1];
    // Verifica se quem está logado é o DONO
    var isOwner = (userData === null || userData === void 0 ? void 0 : userData.role) === 'owner';
    var loadUsers = function () { return __awaiter(_this, void 0, void 0, function () {
        var querySnapshot, lista, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, firestore_1.getDocs)((0, firestore_1.collection)(db, "users"))];
                case 2:
                    querySnapshot = _a.sent();
                    lista = querySnapshot.docs.map(function (d) { return (__assign({ email: d.id }, d.data())); });
                    setUsersList(lista);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao carregar equipe.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () { loadUsers(); }, []);
    var handleAddUser = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!isOwner)
                        return [2 /*return*/, react_hot_toast_1.toast.error("Apenas o dono pode adicionar membros.")]; // Bloqueio lógico
                    if (!newEmail || !newName)
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, firestore_1.setDoc)((0, firestore_1.doc)(db, "users", newEmail.trim().toLowerCase()), {
                            name: newName,
                            email: newEmail.trim().toLowerCase(),
                            role: 'vendedor',
                            active: true,
                            createdBy: user === null || user === void 0 ? void 0 : user.email,
                            createdAt: new Date()
                        })];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Usuário adicionado!");
                    setNewEmail('');
                    setNewName('');
                    loadUsers();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao adicionar usuário.");
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (targetUser) { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isOwner)
                        return [2 /*return*/, react_hot_toast_1.toast.error("Apenas o dono pode remover membros.")];
                    // Ninguém pode deletar um OWNER (nem mesmo outro owner, por segurança básica nesta versão)
                    if (targetUser.role === 'owner') {
                        return [2 /*return*/, react_hot_toast_1.toast.error("O Dono não pode ser removido.")];
                    }
                    if (!confirm("Revogar acesso de ".concat(targetUser.name, "?")))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, firestore_1.deleteDoc)((0, firestore_1.doc)(db, "users", targetUser.email))];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Acesso revogado.");
                    loadUsers();
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao remover.");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="pb-20 max-w-4xl mx-auto">
      <react_hot_toast_1.Toaster position="top-right"/>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <lucide_react_1.Users className="text-dourado"/> Gestão de Equipe
        </h1>
        <p className="text-gray-500 mt-2">
          {isOwner
            ? "Gerencie quem tem acesso ao sistema."
            : "Visualize a equipe da loja."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* FORMULÁRIO (SÓ APARECE PARA O DONO) */}
        {isOwner ? (<div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <lucide_react_1.Plus size={18} className="text-green-600"/> Novo Membro
              </h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                  <input value={newName} onChange={function (e) { return setNewName(e.target.value); }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado" placeholder="Ex: João Silva" required/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">E-mail Google</label>
                  <input type="email" value={newEmail} onChange={function (e) { return setNewEmail(e.target.value); }} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-dourado" placeholder="joao@gmail.com" required/>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-carvao text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-70 flex justify-center items-center gap-2">
                  Confirmar Acesso
                </button>
              </form>
            </div>
          </div>) : (
        // SE NÃO FOR DONO, MOSTRA UM AVISO
        <div className="md:col-span-1">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center opacity-75">
              <lucide_react_1.Lock size={32} className="mx-auto text-gray-400 mb-2"/>
              <h3 className="font-bold text-gray-600">Acesso Restrito</h3>
              <p className="text-sm text-gray-500 mt-1">Apenas o Admin Master pode adicionar ou remover membros.</p>
            </div>
          </div>)}

        {/* LISTA */}
        <div className="md:col-span-2 space-y-4">
          {loading ? <p>Carregando...</p> : usersList.map(function (u) { return (<framer_motion_1.motion.div key={u.email} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={"p-4 rounded-xl border flex items-center justify-between shadow-sm ".concat(u.role === 'owner' ? 'bg-yellow-50/50 border-yellow-100' : 'bg-white border-gray-100')}>
              <div className="flex items-center gap-4">
                <div className={"p-3 rounded-full ".concat(u.role === 'owner' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-50 text-blue-600')}>
                  {u.role === 'owner' ? <lucide_react_1.ShieldCheck size={20}/> : <lucide_react_1.Shield size={20}/>}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{u.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <lucide_react_1.Mail size={12}/> {u.email}
                  </div>
                </div>
              </div>

              {/* BOTÃO DE DELETE: Só aparece se EU for Owner E o alvo NÃO for Owner */}
              {isOwner && u.role !== 'owner' && (<button onClick={function () { return handleDelete(u); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Revogar Acesso">
                  <lucide_react_1.Trash2 size={18}/>
                </button>)}
            </framer_motion_1.motion.div>); })}
        </div>
      </div>
    </div>);
}
