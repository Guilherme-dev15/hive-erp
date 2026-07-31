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
exports.CatalogoPage = CatalogoPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var apiService_1 = require("../services/apiService");
function CatalogoPage() {
    var _a = (0, react_1.useState)([]), produtos = _a[0], setProdutos = _a[1];
    var _b = (0, react_1.useState)([]), categories = _b[0], setCategories = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), storeConfig = _d[0], setStoreConfig = _d[1];
    // Filtros
    var _e = (0, react_1.useState)(''), searchTerm = _e[0], setSearchTerm = _e[1];
    var _f = (0, react_1.useState)('Todas'), selectedCategory = _f[0], setSelectedCategory = _f[1];
    // Modal de Detalhes
    var _g = (0, react_1.useState)(null), selectedProduct = _g[0], setSelectedProduct = _g[1];
    // Estado da Variante Selecionada (Grade)
    var _h = (0, react_1.useState)(null), selectedVariant = _h[0], setSelectedVariant = _h[1];
    (0, react_1.useEffect)(function () {
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, p, c, conf, err_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, 3, 4]);
                            return [4 /*yield*/, Promise.all([
                                    (0, apiService_1.getAdminProdutos)(),
                                    (0, apiService_1.getCategories)(),
                                    (0, apiService_1.getConfig)()
                                ])];
                        case 1:
                            _a = _b.sent(), p = _a[0], c = _a[1], conf = _a[2];
                            // Filtra apenas produtos ativos para o catálogo
                            setProdutos(p.filter(function (i) { return i.status === 'ativo'; }));
                            setCategories(c);
                            setStoreConfig(conf);
                            return [3 /*break*/, 4];
                        case 2:
                            err_1 = _b.sent();
                            console.error(err_1);
                            return [3 /*break*/, 4];
                        case 3:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        load();
    }, []);
    // Resetar variante ao abrir novo produto
    (0, react_1.useEffect)(function () {
        if (selectedProduct) {
            // Se tiver variantes, seleciona a primeira automaticamente
            if (selectedProduct.variantes && selectedProduct.variantes.length > 0) {
                setSelectedVariant(selectedProduct.variantes[0]);
            }
            else {
                setSelectedVariant(null);
            }
        }
    }, [selectedProduct]);
    var filteredProducts = (0, react_1.useMemo)(function () {
        return produtos.filter(function (p) {
            var _a;
            var matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ((_a = p.code) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchTerm.toLowerCase()));
            var matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
            return matchSearch && matchCat;
        });
    }, [produtos, searchTerm, selectedCategory]);
    var formatCurrency = function (val) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };
    var handleWhatsApp = function () {
        var _a;
        if (!selectedProduct)
            return;
        var phone = ((_a = storeConfig === null || storeConfig === void 0 ? void 0 : storeConfig.whatsapp) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, '')) || '';
        if (!phone)
            return alert("WhatsApp da loja não configurado.");
        var message = "Ol\u00E1! Tenho interesse no produto: *".concat(selectedProduct.name, "*");
        // Adiciona detalhes da variante na mensagem
        if (selectedVariant) {
            message += "\nOp\u00E7\u00E3o: *".concat(selectedVariant.medida, "*");
            if (selectedVariant.sob_consulta) {
                message += " (Consultar Disponibilidade)";
            }
            else {
                message += " - Pre\u00E7o: ".concat(formatCurrency(selectedVariant.valor_ajuste));
            }
        }
        else {
            message += " - Pre\u00E7o: ".concat(formatCurrency(selectedProduct.salePrice));
        }
        message += "\nC\u00F3digo: ".concat(selectedProduct.code);
        window.open("https://wa.me/55".concat(phone, "?text=").concat(encodeURIComponent(message)), '_blank');
    };
    return (<div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HEADER DO CATÁLOGO */}
      <header className="bg-white sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-dourado">
                <lucide_react_1.ShoppingBag size={20} color="#d19900"/>
             </div>
             <div>
               <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                 {(storeConfig === null || storeConfig === void 0 ? void 0 : storeConfig.storeName) || 'CATÁLOGO'}
               </h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coleção Exclusiva</p>
             </div>
          </div>
          
          {/* Busca Simples */}
          <div className="relative hidden md:block w-64">
             <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
             <input type="text" placeholder="Buscar peças..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#d19900]/20 transition-all"/>
          </div>
        </div>

        {/* Menu de Categorias (Scroll Horizontal) */}
        <div className="max-w-6xl mx-auto px-4 pb-0 overflow-x-auto scrollbar-hide flex gap-6">
           {__spreadArray(['Todas'], categories.map(function (c) { return c.name; }), true).map(function (cat) { return (<button key={cat} onClick={function () { return setSelectedCategory(cat); }} className={"pb-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ".concat(selectedCategory === cat ? 'text-[#d19900] border-[#d19900]' : 'text-gray-400 border-transparent hover:text-gray-600')}>
               {cat}
             </button>); })}
        </div>
      </header>

      {/* BODY */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Mobile Search */}
        <div className="md:hidden mb-6 relative">
           <lucide_react_1.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
           <input type="text" placeholder="O que você procura hoje?" value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm outline-none focus:border-[#d19900]"/>
        </div>

        {loading ? (<div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-[#d19900] border-t-transparent rounded-full"></div></div>) : (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
             {filteredProducts.map(function (produto) { return (<framer_motion_1.motion.div layout key={produto.id} onClick={function () { return setSelectedProduct(produto); }} className="group bg-white rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100 overflow-hidden">
                 <div className="aspect-[4/5] overflow-hidden bg-gray-100 relative">
                   <img src={produto.imageUrl || 'https://placehold.co/400x500/f3f4f6/a3a3a3?text=Sem+Foto'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={produto.name}/>
                   {/* Badge de Variações */}
                   {produto.variantes && produto.variantes.length > 0 && (<div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <lucide_react_1.Ruler size={10} className="text-[#d19900]"/>
                        {produto.variantes.length} Opções
                      </div>)}
                 </div>
                 
                 <div className="p-4">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                     {produto.category}
                   </p>
                   <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                     {produto.name}
                   </h3>
                   <div className="flex items-center justify-between">
                     <span className="text-lg font-black text-[#d19900]">
                       {formatCurrency(produto.salePrice)}
                     </span>
                     <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#d19900] group-hover:text-white transition-colors">
                        <lucide_react_1.ArrowRight size={16}/>
                     </div>
                   </div>
                 </div>
               </framer_motion_1.motion.div>); })}
           </div>)}
      </main>

      {/* MODAL DE DETALHES DO PRODUTO (A Mágica das Variantes) */}
      <framer_motion_1.AnimatePresence>
        {selectedProduct && (<framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={function () { return setSelectedProduct(null); }}>
            <framer_motion_1.motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} onClick={function (e) { return e.stopPropagation(); }} className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row">
              
              {/* Coluna Imagem */}
              <div className="w-full md:w-1/2 bg-gray-100 h-64 md:h-auto relative">
                 <img src={selectedProduct.imageUrl} className="w-full h-full object-cover"/>
                 <button onClick={function () { return setSelectedProduct(null); }} className="absolute top-4 left-4 p-2 bg-white/50 backdrop-blur rounded-full text-black hover:bg-white transition-all md:hidden">
                   <lucide_react_1.X size={20}/>
                 </button>
              </div>

              {/* Coluna Detalhes */}
              <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-white overflow-y-auto">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <span className="text-xs font-bold text-[#d19900] uppercase tracking-widest bg-[#d19900]/10 px-2 py-1 rounded-md">
                         {selectedProduct.category}
                       </span>
                       <h2 className="text-2xl font-black text-gray-900 mt-2 leading-tight">
                         {selectedProduct.name}
                       </h2>
                       <p className="text-xs text-gray-400 font-mono mt-1">REF: {selectedProduct.code}</p>
                    </div>
                    <button onClick={function () { return setSelectedProduct(null); }} className="hidden md:block p-2 hover:bg-gray-100 rounded-full text-gray-400">
                       <lucide_react_1.X size={24}/>
                    </button>
                 </div>

                 <div className="my-6 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                       {selectedProduct.description || "Sem descrição disponível."}
                    </p>
                    
                    {/* SELETOR DE VARIANTES / GRADES */}
                    {selectedProduct.variantes && selectedProduct.variantes.length > 0 && (<div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                           <lucide_react_1.Ruler size={14}/> Selecione a Opção:
                        </label>
                        <div className="flex flex-wrap gap-2">
                           {selectedProduct.variantes.map(function (variante, idx) {
                    var isSelected = selectedVariant === variante;
                    return (<button key={idx} onClick={function () { return setSelectedVariant(variante); }} className={"\n                                   px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all\n                                   ".concat(isSelected
                            ? 'border-[#d19900] bg-[#d19900] text-white shadow-lg shadow-[#d19900]/20'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300', "\n                                 ")}>
                                 {variante.medida}
                               </button>);
                })}
                        </div>
                      </div>)}
                 </div>

                 <div className="mt-auto pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-4">
                       <div>
                          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Preço Final</p>
                          <div className="text-3xl font-black text-gray-900 tracking-tight">
                             {/* Lógica de Preço: Se tiver variante selecionada, usa o preço dela. Se for sob consulta, esconde o preço */}
                             {(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.sob_consulta)
                ? <span className="text-xl text-gray-500">Sob Consulta</span>
                : formatCurrency(selectedVariant ? selectedVariant.valor_ajuste : selectedProduct.salePrice)}
                          </div>
                       </div>
                       
                       {/* Status de Estoque */}
                       {(selectedVariant ? selectedVariant.estoque > 0 : selectedProduct.quantity > 0) ? (<div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-full text-xs font-bold">
                             <lucide_react_1.Package size={14}/> Em Estoque
                          </div>) : (<div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full text-xs font-bold">
                             <lucide_react_1.Info size={14}/> Sob Encomenda
                          </div>)}
                    </div>

                    <button onClick={handleWhatsApp} className="w-full bg-[#25D366] hover:bg-[#1ebc57] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95">
                       <lucide_react_1.MessageCircle size={24}/>
                       {(selectedVariant === null || selectedVariant === void 0 ? void 0 : selectedVariant.sob_consulta) ? 'Consultar Disponibilidade' : 'Comprar pelo WhatsApp'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                       Venda assistida via WhatsApp oficial da loja.
                    </p>
                 </div>

              </div>
            </framer_motion_1.motion.div>
          </framer_motion_1.motion.div>)}
      </framer_motion_1.AnimatePresence>
    </div>);
}
