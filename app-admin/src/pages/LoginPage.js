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
exports.LoginPage = LoginPage;
var react_1 = require("react");
var useAuth_1 = require("../hooks/useAuth");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
function LoginPage() {
    var _this = this;
    var signInWithGoogle = (0, useAuth_1.useAuth)().signInWithGoogle;
    var _a = (0, react_1.useState)(false), isLoggingIn = _a[0], setIsLoggingIn = _a[1];
    var handleLogin = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoggingIn(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, signInWithGoogle()];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Bem-vindo de volta!");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    react_hot_toast_1.toast.error("Falha no login. Tente novamente.");
                    setIsLoggingIn(false);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="min-h-screen bg-off-white flex flex-col items-center justify-center p-4">
      <react_hot_toast_1.Toaster position="top-right"/>
      
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
        {/* Ícone */}
        <div className="bg-carvao w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <lucide_react_1.Lock className="text-dourado" size={32}/>
        </div>

        <h1 className="text-2xl font-bold text-carvao mb-2">Área Restrita</h1>
        <p className="text-gray-500 mb-8">
          Apenas pessoal autorizado da <span className="font-semibold text-dourado">Hive ERP</span>.
        </p>

        {/* Botão de Login Google */}
        <button onClick={handleLogin} disabled={isLoggingIn} className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm group">
          {isLoggingIn ? (<lucide_react_1.Loader2 className="animate-spin text-carvao" size={24}/>) : (<>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google G" className="w-6 h-6"/>
              <span className="font-medium group-hover:text-gray-900">Entrar com Google</span>
            </>)}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          Sistema Seguro HiveERP v1.0
        </p>
      </div>
    </div>);
}
