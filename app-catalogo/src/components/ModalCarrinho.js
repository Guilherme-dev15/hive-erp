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
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Package, X, Plus, Minus, Send, TicketPercent, Loader2, User, CheckCircle, } from "lucide-react";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { saveOrder, checkCoupon } from "../services/api";
import { formatCurrency } from "../utils/format";
import { CheckoutForm } from "./CheckoutForm";
// Carrega o Stripe usando a chave pública do .env
var stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
export function ModalCarrinho(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, itens = _a.itens, setCarrinho = _a.setCarrinho, whatsappNumber = _a.whatsappNumber, config = _a.config;
    var _b = useState(""), nome = _b[0], setNome = _b[1];
    var _c = useState(""), tel = _c[0], setTel = _c[1];
    var _d = useState(""), obs = _d[0], setObs = _d[1];
    // Cupom
    var _e = useState(""), couponCode = _e[0], setCouponCode = _e[1];
    var _f = useState(null), appliedCoupon = _f[0], setAppliedCoupon = _f[1];
    // Loading States
    var _g = useState(false), loading = _g[0], setLoading = _g[1];
    var _h = useState(false), checkingCoupon = _h[0], setCheckingCoupon = _h[1];
    // --- STRIPE STATES ---
    var _j = useState(false), showPayment = _j[0], setShowPayment = _j[1];
    var _k = useState(""), clientSecret = _k[0], setClientSecret = _k[1];
    // --- SUCESSO STATES (NOVO) ---
    var _l = useState(false), orderSuccess = _l[0], setOrderSuccess = _l[1];
    var _m = useState(""), lastOrderId = _m[0], setLastOrderId = _m[1];
    // --- CÁLCULOS ---
    var _o = useMemo(function () {
        var sub = itens.reduce(function (acc, i) { return acc + (i.produto.salePrice || 0) * i.quantidade; }, 0);
        var desc = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === "percentage") {
                desc = sub * (appliedCoupon.discountValue / 100);
            }
            else {
                desc = appliedCoupon.discountValue;
            }
        }
        return {
            subtotal: sub,
            desconto: desc,
            total: Math.max(0, sub - desc),
        };
    }, [itens, appliedCoupon]), subtotal = _o.subtotal, desconto = _o.desconto, total = _o.total;
    // --- HANDLER DE CUPOM ---
    var handleCoupon = function () { return __awaiter(_this, void 0, void 0, function () {
        var storeId, res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!couponCode.trim())
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    setCheckingCoupon(true);
                    storeId = (config === null || config === void 0 ? void 0 : config.storeId) ||
                        new URLSearchParams(window.location.search).get("storeId");
                    if (!storeId) {
                        toast.error("Erro técnico: ID da loja não identificado.");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, checkCoupon(couponCode, storeId)];
                case 2:
                    res = _a.sent();
                    if (res.valid) {
                        setAppliedCoupon({
                            code: res.code,
                            discountValue: res.discountValue,
                            type: res.type,
                        });
                        toast.success("Cupom ".concat(couponCode.toUpperCase(), " aplicado!"));
                    }
                    else {
                        toast.error(res.message || "Cupom inválido.");
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error(error_1);
                    toast.error("Erro ao validar cupom.");
                    return [3 /*break*/, 5];
                case 4:
                    setCheckingCoupon(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var updateQtd = function (id, d) {
        setCarrinho(function (prev) {
            var _a;
            var item = prev[id];
            if (!item)
                return prev;
            var nova = item.quantidade + d;
            if (d > 0 && nova > (item.produto.quantity || 999)) {
                toast.error("Estoque limite atingido");
                return prev;
            }
            if (nova <= 0) {
                var c = __assign({}, prev);
                delete c[id];
                return c;
            }
            return __assign(__assign({}, prev), (_a = {}, _a[id] = __assign(__assign({}, item), { quantidade: nova }), _a));
        });
    };
    var removeItem = function (id) {
        setCarrinho(function (prev) {
            var c = __assign({}, prev);
            delete c[id];
            return c;
        });
    };
    // --- INICIAR PAGAMENTO ONLINE (STRIPE) ---
    // (DESATIVADO: botão de cartão comentado no JSX abaixo)
    // const handleOnlinePayment = async () => {
    //   if (!nome.trim() || !tel.trim())
    //     return toast.error("Preencha Nome e WhatsApp antes de pagar.");
    //
    //   setLoading(true);
    //   try {
    //     const data = await createPaymentIntent(total, config.storeId || "");
    //     setClientSecret(data.clientSecret);
    //     setShowPayment(true);
    //   } catch (error) {
    //     console.error("Erro no pagamento:", error);
    //     toast.error("Erro ao iniciar pagamento.");
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // --- FINALIZAR PEDIDO (SALVAR NO BANCO) ---
    var saveOrderToDb = function (paymentMethod) { return __awaiter(_this, void 0, void 0, function () {
        var paymentInfo, statusInicial, orderPayload, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    paymentInfo = paymentMethod === "credit_card"
                        ? " [PAGO VIA CARTÃO]"
                        : " [VIA WHATSAPP]";
                    statusInicial = paymentMethod === "credit_card" ? "Em Separação" : "Aguardando Pagamento";
                    orderPayload = {
                        customerName: nome,
                        customerPhone: tel,
                        items: itens.map(function (i) { return ({
                            id: i.produto.id,
                            name: i.produto.name,
                            code: i.produto.code,
                            salePrice: i.produto.salePrice || 0,
                            quantidade: i.quantidade,
                        }); }),
                        subtotal: subtotal,
                        discount: desconto,
                        total: total,
                        notes: (obs || "") + paymentInfo,
                        storeId: config.storeId,
                        status: statusInicial,
                    };
                    console.log("📦 Enviando pedido com status:", orderPayload.status);
                    return [4 /*yield*/, saveOrder(orderPayload)];
                case 1:
                    res = _a.sent();
                    return [2 /*return*/, res.id || "NOVO"];
            }
        });
    }); };
    var finalizarWhatsApp = function () { return __awaiter(_this, void 0, void 0, function () {
        var orderId, msg, linkZap, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!whatsappNumber)
                        return [2 /*return*/, toast.error("Loja sem WhatsApp configurado")];
                    if (!nome.trim() || !tel.trim())
                        return [2 /*return*/, toast.error("Preencha Nome e WhatsApp")];
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, saveOrderToDb("whatsapp")];
                case 2:
                    orderId = _a.sent();
                    msg = "\uD83E\uDDFE *PEDIDO #".concat(String(orderId).substring(0, 5).toUpperCase(), "*\n") +
                        "\uD83D\uDC64 ".concat(nome, "\n") +
                        "\uD83D\uDCDE ".concat(tel, "\n\n") +
                        itens.map(function (i) { return "".concat(i.quantidade, "x ").concat(i.produto.name); }).join("\n") +
                        "\n\nSubtotal: ".concat(formatCurrency(subtotal)) +
                        (desconto > 0
                            ? "\nDesconto (".concat(appliedCoupon === null || appliedCoupon === void 0 ? void 0 : appliedCoupon.code, "): -").concat(formatCurrency(desconto))
                            : "") +
                        "\n*Total: ".concat(formatCurrency(total), "*") +
                        (obs ? "\nObs: ".concat(obs) : "");
                    linkZap = "https://wa.me/".concat(whatsappNumber, "?text=").concat(encodeURIComponent(msg));
                    window.open(linkZap, "_blank");
                    setCarrinho({});
                    onClose();
                    toast.success("Pedido enviado com sucesso!");
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    toast.error("Erro ao processar pedido.");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // --- CALLBACK DE SUCESSO DO STRIPE (ATUALIZADO) ---
    var onPaymentSuccess = function () { return __awaiter(_this, void 0, void 0, function () {
        var orderId, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, saveOrderToDb("credit_card")];
                case 1:
                    orderId = _a.sent();
                    // 2. Define o ID e ativa a tela de sucesso
                    setLastOrderId(String(orderId));
                    setOrderSuccess(true);
                    // 3. Limpa o carrinho
                    setCarrinho({});
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error("Erro ao salvar pedido pago:", error_2);
                    toast.error("Pagamento aprovado, mas erro ao salvar pedido. Contate a loja.");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Função para fechar tudo e limpar estados
    var handleCloseModal = function () {
        onClose();
        // Reseta estados após fechar (pequeno delay para animação)
        setTimeout(function () {
            setOrderSuccess(false);
            setShowPayment(false);
            setClientSecret("");
        }, 300);
    };
    return (<AnimatePresence>
      {isOpen && (<>
          <motion.div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}/>
          <motion.div className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-white shadow-2xl flex flex-col h-full" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
            {/* HEADER */}
            <div className="p-5 flex justify-between items-center bg-gray-50/80 border-b backdrop-blur-sm sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {orderSuccess ? (<CheckCircle className="text-green-600"/>) : (<ShoppingCart size={22}/>)}
                {orderSuccess ? "Sucesso!" : "Carrinho"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X size={24}/>
              </button>
            </div>

            {/* CONTEÚDO SCROLLÁVEL */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
              {/* TELA DE SUCESSO (NOVA) */}
              {orderSuccess ? (<div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600"/>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Pedido Confirmado!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Seu pedido{" "}
                    <span className="font-mono font-bold text-gray-900">
                      #{lastOrderId.slice(-6).toUpperCase()}
                    </span>{" "}
                    foi recebido com sucesso.
                  </p>

                  <div className="bg-gray-50 p-5 rounded-xl w-full mb-6 text-sm text-left border border-gray-100 shadow-sm">
                    <p className="mb-3 font-semibold text-gray-800">
                      O que acontece agora?
                    </p>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"/>
                        Pagamento via cartão confirmado.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"/>
                        Estamos separando seus itens.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"/>
                        Você receberá atualizações no WhatsApp.
                      </li>
                    </ul>
                  </div>

                  <button onClick={handleCloseModal} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg">
                    Voltar para a Loja
                  </button>
                </div>) : (
            /* FLUXO NORMAL DO CARRINHO */
            <>
                  {itens.length === 0 && !orderSuccess ? (<div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <ShoppingCart size={48} className="mb-4 opacity-20"/>
                      <p>Seu carrinho está vazio.</p>
                    </div>) : (<>
                      {/* PAGAMENTO STRIPE */}
                      {showPayment && clientSecret ? (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <button onClick={function () { return setShowPayment(false); }} className="text-sm text-gray-500 mb-4 flex items-center gap-1 hover:underline">
                            ← Voltar para resumo
                          </button>
                          <Elements stripe={stripePromise} options={{
                            clientSecret: clientSecret,
                            appearance: { theme: "stripe" },
                        }}>
                            <CheckoutForm amount={total} storeId={config.storeId || ""} onSuccess={onPaymentSuccess} onCancel={function () { return setShowPayment(false); }}/>
                          </Elements>
                        </div>) : (
                    /* LISTA DE ITENS */
                    <>
                          <div className="space-y-4">
                            {itens.map(function (item) { return (<div key={item.produto.id} className="flex gap-4 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative">
                                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border">
                                  {item.produto.imageUrl ? (<img src={item.produto.imageUrl} className="w-full h-full object-cover" alt={item.produto.name}/>) : (<Package size={24} className="text-gray-300"/>)}
                                </div>
                                <div className="flex-1 pr-6">
                                  <p className="text-sm font-bold line-clamp-2 text-gray-800">
                                    {item.produto.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mb-2 mt-1">
                                    {formatCurrency(item.produto.salePrice)}
                                  </p>
                                  <div className="flex items-center bg-gray-50 rounded-lg h-8 px-1 w-max border">
                                    <button onClick={function () {
                                return updateQtd(item.produto.id, -1);
                            }} className="w-8 h-full flex justify-center items-center">
                                      <Minus size={14}/>
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold">
                                      {item.quantidade}
                                    </span>
                                    <button onClick={function () {
                                return updateQtd(item.produto.id, 1);
                            }} className="w-8 h-full flex justify-center items-center">
                                      <Plus size={14}/>
                                    </button>
                                  </div>
                                </div>
                                <button onClick={function () { return removeItem(item.produto.id); }} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1">
                                  <X size={16}/>
                                </button>
                              </div>); })}
                          </div>

                          {/* DADOS DO CLIENTE */}
                          <div className="bg-gray-50 p-5 rounded-2xl space-y-4 border border-gray-100 mt-6">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <User size={14}/> Seus Dados
                            </p>
                            <input placeholder="Seu Nome Completo" className="w-full p-3.5 rounded-xl border text-sm" value={nome} onChange={function (e) { return setNome(e.target.value); }}/>
                            <input placeholder="WhatsApp (com DDD)" type="tel" className="w-full p-3.5 rounded-xl border text-sm" value={tel} onChange={function (e) { return setTel(e.target.value); }}/>
                            <textarea placeholder="Observações..." className="w-full p-3.5 rounded-xl border text-sm" rows={2} value={obs} onChange={function (e) { return setObs(e.target.value); }}/>
                          </div>

                          {/* CUPOM */}
                          <div className="flex gap-2 mt-4">
                            <div className="relative flex-1">
                              <TicketPercent size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                              <input placeholder="CUPOM DE DESCONTO" className="w-full pl-10 p-3.5 rounded-xl border text-sm uppercase" value={couponCode} onChange={function (e) {
                            return setCouponCode(e.target.value.toUpperCase());
                        }} disabled={!!appliedCoupon}/>
                            </div>
                            <button onClick={appliedCoupon
                            ? function () {
                                setAppliedCoupon(null);
                                setCouponCode("");
                            }
                            : handleCoupon} disabled={checkingCoupon} className={"px-5 rounded-xl font-bold text-xs transition-all ".concat(appliedCoupon ? "bg-red-50 text-red-600" : "bg-gray-900 text-white")}>
                              {checkingCoupon ? (<Loader2 className="animate-spin" size={16}/>) : appliedCoupon ? ("REMOVER") : ("APLICAR")}
                            </button>
                          </div>
                        </>)}
                    </>)}
                </>)}
            </div>

            {/* FOOTER (SÓ APARECE SE NÃO ESTIVER PAGANDO E NÃO FOR SUCESSO) */}
            {!showPayment && !orderSuccess && (<div className="p-6 border-t bg-white">
                <div className="space-y-2 mb-5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {desconto > 0 && (<div className="flex justify-between text-green-600 font-bold bg-green-50 p-2 rounded-lg">
                      <span>Desconto</span>
                      <span>-{formatCurrency(desconto)}</span>
                    </div>)}
                  <div className="flex justify-between text-2xl font-black text-gray-900 border-t pt-3 mt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {/* BOTÃO WHATSAPP */}
                  <button onClick={finalizarWhatsApp} disabled={itens.length === 0 || loading} className="w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity" style={{ backgroundColor: "#25D366" }}>
                    {loading ? (<Loader2 className="animate-spin"/>) : (<Send size={20}/>)}
                    Finalizar no WhatsApp
                  </button>
                  {/*
                /* BOTÃO CARTÃO DE CRÉDITO
                <button
                  onClick={handleOnlinePayment}
                  disabled={itens.length === 0 || loading}
                  className="w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                  Pagar com Cartão
                </button>
                */}
                </div>
              </div>)}
          </motion.div>
        </>)}
    </AnimatePresence>);
}
