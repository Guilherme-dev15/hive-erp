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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.ProdutoFormModal = ProdutoFormModal;
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_1 = require("@hookform/resolvers/zod");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
var zod_2 = require("zod");
var CategoryModal_1 = require("./CategoryModal");
var schemas_1 = require("../types/schemas");
var apiService_1 = require("../services/apiService");
// --- SCHEMA DE VARIANTES ---
var varianteSchema = zod_2.z.object({
    medida: zod_2.z.string().min(1, "Obrigatório"),
    valor_ajuste: zod_2.z.coerce.number(),
    estoque: zod_2.z.coerce.number(),
    sob_consulta: zod_2.z.boolean().optional(),
    sku_sufixo: zod_2.z.string().optional(),
});
// --- SCHEMA PRINCIPAL ESTENDIDO ---
var extendedProdutoSchema = schemas_1.produtoSchema.extend({
    subcategory: zod_2.z.string().optional(),
    markup: zod_2.z.coerce.number().min(1, "Mínimo 1.0").optional(),
    weight: zod_2.z.coerce.number().optional(),
    gramPrice: zod_2.z.coerce.number().optional(),
    cm: zod_2.z.string().optional(),
    mm: zod_2.z.string().optional(),
    variantes: zod_2.z.array(varianteSchema).optional(),
});
var FormInput = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, icon = _a.icon, className = _a.className, props = __rest(_a, ["label", "name", "register", "error", "icon", "className"]);
    return (<div className={className}>
    {label && (<label htmlFor={String(name)} className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider ml-1">
        {label}
      </label>)}
    <div className="relative group">
      {icon && (<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-[#d19900] transition-colors">
          {icon}
        </div>)}
      <input id={String(name)} {...props} {...register(name)} className={"\n          block w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all duration-200\n          ".concat(error
            ? "border-red-300 focus:ring-red-200 focus:border-red-500"
            : "border-gray-200 hover:border-gray-300 focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10", " \n          ").concat(icon ? "pl-10" : "", " disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed placeholder:text-gray-400 text-gray-800\n        ")}/>
    </div>
    {error && (<p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
        <lucide_react_1.AlertCircle size={10}/> {error}
      </p>)}
  </div>);
};
var FormSelect = function (_a) {
    var label = _a.label, name = _a.name, register = _a.register, error = _a.error, icon = _a.icon, className = _a.className, children = _a.children, props = __rest(_a, ["label", "name", "register", "error", "icon", "className", "children"]);
    return (<div className={className}>
    {label && (<label htmlFor={String(name)} className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider ml-1">
        {label}
      </label>)}
    <div className="relative group">
      {icon && (<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-[#d19900] transition-colors">
          {icon}
        </div>)}
      <select id={String(name)} {...props} {...register(name)} className={"\n          block w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all duration-200 appearance-none\n          ".concat(error
            ? "border-red-300 focus:ring-red-200 focus:border-red-500"
            : "border-gray-200 hover:border-gray-300 focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10", " \n          ").concat(icon ? "pl-10" : "", " disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-800\n        ")}>
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <lucide_react_1.ChevronDown size={14}/>
      </div>
    </div>
    {error && (<p className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
        <lucide_react_1.AlertCircle size={10}/> {error}
      </p>)}
  </div>);
};
// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
function ProdutoFormModal(_a) {
    var _this = this;
    var _b, _c;
    var isOpen = _a.isOpen, onClose = _a.onClose, fornecedores = _a.fornecedores, categories = _a.categories, setCategories = _a.setCategories, produtoParaEditar = _a.produtoParaEditar, onProdutoSalvo = _a.onProdutoSalvo, configGlobal = _a.configGlobal;
    var isEditMode = !!produtoParaEditar;
    var _d = (0, react_1.useState)(false), isUploading = _d[0], setIsUploading = _d[1];
    var _e = (0, react_1.useState)(null), previewImage = _e[0], setPreviewImage = _e[1];
    var _f = (0, react_1.useState)(false), isCategoryModalOpen = _f[0], setIsCategoryModalOpen = _f[1];
    // --- ESTADOS DA CALCULADORA ---
    var _g = (0, react_1.useState)(false), showMetalCalc = _g[0], setShowMetalCalc = _g[1];
    var _h = (0, react_1.useState)(null), activeSupplierRules = _h[0], setActiveSupplierRules = _h[1];
    var _j = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(extendedProdutoSchema),
        defaultValues: {
            name: "",
            costPrice: 0,
            salePrice: 0,
            markup: 2.0,
            quantity: 0,
            supplierId: "",
            category: "",
            subcategory: "",
            code: "",
            imageUrl: "",
            status: "ativo",
            description: "",
            weight: 0,
            gramPrice: 0,
            cm: "",
            mm: "",
            variantes: [],
        },
    }), register = _j.register, handleSubmit = _j.handleSubmit, reset = _j.reset, setValue = _j.setValue, watch = _j.watch, getValues = _j.getValues, _k = _j.formState, errors = _k.errors, isSubmitting = _k.isSubmitting;
    var custoObs = watch("costPrice");
    var vendaObs = watch("salePrice");
    var markupObs = watch("markup");
    var pesoObs = watch("weight");
    var gramaObs = watch("gramPrice");
    var fornecedorObs = watch("supplierId");
    var variantesObs = watch("variantes");
    // --- FUNÇÕES DE VARIANTES ---
    var addVariante = function () {
        var atuais = getValues("variantes") || [];
        var precoBase = getValues("salePrice") || 0;
        setValue("variantes", __spreadArray(__spreadArray([], atuais, true), [
            { medida: "", valor_ajuste: precoBase, estoque: 1, sob_consulta: false },
        ], false));
    };
    var removeVariante = function (index) {
        var atuais = getValues("variantes") || [];
        setValue("variantes", atuais.filter(function (_, i) { return i !== index; }));
    };
    var updateTotalStock = function () {
        var atuais = getValues("variantes") || [];
        var total = atuais.reduce(function (acc, v) { return acc + (Number(v.estoque) || 0); }, 0);
        if (total > 0) {
            setValue("quantity", total);
            react_hot_toast_1.toast.success("Estoque geral atualizado para ".concat(total, " un."));
        }
    };
    var applyBasePriceToAll = function () {
        var currentPrice = getValues("salePrice") || 0;
        var currentVariants = getValues("variantes") || [];
        if (currentVariants.length === 0)
            return react_hot_toast_1.toast.error("Adicione variantes primeiro.");
        var updatedVariants = currentVariants.map(function (v) { return (__assign(__assign({}, v), { valor_ajuste: currentPrice })); });
        setValue("variantes", updatedVariants);
        react_hot_toast_1.toast.success("Pre\u00E7o R$ ".concat(currentPrice.toFixed(2), " aplicado em todas as grades!"));
    };
    var generateAutoCode = function (catName, supId) {
        var catPart = catName ? catName.substring(0, 3).toUpperCase() : "GEN";
        var supObj = fornecedores.find(function (f) { return f.id === supId; });
        var supPart = "XX";
        if (supObj) {
            var clean = supObj.name.replace(/[^a-zA-Z]/g, "");
            supPart = clean.substring(0, 2).toUpperCase();
        }
        var random = Math.floor(Math.random() * 9000) + 1000;
        return "".concat(catPart, "-").concat(supPart, "-").concat(random);
    };
    // Detectar Regras do Fornecedor
    (0, react_1.useEffect)(function () {
        var _a;
        if (fornecedorObs) {
            var forn = fornecedores.find(function (f) { return f.id === fornecedorObs; });
            if (forn && ((_a = forn.rules) === null || _a === void 0 ? void 0 : _a.isByWeight)) {
                setActiveSupplierRules(forn.rules);
                setShowMetalCalc(true);
                if (!isEditMode &&
                    forn.rules.lots.length > 0 &&
                    !getValues("gramPrice")) {
                    setValue("gramPrice", forn.rules.lots[0].price);
                }
            }
            else {
                setActiveSupplierRules(null);
            }
        }
    }, [fornecedorObs, fornecedores, isEditMode, setValue, getValues]);
    // Cálculos Automáticos
    (0, react_1.useEffect)(function () {
        if (!showMetalCalc)
            return;
        var p = Number(pesoObs) || 0;
        var g = Number(gramaObs) || 0;
        if (p > 0 && g > 0) {
            var custoCalculado = parseFloat((p * g).toFixed(2));
            if (Math.abs(Number(getValues("costPrice")) - custoCalculado) > 0.01) {
                setValue("costPrice", custoCalculado);
            }
        }
    }, [pesoObs, gramaObs, showMetalCalc, setValue, getValues]);
    (0, react_1.useEffect)(function () {
        var c = Number(custoObs) || 0;
        var m = Number(markupObs) || 0;
        if (c > 0 && m > 0) {
            var vendaCalculada = parseFloat((c * m).toFixed(2));
            if (Math.abs(Number(getValues("salePrice")) - vendaCalculada) > 0.01) {
                setValue("salePrice", vendaCalculada);
            }
        }
    }, [custoObs, markupObs, setValue, getValues]);
    // --- CÁLCULO DE LUCRO E MARGEM (VISÍVEL) ---
    var indicadores = (0, react_1.useMemo)(function () {
        var c = Number(custoObs) || 0;
        var v = Number(vendaObs) || 0;
        if (v === 0)
            return { lucro: 0, margem: 0 };
        // Taxas globais (se não existirem, usa 0)
        var taxaCartao = (configGlobal === null || configGlobal === void 0 ? void 0 : configGlobal.cardFee)
            ? v * (configGlobal.cardFee / 100)
            : 0;
        var taxaEmbalagem = (configGlobal === null || configGlobal === void 0 ? void 0 : configGlobal.packagingCost) || 0;
        var lucro = v - (c + taxaCartao + taxaEmbalagem);
        var margem = (lucro / v) * 100;
        return { lucro: lucro, margem: margem };
    }, [custoObs, vendaObs, configGlobal]);
    // Init Form
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            if (isEditMode && produtoParaEditar) {
                var p = produtoParaEditar;
                var mk = p.salePrice && p.costPrice ? p.salePrice / p.costPrice : 2.0;
                if (p.weight && p.weight > 0)
                    setShowMetalCalc(true);
                reset({
                    name: p.name,
                    category: p.category,
                    subcategory: p.subcategory || "",
                    markup: parseFloat(mk.toFixed(2)) || 2.0,
                    weight: p.weight || 0,
                    gramPrice: p.gramPrice || 0,
                    costPrice: Number(p.costPrice),
                    salePrice: Number(p.salePrice),
                    quantity: p.quantity,
                    supplierId: p.supplierId,
                    code: p.code,
                    imageUrl: p.imageUrl,
                    status: p.status,
                    description: p.description,
                    cm: p.cm || "",
                    mm: p.mm || "",
                    variantes: p.variantes || [],
                });
                setPreviewImage(p.imageUrl || null);
            }
            else {
                reset({
                    name: "",
                    costPrice: 0,
                    salePrice: 0,
                    markup: 2.0,
                    quantity: 0,
                    category: "",
                    subcategory: "",
                    code: "",
                    status: "ativo",
                    weight: 0,
                    gramPrice: 0,
                    cm: "",
                    mm: "",
                    variantes: [],
                });
                setPreviewImage(null);
                setShowMetalCalc(false);
            }
        }
    }, [isOpen, isEditMode, produtoParaEditar, reset]);
    var handleImageUpload = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var file, url, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    file = (_b = e.target.files) === null || _b === void 0 ? void 0 : _b[0];
                    if (!file)
                        return [2 /*return*/];
                    setIsUploading(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, apiService_1.uploadImage)(file, "products")];
                case 2:
                    url = _c.sent();
                    setPreviewImage(URL.createObjectURL(file));
                    setValue("imageUrl", url);
                    react_hot_toast_1.toast.success("Foto carregada!");
                    return [3 /*break*/, 5];
                case 3:
                    _a = _c.sent();
                    react_hot_toast_1.toast.error("Erro no upload");
                    return [3 /*break*/, 5];
                case 4:
                    setIsUploading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var onSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var finalDesc, specs, specsStr, finalCode, payload, res, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    finalDesc = data.description || "";
                    specs = [];
                    if (data.cm)
                        specs.push("Comprimento: ".concat(data.cm, "cm"));
                    if (data.mm)
                        specs.push("Espessura: ".concat(data.mm, "mm"));
                    if (specs.length > 0) {
                        specsStr = specs.join(" | ");
                        if (!finalDesc.includes(specsStr))
                            finalDesc = "".concat(finalDesc, "\n").concat(specsStr).trim();
                    }
                    finalCode = data.code;
                    if (!isEditMode && !finalCode) {
                        finalCode = generateAutoCode(data.category || "", data.supplierId || "");
                    }
                    payload = __assign(__assign({}, data), { code: finalCode, subcategory: ((_a = data.subcategory) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || "", weight: Number(data.weight), gramPrice: Number(data.gramPrice), description: finalDesc, cm: data.cm, mm: data.mm, variantes: data.variantes || [] });
                    res = void 0;
                    if (!(isEditMode && produtoParaEditar)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, apiService_1.updateAdminProduto)(produtoParaEditar.id, payload)];
                case 1:
                    _b.sent();
                    // Para atualizar a lista sem F5, montamos o objeto atualizado manualmente
                    // pois o updateAdminProduto as vezes retorna void
                    res = __assign(__assign({}, produtoParaEditar), payload);
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, apiService_1.createAdminProduto)(payload)];
                case 3:
                    res = _b.sent();
                    _b.label = 4;
                case 4:
                    onProdutoSalvo(res); // Envia o objeto completo para a lista atualizar
                    onClose();
                    react_hot_toast_1.toast.success(isEditMode
                        ? "Produto Atualizado!"
                        : "Produto Criado! SKU: ".concat(finalCode));
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    console.error(error_1);
                    react_hot_toast_1.toast.error("Erro ao salvar.");
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div key="modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <framer_motion_1.motion.div key="modal-content" className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20" onClick={function (e) { return e.stopPropagation(); }} initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
              <div>
                <h2 className="text-2xl font-black text-[#4a4a4a] tracking-tight flex items-center gap-3">
                  {isEditMode ? "Editar Produto" : "Novo Cadastro"}
                  {isEditMode && produtoParaEditar && (<span className="text-[10px] font-bold text-[#d19900] bg-yellow-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                      ID: {produtoParaEditar.id.slice(0, 6)}
                    </span>)}
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Detalhes técnicos, variantes e precificação.
                </p>
              </div>
              <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-all active:scale-90">
                <lucide_react_1.X size={22}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                <input type="hidden" {...register("imageUrl")}/>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* --- COLUNA ESQUERDA: DADOS --- */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 shadow-sm group">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">
                        Visual do Produto
                      </label>
                      <div className="flex gap-4 items-center">
                        <div className="w-28 h-28 bg-white border border-gray-200 rounded-2xl shadow-inner flex items-center justify-center overflow-hidden shrink-0 relative transition-transform group-hover:scale-105 duration-300">
                          {previewImage ? (<img src={previewImage} className="w-full h-full object-cover"/>) : (<lucide_react_1.Image className="text-gray-200" size={40}/>)}
                          {isUploading && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                              <lucide_react_1.Loader2 className="text-white animate-spin" size={30}/>
                            </div>)}
                        </div>
                        <div className="flex-1">
                          <input type="file" id="upload" className="hidden" accept="image/*" onChange={handleImageUpload}/>
                          <label htmlFor="upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#d19900] hover:bg-white transition-all group/label">
                            <lucide_react_1.UploadCloud className="text-gray-300 group-hover/label:text-[#d19900] mb-1.5 transition-colors"/>
                            <span className="text-[10px] font-black text-gray-400 group-hover/label:text-[#d19900] uppercase tracking-tighter text-center px-2">
                              Carregar Foto
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormInput label="Nome Oficial" name="name" register={register} error={(_b = errors.name) === null || _b === void 0 ? void 0 : _b.message} placeholder="Ex: Corrente Veneziana"/>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">
                            Categoria
                          </label>
                          <div className="flex gap-2">
                            <select {...register("category")} className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none text-gray-700">
                              <option value="">Selecione...</option>
                              {categories
                .sort(function (a, b) { return a.name.localeCompare(b.name); })
                .map(function (c) { return (<option key={c.id} value={c.name}>
                                    {c.name}
                                  </option>); })}
                            </select>
                            <button type="button" onClick={function () { return setIsCategoryModalOpen(true); }} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors border border-gray-200">
                              <lucide_react_1.Plus size={18}/>
                            </button>
                          </div>
                        </div>
                        <FormInput label="Subcategoria" name="subcategory" register={register} placeholder="Ex: Veneziana"/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Comprimento (cm)" name="cm" register={register} placeholder="Ex: 45" icon={<lucide_react_1.Ruler size={14}/>}/>
                        <FormInput label="Espessura (mm)" name="mm" register={register} placeholder="Ex: 1.5" icon={<lucide_react_1.Ruler size={14}/>}/>
                      </div>

                      <FormInput label="SKU (Gerado ao Salvar)" name="code" register={register} icon={<lucide_react_1.Wand2 size={14}/>} placeholder="Automático" readOnly/>
                    </div>
                  </div>

                  {/* --- COLUNA DIREITA: FINANCEIRO --- */}
                  <div className="lg:col-span-7 space-y-6">
                    <FormSelect label="Parceiro / Fornecedor" name="supplierId" register={register}>
                      <option value="">Escolha o Fornecedor...</option>
                      {fornecedores.map(function (f) { return (<option key={f.id} value={f.id}>
                          {f.name}
                        </option>); })}
                    </FormSelect>

                    {/* --- CALCULADORA DE METAL --- */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <lucide_react_1.Scale size={12}/> Precificação por Peso
                        </span>
                        <button type="button" onClick={function () { return setShowMetalCalc(!showMetalCalc); }} className={"text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all ".concat(showMetalCalc ? "bg-purple-600 text-white shadow-lg shadow-purple-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}>
                          {showMetalCalc
                ? "Modo Peso Ativado"
                : "Ativar Modo Peso"}
                        </button>
                      </div>
                      <framer_motion_1.AnimatePresence>
                        {showMetalCalc && (<framer_motion_1.motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 grid grid-cols-2 gap-4 relative overflow-hidden">
                              {((_c = activeSupplierRules === null || activeSupplierRules === void 0 ? void 0 : activeSupplierRules.lots) === null || _c === void 0 ? void 0 : _c.length) > 0 && (<div className="col-span-2 mb-2">
                                  <label className="text-[9px] font-black text-purple-600 uppercase mb-1.5 block">
                                    Selecione Lote / Cotação
                                  </label>
                                  <select className="w-full text-xs border-purple-200 rounded-xl p-2.5 font-bold text-purple-900 bg-white outline-none focus:ring-4 focus:ring-purple-500/10" onChange={function (e) {
                        var v = Number(e.target.value);
                        if (v > 0)
                            setValue("gramPrice", v);
                    }}>
                                    <option value="">
                                      Tabela de Preços...
                                    </option>
                                    {activeSupplierRules.lots.map(function (l) { return (<option key={l.id} value={l.price}>
                                        {l.name} - R$ {l.price.toFixed(2)}/g
                                      </option>); })}
                                  </select>
                                </div>)}
                              <FormInput label="Peso (g)" name="weight" type="number" step="0.01" register={register} placeholder="0.00"/>
                              <FormInput label="Cotação (R$/g)" name="gramPrice" type="number" step="0.01" register={register} placeholder="0.00" icon={<lucide_react_1.DollarSign size={14} className="text-purple-400"/>}/>
                            </div>
                          </framer_motion_1.motion.div>)}
                      </framer_motion_1.AnimatePresence>
                    </div>

                    {/* --- BLOCO PRECIFICAÇÃO & LUCRO --- */}
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm relative">
                      <div className="grid grid-cols-3 gap-5">
                        <FormInput label="Custo Real (R$)" name="costPrice" type="number" step="0.01" register={register} placeholder="0.00"/>
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider text-center">
                            Markup
                          </label>
                          <div className="relative group">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                              <lucide_react_1.Calculator size={14}/>
                            </div>
                            <input type="number" step="0.1" {...register("markup")} className="block w-full px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-center focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all pl-9 text-gray-800"/>
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-[10px] font-bold text-[#4a4a4a] uppercase mb-1.5 tracking-wider text-right">
                            Venda Final
                          </label>
                          <input type="number" step="0.01" {...register("salePrice")} className="block w-full px-3 py-2.5 bg-white border border-gray-300 hover:border-gray-400 rounded-xl text-sm font-black text-right text-[#4a4a4a] focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all"/>
                        </div>
                      </div>

                      {/* EXIBIÇÃO DO LUCRO - AGORA BEM VISÍVEL */}
                      <div className="mt-5 pt-4 border-t border-gray-200 flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                          <lucide_react_1.TrendingUp size={16}/>
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            Lucro Líquido Estimado
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={"text-sm font-black px-2 py-1 rounded-md ".concat(indicadores.lucro > 0 ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>
                            R$ {indicadores.lucro.toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 ml-2">
                            ({indicadores.margem.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <FormInput label="Estoque Principal" name="quantity" type="number" register={register} icon={<lucide_react_1.Box size={14}/>}/>
                      <FormSelect label="Estado" name="status" register={register}>
                        <option value="ativo">Disponível / Ativo</option>
                        <option value="inativo">Indisponível / Oculto</option>
                      </FormSelect>
                    </div>
                  </div>
                </div>

                {/* --- SEÇÃO DE GRADES E VARIANTES --- */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <lucide_react_1.Layers size={16} className="text-[#d19900]"/> Grades e
                        Variações
                      </h3>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Adicione tamanhos, aros ou cores. O preço pode ser
                        ajustado individualmente.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={applyBasePriceToAll} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-100 transition-colors border border-blue-200" title="Copia o 'Preço de Venda Final' para todas as variantes">
                        <lucide_react_1.RefreshCw size={14}/> Aplicar Preço Base (R${" "}
                        {Number(vendaObs).toFixed(2)}) em Tudo
                      </button>

                      <button type="button" onClick={addVariante} className="text-xs bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                        <lucide_react_1.Plus size={14}/> Nova Variação
                      </button>
                    </div>
                  </div>

                  {!variantesObs || variantesObs.length === 0 ? (<div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-xs font-medium">
                      Nenhuma variação cadastrada. Este produto será vendido
                      como item único.
                    </div>) : (<div className="space-y-3">
                      <div className="grid grid-cols-12 gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
                        <div className="col-span-3">Nome / Medida</div>
                        <div className="col-span-3">Preço Venda (R$)</div>
                        <div className="col-span-2 text-center">Estoque</div>
                        <div className="col-span-3">Status</div>
                        <div className="col-span-1"></div>
                      </div>
                      {variantesObs.map(function (_v, index) { return (<div key={index} className="grid grid-cols-12 gap-3 items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                          <div className="col-span-3">
                            <input {...register("variantes.".concat(index, ".medida"))} placeholder="Ex: 45cm ou Aro 18" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-[#d19900]"/>
                          </div>
                          <div className="col-span-3 relative group">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-green-600 font-bold text-xs">
                              R$
                            </div>
                            <input type="number" step="0.01" {...register("variantes.".concat(index, ".valor_ajuste"))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold text-green-700 outline-none focus:border-green-500 pl-8"/>
                          </div>
                          <div className="col-span-2">
                            <input type="number" {...register("variantes.".concat(index, ".estoque"))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs font-bold text-center outline-none"/>
                          </div>
                          <div className="col-span-3 flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-600 select-none hover:text-black">
                              <input type="checkbox" {...register("variantes.".concat(index, ".sob_consulta"))} className="w-4 h-4 rounded text-[#d19900] focus:ring-[#d19900] border-gray-300"/>
                              Sob Consulta
                            </label>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <button type="button" onClick={function () { return removeVariante(index); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <lucide_react_1.Trash2 size={14}/>
                            </button>
                          </div>
                        </div>); })}

                      <div className="flex justify-end pt-2">
                        <button type="button" onClick={updateTotalStock} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                          <lucide_react_1.Copy size={12}/> Somar estoque das grades para o
                          total
                        </button>
                      </div>
                    </div>)}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                    Descrição Técnica e Notas
                  </label>
                  <textarea {...register("description")} rows={3} className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:border-[#d19900] focus:ring-4 focus:ring-[#d19900]/10 outline-none resize-none transition-all text-gray-700" placeholder="Especifique materiais, banho, tamanho e outros detalhes cruciais..."></textarea>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="bg-[#4a4a4a] hover:bg-black text-white px-10 py-3 rounded-2xl font-black shadow-xl shadow-gray-200 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 tracking-widest uppercase text-xs">
                    {isSubmitting ? (<lucide_react_1.Loader2 className="animate-spin" size={18}/>) : (<lucide_react_1.Plus size={18} className="text-[#d19900]"/>)}
                    {isEditMode ? "Atualizar Produto" : "Salvar Produto"}
                  </button>
                </div>
              </form>
            </div>
          </framer_motion_1.motion.div>
        </framer_motion_1.motion.div>)}
      <CategoryModal_1.CategoryModal isOpen={isCategoryModalOpen} onClose={function () { return setIsCategoryModalOpen(false); }} categories={categories} setCategories={setCategories} onCategoryCreated={function (cat) { return setValue("category", cat.name); }}/>
    </framer_motion_1.AnimatePresence>);
}
