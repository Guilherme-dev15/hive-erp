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
exports.AuthContext = void 0;
exports.AuthProvider = AuthProvider;
var react_1 = require("react");
var auth_1 = require("firebase/auth");
var firestore_1 = require("firebase/firestore");
var firebaseConfig_1 = require("../services/firebase/firebaseConfig");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
exports.AuthContext = (0, react_1.createContext)({});
var db = (0, firestore_1.getFirestore)();
function AuthProvider(_a) {
    var _this = this;
    var children = _a.children;
    var _b = (0, react_1.useState)(null), user = _b[0], setUser = _b[1];
    var _c = (0, react_1.useState)(null), userData = _c[0], setUserData = _c[1];
    var _d = (0, react_1.useState)(true), loading = _d[0], setLoading = _d[1];
    (0, react_1.useEffect)(function () {
        var unsubscribe = (0, auth_1.onAuthStateChanged)(firebaseConfig_1.auth, function (currentUser) { return __awaiter(_this, void 0, void 0, function () {
            var userRef, userSnap, data, token, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(currentUser && currentUser.email)) return [3 /*break*/, 9];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        userRef = (0, firestore_1.doc)(db, "users", currentUser.email);
                        return [4 /*yield*/, (0, firestore_1.getDoc)(userRef)];
                    case 2:
                        userSnap = _a.sent();
                        if (!(userSnap.exists() && userSnap.data().active === true)) return [3 /*break*/, 4];
                        data = userSnap.data();
                        setUserData(data);
                        setUser(currentUser);
                        return [4 /*yield*/, currentUser.getIdToken()];
                    case 3:
                        token = _a.sent();
                        apiService_1.apiClient.defaults.headers.common["Authorization"] = "Bearer ".concat(token);
                        return [3 /*break*/, 6];
                    case 4:
                        react_hot_toast_1.toast.error("Acesso negado. Usuário não cadastrado na equipe.");
                        return [4 /*yield*/, (0, auth_1.signOut)(firebaseConfig_1.auth)];
                    case 5:
                        _a.sent();
                        setUser(null);
                        setUserData(null);
                        delete apiService_1.apiClient.defaults.headers.common["Authorization"];
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("Erro ao validar usuário:", error_1);
                        react_hot_toast_1.toast.error("Erro de conexão ao validar permissões.");
                        setUser(null);
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        setUser(null);
                        setUserData(null);
                        delete apiService_1.apiClient.defaults.headers.common["Authorization"];
                        _a.label = 10;
                    case 10:
                        setLoading(false);
                        return [2 /*return*/];
                }
            });
        }); });
        return unsubscribe;
    }, []);
    var signInWithGoogle = function () { return __awaiter(_this, void 0, void 0, function () {
        var provider, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = new auth_1.GoogleAuthProvider();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, auth_1.signInWithPopup)(firebaseConfig_1.auth, provider)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    if (error_2.code !== "auth/popup-closed-by-user") {
                        console.error("Erro login:", error_2);
                        react_hot_toast_1.toast.error("Erro ao conectar com Google.");
                    }
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var logout = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, auth_1.signOut)(firebaseConfig_1.auth)];
                case 1:
                    _a.sent();
                    setUser(null);
                    setUserData(null);
                    delete apiService_1.apiClient.defaults.headers.common["Authorization"];
                    return [2 /*return*/];
            }
        });
    }); };
    var value = { user: user, userData: userData, loading: loading, signInWithGoogle: signInWithGoogle, logout: logout };
    return (<exports.AuthContext.Provider value={value}>
      {!loading && children}
    </exports.AuthContext.Provider>);
}
