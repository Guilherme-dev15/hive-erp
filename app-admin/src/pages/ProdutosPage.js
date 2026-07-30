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
exports.ProdutosPage = ProdutosPage;
var react_1 = require("react");
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_hot_toast_1 = require("react-hot-toast");
var renderer_1 = require("@react-pdf/renderer");
var react_to_print_1 = require("react-to-print");
var BulkMarkupModal_1 = require("../components/BulkMarkupModal");
var bulkUpdate_1 = require("../services/firebase/bulkUpdate");
// --- HOOKS ---
var useProducts_1 = require("../hooks/useProducts");
// --- SERVIÇOS ---
var apiService_1 = require("../services/apiService");
// --- COMPONENTES ---
var ImportModal_1 = require("../components/ImportModal");
var ProdutoFormModal_1 = require("../components/ProdutoFormModal");
var CategoryModal_1 = require("../components/CategoryModal");
var CatologPDF_1 = require("../components/CatologPDF");
var EtiquetaImpressao_1 = require("../components/EtiquetaImpressao");
var StockModal_1 = require("../components/StockModal");
var NeonStudio_1 = require("../components/NeonStudio");
function ProdutosPage() {
    var _this = this;
    var _a = (0, useProducts_1.useProducts)(), produtos = _a.products, productsLoading = _a.isLoading, deleteProduct = _a.deleteProduct, refreshProducts = _a.refresh;
    // 1. DADOS LOCAIS (que ainda não foram movidos para hooks específicos)
    var _b = (0, react_1.useState)([]), categories = _b[0], setCategories = _b[1];
    var _c = (0, react_1.useState)([]), fornecedores = _c[0], setFornecedores = _c[1];
    // campo lowStockThreshold
    var _d = (0, react_1.useState)(null), storeConfig = _d[0], setStoreConfig = _d[1];
    // 2. CONTROLE
    var _e = (0, react_1.useState)(true), loading = _e[0], setLoading = _e[1];
    var _f = (0, react_1.useState)(""), searchTerm = _f[0], setSearchTerm = _f[1];
    var _g = (0, react_1.useState)("Todas"), filterCategory = _g[0], setFilterCategory = _g[1];
    // 3. SELEÇÃO & PDF
    var _h = (0, react_1.useState)([]), selectedIds = _h[0], setSelectedIds = _h[1];
    var _j = (0, react_1.useState)(false), isGeneratingPdf = _j[0], setIsGeneratingPdf = _j[1];
    // 4. IMPRESSÃO
    var etiquetaRef = (0, react_1.useRef)(null);
    var handlePrintEtiquetas = (0, react_to_print_1.useReactToPrint)({
        contentRef: etiquetaRef,
        documentTitle: "Etiquetas_Produtos",
        onAfterPrint: function () { return react_hot_toast_1.toast.success("Impressão enviada!"); },
    });
    // 5. MODAIS
    var _k = (0, react_1.useState)(false), isModalOpen = _k[0], setIsModalOpen = _k[1];
    var _l = (0, react_1.useState)(false), isCategoryModalOpen = _l[0], setIsCategoryModalOpen = _l[1];
    var _m = (0, react_1.useState)(false), isImportModalOpen = _m[0], setIsImportModalOpen = _m[1];
    var _o = (0, react_1.useState)(false), isNeonOpen = _o[0], setIsNeonOpen = _o[1];
    var _p = (0, react_1.useState)(null), produtoEditando = _p[0], setProdutoEditando = _p[1];
    var _q = (0, react_1.useState)(false), isStockModalOpen = _q[0], setIsStockModalOpen = _q[1];
    var _r = (0, react_1.useState)(null), produtoEstoque = _r[0], setProdutoEstoque = _r[1];
    // State para controlar se o modal está visível (começa falso/escondido)
    var _s = (0, react_1.useState)(false), isMarkupModalOpen = _s[0], setIsMarkupModalOpen = _s[1];
    // ============================================================================
    // 🔥 LÓGICA DE QR CODE
    // ============================================================================
    (0, react_1.useEffect)(function () {
        var params = new URLSearchParams(window.location.search);
        var qrFromUrl = params.get("q");
        var qrFromCache = localStorage.getItem("pending_qr_scan");
        var finalQuery = qrFromUrl || qrFromCache;
        if (finalQuery) {
            setSearchTerm(finalQuery);
            (0, react_hot_toast_1.toast)("Produto localizado via QR Code", {
                icon: "📷",
                style: {
                    borderRadius: "10px",
                    background: "#4a4a4a",
                    color: "#d19900",
                    fontWeight: "bold",
                    border: "1px solid #d19900",
                },
            });
            window.history.replaceState({}, "", window.location.pathname);
            localStorage.removeItem("pending_qr_scan");
        }
    }, []);
    // ============================================================================
    // CARREGAMENTO DE DADOS AUXILIARES
    // ============================================================================
    var carregarAuxiliares = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, catsData, fornsData, configData, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    return [4 /*yield*/, Promise.all([
                            (0, apiService_1.getCategories)(),
                            (0, apiService_1.getFornecedores)(),
                            (0, apiService_1.getConfig)(),
                        ])];
                case 1:
                    _a = _b.sent(), catsData = _a[0], fornsData = _a[1], configData = _a[2];
                    setCategories(catsData);
                    setFornecedores(fornsData);
                    setStoreConfig(configData);
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _b.sent();
                    console.error(error_1);
                    react_hot_toast_1.toast.error("Erro ao conectar com o servidor.");
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        carregarAuxiliares();
    }, []);
    // Função "refresh" unificada, usada em callbacks após mutações.
    var carregarTudo = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Promise.all([refreshProducts(), carregarAuxiliares()])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    // ============================================================================
    // FILTROS
    // ============================================================================
    var produtosFiltrados = (0, react_1.useMemo)(function () {
        return produtos.filter(function (p) {
            var termo = searchTerm.toLowerCase().trim();
            var sub = p.subcategory ? p.subcategory.toLowerCase() : "";
            var code = p.code ? p.code.toLowerCase() : "";
            var name = p.name ? p.name.toLowerCase() : "";
            var matchTexto = name.includes(termo) || code.includes(termo) || sub.includes(termo);
            var matchCategoria = filterCategory === "Todas" || p.category === filterCategory;
            return matchTexto && matchCategoria;
        });
    }, [produtos, searchTerm, filterCategory]);
    // ============================================================================
    // SELEÇÃO
    // ============================================================================
    var produtosSelecionados = (0, react_1.useMemo)(function () {
        if (selectedIds.length > 0) {
            return produtos.filter(function (p) { return selectedIds.includes(p.id); });
        }
        return [];
    }, [selectedIds, produtos]);
    var produtosParaPdf = (0, react_1.useMemo)(function () {
        if (selectedIds.length > 0)
            return produtosSelecionados;
        return produtosFiltrados;
    }, [selectedIds, produtosSelecionados, produtosFiltrados]);
    var toggleSelection = function (id) {
        setSelectedIds(function (prev) {
            return prev.includes(id) ? prev.filter(function (pId) { return pId !== id; }) : __spreadArray(__spreadArray([], prev, true), [id], false);
        });
        setIsGeneratingPdf(false);
    };
    var handleSelectAll = function () {
        if (selectedIds.length === produtosFiltrados.length) {
            setSelectedIds([]);
        }
        else {
            setSelectedIds(produtosFiltrados.map(function (p) { return p.id; }));
        }
        setIsGeneratingPdf(false);
    };
    var handlePreparePdf = function () {
        if (selectedIds.length === 0 &&
            !confirm("Nenhum produto selecionado. Deseja gerar o catálogo com TODOS os produtos filtrados?")) {
            return;
        }
        setIsGeneratingPdf(true);
    };
    var onPrintClick = function () {
        if (selectedIds.length === 0) {
            return react_hot_toast_1.toast.error("Selecione pelo menos um produto para imprimir a etiqueta.");
        }
        handlePrintEtiquetas();
    };
    // ============================================================================
    // CRUD
    // ============================================================================
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!confirm("Tem certeza que deseja excluir este produto?"))
                return [2 /*return*/];
            deleteProduct(id);
            return [2 /*return*/];
        });
    }); };
    var handleEdit = function (prod) {
        setProdutoEditando(prod);
        setIsModalOpen(true);
    };
    var handleNew = function () {
        setProdutoEditando(null);
        setIsModalOpen(true);
    };
    var handleStock = function (prod) {
        setProdutoEstoque(prod);
        setIsStockModalOpen(true);
    };
    var handleSaveSuccess = function (prodSalvo) {
        setIsModalOpen(false);
        refreshProducts();
    };
    // Mensagem de Sucesso para Atualização em Massa
    var handleMarkupSuccess = function (updatedCount) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    react_hot_toast_1.toast.success("".concat(updatedCount, " produtos foram atualizados com o novo markup!"));
                    return [4 /*yield*/, refreshProducts()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    // ============================================================================
    // Atualização de Status em Massa
    var handleBulkStatusChange = function (novoStatus) { return __awaiter(_this, void 0, void 0, function () {
        var count, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedIds.length === 0) {
                        (0, react_hot_toast_1.toast)("Selecione pelo menos um produto para alterar.", {
                            icon: "⚠️",
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    setLoading(true);
                    return [4 /*yield*/, (0, bulkUpdate_1.updateStatusEmMassa)(selectedIds, novoStatus)];
                case 2:
                    count = _a.sent();
                    react_hot_toast_1.toast.success("".concat(count, " produtos alterados para ").concat(novoStatus.toUpperCase(), "!"), { duration: 4000 });
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, refreshProducts()];
                case 4:
                    _a.sent();
                    setSelectedIds([]);
                    return [3 /*break*/, 7];
                case 5:
                    error_2 = _a.sent();
                    console.error(error_2);
                    react_hot_toast_1.toast.error("Erro ao atualizar o status dos produtos.");
                    return [3 /*break*/, 7];
                case 6:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    if (loading || productsLoading)
        return (<div className="flex justify-center items-center h-[60vh]">
        <lucide_react_1.Loader2 className="animate-spin text-[#d19900]" size={48}/>
      </div>);
    return (<div className="space-y-8 pb-20 p-6 md:p-8 bg-gray-50/50 min-h-screen">
      <react_hot_toast_1.Toaster position="top-right"/>

      {/* HEADER DE COMANDO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-[#4a4a4a] flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-[#d19900]/10 rounded-xl text-[#d19900]">
              <lucide_react_1.Package size={24}/>
            </div>
            Gestão de Produtos
            <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              {produtos.length} items
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium ml-1">
            {selectedIds.length > 0 ? (<span className="text-[#d19900] font-bold bg-[#d19900]/10 px-2 py-0.5 rounded">
                {selectedIds.length} selecionados
              </span>) : ("Gerencie seu inventário, preços e catálogo digital.")}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 gap-1">
            <button onClick={onPrintClick} className={"p-2.5 rounded-lg text-gray-500 hover:text-[#d19900] hover:bg-white hover:shadow-sm transition-all ".concat(selectedIds.length > 0 ? "text-[#d19900] bg-white shadow-sm" : "")} title="Imprimir Etiquetas">
              <lucide_react_1.Tag size={18}/>
            </button>

            {isGeneratingPdf ? (<div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100 animate-pulse">
                <renderer_1.PDFDownloadLink document={<CatologPDF_1.CatalogPDF produtos={produtosParaPdf} storeName={(storeConfig === null || storeConfig === void 0 ? void 0 : storeConfig.storeName) || "Catálogo"}/>} fileName="catalogo_produtos.pdf" className="flex items-center gap-2 text-[#d19900] font-bold text-xs">
                  {/* @ts-ignore */}
                  {function (_a) {
            var loading = _a.loading;
            return (loading ? "Gerando..." : "Baixar PDF");
        }}
                </renderer_1.PDFDownloadLink>
                <button onClick={function () { return setIsGeneratingPdf(false); }} className="hover:bg-red-50 p-1 rounded-full">
                  <lucide_react_1.X size={12} className="text-red-400"/>
                </button>
              </div>) : (<button onClick={handlePreparePdf} className="p-2.5 rounded-lg text-gray-500 hover:text-[#d19900] hover:bg-white hover:shadow-sm transition-all" title="Gerar Catálogo PDF">
                <lucide_react_1.FileDown size={18}/>
              </button>)}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block"></div>

          <div className="flex gap-2">
            <button onClick={function () { return setIsCategoryModalOpen(true); }} className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-[#d19900]/50 hover:text-[#d19900] transition-colors shadow-sm" title="Categorias">
              <lucide_react_1.FolderTree size={18}/>
            </button>

            <button onClick={function () { return setIsImportModalOpen(true); }} className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:border-green-200 hover:text-green-600 transition-colors shadow-sm" title="Importar Excel">
              <lucide_react_1.FileSpreadsheet size={18}/>
            </button>
          </div>

          <button onClick={function () { return setIsNeonOpen(true); }} className="group flex items-center gap-2 px-5 py-3 bg-[#ffffff] text-[#d19900] rounded-xl hover:bg-black hover:shadow-[0_0_20px_rgba(209,153,0,0.2)] transition-all font-bold ml-2 border">
            <lucide_react_1.Sparkles size={18} className="group-hover:text-white transition-colors"/>
            <span className="hidden sm:inline group-hover:text-white transition-colors">
              Neon Studio
            </span>
          </button>

          <button onClick={handleNew} className="px-6 py-3 bg-[#d19900] text-white rounded-xl hover:bg-[#b88600] hover:shadow-lg hover:shadow-[#d19900]/30 flex items-center gap-2 font-bold transition-all active:scale-95">
            <lucide_react_1.Plus size={20}/>{" "}
            <span className="hidden sm:inline">Novo Produto</span>
          </button>
          {/* O Botão que abre o Modal */}
          <button onClick={function () { return setIsMarkupModalOpen(true); }} className="px-6 py-3 bg-[#d19900] text-white rounded-xl hover:bg-[#b88600] hover:shadow-lg hover:shadow-[#d19900]/30 flex items-center gap-2 font-bold transition-all active:scale-95">
            Atualizar Preços em Massa
          </button>

          {/* O nosso Modal (Ele só vai aparecer de fato quando o isMarkupModalOpen for true) */}
          <BulkMarkupModal_1.BulkMarkupModal isOpen={isMarkupModalOpen} onClose={function () { return setIsMarkupModalOpen(false); }} onSuccess={handleMarkupSuccess}/>
        </div>
      </div>
      {/* RENDERIZAÇÃO CONDICIONAL: Só aparece se tiver item marcado */}
      {selectedIds.length > 0 && (<div className="flex gap-2 items-center bg-gray-100 p-2 rounded-lg border border-gray-200">
          <span className="text-sm font-semibold text-gray-600 px-2">
            {selectedIds.length} selecionado(s):
          </span>

          <button onClick={function () { return handleBulkStatusChange("ativo"); }} disabled={loading} 
        // Dourado Sólido: Ação de destaque, traz o produto para a "luz"
        className="bg-amber-500 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-amber-600 transition-all disabled:opacity-50 shadow-sm">
            Ativar Catálogo
          </button>

          <button onClick={function () { return handleBulkStatusChange("inativo"); }} disabled={loading} 
        // Cinza Escuro/Chumbo: Ação de ocultar, remete a algo "apagado" ou "guardado no cofre"
        className="bg-stone-800 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-stone-900 transition-all disabled:opacity-50 shadow-sm">
            Ocultar Catálogo
          </button>
        </div>)}

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        <button onClick={handleSelectAll} className={"\n                flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all\n                ".concat(selectedIds.length > 0 &&
            selectedIds.length === produtosFiltrados.length
            ? "bg-[#d19900]/10 text-[#d19900] border border-[#d19900]/20"
            : "bg-white hover:bg-gray-50 text-gray-600 border border-transparent", "\n            ")}>
          {selectedIds.length > 0 &&
            selectedIds.length === produtosFiltrados.length ? (<>
              <lucide_react_1.CheckSquare size={18}/> Todos
            </>) : (<>
              <lucide_react_1.Square size={18}/> Selecionar
            </>)}
        </button>

        <div className="flex-grow relative group">
          <lucide_react_1.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d19900] transition-colors" size={20}/>
          <input type="text" placeholder="Buscar por nome, código SKU ou subcategoria..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#d19900]/50 focus:ring-4 focus:ring-[#d19900]/10 outline-none transition-all placeholder:text-gray-400 text-sm font-medium text-[#4a4a4a]"/>
        </div>

        <div className="min-w-[220px] relative group">
          <lucide_react_1.Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#d19900] transition-colors" size={18}/>
          <select value={filterCategory} onChange={function (e) { return setFilterCategory(e.target.value); }} className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-[#d19900]/50 focus:ring-4 focus:ring-[#d19900]/10 outline-none appearance-none cursor-pointer text-sm font-medium text-[#4a4a4a]">
            <option value="Todas">Todas as Categorias</option>
            {categories.map(function (c) { return (<option key={c.id} value={c.name}>
                {c.name}
              </option>); })}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <lucide_react_1.ChevronRight size={14} className="rotate-90"/>
          </div>
        </div>

        <button onClick={carregarTudo} className="p-3 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-[#d19900] transition-colors" title="Recarregar">
          <lucide_react_1.RefreshCw size={20}/>
        </button>
      </div>

      {/* GRID DE PRODUTOS */}
      {produtosFiltrados.length === 0 ? (<div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-gray-200">
          {searchTerm ? (<>
              <div className="bg-red-50 p-6 rounded-full mb-4">
                <lucide_react_1.QrCode size={48} className="text-red-300"/>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Produto não encontrado
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                O código "{searchTerm}" não retornou resultados.
              </p>
              <button onClick={function () { return setSearchTerm(""); }} className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">
                Limpar Busca
              </button>
            </>) : (<>
              <div className="bg-gray-50 p-6 rounded-full mb-4">
                <lucide_react_1.Package size={48} className="text-gray-300"/>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Nenhum produto cadastrado
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Comece adicionando novos itens ao estoque.
              </p>
            </>)}
        </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <framer_motion_1.AnimatePresence>
            {produtosFiltrados.map(function (p) {
                var isSelected = selectedIds.includes(p.id);
                // 🔥 LÓGICA VISUAL DE ESTOQUE BAIXO
                var stock = p.quantity || 0;
                var limit = (storeConfig === null || storeConfig === void 0 ? void 0 : storeConfig.lowStockThreshold) || 5;
                var isLow = stock > 0 && stock <= limit;
                var isOut = stock <= 0;
                return (<framer_motion_1.motion.div layout key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} className={"\n                    group bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col relative transition-all duration-300\n                    ".concat(isSelected ? "ring-2 ring-[#d19900] shadow-xl shadow-[#d19900]/10" : "border border-gray-100 hover:shadow-xl hover:border-gray-200", "\n                  ")} onClick={function (e) {
                        if (e.target.closest("button"))
                            return;
                        toggleSelection(p.id);
                    }}>
                  <div className="absolute top-4 right-4 z-20 transition-transform duration-200 group-hover:scale-110">
                    <div className={"\n                        w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm\n                        ".concat(isSelected ? "bg-[#d19900] text-white" : "bg-white/90 backdrop-blur text-gray-300 border border-gray-100 hover:border-[#d19900]", "\n                    ")}>
                      {isSelected ? (<lucide_react_1.CheckSquare size={16}/>) : (<lucide_react_1.Square size={16}/>)}
                    </div>
                  </div>

                  <div className="h-64 relative bg-gray-50 overflow-hidden">
                    {p.imageUrl ? (<img src={p.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy"/>) : (<div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
                        <lucide_react_1.Package size={40}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                          Sem Imagem
                        </span>
                      </div>)}

                    <div className="absolute bottom-3 left-3 flex flex-col gap-1 items-start max-w-[80%]">
                      <span className="bg-white/90 backdrop-blur-md text-[#4a4a4a] text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm border border-white/20">
                        {p.category || "Geral"}
                      </span>
                      {p.subcategory && (<span className="bg-[#4a4a4a]/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <span className="opacity-70 text-[8px] text-[#d19900]">
                            ▶
                          </span>{" "}
                          {p.subcategory}
                        </span>)}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button onClick={function (e) {
                        e.stopPropagation();
                        handleEdit(p);
                    }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-[#d19900] transition-all shadow-lg" title="Editar">
                        <lucide_react_1.Edit size={20}/>
                      </button>
                      <button onClick={function (e) {
                        e.stopPropagation();
                        handleStock(p);
                    }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-amber-600 transition-all shadow-lg" title="Estoque">
                        <lucide_react_1.History size={20}/>
                      </button>
                      <button onClick={function (e) {
                        e.stopPropagation();
                        handleDelete(p.id);
                    }} className="p-3.5 bg-white text-[#4a4a4a] rounded-2xl hover:scale-110 hover:text-red-600 transition-all shadow-lg" title="Excluir">
                        <lucide_react_1.Trash2 size={20}/>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 font-mono tracking-wide">
                          {p.code || "SEM SKU"}
                        </span>
                        {p.weight && (<span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d19900]"></span>{" "}
                            {p.weight}g
                          </span>)}
                      </div>

                      <h3 className="font-bold text-[#4a4a4a] text-base leading-tight line-clamp-2 mb-1 group-hover:text-[#d19900] transition-colors" title={p.name}>
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Preço Venda
                        </span>
                        <span className="text-xl font-black text-[#d19900] tracking-tight">
                          R$ {Number(p.salePrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          Estoque
                        </span>

                        {/* 🔥 BADGE DE ESTOQUE INTELIGENTE */}
                        <span className={"font-bold text-sm px-2 py-0.5 rounded-lg flex items-center gap-1\n                            ".concat(isOut
                        ? "bg-red-50 text-red-600"
                        : isLow
                            ? "bg-orange-50 text-orange-600 border border-orange-100"
                            : "bg-green-50 text-green-700", "\n                          ")}>
                          {stock} un
                          {isLow && (<lucide_react_1.AlertTriangle size={12} className="animate-pulse"/>)}
                        </span>
                      </div>
                    </div>
                  </div>
                </framer_motion_1.motion.div>);
            })}
          </framer_motion_1.AnimatePresence>
        </div>)}

      <EtiquetaImpressao_1.EtiquetaImpressao ref={etiquetaRef} produtos={produtosSelecionados} config={{ storeName: storeConfig === null || storeConfig === void 0 ? void 0 : storeConfig.storeName }}/>

      <ProdutoFormModal_1.ProdutoFormModal isOpen={isModalOpen} onClose={function () { return setIsModalOpen(false); }} fornecedores={fornecedores} categories={categories} setCategories={setCategories} produtoParaEditar={produtoEditando} onProdutoSalvo={handleSaveSuccess} configGlobal={undefined}/>
      <CategoryModal_1.CategoryModal isOpen={isCategoryModalOpen} onClose={function () { return setIsCategoryModalOpen(false); }} categories={categories} setCategories={setCategories} onCategoryCreated={function (newCat) {
            return setCategories(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newCat], false); });
        }}/>
      <ImportModal_1.ImportModal isOpen={isImportModalOpen} onClose={function () { return setIsImportModalOpen(false); }} onSuccess={carregarTudo}/>

      <NeonStudio_1.NeonStudio isOpen={isNeonOpen} onClose={function () { return setIsNeonOpen(false); }} onSuccess={carregarTudo}/>
      <StockModal_1.StockModal isOpen={isStockModalOpen} onClose={function () { return setIsStockModalOpen(false); }} product={produtoEstoque} onSuccess={carregarTudo}/>
    </div>);
}
