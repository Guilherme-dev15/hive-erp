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
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Loader2, Search, SlidersHorizontal, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { fetchCatalogData, fetchStoreBySlug } from './services/api';
import { BannerCarousel } from './components/BannerCarousel';
import { CardProduto } from './components/CardProduto';
import { ModalCarrinho } from './components/ModalCarrinho';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CategoryFilter } from './components/CategoryFilter';
// ============================================================================
// 1. HOOK: IDENTIFICAÇÃO DA LOJA (Lógica de URL e Slug)
// ============================================================================
var useStoreIdentity = function () {
    var _a = useState({
        slug: null,
        storeId: null
    }), identity = _a[0], setIdentity = _a[1];
    useEffect(function () {
        var params = new URLSearchParams(window.location.search);
        // Prioridade 1: ?loja=nome (Amigável) ou ?slug=nome (Técnico)
        var currentSlug = params.get('loja') || params.get('slug');
        var directStoreId = params.get('storeId');
        // Prioridade 2: Subdomínio
        if (!currentSlug) {
            var host = window.location.hostname;
            if (!host.includes('localhost') && !host.includes('vercel.app')) {
                currentSlug = host.split('.')[0];
            }
        }
        setIdentity({ slug: currentSlug, storeId: directStoreId });
    }, []);
    return identity;
};
// ============================================================================
// 2. HOOK: DADOS DA LOJA (Busca API)
// ============================================================================
var useStoreData = function (slug, directStoreId) {
    var _a = useState([]), produtos = _a[0], setProdutos = _a[1];
    var _b = useState({
        whatsappNumber: null,
        storeName: 'Carregando...',
        primaryColor: '#D4AF37',
        secondaryColor: '#343434',
        banners: [],
        lowStockThreshold: 5
    }), config = _b[0], setConfig = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    useEffect(function () {
        if (!slug && !directStoreId)
            return; // Aguarda identificação
        function loadData() {
            return __awaiter(this, void 0, void 0, function () {
                var finalStoreId_1, storeData_1, err_1, data_1, safeProducts, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, 7, 8]);
                            setLoading(true);
                            finalStoreId_1 = directStoreId;
                            if (!(slug && !finalStoreId_1)) return [3 /*break*/, 4];
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, fetchStoreBySlug(slug)];
                        case 2:
                            storeData_1 = _a.sent();
                            finalStoreId_1 = storeData_1.storeId;
                            // Pré-carrega config básica
                            setConfig(function (prev) { return (__assign(__assign(__assign({}, prev), storeData_1), { storeName: storeData_1.storeName || 'Loja Virtual', slug: storeData_1.slug })); });
                            document.title = storeData_1.storeName || 'Loja Virtual';
                            return [3 /*break*/, 4];
                        case 3:
                            err_1 = _a.sent();
                            throw new Error("Loja não encontrada. Verifique o endereço.");
                        case 4:
                            if (!finalStoreId_1)
                                throw new Error("ID da loja não identificado.");
                            return [4 /*yield*/, fetchCatalogData(finalStoreId_1)];
                        case 5:
                            data_1 = _a.sent();
                            safeProducts = (data_1.produtos || []).map(function (p) { return (__assign(__assign({}, p), { salePrice: Number(p.salePrice) || 0, promotionalPrice: Number(p.promotionalPrice) || 0 })); });
                            setProdutos(safeProducts);
                            // Atualiza config com dados mais recentes do catálogo
                            if (data_1.config) {
                                setConfig(function (prev) { return (__assign(__assign(__assign(__assign({}, prev), { storeId: finalStoreId_1 }), data_1.config), { storeName: data_1.config.storeName || prev.storeName })); });
                            }
                            return [3 /*break*/, 8];
                        case 6:
                            err_2 = _a.sent();
                            console.error("Erro carrega loja:", err_2);
                            setError(err_2.message || "Erro desconhecido");
                            return [3 /*break*/, 8];
                        case 7:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        }
        loadData();
    }, [slug, directStoreId]);
    return { produtos: produtos, config: config, loading: loading, error: error };
};
// ============================================================================
// 3. HOOK: CARRINHO DE COMPRAS
// ============================================================================
var useCart = function () {
    var _a = useState({}), carrinho = _a[0], setCarrinho = _a[1];
    var _b = useState(false), isAberto = _b[0], setIsAberto = _b[1];
    var adicionar = useCallback(function (produto) {
        var _a;
        var stock = (_a = produto.quantity) !== null && _a !== void 0 ? _a : 0;
        if (stock <= 0) {
            toast.error("Esgotado!", { id: "esg-".concat(produto.id) });
            return;
        }
        setCarrinho(function (prev) {
            var _a;
            var _b;
            var qtdAtual = ((_b = prev[produto.id]) === null || _b === void 0 ? void 0 : _b.quantidade) || 0;
            if (qtdAtual + 1 > stock) {
                toast.error("Estoque limite atingido.", { id: "lim-".concat(produto.id) });
                return prev;
            }
            var finalPrice = (produto.isOnSale && produto.promotionalPrice && produto.promotionalPrice < produto.salePrice)
                ? produto.promotionalPrice
                : produto.salePrice;
            toast.success("Adicionado ao carrinho!", { id: "add-".concat(produto.id) });
            setIsAberto(true);
            return __assign(__assign({}, prev), (_a = {}, _a[produto.id] = {
                produto: __assign(__assign({}, produto), { salePrice: finalPrice }),
                quantidade: qtdAtual + 1
            }, _a));
        });
    }, []);
    var itens = useMemo(function () { return Object.values(carrinho); }, [carrinho]);
    var totalItens = itens.reduce(function (acc, item) { return acc + item.quantidade; }, 0);
    return { carrinho: carrinho, setCarrinho: setCarrinho, adicionar: adicionar, itens: itens, totalItens: totalItens, isAberto: isAberto, setIsAberto: setIsAberto };
};
// ============================================================================
// 4. HOOK: FILTROS E BUSCA
// ============================================================================
var useProductFilter = function (produtos) {
    var _a = useState(""), term = _a[0], setTerm = _a[1];
    var _b = useState(null), category = _b[0], setCategory = _b[1];
    var _c = useState(null), subcategory = _c[0], setSubcategory = _c[1];
    var _d = useState('default'), sortOrder = _d[0], setSortOrder = _d[1];
    var _e = useState(false), isOpen = _e[0], setIsOpen = _e[1];
    var filtered = useMemo(function () {
        var lista = produtos.filter(function (p) { return p.status === 'ativo' || !p.status; });
        if (term.trim()) {
            var t_1 = term.toLowerCase();
            lista = lista.filter(function (p) { var _a; return p.name.toLowerCase().includes(t_1) || ((_a = p.code) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(t_1)); });
        }
        if (category)
            lista = lista.filter(function (p) { return p.category === category; });
        if (subcategory)
            lista = lista.filter(function (p) { return p.subcategory === subcategory; });
        var getPrice = function (p) { return (p.isOnSale && p.promotionalPrice) ? p.promotionalPrice : p.salePrice; };
        if (sortOrder === 'priceAsc')
            lista.sort(function (a, b) { return getPrice(a) - getPrice(b); });
        if (sortOrder === 'priceDesc')
            lista.sort(function (a, b) { return getPrice(b) - getPrice(a); });
        return lista;
    }, [produtos, term, category, subcategory, sortOrder]);
    return {
        filtered: filtered,
        term: term,
        setTerm: setTerm,
        category: category,
        setCategory: setCategory,
        subcategory: subcategory,
        setSubcategory: setSubcategory,
        sortOrder: sortOrder,
        setSortOrder: setSortOrder,
        isOpen: isOpen,
        setIsOpen: setIsOpen
    };
};
// ============================================================================
// COMPONENTE PRINCIPAL (Limpo e Organizado)
// ============================================================================
export default function App() {
    // 1. Identidade e Dados
    var _a = useStoreIdentity(), slug = _a.slug, storeId = _a.storeId;
    var _b = useStoreData(slug, storeId), produtos = _b.produtos, config = _b.config, loading = _b.loading, error = _b.error;
    // 2. Lógica de Negócio
    var cart = useCart();
    var filter = useProductFilter(produtos);
    var _c = useState(null), selectedProduct = _c[0], setSelectedProduct = _c[1];
    // --- RENDERS DE ESTADO ---
    if (loading && !config.storeName)
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <Loader2 className="animate-spin text-gray-400" size={32}/>
      <p className="text-gray-500 font-medium">Carregando loja...</p>
    </div>);
    if (error)
        return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Store size={48} className="text-gray-300 mb-4"/>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Ops! Loja indisponível</h2>
      <p className="text-gray-500 max-w-xs">{error}</p>
      <p className="text-xs text-gray-400 mt-4">Tente usar ?loja=nome-da-loja</p>
    </div>);
    return (<div className="min-h-screen bg-gray-50/50 font-sans text-gray-800 pb-20">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '12px', background: '#333', color: '#fff' } }}/>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-between backdrop-blur-xl bg-white/80 border-b border-gray-100/50 shadow-sm">
        <h1 className="text-lg font-bold tracking-tight truncate max-w-[70%]" style={{ color: config.secondaryColor }}>
          {config.storeName}
        </h1>
        <button onClick={function () { return cart.setIsAberto(true); }} className="relative p-2.5 rounded-full hover:bg-black/5 transition-colors" style={{ color: config.secondaryColor }}>
          <ShoppingCart size={22} strokeWidth={2.5}/>
          {cart.totalItens > 0 && (<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
              {cart.totalItens}
            </motion.span>)}
        </button>
      </header>

      {/* BANNER */}
      {config.banners && config.banners.length > 0 ? (<BannerCarousel banners={config.banners}/>) : (<div className="mt-20"></div>)}

      {/* FILTROS E BUSCA */}
      <div className="sticky top-16 z-40 bg-gray-50/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-3 pb-1">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 mb-3 flex gap-2">
            <div className="relative flex-grow shadow-sm group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar produtos..." value={filter.term} onChange={function (e) { return filter.setTerm(e.target.value); }} className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white text-sm focus:ring-2 ring-opacity-20 outline-none" style={{ '--tw-ring-color': config.primaryColor }}/>
            </div>
            <button onClick={function () { return filter.setIsOpen(!filter.isOpen); }} className="p-3 rounded-2xl shadow-sm bg-white text-gray-500">
              <SlidersHorizontal size={20}/>
            </button>
          </div>

          <AnimatePresence>
            {filter.isOpen && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-4 mb-2">
                <div className="flex gap-2 py-1 overflow-x-auto no-scrollbar">
                  {['default', 'priceAsc', 'priceDesc'].map(function (opt) { return (<button key={opt} onClick={function () { return filter.setSortOrder(opt); }} className={"px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ".concat(filter.sortOrder === opt ? 'bg-gray-800 text-white' : 'bg-white text-gray-600')}>
                      {opt === 'default' ? 'Relevância' : opt === 'priceAsc' ? 'Menor Preço' : 'Maior Preço'}
                    </button>); })}
                </div>
              </motion.div>)}
          </AnimatePresence>

          <div className="px-4 pb-2">
            <CategoryFilter products={produtos} selectedCategory={filter.category} selectedSubcategory={filter.subcategory} onSelectCategory={filter.setCategory} onSelectSubcategory={filter.setSubcategory} config={config}/>
          </div>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <main className="max-w-7xl mx-auto p-4 min-h-[60vh]">
        <div className="mb-5 px-1 flex items-end justify-between border-b border-gray-100 pb-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">
              {filter.category || 'Destaques'}
            </h2>
            {filter.subcategory && (<span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                ▶ {filter.subcategory}
              </span>)}
          </div>
          <span className="text-xs text-gray-400 font-medium mb-1">{filter.filtered.length} itens</span>
        </div>

        {filter.filtered.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filter.filtered.map(function (prod) { return (<CardProduto key={prod.id} produto={prod} config={config} onAdicionar={function () { return cart.adicionar(prod); }} onImageClick={function () { return setSelectedProduct(prod); }}/>); })}
          </div>) : (<div className="py-24 text-center flex flex-col items-center justify-center text-gray-400">
            <Search size={48} className="mb-4 opacity-20"/>
            <p>Nenhum produto encontrado.</p>
            {(filter.category || filter.term) && (<button onClick={function () { filter.setCategory(null); filter.setSubcategory(null); filter.setTerm(''); }} className="mt-4 text-blue-500 text-sm font-bold hover:underline">
                Limpar Filtros
              </button>)}
          </div>)}
      </main>

      {/* MODAIS */}
      <ModalCarrinho isOpen={cart.isAberto} onClose={function () { return cart.setIsAberto(false); }} itens={cart.itens} setCarrinho={cart.setCarrinho} whatsappNumber={config.whatsappNumber} config={config}/>

      <ProductDetailsModal isOpen={!!selectedProduct} onClose={function () { return setSelectedProduct(null); }} product={selectedProduct} onAddToCart={cart.adicionar} config={config}/>
    </div>);
}
