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
import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/format';
export function CheckoutForm(_a) {
    var _this = this;
    var amount = _a.amount, onSuccess = _a.onSuccess, onCancel = _a.onCancel;
    var stripe = useStripe();
    var elements = useElements();
    var _b = useState(null), message = _b[0], setMessage = _b[1];
    var _c = useState(false), isLoading = _c[0], setIsLoading = _c[1];
    useEffect(function () {
        if (!stripe)
            return;
        // Verifica se houve redirecionamento de pagamento (ex: 3D Secure)
        var clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
        if (!clientSecret)
            return;
        stripe.retrievePaymentIntent(clientSecret).then(function (_a) {
            var paymentIntent = _a.paymentIntent;
            switch (paymentIntent === null || paymentIntent === void 0 ? void 0 : paymentIntent.status) {
                case "succeeded":
                    setMessage("Pagamento realizado com sucesso!");
                    onSuccess();
                    break;
                case "processing":
                    setMessage("Seu pagamento está sendo processado.");
                    break;
                case "requires_payment_method":
                    setMessage("Pagamento não realizado, tente novamente.");
                    break;
                default:
                    setMessage("Algo deu errado.");
                    break;
            }
        });
    }, [onSuccess, stripe]);
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!stripe || !elements)
                        return [2 /*return*/];
                    setIsLoading(true);
                    return [4 /*yield*/, stripe.confirmPayment({
                            elements: elements,
                            confirmParams: {
                                // Redireciona para cá após pagamento (importante para mobile banking)
                                return_url: window.location.href,
                            },
                            redirect: 'if_required' // Tenta não redirecionar se não precisar
                        })];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        if (error.type === "card_error" || error.type === "validation_error") {
                            setMessage(error.message || "Erro no cartão");
                        }
                        else {
                            setMessage("Ocorreu um erro inesperado.");
                        }
                        toast.error(error.message || "Erro no pagamento");
                    }
                    else {
                        // Sucesso sem redirect!
                        toast.success("Pagamento Aprovado!");
                        onSuccess();
                    }
                    setIsLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={handleSubmit} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
      <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold border-b pb-2">
        <Lock size={18} className="text-green-600"/>
        Pagamento Seguro ({formatCurrency(amount)})
      </div>
      
      {/* O Stripe injeta o formulário aqui */}
      <PaymentElement id="payment-element" options={{ layout: "tabs" }}/>
      
      {/* Mensagens de erro */}
      {message && <div className="mt-2 text-sm text-red-500 font-medium">{message}</div>}

      <div className="flex gap-3 mt-6">
        <button type="button" onClick={onCancel} disabled={isLoading || !stripe || !elements} className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">
          Cancelar
        </button>
        
        <button type="submit" disabled={isLoading || !stripe || !elements} className="flex-1 py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
          {isLoading ? <Loader2 className="animate-spin"/> : "Pagar Agora"}
        </button>
      </div>
    </form>);
}
