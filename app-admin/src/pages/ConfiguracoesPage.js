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
exports.ConfiguracoesPage = ConfiguracoesPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var react_hot_toast_1 = require("react-hot-toast");
var lucide_react_1 = require("lucide-react");
var apiService_1 = require("../services/apiService");
// --- VARIANTES DE ANIMAÇÃO ---
var containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};
var itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};
// --- COMPONENTES VISUAIS ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var SectionHeader = function (_a) {
    var Icon = _a.icon, title = _a.title, description = _a.description;
    return (<div className="flex items-start gap-4 mb-6">
    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
      <Icon size={24}/>
    </div>
    <div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var InputGroup = function (_a) {
    var label = _a.label, children = _a.children, description = _a.description;
    return (<div className="space-y-1.5 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{label}</label>
    {children}
    {description && <p className="text-[11px] text-gray-400 ml-1">{description}</p>}
  </div>);
};
function ConfiguracoesPage() {
    var _this = this;
    var _a = (0, react_1.useState)({
        whatsappNumber: '', monthlyGoal: '',
        storeName: 'Hive ERP',
        slug: '', // LINK DA LOJA (IMPORTANTE)
        primaryColor: '#D4AF37', secondaryColor: '#343434',
        cardFee: '0', packagingCost: '0',
        warrantyText: '', lowStockThreshold: '5',
        bannerUrl: '' // URL DO BANNER UNICO
    }), formData = _a[0], setFormData = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(false), isSubmitting = _c[0], setIsSubmitting = _c[1];
    (0, react_1.useEffect)(function () {
        function loadData() {
            return __awaiter(this, void 0, void 0, function () {
                var data, bannerAtual, error_1;
                var _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            _g.trys.push([0, 2, 3, 4]);
                            return [4 /*yield*/, (0, apiService_1.getConfig)()];
                        case 1:
                            data = _g.sent();
                            if (data) {
                                bannerAtual = Array.isArray(data.banners) && data.banners.length > 0
                                    ? data.banners[0]
                                    : (data.bannerUrl || '');
                                setFormData({
                                    whatsappNumber: data.whatsappNumber || '',
                                    monthlyGoal: ((_a = data.monthlyGoal) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                                    storeName: data.storeName || 'Minha Loja',
                                    slug: data.slug || '', // Carrega o slug salvo
                                    primaryColor: data.primaryColor || '#D4AF37',
                                    secondaryColor: data.secondaryColor || '#343434',
                                    cardFee: ((_c = (_b = data.cardFeePercent) !== null && _b !== void 0 ? _b : data.cardFee) !== null && _c !== void 0 ? _c : 0).toString(),
                                    packagingCost: ((_e = (_d = data.packingCost) !== null && _d !== void 0 ? _d : data.packagingCost) !== null && _e !== void 0 ? _e : 0).toString(),
                                    warrantyText: data.warrantyText || '',
                                    lowStockThreshold: ((_f = data.lowStockThreshold) === null || _f === void 0 ? void 0 : _f.toString()) || '5',
                                    bannerUrl: bannerAtual
                                });
                            }
                            return [3 /*break*/, 4];
                        case 2:
                            error_1 = _g.sent();
                            react_hot_toast_1.toast.error("Erro ao carregar configurações.");
                            return [3 /*break*/, 4];
                        case 3:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        loadData();
    }, []);
    var handleChange = function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        // Tratamento especial para o Slug (Link da loja)
        if (name === 'slug') {
            // Força minúsculo e troca espaços por hifens
            var formattedSlug_1 = value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            setFormData(function (prev) { return (__assign(__assign({}, prev), { slug: formattedSlug_1 })); });
        }
        else {
            setFormData(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
            });
        }
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var payload, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!formData.slug) {
                        react_hot_toast_1.toast.error("Você precisa definir um Link para a loja!");
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    payload = {
                        whatsappNumber: formData.whatsappNumber,
                        storeName: formData.storeName,
                        slug: formData.slug, // SALVA O SLUG
                        primaryColor: formData.primaryColor,
                        secondaryColor: formData.secondaryColor,
                        warrantyText: formData.warrantyText,
                        bannerUrl: formData.bannerUrl,
                        banners: [formData.bannerUrl], // Mantém compatibilidade com array
                        monthlyGoal: Number(formData.monthlyGoal) || 0,
                        cardFee: Number(formData.cardFee) || 0,
                        cardFeePercent: Number(formData.cardFee) || 0,
                        packagingCost: Number(formData.packagingCost) || 0,
                        packingCost: Number(formData.packagingCost) || 0,
                        lowStockThreshold: Number(formData.lowStockThreshold) || 5,
                    };
                    return [4 /*yield*/, (0, apiService_1.saveConfig)(payload)];
                case 2:
                    _a.sent();
                    react_hot_toast_1.toast.success("Loja atualizada com sucesso!");
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    react_hot_toast_1.toast.error("Erro ao salvar.");
                    console.error(error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (loading)
        return (<div className="flex h-[80vh] items-center justify-center">
      <lucide_react_1.Loader2 className="animate-spin text-indigo-600" size={40}/>
    </div>);
    return (<framer_motion_1.motion.div className="pb-24 max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
      <react_hot_toast_1.Toaster position="top-right"/>

      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Configurações da Loja</h1>
          <p className="text-gray-500 mt-2 text-lg">Personalize a identidade visual e as regras de negócio.</p>
        </div>
        {formData.slug && (<a 
        // AQUI: Mudamos de ?slug= para ?loja=
        href={"https://hiveerp-catalogo.vercel.app/?loja=".concat(formData.slug)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors">
            <lucide_react_1.Globe size={18}/> Ver Minha Loja
          </a>)}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* --- 1. IDENTIDADE VISUAL --- */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={lucide_react_1.Palette} title="Identidade Visual" description="Defina como sua marca aparece para o cliente."/>

            <div className="space-y-5">
              <InputGroup label="Nome da Loja" description="Nome exibido no cabeçalho.">
                <div className="relative">
                  <lucide_react_1.Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  <input name="storeName" value={formData.storeName} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium" placeholder="Ex: Hive Pratas"/>
                </div>
              </InputGroup>

              {/* CAMPO NOVO: SLUG */}
              <InputGroup label="Link Personalizado (Slug)" description="O endereço da sua loja na internet.">
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-100 text-gray-500 text-sm font-medium">
                    hive-erp.../
                  </span>
                  <input name="slug" value={formData.slug} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700 lowercase" placeholder="minha-loja"/>
                </div>
              </InputGroup>

              {/* CAMPO NOVO: BANNER */}
              <InputGroup label="URL do Banner (Topo)" description="Link da imagem de fundo do topo da loja.">
                <div className="relative">
                  <lucide_react_1.Image className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  <input name="bannerUrl" value={formData.bannerUrl} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm" placeholder="https://imgur.com/..."/>
                </div>
              </InputGroup>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Cor Principal">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <input type="color" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0"/>
                    <input type="text" name="primaryColor" value={formData.primaryColor} onChange={handleChange} className="w-full bg-transparent border-none text-xs font-mono uppercase focus:ring-0"/>
                  </div>
                </InputGroup>

                <InputGroup label="Cor Secundária">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                    <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="h-8 w-8 rounded-lg cursor-pointer border-0 p-0"/>
                    <input type="text" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="w-full bg-transparent border-none text-xs font-mono uppercase focus:ring-0"/>
                  </div>
                </InputGroup>
              </div>
            </div>
          </framer_motion_1.motion.div>

          {/* --- 2. OPERACIONAL & CUSTOS --- */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={lucide_react_1.Calculator} title="Custos & Metas" description="Dados para cálculo automático de lucro."/>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Taxa Cartão (%)">
                  <div className="relative">
                    <lucide_react_1.CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input type="number" step="0.01" name="cardFee" value={formData.cardFee} onChange={handleChange} className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
                  </div>
                </InputGroup>

                <InputGroup label="Custo Embalagem (R$)">
                  <div className="relative">
                    <lucide_react_1.Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input type="number" step="0.01" name="packagingCost" value={formData.packagingCost} onChange={handleChange} className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"/>
                  </div>
                </InputGroup>
              </div>

              <InputGroup label="Meta Mensal de Lucro (R$)" description="Valor alvo para o Dashboard.">
                <div className="relative">
                  <lucide_react_1.Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  <input type="number" name="monthlyGoal" value={formData.monthlyGoal} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700" placeholder="Ex: 5000"/>
                </div>
              </InputGroup>
            </div>
          </framer_motion_1.motion.div>

          {/* --- 3. ATENDIMENTO --- */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={lucide_react_1.Smartphone} title="Atendimento" description="Canais de contato e stock."/>

            <div className="space-y-5">
              <InputGroup label="WhatsApp (Com DDD)" description="Para onde os pedidos serão enviados.">
                <div className="relative">
                  <lucide_react_1.Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18}/>
                  <input name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="5511999998888"/>
                </div>
              </InputGroup>

              <InputGroup label="Alerta de Stock Baixo" description="Quantidade mínima para avisar reposição.">
                <div className="relative">
                  <lucide_react_1.BellRing className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" size={18}/>
                  <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"/>
                </div>
              </InputGroup>
            </div>
          </framer_motion_1.motion.div>

          {/* --- 4. GARANTIA --- */}
          <framer_motion_1.motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <SectionHeader icon={lucide_react_1.ScrollText} title="Termos de Garantia" description="Texto que sai no PDF de impressão."/>
            <textarea name="warrantyText" value={formData.warrantyText} onChange={handleChange} rows={5} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm leading-relaxed" placeholder="Ex: Garantia vitalícia na prata 925..."/>
          </framer_motion_1.motion.div>

        </div>

        {/* --- BARRA DE AÇÃO FLUTUANTE --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-end z-40 md:pl-[280px]">
          <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:hover:scale-100 font-bold text-sm md:text-base">
            {isSubmitting ? <lucide_react_1.Loader2 className="animate-spin" size={20}/> : <lucide_react_1.Save size={20}/>}
            Salvar Configurações
          </button>
        </div>

      </form>
    </framer_motion_1.motion.div>);
}
exports.default = ConfiguracoesPage;
