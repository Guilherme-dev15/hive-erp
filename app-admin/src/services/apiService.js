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
exports.saveConfig = exports.getConfig = exports.getABCReport = exports.getDashboardCharts = exports.getDashboardStats = exports.revertCampaign = exports.applyCampaign = exports.simulateCampaign = exports.deleteCoupon = exports.createCoupon = exports.getCoupons = exports.deleteCategory = exports.createCategory = exports.getCategories = exports.deleteFornecedor = exports.updateFornecedor = exports.createFornecedor = exports.getFornecedores = exports.getProductLogs = exports.adjustStock = exports.deleteTransacao = exports.updateTransacao = exports.createTransacao = exports.getTransacoes = exports.deleteAdminOrder = exports.updateAdminOrderStatus = exports.getAdminOrders = exports.importProductsBulk = exports.deleteAdminProduto = exports.updateAdminProduto = exports.createAdminProduto = exports.getAdminProdutos = exports.uploadImage = exports.apiClient = void 0;
var axios_1 = require("axios");
var storage_1 = require("firebase/storage");
var firebaseConfig_1 = require("./firebase/firebaseConfig");
// ============================================================================
// CONFIGURAÇÃO DA CONEXÃO
// ============================================================================
var API_URL = import.meta.env.VITE_API_URL;
exports.apiClient = axios_1.default.create({
    baseURL: API_URL,
});
// Interceptor para injetar o Token do Firebase em todas as chamadas
exports.apiClient.interceptors.request.use(function (config) { return __awaiter(void 0, void 0, void 0, function () {
    var user, token;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                user = firebaseConfig_1.auth.currentUser;
                if (!user) return [3 /*break*/, 2];
                return [4 /*yield*/, user.getIdToken()];
            case 1:
                token = _a.sent();
                config.headers.Authorization = "Bearer ".concat(token);
                _a.label = 2;
            case 2: return [2 /*return*/, config];
        }
    });
}); });
// ============================================================================
// SERVIÇO DE UPLOAD (FIREBASE STORAGE)
// ============================================================================
var uploadImage = function (file, p0) { return __awaiter(void 0, void 0, void 0, function () {
    var cleanName, fileName, storageRef, snapshot, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!file)
                    return [2 /*return*/, ""];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                cleanName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
                fileName = "products/".concat(Date.now(), "_").concat(cleanName);
                storageRef = (0, storage_1.ref)(firebaseConfig_1.storage, fileName);
                return [4 /*yield*/, (0, storage_1.uploadBytes)(storageRef, file)];
            case 2:
                snapshot = _a.sent();
                return [4 /*yield*/, (0, storage_1.getDownloadURL)(snapshot.ref)];
            case 3: return [2 /*return*/, _a.sent()];
            case 4:
                error_1 = _a.sent();
                console.error("Erro no Upload:", error_1);
                throw new Error("Falha ao subir imagem.");
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.uploadImage = uploadImage;
// ============================================================================
// DOMÍNIO: PRODUTOS
// ============================================================================
var getAdminProdutos = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.get("/admin/products")];
            case 1:
                response = _a.sent();
                // Mapeamento de segurança para garantir integridade da UI
                return [2 /*return*/, response.data.map(function (prod) { return (__assign(__assign({}, prod), { variantes: prod.variantes || [], cm: prod.cm || "", mm: prod.mm || "" })); })];
        }
    });
}); };
exports.getAdminProdutos = getAdminProdutos;
var createAdminProduto = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/products", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.createAdminProduto = createAdminProduto;
var updateAdminProduto = function (id, data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.put("/admin/products/".concat(id), data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.updateAdminProduto = updateAdminProduto;
var deleteAdminProduto = function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/products/".concat(id))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
exports.deleteAdminProduto = deleteAdminProduto;
var importProductsBulk = function (products) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/products/bulk", products)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.importProductsBulk = importProductsBulk;
// ============================================================================
// DOMÍNIO: PEDIDOS (GESTÃO DE VENDAS)
// ============================================================================
var getAdminOrders = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/orders")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getAdminOrders = getAdminOrders;
var updateAdminOrderStatus = function (orderId, status) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.patch("/admin/orders/".concat(orderId, "/status"), {
                    status: status,
                })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
exports.updateAdminOrderStatus = updateAdminOrderStatus;
var deleteAdminOrder = function (orderId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/orders/".concat(orderId))];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.deleteAdminOrder = deleteAdminOrder;
// ============================================================================
// DOMÍNIO: FINANCEIRO & TRANSAÇÕES
// ============================================================================
var getTransacoes = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/transactions")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getTransacoes = getTransacoes;
var createTransacao = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/transactions", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.createTransacao = createTransacao;
var updateTransacao = function (id, data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.put("/admin/transactions/".concat(id), data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.updateTransacao = updateTransacao;
var deleteTransacao = function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/transactions/".concat(id))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
exports.deleteTransacao = deleteTransacao;
// ============================================================================
// DOMÍNIO: ESTOQUE (INVENTÁRIO)
// ============================================================================
var adjustStock = function (data) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.post("/admin/inventory/adjust", data)];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
exports.adjustStock = adjustStock;
var getProductLogs = function (productId) { return __awaiter(void 0, void 0, void 0, function () {
    var response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.get("/admin/inventory/logs/".concat(productId))];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
        }
    });
}); };
exports.getProductLogs = getProductLogs;
// ============================================================================
// DOMÍNIO: FORNECEDORES & CATEGORIAS
// ============================================================================
var getFornecedores = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/suppliers")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getFornecedores = getFornecedores;
var createFornecedor = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/suppliers", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.createFornecedor = createFornecedor;
var updateFornecedor = function (id, data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.put("/admin/suppliers/".concat(id), data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.updateFornecedor = updateFornecedor;
var deleteFornecedor = function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/suppliers/".concat(id))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
exports.deleteFornecedor = deleteFornecedor;
var getCategories = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/categories")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getCategories = getCategories;
var createCategory = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/categories", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.createCategory = createCategory;
var deleteCategory = function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/categories/".concat(id))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
exports.deleteCategory = deleteCategory;
// ============================================================================
// DOMÍNIO: MARKETING (CUPONS & CAMPANHAS)
// ============================================================================
var getCoupons = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/coupons")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getCoupons = getCoupons;
var createCoupon = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/coupons", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.createCoupon = createCoupon;
var deleteCoupon = function (id) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.delete("/admin/coupons/".concat(id))];
        case 1: return [2 /*return*/, _a.sent()];
    }
}); }); };
exports.deleteCoupon = deleteCoupon;
var simulateCampaign = function (discountPercent, minMarkup) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.post("/admin/campaign/simulate", {
                    discountPercent: discountPercent,
                    minMarkup: minMarkup,
                })];
            case 1: return [2 /*return*/, (_a.sent()).data];
        }
    });
}); };
exports.simulateCampaign = simulateCampaign;
var applyCampaign = function (discountPercent, minMarkup, campaignName) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, exports.apiClient.post("/admin/campaign/apply", {
                    discountPercent: discountPercent,
                    minMarkup: minMarkup,
                    campaignName: campaignName,
                })];
            case 1: return [2 /*return*/, (_a.sent()).data];
        }
    });
}); };
exports.applyCampaign = applyCampaign;
var revertCampaign = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/campaign/revert")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.revertCampaign = revertCampaign;
// ============================================================================
// DOMÍNIO: DASHBOARD & CONFIGURAÇÕES GLOBAIS
// ============================================================================
var getDashboardStats = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/dashboard-stats")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getDashboardStats = getDashboardStats;
var getDashboardCharts = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/dashboard-charts")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getDashboardCharts = getDashboardCharts;
var getABCReport = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/reports/abc")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getABCReport = getABCReport;
var getConfig = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.get("/admin/config")];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.getConfig = getConfig;
var saveConfig = function (data) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    switch (_a.label) {
        case 0: return [4 /*yield*/, exports.apiClient.post("/admin/config", data)];
        case 1: return [2 /*return*/, (_a.sent()).data];
    }
}); }); };
exports.saveConfig = saveConfig;
