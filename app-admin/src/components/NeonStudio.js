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
exports.NeonStudio = NeonStudio;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var apiService_1 = require("../services/apiService");
function NeonStudio(_a) {
    var _this = this;
    var isOpen = _a.isOpen, onClose = _a.onClose, onSuccess = _a.onSuccess;
    var _b = (0, react_1.useState)([]), items = _b[0], setItems = _b[1];
    var _c = (0, react_1.useState)([]), categories = _c[0], setCategories = _c[1];
    var _d = (0, react_1.useState)([]), suppliers = _d[0], setSuppliers = _d[1];
    var _e = (0, react_1.useState)(false), isUploading = _e[0], setIsUploading = _e[1];
    var _f = (0, react_1.useState)({ current: 0, total: 0 });
    // Configurações Globais
    var _g = (0, react_1.useState)({
        supplierId: '',
        categoryId: '',
        subcategory: '',
        stock: '1',
        markup: '2.0',
    }), globalSettings = _g[0], setGlobalSettings = _g[1];
    // Calculadora de Metal
    var _h = (0, react_1.useState)(false), showMetalCalc = _h[0], setShowMetalCalc = _h[1];
    var _j = (0, react_1.useState)(null), setActiveSupplierRules = _j[1];
    var _k = (0, react_1.useState)(0), globalGramPrice = _k[0], setGlobalGramPrice = _k[1];
    // Inicialização
    (0, react_1.useEffect)(function () {
        if (isOpen) {
            Promise.all([(0, apiService_1.getCategories)(), (0, apiService_1.getFornecedores)()]).then(function (_a) {
                var cats = _a[0], sups = _a[1];
                setCategories(cats);
                setSuppliers(sups);
                if (cats.length)
                    setGlobalSettings(function (p) { return (__assign(__assign({}, p), { categoryId: cats[0].id })); });
                if (sups.length)
                    setGlobalSettings(function (p) { return (__assign(__assign({}, p), { supplierId: sups[0].id })); });
            });
            setItems([]);
            setShowMetalCalc(false);
            setGlobalGramPrice(0);
        }
    }, [isOpen]);
    // Lógica Automática de Fornecedor
    (0, react_1.useEffect)(function () {
        var _a, _b;
        if (globalSettings.supplierId) {
            var sup = suppliers.find(function (s) { return s.id === globalSettings.supplierId; });
            if (sup && ((_a = sup.rules) === null || _a === void 0 ? void 0 : _a.isByWeight)) {
                setActiveSupplierRules(sup.rules);
                setShowMetalCalc(true);
                if (((_b = sup.rules.lots) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                    setGlobalGramPrice(sup.rules.lots[0].price);
                }
            }
            else {
                setActiveSupplierRules(null);
            }
        }
    }, [globalSettings.supplierId, suppliers]);
    var handleGlobalChange = function (field, value) {
        setGlobalSettings(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    // Upload e Criação dos Itens
    var handleFileUpload = function (e) {
        if (!e.target.files)
            return;
        var files = Array.from(e.target.files);
        var newItems = files.map(function (file) { return ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            previewUrl: URL.createObjectURL(file),
            selected: true,
            status: 'pending',
            data: {
                description: file.name.split('.')[0].replace(/-/g, ' ').toUpperCase(),
                price: '',
                cm: '',
                mm: '',
                categoryId: globalSettings.categoryId,
                subcategory: globalSettings.subcategory,
                supplierId: globalSettings.supplierId,
                stock: globalSettings.stock,
                variantes: []
            },
            edit: { scale: 1, x: 0, y: 0 }
        }); });
        setItems(function (prev) { return __spreadArray(__spreadArray([], prev, true), newItems, true); });
    };
    // Funções de Update do Item
    var updateItem = function (id, field, value) { return setItems(function (prev) { return prev.map(function (i) {
        var _a;
        return i.id === id ? __assign(__assign({}, i), { data: __assign(__assign({}, i.data), (_a = {}, _a[field] = value, _a)) }) : i;
    }); }); };
    var updateEdit = function (id, field, value) { return setItems(function (prev) { return prev.map(function (i) {
        var _a;
        return i.id === id ? __assign(__assign({}, i), { edit: __assign(__assign({}, i.edit), (_a = {}, _a[field] = value, _a)) }) : i;
    }); }); };
    var toggleSelect = function (id) { return setItems(function (prev) { return prev.map(function (i) { return i.id === id ? __assign(__assign({}, i), { selected: !i.selected }) : i; }); }); };
    var removeItem = function (id) { return setItems(function (prev) { return prev.filter(function (i) { return i.id !== id; }); }); };
    // --- LÓGICA DE VARIANTES ---
    var addVariante = function (itemId, type) {
        setItems(function (prev) { return prev.map(function (item) {
            if (item.id !== itemId)
                return item;
            var nova = {
                sku_sufixo: type === 'cm' ? '-40CM' : '-N18',
                valor_ajuste: Number(item.data.price) || 0, // Herda o preço base
                medida: type === 'cm' ? '40cm' : '18',
                estoque: 1,
                sob_consulta: false
            };
            return __assign(__assign({}, item), { data: __assign(__assign({}, item.data), { variantes: __spreadArray(__spreadArray([], item.data.variantes, true), [nova], false) }) });
        }); });
    };
    var updateVariante = function (itemId, index, field, value) {
        setItems(function (prev) { return prev.map(function (item) {
            var _a;
            if (item.id !== itemId)
                return item;
            var novas = __spreadArray([], item.data.variantes, true);
            novas[index] = __assign(__assign({}, novas[index]), (_a = {}, _a[field] = value, _a));
            return __assign(__assign({}, item), { data: __assign(__assign({}, item.data), { variantes: novas }) });
        }); });
    };
    var removeVariante = function (itemId, index) {
        setItems(function (prev) { return prev.map(function (item) {
            if (item.id !== itemId)
                return item;
            var novas = item.data.variantes.filter(function (_, i) { return i !== index; });
            return __assign(__assign({}, item), { data: __assign(__assign({}, item.data), { variantes: novas }) });
        }); });
    };
    // Gerador de SKU
    var generateSmartCode = function (categoryId, supplierId) {
        var catObj = categories.find(function (c) { return c.id === categoryId; });
        var catPrefix = catObj ? catObj.name.substring(0, 3).toUpperCase() : 'GEN';
        var supObj = suppliers.find(function (s) { return s.id === supplierId; });
        var supPrefix = 'XX';
        if (supObj) {
            var supClean = supObj.name.replace(/[^a-zA-Z]/g, '');
            supPrefix = supClean.substring(0, 2).toUpperCase();
        }
        var random3 = Math.floor(Math.random() * 900) + 100;
        return "".concat(catPrefix, "-").concat(supPrefix, "-").concat(random3);
    };
    // Gerador de Crop Final
    var generateFinalCrop = function (item) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var img = new Image();
                    img.src = item.previewUrl;
                    img.crossOrigin = "anonymous";
                    img.onload = function () {
                        var canvas = document.createElement('canvas');
                        canvas.width = 1080;
                        canvas.height = 1080;
                        var ctx = canvas.getContext('2d');
                        if (!ctx)
                            return reject();
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, 1080, 1080);
                        var ratio = 1080 / 300;
                        ctx.translate(1080 / 2, 1080 / 2);
                        ctx.translate(item.edit.x * ratio, item.edit.y * ratio);
                        ctx.scale(item.edit.scale, item.edit.scale);
                        var baseScale = Math.max(1080 / img.width, 1080 / img.height);
                        ctx.drawImage(img, -img.width * baseScale / 2, -img.height * baseScale / 2, img.width * baseScale, img.height * baseScale);
                        canvas.toBlob(function (blob) { if (blob)
                            resolve(blob);
                        else
                            reject(); }, 'image/jpeg', 0.95);
                    };
                    img.onerror = reject;
                })];
        });
    }); };
    // Sincronização
    var handleSync = function () { return __awaiter(_this, void 0, void 0, function () {
        var toUpload, successList, activeMarkup, _loop_1, i;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    toUpload = items.filter(function (i) { return i.selected && i.status !== 'success'; });
                    if (toUpload.length === 0)
                        return [2 /*return*/, react_hot_toast_1.toast.error("Selecione itens para enviar.")];
                    setIsUploading(true);
                    successList = [];
                    activeMarkup = Number(globalSettings.markup) || 2.0;
                    _loop_1 = function (i) {
                        var item, finalBlob, finalName, fileToUpload, imageUrl, smartCode, costPrice, weight, rawInputValue, finalSalePrice, variantesCalculadas, productData, error_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    item = toUpload[i];
                                    setItems(function (prev) { return prev.map(function (it) { return it.id === item.id ? __assign(__assign({}, it), { status: 'uploading' }) : it; }); });
                                    _c.label = 1;
                                case 1:
                                    _c.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, generateFinalCrop(item)];
                                case 2:
                                    finalBlob = _c.sent();
                                    finalName = [
                                        item.data.description,
                                        item.data.cm ? "".concat(item.data.cm, "CM") : '',
                                        item.data.mm ? "".concat(item.data.mm, "MM") : ''
                                    ].filter(Boolean).join(' ').toUpperCase();
                                    fileToUpload = new File([finalBlob], "".concat(finalName, ".jpg"), { type: 'image/jpeg' });
                                    return [4 /*yield*/, (0, apiService_1.uploadImage)(fileToUpload)];
                                case 3:
                                    imageUrl = _c.sent();
                                    smartCode = generateSmartCode(item.data.categoryId, item.data.supplierId);
                                    costPrice = 0;
                                    weight = 0;
                                    rawInputValue = Number(item.data.price) || 0;
                                    if (showMetalCalc && globalGramPrice > 0) {
                                        weight = rawInputValue;
                                        costPrice = weight * globalGramPrice;
                                    }
                                    else {
                                        costPrice = rawInputValue;
                                    }
                                    finalSalePrice = costPrice * activeMarkup;
                                    variantesCalculadas = item.data.variantes.map(function (v) {
                                        var vCusto = 0;
                                        var vValorInput = Number(v.valor_ajuste) || 0;
                                        if (showMetalCalc && globalGramPrice > 0) {
                                            vCusto = vValorInput * globalGramPrice;
                                        }
                                        else {
                                            vCusto = vValorInput;
                                        }
                                        return __assign(__assign({}, v), { valor_ajuste: parseFloat((vCusto * activeMarkup).toFixed(2)) });
                                    });
                                    productData = {
                                        name: finalName,
                                        costPrice: parseFloat(costPrice.toFixed(2)),
                                        salePrice: parseFloat(finalSalePrice.toFixed(2)),
                                        quantity: item.data.variantes.length > 0
                                            ? item.data.variantes.reduce(function (acc, v) { return acc + Number(v.estoque); }, 0)
                                            : Number(item.data.stock) || 0,
                                        category: ((_a = categories.find(function (c) { return c.id === item.data.categoryId; })) === null || _a === void 0 ? void 0 : _a.name) || 'Geral',
                                        subcategory: item.data.subcategory || '', // Usa o campo editável
                                        supplierId: item.data.supplierId,
                                        imageUrl: imageUrl,
                                        code: smartCode,
                                        status: 'ativo',
                                        weight: weight > 0 ? weight : undefined,
                                        gramPrice: showMetalCalc ? globalGramPrice : undefined,
                                        variantes: variantesCalculadas
                                    };
                                    successList.push(productData);
                                    setItems(function (prev) { return prev.map(function (it) { return it.id === item.id ? __assign(__assign({}, it), { status: 'success' }) : it; }); });
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_1 = _c.sent();
                                    console.error(error_1);
                                    setItems(function (prev) { return prev.map(function (it) { return it.id === item.id ? __assign(__assign({}, it), { status: 'error' }) : it; }); });
                                    return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < toUpload.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (!(successList.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, apiService_1.importProductsBulk)(successList)];
                case 5:
                    _b.sent();
                    react_hot_toast_1.toast.success("".concat(successList.length, " cadastrados com sucesso!"));
                    onSuccess();
                    setTimeout(onClose, 1500);
                    _b.label = 6;
                case 6:
                    setIsUploading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<framer_motion_1.AnimatePresence>
      {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#000] text-white flex flex-col font-sans">
          
          {/* HEADER */}
          <header className="px-6 py-4 border-b border-white/5 bg-black/80 backdrop-blur-xl flex flex-col xl:flex-row justify-between items-center sticky top-0 z-50 gap-4 shadow-2xl">
            <div className="flex items-center gap-4 w-full xl:w-auto">
              <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"><lucide_react_1.X size={20}/></button>
              <h1 className="text-lg font-bold flex items-center gap-2 text-white tracking-wider">
                <lucide_react_1.Sparkles className="text-cyan-400" size={18}/> NEON STUDIO
              </h1>
            </div>

            <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto w-full xl:w-auto scrollbar-hide backdrop-blur-md">
                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <div className="flex flex-col w-36">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Fornecedor</label>
                      <select value={globalSettings.supplierId} onChange={function (e) { return handleGlobalChange('supplierId', e.target.value); }} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                         <option value="" className="bg-black">Selecione...</option>
                         {suppliers.map(function (s) { return <option key={s.id} value={s.id} className="bg-black">{s.name}</option>; })}
                      </select>
                   </div>
                </div>

                {/* Seletor Global de Subcategoria (Opcional, para preencher padrão) */}
                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <div className="flex flex-col w-28">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Subcat. Padrão</label>
                      <input type="text" value={globalSettings.subcategory.toUpperCase()} onChange={function (e) { return handleGlobalChange('subcategory', e.target.value); }} className="bg-transparent text-sm font-bold text-white outline-none w-full" placeholder="Ex: Anel"/>
                   </div>
                </div>

                <div className="flex items-center gap-3 px-3 border-r border-white/5">
                   <button onClick={function () { return setShowMetalCalc(!showMetalCalc); }} className={"flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ".concat(showMetalCalc ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-500')}>
                      <lucide_react_1.Scale size={14}/> {showMetalCalc ? 'Modo Peso' : 'Modo R$'}
                   </button>
                   {showMetalCalc && (<div className="flex flex-col w-24">
                        <label className="text-[9px] text-purple-400 font-bold uppercase mb-1">R$/g</label>
                        <input type="number" step="0.01" value={globalGramPrice} onChange={function (e) { return setGlobalGramPrice(Number(e.target.value)); }} className="bg-transparent text-sm font-bold text-white outline-none w-full"/>
                     </div>)}
                </div>

                <div className="flex items-center gap-4 px-3">
                   <div className="flex flex-col w-20 text-center">
                      <label className="text-[9px] text-cyan-500 font-bold uppercase mb-1">Markup</label>
                      <input type="number" step="0.1" value={globalSettings.markup} onChange={function (e) { return handleGlobalChange('markup', e.target.value); }} className="bg-transparent text-sm font-bold text-white outline-none text-center"/>
                   </div>
                   <div className="flex flex-col w-16 text-center">
                      <label className="text-[9px] text-gray-500 font-bold uppercase mb-1">Qtd</label>
                      <input type="number" value={globalSettings.stock} onChange={function (e) { return handleGlobalChange('stock', e.target.value); }} className="bg-transparent text-sm font-bold text-white outline-none text-center"/>
                   </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
              <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition border border-white/10">
                <lucide_react_1.Plus size={20}/>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload}/>
              </label>
              <button onClick={handleSync} disabled={isUploading || items.filter(function (i) { return i.selected; }).length === 0} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 transition-all active:scale-95">
                {isUploading ? <lucide_react_1.Loader2 className="animate-spin" size={20}/> : <lucide_react_1.CloudUpload size={20}/>}
                <span>Sincronizar</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-black">
            {items.length === 0 ? (<div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                <lucide_react_1.Image size={48} className="text-gray-600 mb-4"/>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Arraste imagens para começar</p>
              </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                {items.map(function (item) { return (<ProductCard key={item.id} item={item} categories={categories} suppliers={suppliers} onUpdate={updateItem} onEdit={updateEdit} onToggle={toggleSelect} onRemove={removeItem} onAddVariante={addVariante} onUpdateVariante={updateVariante} onRemoveVariante={removeVariante} generateSmartCode={generateSmartCode} activeMarkup={globalSettings.markup} isByWeight={showMetalCalc} lotPrice={globalGramPrice}/>); })}
              </div>)}
          </main>
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
// --- CARD DO PRODUTO (ATUALIZADO COM CAMPO DE SUBCATEGORIA) ---
function ProductCard(_a) {
    var item = _a.item, categories = _a.categories, suppliers = _a.suppliers, onUpdate = _a.onUpdate, onEdit = _a.onEdit, onToggle = _a.onToggle, onRemove = _a.onRemove, onAddVariante = _a.onAddVariante, onUpdateVariante = _a.onUpdateVariante, onRemoveVariante = _a.onRemoveVariante, generateSmartCode = _a.generateSmartCode, activeMarkup = _a.activeMarkup, isByWeight = _a.isByWeight, lotPrice = _a.lotPrice;
    var isSelected = item.selected;
    var smartCodePreview = generateSmartCode(item.data.categoryId, item.data.supplierId);
    var inputValue = Number(item.data.price) || 0;
    var custoReal = inputValue;
    if (isByWeight && lotPrice > 0)
        custoReal = inputValue * lotPrice;
    var estimatedSale = custoReal * (Number(activeMarkup) || 2);
    return (<div className={"relative bg-black rounded-2xl overflow-hidden flex flex-col transition-all duration-300 border border-white/10 group hover:border-white/30 ".concat(isSelected ? 'ring-1 ring-cyan-500/50' : 'opacity-90 hover:opacity-100')}>
      
      {/* IMAGEM E EDITOR */}
      <div className="relative aspect-square bg-[#050505] overflow-hidden border-b border-white/5">
        {item.status === 'uploading' && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm"><lucide_react_1.Loader2 className="animate-spin text-cyan-400" size={32}/></div>}
        {item.status === 'success' && <div className="absolute inset-0 z-50 bg-green-900/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30"><lucide_react_1.CheckCircle className="text-green-400" size={48}/></div>}

        <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={function () { return onToggle(item.id); }} className={"p-2 rounded-lg backdrop-blur-md border ".concat(isSelected ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-black/60 border-white/20 text-gray-300')}><lucide_react_1.CheckSquare size={14}/></button>
           <button onClick={function () { return onRemove(item.id); }} className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md"><lucide_react_1.Trash2 size={14}/></button>
        </div>
        <div className="absolute bottom-3 left-3 z-20">
           <span className="text-[10px] font-mono font-bold bg-black/80 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 backdrop-blur-md shadow-lg">{smartCodePreview}</span>
        </div>
        <CssImageEditor src={item.previewUrl} edit={item.edit} onChange={function (k, v) { return onEdit(item.id, k, v); }}/>
      </div>

      <div className="p-4 space-y-3 bg-black flex-1 flex flex-col">
        {/* NOME */}
        <input value={item.data.description} onChange={function (e) { return onUpdate(item.id, 'description', e.target.value); }} className="w-full bg-transparent text-xs font-bold text-white border-b border-white/10 focus:border-cyan-500 outline-none uppercase py-1" placeholder="NOME DO PRODUTO"/>

        {/* SUBCATEGORIA (NOVO) */}
        <input value={item.data.subcategory} onChange={function (e) { return onUpdate(item.id, 'subcategory', e.target.value); }} className="w-full bg-transparent text-[10px] font-bold text-gray-500 border-b border-white/5 focus:border-cyan-500/50 outline-none uppercase py-1 mb-2" placeholder="SUBCATEGORIA (OPCIONAL)"/>

        {/* PREÇO E VENDA */}
        <div className="bg-white/5 rounded-xl p-2 border border-white/10 flex justify-between items-center">
           <div className="flex flex-col w-1/2 border-r border-white/10 pr-2">
              <label className={"text-[8px] font-black uppercase tracking-wider ".concat(isByWeight ? 'text-purple-400' : 'text-cyan-500')}>{isByWeight ? 'PESO (g)' : 'CUSTO (R$)'}</label>
              <input type="number" value={item.data.price} onChange={function (e) { return onUpdate(item.id, 'price', e.target.value); }} className="bg-transparent text-sm font-mono font-bold text-white outline-none" placeholder="0.00"/>
           </div>
           <div className="flex flex-col w-1/2 pl-2 text-right">
              <label className="text-[8px] text-gray-500 uppercase">Venda Est.</label>
              <span className="text-xs font-bold text-green-400">R$ {estimatedSale.toFixed(0)}</span>
           </div>
        </div>

        {/* CM / MM */}
        <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute top-2 left-2 text-[8px] text-gray-500 font-bold">CM</span>
              <input value={item.data.cm} onChange={function (e) { return onUpdate(item.id, 'cm', e.target.value); }} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" placeholder="45"/>
            </div>
            <div className="relative">
              <span className="absolute top-2 left-2 text-[8px] text-gray-500 font-bold">MM</span>
              <input value={item.data.mm} onChange={function (e) { return onUpdate(item.id, 'mm', e.target.value); }} className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-6 text-[10px] text-white outline-none focus:border-cyan-500 uppercase" placeholder="1.5"/>
            </div>
        </div>

        {/* GAVETA DE VARIANTES */}
        <div className="pt-2 mt-auto">
           <div className="flex justify-between items-center mb-1">
              <label className="text-[8px] font-black text-gray-600 uppercase flex items-center gap-1"><lucide_react_1.Package size={10}/> Grades</label>
              <div className="flex gap-1">
                 <button onClick={function () { return onAddVariante(item.id, 'cm'); }} className="text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/10 hover:bg-[#d19900] hover:text-black hover:border-[#d19900] transition-colors">+CM</button>
                 <button onClick={function () { return onAddVariante(item.id, 'aro'); }} className="text-[8px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/10 hover:bg-[#d19900] hover:text-black hover:border-[#d19900] transition-colors">+ARO</button>
              </div>
           </div>
           
           <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
              {item.data.variantes.map(function (v, idx) { return (<div key={idx} className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5 group/v">
                    <input value={v.medida} onChange={function (e) { return onUpdateVariante(item.id, idx, 'medida', e.target.value); }} className="w-10 bg-transparent text-[9px] text-white outline-none font-bold" placeholder="Tam"/>
                    <div className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                       <span className="text-[8px] text-gray-600">R$</span>
                       <input type="number" value={v.valor_ajuste} onChange={function (e) { return onUpdateVariante(item.id, idx, 'valor_ajuste', Number(e.target.value)); }} className="w-10 bg-transparent text-[9px] text-white outline-none"/>
                    </div>
                    <button onClick={function () { return onUpdateVariante(item.id, idx, 'sob_consulta', !v.sob_consulta); }} className={"ml-auto text-[7px] font-black px-1 py-0.5 rounded ".concat(v.sob_consulta ? 'text-red-400' : 'text-green-400')}>
                       {v.sob_consulta ? 'CONS' : 'OK'}
                    </button>
                    <button onClick={function () { return onRemoveVariante(item.id, idx); }} className="text-gray-600 hover:text-red-400 opacity-0 group-hover/v:opacity-100 transition-opacity"><lucide_react_1.Trash2 size={10}/></button>
                 </div>); })}
           </div>
        </div>

        {/* SELECTS */}
        <div className="grid grid-cols-2 gap-2 mt-2">
            <select value={item.data.categoryId} onChange={function (e) { return onUpdate(item.id, 'categoryId', e.target.value); }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-gray-400 outline-none">
                <option value="">Cat...</option>
                {categories.map(function (c) { return <option key={c.id} value={c.id} className="bg-black">{c.name}</option>; })}
            </select>
            <select value={item.data.supplierId} onChange={function (e) { return onUpdate(item.id, 'supplierId', e.target.value); }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-gray-400 outline-none">
                <option value="">Forn...</option>
                {suppliers.map(function (s) { return <option key={s.id} value={s.id} className="bg-black">{s.name}</option>; })}
            </select>
        </div>
      </div>
    </div>);
}
// EDITOR CSS
function CssImageEditor(_a) {
    var src = _a.src, edit = _a.edit, onChange = _a.onChange;
    var _b = (0, react_1.useState)(false), isDragging = _b[0], setIsDragging = _b[1];
    var _c = (0, react_1.useState)({ x: 0, y: 0 }), lastPos = _c[0], setLastPos = _c[1];
    var handleMouseDown = function (e) { setIsDragging(true); setLastPos({ x: e.clientX, y: e.clientY }); };
    var handleMouseMove = function (e) { if (!isDragging)
        return; var dx = e.clientX - lastPos.x; var dy = e.clientY - lastPos.y; setLastPos({ x: e.clientX, y: e.clientY }); onChange('x', (edit.x || 0) + dx); onChange('y', (edit.y || 0) + dy); };
    var handleMouseUp = function () { return setIsDragging(false); };
    var handleWheel = function (e) { var delta = e.deltaY * -0.001; var newScale = Math.max(0.5, Math.min(5, (edit.scale || 1) + delta)); onChange('scale', newScale); };
    return (<div className="w-full h-full relative overflow-hidden bg-[#050505]" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
      <img src={src} draggable={false} className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover transition-transform duration-75 ease-out origin-center" style={{ transform: "translate(-50%, -50%) translate(".concat(edit.x, "px, ").concat(edit.y, "px) scale(").concat(edit.scale, ")") }}/>
      <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-30"><div className="absolute top-1/2 w-full h-px bg-white/10"></div><div className="absolute left-1/2 h-full w-px bg-white/10"></div></div>
    </div>);
}
