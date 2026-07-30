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
exports.BulkMarkupModal = void 0;
var react_1 = require("react");
var firestore_1 = require("firebase/firestore");
var firebaseConfig_1 = require("../services/firebase/firebaseConfig");
var bulkUpdate_1 = require("../services/firebase/bulkUpdate");
var BulkMarkupModal = function (_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess;
    var _b = (0, react_1.useState)([]), categories = _b[0], setCategories = _b[1];
    var _c = (0, react_1.useState)(""), selectedCategory = _c[0], setSelectedCategory = _c[1];
    var _d = (0, react_1.useState)(""), markupValue = _d[0], setMarkupValue = _d[1];
    var _e = (0, react_1.useState)(false), isProcessing = _e[0], setIsProcessing = _e[1];
    // PONTO 3: Estado para lidar com a mensagem de erro (sem usar alert!)
    var _f = (0, react_1.useState)(null), errorMessage = _f[0], setErrorMessage = _f[1];
    (0, react_1.useEffect)(function () {
        if (!isOpen) {
            // PONTO 5: Limpeza de state quando o modal fecha!
            setSelectedCategory("");
            setMarkupValue("");
            setErrorMessage(null);
            return;
        }
        var fetchCategories = function () { return __awaiter(void 0, void 0, void 0, function () {
            var user, categoriasQuery, querySnapshot, loadedCategories_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        user = firebaseConfig_1.auth.currentUser;
                        if (!user) {
                            setErrorMessage("Você precisa estar logado.");
                            return [2 /*return*/];
                        }
                        categoriasQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, "categories"), (0, firestore_1.where)("userId", "==", user.uid));
                        return [4 /*yield*/, (0, firestore_1.getDocs)(categoriasQuery)];
                    case 1:
                        querySnapshot = _a.sent();
                        loadedCategories_1 = [];
                        querySnapshot.forEach(function (doc) {
                            loadedCategories_1.push({ id: doc.id, name: doc.data().name });
                        });
                        setCategories(loadedCategories_1);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error(error_1);
                        setErrorMessage("Erro ao carregar categorias do banco.");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        fetchCategories();
    }, [isOpen]);
    var handleApplyMarkup = function () { return __awaiter(void 0, void 0, void 0, function () {
        var updatedCount, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setErrorMessage(null); // Limpa erros anteriores
                    if (!selectedCategory || !markupValue) {
                        setErrorMessage("Por favor, selecione uma categoria e digite um markup válido.");
                        return [2 /*return*/];
                    }
                    setIsProcessing(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, bulkUpdate_1.updateMarkupViaFirebase)(Number(markupValue), selectedCategory)];
                case 2:
                    updatedCount = _a.sent();
                    onSuccess(updatedCount);
                    onClose();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    setErrorMessage("Erro grave ao atualizar preços. Tente novamente.");
                    return [3 /*break*/, 5];
                case 4:
                    setIsProcessing(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">Atualizar Markup em Massa</h2>

        {/* PONTO 3: Feedback visual de erro elegante */}
        {errorMessage && (<div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm font-medium">
            {errorMessage}
          </div>)}

        <div className="mb-4">
          {/* PONTO 2: Acessibilidade com htmlFor */}
          <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria Alvo
          </label>
          <select id="category-select" className="w-full border p-2 rounded" value={selectedCategory} onChange={function (e) { return setSelectedCategory(e.target.value); }} disabled={isProcessing}>
            <option value="">Selecione...</option>
            {categories.map(function (cat) { return (
        // PONTO 4: Usando o doc.id real do Firebase como Key
        <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>); })}
          </select>
        </div>

        <div className="mb-6">
          {/* PONTO 2: Acessibilidade com htmlFor */}
          <label htmlFor="markup-input" className="block text-sm font-medium text-gray-700 mb-1">
            Novo Markup (ex: 2.5)
          </label>
          <input id="markup-input" type="number" step="0.1" min="1" className="w-full border p-2 rounded" value={markupValue} onChange={function (e) { return setMarkupValue(parseFloat(e.target.value)); }} disabled={isProcessing}/>
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors" onClick={onClose} disabled={isProcessing}>
            Cancelar
          </button>
          <button className="px-4 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 disabled:opacity-50 transition-colors" onClick={handleApplyMarkup} disabled={isProcessing}>
            {isProcessing ? "Aplicando..." : "Aplicar Markup"}
          </button>
        </div>
      </div>
    </div>);
};
exports.BulkMarkupModal = BulkMarkupModal;
