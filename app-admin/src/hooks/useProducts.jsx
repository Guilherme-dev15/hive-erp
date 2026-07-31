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
exports.useProducts = useProducts;
var react_1 = require("react");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
function useProducts() {
    var _this = this;
    var _a = (0, react_1.useState)([]), products = _a[0], setProducts = _a[1];
    var _b = (0, react_1.useState)(true), isLoading = _b[0], setIsLoading = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    var fetchProducts = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.getAdminProdutos)()];
                case 2:
                    data = _a.sent();
                    setProducts(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao carregar produtos.");
                    console.error(error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    (0, react_1.useEffect)(function () {
        fetchProducts();
    }, [fetchProducts]);
    var createProduct = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var newProduct_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.createAdminProduto)(data)];
                case 2:
                    newProduct_1 = _a.sent();
                    setProducts(function (prev) { return __spreadArray([newProduct_1], prev, true); }); // Adiciona no topo da lista
                    react_hot_toast_1.toast.success("Produto criado com sucesso!");
                    return [2 /*return*/, newProduct_1];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao criar produto.");
                    console.error(error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var updateProduct = function (id, data) { return __awaiter(_this, void 0, void 0, function () {
        var updatedProduct_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.updateAdminProduto)(id, data)];
                case 2:
                    updatedProduct_1 = _a.sent();
                    setProducts(function (prev) {
                        return prev.map(function (p) { return (p.id === id ? __assign(__assign({}, p), updatedProduct_1) : p); });
                    });
                    react_hot_toast_1.toast.success("Produto atualizado!");
                    return [2 /*return*/, updatedProduct_1];
                case 3:
                    error_3 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao atualizar produto.");
                    console.error(error_3);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var deleteProduct = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, apiService_1.deleteAdminProduto)(id)];
                case 1:
                    _a.sent();
                    setProducts(function (prev) { return prev.filter(function (p) { return p.id !== id; }); });
                    react_hot_toast_1.toast.success("Produto removido.");
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao remover produto.");
                    console.error(error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var bulkImport = function (productsData) { return __awaiter(_this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, (0, apiService_1.importProductsBulk)(productsData)];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Produtos importados em massa!");
                    return [4 /*yield*/, fetchProducts()];
                case 3:
                    _a.sent(); // Recarrega a lista após importação
                    return [3 /*break*/, 6];
                case 4:
                    error_5 = _a.sent();
                    react_hot_toast_1.toast.error("Erro na importação em massa.");
                    console.error(error_5);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return {
        products: products,
        isLoading: isLoading,
        isSubmitting: isSubmitting,
        createProduct: createProduct,
        updateProduct: updateProduct,
        deleteProduct: deleteProduct,
        bulkImport: bulkImport,
        refresh: fetchProducts,
    };
}
