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
exports.updateStatusEmMassa = exports.updateMarkupViaFirebase = void 0;
var firestore_1 = require("firebase/firestore");
var firebaseConfig_1 = require("./firebaseConfig");
var updateMarkupViaFirebase = function (newMarkup, category) { return __awaiter(void 0, void 0, void 0, function () {
    var user, batch_1, productsRef, q, snapshot, updatedCount_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = firebaseConfig_1.auth.currentUser;
                if (!user)
                    throw new Error("Usuário não autenticado");
                batch_1 = (0, firestore_1.writeBatch)(firebaseConfig_1.db);
                productsRef = (0, firestore_1.collection)(firebaseConfig_1.db, "products");
                q = (0, firestore_1.query)(productsRef, (0, firestore_1.where)("category", "==", category), (0, firestore_1.where)("userId", "==", user.uid));
                return [4 /*yield*/, (0, firestore_1.getDocs)(q)];
            case 1:
                snapshot = _a.sent();
                updatedCount_1 = 0;
                snapshot.forEach(function (productDoc) {
                    var data = productDoc.data();
                    var docRef = (0, firestore_1.doc)(firebaseConfig_1.db, "products", productDoc.id);
                    // Mantém o preço antigo como segurança caso nenhuma regra bata
                    var newSalePrice = data.salePrice;
                    // 1. Coletamos as variáveis com Fallback (Zero se não existir)
                    var weight = data.weight || 0;
                    var gramPrice = data.gramPrice || 0;
                    var costPrice = data.costPrice || 0;
                    // 2. A Inteligência de Precificação (Polimorfismo)
                    if (weight > 0 && gramPrice > 0) {
                        // Modelo 1: Precificação por Peso (Fabricação Própria)
                        newSalePrice = weight * gramPrice * newMarkup;
                    }
                    else if (costPrice > 0) {
                        // Modelo 2: Precificação por Custo Real (Terceirizados/Prontos)
                        newSalePrice = costPrice * newMarkup;
                    }
                    // 3. Adiciona na fila de atualização
                    batch_1.update(docRef, {
                        markup: newMarkup,
                        salePrice: newSalePrice,
                        updatedAt: new Date(),
                    });
                    updatedCount_1++;
                });
                if (updatedCount_1 === 0)
                    return [2 /*return*/, 0];
                return [4 /*yield*/, batch_1.commit()];
            case 2:
                _a.sent();
                return [2 /*return*/, updatedCount_1];
            case 3:
                error_1 = _a.sent();
                console.error("Falha crítica no Batch do Firestore:", error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateMarkupViaFirebase = updateMarkupViaFirebase;
var updateStatusEmMassa = function (productIds, // Agora recebemos um array com os IDs selecionados
novoStatus) { return __awaiter(void 0, void 0, void 0, function () {
    var user, batch_2, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                user = firebaseConfig_1.auth.currentUser;
                if (!user)
                    throw new Error("Usuário não autenticado");
                if (productIds.length === 0)
                    return [2 /*return*/, 0];
                if (productIds.length > 500) {
                    throw new Error("O limite do Firebase é de 500 atualizações por vez.");
                }
                batch_2 = (0, firestore_1.writeBatch)(firebaseConfig_1.db);
                // Iteramos diretamente sobre os IDs que o React nos passou
                productIds.forEach(function (id) {
                    // Como já temos o ID, vamos direto no "endereço" do documento
                    var docRef = (0, firestore_1.doc)(firebaseConfig_1.db, "products", id);
                    // Adicionamos no lote a instrução para mudar o status
                    batch_2.update(docRef, {
                        status: novoStatus,
                        updatedAt: new Date(),
                    });
                });
                // Executa tudo de uma vez
                return [4 /*yield*/, batch_2.commit()];
            case 1:
                // Executa tudo de uma vez
                _a.sent();
                return [2 /*return*/, productIds.length];
            case 2:
                error_2 = _a.sent();
                console.error("Falha ao atualizar status em lote:", error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateStatusEmMassa = updateStatusEmMassa;
